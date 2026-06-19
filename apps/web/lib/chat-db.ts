import "server-only";

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { UIMessage } from "ai";

import { CHAT_DB_PATH } from "@/lib/config";

/**
 * Lưu lịch sử hội thoại chat vào SQLite phía server (node:sqlite built-in).
 * Mỗi hội thoại gắn với `user_email` lấy từ session → mỗi người chỉ thấy
 * lịch sử của mình.
 *
 * node:sqlite cần Node >= 22.5 (image runtime node:22-slim đáp ứng). Module
 * được whitelist trong next.config.ts (serverExternalPackages) để Next không
 * cố bundle built-in này.
 *
 * Schema:
 *   conversations(id, user_email, title, created_at, updated_at)
 *   messages(id, conversation_id, ord, role, parts_json, metadata_json)
 *   message_feedback(conversation_id, message_id, user_email, rating, created_at)
 * messages.ord giữ đúng thứ tự; xoá hội thoại cascade xoá messages.
 */

export type Conversation = {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: number;
  updatedAt: number;
};

/** Bản tóm tắt (không kèm messages) — dùng cho danh sách sidebar. */
export type ConversationSummary = Omit<Conversation, "messages">;

let db: DatabaseSync | null = null;

/** Mở DB (singleton) và đảm bảo schema. */
function getDb(): DatabaseSync {
  if (db) return db;

  fs.mkdirSync(path.dirname(CHAT_DB_PATH), { recursive: true });

  db = new DatabaseSync(CHAT_DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id         TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      title      TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_conv_user_updated
      ON conversations (user_email, updated_at DESC);

    CREATE TABLE IF NOT EXISTS messages (
      id              TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL
        REFERENCES conversations (id) ON DELETE CASCADE,
      ord             INTEGER NOT NULL,
      role            TEXT NOT NULL,
      parts_json      TEXT NOT NULL,
      metadata_json   TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_msg_conv
      ON messages (conversation_id, ord);

    CREATE TABLE IF NOT EXISTS message_feedback (
      conversation_id TEXT NOT NULL,
      message_id      TEXT NOT NULL,
      user_email      TEXT NOT NULL,
      rating          INTEGER NOT NULL,
      created_at      INTEGER NOT NULL,
      PRIMARY KEY (user_email, conversation_id, message_id)
    );
    CREATE INDEX IF NOT EXISTS idx_feedback_conv
      ON message_feedback (conversation_id);

    CREATE TABLE IF NOT EXISTS bookmarks (
      user_email TEXT NOT NULL,
      slug       TEXT NOT NULL,
      title      TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      PRIMARY KEY (user_email, slug)
    );
    CREATE INDEX IF NOT EXISTS idx_bookmark_user_created
      ON bookmarks (user_email, created_at DESC);
  `);

  return db;
}

const MAX_CONVERSATIONS = 50;

/** Liệt kê hội thoại của user, mới nhất trước (không kèm messages). */
export function listConversations(userEmail: string): ConversationSummary[] {
  const rows = getDb()
    .prepare(
      `SELECT id, title, created_at, updated_at
         FROM conversations
        WHERE user_email = ?
        ORDER BY updated_at DESC
        LIMIT ?`,
    )
    .all(userEmail, MAX_CONVERSATIONS) as Array<{
    id: string;
    title: string;
    created_at: number;
    updated_at: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/** Lấy 1 hội thoại (kèm messages) — chỉ khi thuộc về user. Null nếu không có. */
export function getConversation(
  userEmail: string,
  id: string,
): Conversation | null {
  const conn = getDb();
  const conv = conn
    .prepare(
      `SELECT id, title, created_at, updated_at
         FROM conversations
        WHERE id = ? AND user_email = ?`,
    )
    .get(id, userEmail) as
    | { id: string; title: string; created_at: number; updated_at: number }
    | undefined;

  if (!conv) return null;

  const msgs = conn
    .prepare(
      `SELECT role, parts_json, metadata_json
         FROM messages
        WHERE conversation_id = ?
        ORDER BY ord ASC`,
    )
    .all(id) as Array<{
    role: string;
    parts_json: string;
    metadata_json: string | null;
  }>;

  const messages: UIMessage[] = msgs.map((m, i) => ({
    id: `${id}-${i}`,
    role: m.role as UIMessage["role"],
    parts: JSON.parse(m.parts_json),
    ...(m.metadata_json
      ? { metadata: JSON.parse(m.metadata_json) }
      : {}),
  }));

  return {
    id: conv.id,
    title: conv.title,
    messages,
    createdAt: conv.created_at,
    updatedAt: conv.updated_at,
  };
}

/**
 * Upsert một hội thoại + toàn bộ messages (ghi đè message cũ của hội thoại).
 * Title chỉ đặt khi tạo mới hoặc khi hội thoại chưa có title.
 */
export function upsertConversation(
  userEmail: string,
  id: string,
  title: string,
  messages: UIMessage[],
): void {
  const conn = getDb();
  const now = Date.now();

  conn.exec("BEGIN");
  try {
    const existing = conn
      .prepare(
        `SELECT title FROM conversations WHERE id = ? AND user_email = ?`,
      )
      .get(id, userEmail) as { title: string } | undefined;

    if (existing) {
      // Giữ title cũ nếu đã có; cập nhật updated_at.
      const finalTitle = existing.title || title;
      conn
        .prepare(
          `UPDATE conversations SET title = ?, updated_at = ?
            WHERE id = ? AND user_email = ?`,
        )
        .run(finalTitle, now, id, userEmail);
    } else {
      conn
        .prepare(
          `INSERT INTO conversations (id, user_email, title, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(id, userEmail, title, now, now);
    }

    // Ghi lại toàn bộ messages: xoá cũ rồi chèn mới (đơn giản, an toàn thứ tự).
    conn
      .prepare(`DELETE FROM messages WHERE conversation_id = ?`)
      .run(id);

    const insertMsg = conn.prepare(
      `INSERT INTO messages (id, conversation_id, ord, role, parts_json, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    messages.forEach((m, ord) => {
      insertMsg.run(
        `${id}-${ord}`,
        id,
        ord,
        m.role,
        JSON.stringify(m.parts ?? []),
        m.metadata != null ? JSON.stringify(m.metadata) : null,
      );
    });

    conn.exec("COMMIT");
  } catch (err) {
    conn.exec("ROLLBACK");
    throw err;
  }
}

/** Xoá 1 hội thoại của user (cascade xoá messages). */
export function deleteConversation(userEmail: string, id: string): void {
  getDb()
    .prepare(`DELETE FROM conversations WHERE id = ? AND user_email = ?`)
    .run(id, userEmail);
}

/** Đánh giá: 1 = 👍, -1 = 👎. */
export type FeedbackRating = 1 | -1;

/**
 * Ghi/cập nhật đánh giá của user cho một message assistant. Bấm lại cùng rating
 * → gỡ (toggle off). Trả về rating hiện tại sau thao tác (0 = đã gỡ).
 *
 * `messageId` là id phía client của useChat (ổn định trong một hội thoại đã
 * lưu), không phải PK nội bộ của bảng messages.
 */
export function setFeedback(
  userEmail: string,
  conversationId: string,
  messageId: string,
  rating: FeedbackRating,
): FeedbackRating | 0 {
  const conn = getDb();
  const current = conn
    .prepare(
      `SELECT rating FROM message_feedback
        WHERE user_email = ? AND conversation_id = ? AND message_id = ?`,
    )
    .get(userEmail, conversationId, messageId) as
    | { rating: number }
    | undefined;

  // Bấm lại đúng rating đang có → gỡ đánh giá.
  if (current && current.rating === rating) {
    conn
      .prepare(
        `DELETE FROM message_feedback
          WHERE user_email = ? AND conversation_id = ? AND message_id = ?`,
      )
      .run(userEmail, conversationId, messageId);
    return 0;
  }

  conn
    .prepare(
      `INSERT INTO message_feedback
         (conversation_id, message_id, user_email, rating, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (user_email, conversation_id, message_id)
       DO UPDATE SET rating = excluded.rating, created_at = excluded.created_at`,
    )
    .run(conversationId, messageId, userEmail, rating, Date.now());

  return rating;
}

/** Lấy toàn bộ đánh giá của user trong một hội thoại: { messageId: rating }. */
export function getFeedbackForConversation(
  userEmail: string,
  conversationId: string,
): Record<string, FeedbackRating> {
  const rows = getDb()
    .prepare(
      `SELECT message_id, rating FROM message_feedback
        WHERE user_email = ? AND conversation_id = ?`,
    )
    .all(userEmail, conversationId) as Array<{
    message_id: string;
    rating: number;
  }>;

  const out: Record<string, FeedbackRating> = {};
  for (const r of rows) out[r.message_id] = r.rating as FeedbackRating;
  return out;
}

/** Một trang wiki đã lưu (bookmark). `slug` chính là đường dẫn /wiki/<slug>. */
export type Bookmark = {
  slug: string;
  title: string;
  createdAt: number;
};

/** Liệt kê bookmark của user, mới nhất trước. */
export function listBookmarks(userEmail: string): Bookmark[] {
  const rows = getDb()
    .prepare(
      `SELECT slug, title, created_at
         FROM bookmarks
        WHERE user_email = ?
        ORDER BY created_at DESC`,
    )
    .all(userEmail) as Array<{
    slug: string;
    title: string;
    created_at: number;
  }>;

  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    createdAt: r.created_at,
  }));
}

/**
 * Bật/tắt bookmark cho một trang. Trả về trạng thái sau thao tác
 * (true = đang được lưu).
 */
export function toggleBookmark(
  userEmail: string,
  slug: string,
  title: string,
): boolean {
  const conn = getDb();
  const existing = conn
    .prepare(`SELECT 1 FROM bookmarks WHERE user_email = ? AND slug = ?`)
    .get(userEmail, slug);

  if (existing) {
    conn
      .prepare(`DELETE FROM bookmarks WHERE user_email = ? AND slug = ?`)
      .run(userEmail, slug);
    return false;
  }

  conn
    .prepare(
      `INSERT INTO bookmarks (user_email, slug, title, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run(userEmail, slug, title, Date.now());
  return true;
}

/** Kiểm tra một trang đã được user bookmark chưa. */
export function isBookmarked(userEmail: string, slug: string): boolean {
  return !!getDb()
    .prepare(`SELECT 1 FROM bookmarks WHERE user_email = ? AND slug = ?`)
    .get(userEmail, slug);
}
