import "server-only";

import { MAX_QUERY_LENGTH } from "@/lib/config";

/**
 * Guardrails cho query đầu vào của RAG search.
 *
 * Mục tiêu:
 *  1. Validate cơ bản (độ dài, ký tự điều khiển).
 *  2. Chặn prompt injection (câu cố điều khiển model ở bước generation).
 *  3. Chặn từ ngữ độc hại.
 *  4. Phát hiện & CHE (redact) PII / secret người dùng vô tình nhập.
 *
 * Tách riêng, logic thuần (không I/O) để tái dùng ở bước generation (#WEB7)
 * và dễ unit-test.
 */

export type GuardrailRejection = {
  ok: false;
  /** Mã lý do để client/log phân biệt. */
  reason:
    | "empty"
    | "too_long"
    | "control_chars"
    | "prompt_injection"
    | "toxic";
  /** Thông điệp thân thiện trả cho người dùng. */
  message: string;
};

export type GuardrailAcceptance = {
  ok: true;
  /** Query đã được làm sạch + che PII, dùng để embed. */
  sanitizedQuery: string;
  /** true nếu có PII bị che — để log/cảnh báo. */
  redacted: boolean;
};

export type GuardrailResult = GuardrailRejection | GuardrailAcceptance;

// ---------------------------------------------------------------------------
// Mẫu phát hiện
// ---------------------------------------------------------------------------

/** Ký tự điều khiển (trừ tab/newline) — dấu hiệu payload bất thường. */
const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/;

/** Mẫu prompt injection phổ biến (Anh + Việt). */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+|the\s+)?(previous|above|prior)\s+(instructions?|prompts?)/i,
  /disregard\s+(all\s+|the\s+)?(previous|above|prior)/i,
  /bỏ\s*qua\s+(các\s+|mọi\s+|toàn\s+bộ\s+)?(hướng\s*dẫn|chỉ\s*dẫn|câu\s*lệnh|yêu\s*cầu)\s+(trước|trên|phía\s*trên)/i,
  /(reveal|show|print|leak|repeat)\s+(your\s+|the\s+)?(system\s+prompt|instructions?|prompt)/i,
  /(in|tiết\s*lộ|hiển\s*thị)\s+(ra\s+)?(system\s+prompt|prompt\s+hệ\s+thống|câu\s+lệnh\s+hệ\s+thống)/i,
  /you\s+are\s+now\s+(a|an|in)\b/i,
  /act\s+as\s+(a|an|if)\b/i,
  /(developer|jailbreak|DAN)\s+mode/i,
];

/** Từ ngữ độc hại (tối giản — mở rộng theo nhu cầu). */
const TOXIC_PATTERNS: RegExp[] = [
  /\bf+u+c+k+\b/i,
  /\bs+h+i+t+\b/i,
  /\bb+i+t+c+h+\b/i,
  /\bđụ\b|\bđịt\b|\blồn\b|\bcặc\b|\bđéo\b/i,
];

// PII / secret — phát hiện để CHE (không reject, vì có thể chỉ là nhầm).
// THỨ TỰ QUAN TRỌNG: che secret/email TRƯỚC, vì regex card/phone (khớp dãy số)
// có thể cắn vào các chữ số nằm trong API key nếu chạy trước.
const PII_PATTERNS: { name: string; re: RegExp; replacement: string }[] = [
  {
    // API key kiểu Google/AIza, AQ.xxx, sk-..., GitHub token...
    name: "api_key",
    re: /\b(?:AIza[0-9A-Za-z_-]{20,}|AQ\.[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z]{20,}|gh[pousr]_[0-9A-Za-z]{20,})\b/g,
    replacement: "[SECRET]",
  },
  {
    name: "email",
    re: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
    replacement: "[EMAIL]",
  },
  {
    name: "credit_card",
    re: /\b(?:\d[ -]*?){13,19}\b/g,
    replacement: "[CARD]",
  },
  {
    // SĐT VN/quốc tế: +84..., 0..., có thể có khoảng trắng/gạch.
    name: "phone",
    re: /(?<!\d)(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{2,4}\)?[ .-]?){2,4}\d{2,4}(?!\d)/g,
    replacement: "[PHONE]",
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Kiểm tra + làm sạch query. Trả về kết quả reject (kèm lý do) hoặc accept
 * (kèm query đã che PII).
 *
 * Thứ tự: reject trước (rẻ + dứt khoát), redact PII sau.
 */
export function checkQuery(rawQuery: string): GuardrailResult {
  const query = rawQuery.trim();

  if (!query) {
    return { ok: false, reason: "empty", message: "Câu hỏi không được để trống." };
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return {
      ok: false,
      reason: "too_long",
      message: `Câu hỏi quá dài (tối đa ${MAX_QUERY_LENGTH} ký tự).`,
    };
  }

  if (CONTROL_CHARS.test(query)) {
    return {
      ok: false,
      reason: "control_chars",
      message: "Câu hỏi chứa ký tự không hợp lệ.",
    };
  }

  if (INJECTION_PATTERNS.some((re) => re.test(query))) {
    return {
      ok: false,
      reason: "prompt_injection",
      message:
        "Câu hỏi chứa nội dung không được phép. Hãy đặt câu hỏi về nội dung trong wiki.",
    };
  }

  if (TOXIC_PATTERNS.some((re) => re.test(query))) {
    return {
      ok: false,
      reason: "toxic",
      message: "Câu hỏi chứa ngôn từ không phù hợp.",
    };
  }

  const { text: sanitizedQuery, redacted } = redactPII(query);

  return { ok: true, sanitizedQuery, redacted };
}

/** Che PII/secret trong text. Trả về text đã che + cờ có che hay không. */
export function redactPII(text: string): { text: string; redacted: boolean } {
  let result = text;
  let redacted = false;
  for (const { re, replacement } of PII_PATTERNS) {
    result = result.replace(re, (match) => {
      // tránh che chuỗi quá ngắn lọt vào regex card/phone (vd "12")
      if (match.replace(/\D/g, "").length < 6 && replacement !== "[EMAIL]") {
        return match;
      }
      redacted = true;
      return replacement;
    });
  }
  return { text: result, redacted };
}
