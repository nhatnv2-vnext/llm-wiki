---
name: ask-vault
description: Tra cứu wiki trong vault (02_Wiki/) + code-graph (02_Wiki/05_Code_Graph/) + source code (01_Raw/codebase/) để trả lời câu hỏi về dự án laptop-shop (NestJS + Angular + MySQL/Prisma). Trigger khi user gõ /ask-vault, hỏi "vault có nói gì về...", "tra cứu wiki...", "module X làm gì", hoặc bất kỳ câu hỏi định tính về kiến trúc, API, schema, flow, module của dự án.
---

# Skill: ask-vault

Bạn được gọi để trả lời câu hỏi về **dự án `laptop-shop`** (NestJS + Angular + MySQL/Prisma) đã được index trong vault Obsidian.

## Quy tắc 6 bước

1. **Bắt đầu từ map.** Đọc `02_Wiki/00_Dashboard/Index.md` để lấy tổng quan.
   Nếu file `02_Wiki/00_Dashboard/Vault_Index.json` tồn tại, đọc nó trước — đó là index nhanh (title, headings, links).

2. **Định vị file liên quan.** Dựa vào câu hỏi:
   - Câu hỏi kiến trúc / flow → `02_Wiki/01_Architecture/`
   - API endpoint → `02_Wiki/02_API_Specs/`
   - Bảng / schema → `02_Wiki/03_Database/Schema_Design.md`
   - Module cụ thể (cấp code) → `02_Wiki/05_Code_Graph/<project>/<area>/SKILL.md`
   - Phát hiện code lệch spec → `02_Wiki/04_Tasks_&_Logs/Conflict_Reports.md`

3. **Theo wikilink.** Mọi file wiki có section "Liên kết" hoặc link `[[...]]` ở giữa văn bản. Follow chúng để bù ngữ cảnh.

4. **Khi cần code thật**, mở file trong `01_Raw/codebase/` — đường dẫn được nêu trong frontmatter `source:` hoặc trong section "Source of truth".

5. **Khi vault không có**, nói thẳng: "Wiki chưa có nội dung X. File gần nhất là [[Y]]." KHÔNG bịa đặt.

6. **BẮT BUỘC: log telemetry.** Sau khi trả lời, chạy Bash sau đây để append 1 JSONL entry vào `02_Wiki/04_Tasks_&_Logs/Ask_Logs/<YYYY-MM>.jsonl`. Mục đích: lead theo dõi câu hỏi của team → biết wiki còn gap ở đâu (xem `System/CLAUDE.md §2.4`).

   ```bash
   ts=$(date -u +%FT%TZ)
   user=$(git config user.email 2>/dev/null || echo "${USER:-unknown}")
   month=$(date -u +%Y-%m)
   logdir="02_Wiki/04_Tasks_&_Logs/Ask_Logs"
   mkdir -p "$logdir"
   python3 - <<'PYEOF' >> "$logdir/${month}.jsonl"
   import json, os
   print(json.dumps({
     "ts": os.environ["ts"],
     "user": os.environ["user"],
     "question": os.environ["question"][:300],
     "answer_summary": os.environ["answer_summary"][:200],
   }, ensure_ascii=False))
   PYEOF
   ```

   Trước khi chạy, set env var:
   - `question`: nguyên văn câu hỏi user (script tự truncate 300 ký tự).
   - `answer_summary`: 1-2 dòng tóm tắt câu trả lời của bạn (≤200 ký tự). Nếu vault không có → ghi rõ "wiki chưa có ..." để aggregator detect gap.

   Ví dụ invocation:
   ```bash
   ts=$(date -u +%FT%TZ) \
   user=$(git config user.email 2>/dev/null || echo "$USER") \
   month=$(date -u +%Y-%m) \
   question="Auth flow như thế nào?" \
   answer_summary="POST /auth/login JWT → users.refresh_token. Frontend interceptor refresh khi 401." \
     bash -c 'mkdir -p 02_Wiki/04_Tasks_&_Logs/Ask_Logs && python3 -c "import json,os;print(json.dumps({\"ts\":os.environ[\"ts\"],\"user\":os.environ[\"user\"],\"question\":os.environ[\"question\"][:300],\"answer_summary\":os.environ[\"answer_summary\"][:200]},ensure_ascii=False))" >> "02_Wiki/04_Tasks_&_Logs/Ask_Logs/${month}.jsonl"'
   ```

   Quy tắc:
   - KHÔNG block trả lời cho user. Nếu Bash fail (permission denied, no python3…), ignore — không retry.
   - KHÔNG log nếu user dùng `/ask-vault` chỉ để test/debug (vd "hello", "ping") — judgement call.

## Format câu trả lời

```
**Tóm tắt** (1-3 dòng)

**Chi tiết**
<nội dung, có wikilink + trích file:line>

**Nguồn**
- [[<wiki_file_1>]]
- `01_Raw/codebase/<path>:<line>` (nếu trích code)
```

## Ràng buộc

- KHÔNG sửa file trong `01_Raw/`. Nếu phát hiện code lệch spec → đề nghị user ghi vào `Conflict_Reports.md`, không tự ghi.
- KHÔNG suy luận về module nếu không tìm thấy trong vault. Trả lời "không có trong vault" thay vì đoán.
- Trích dẫn file:line khi có thể (vd: `auth.controller.ts:21`).
- Đọc memory trước khi đề xuất công cụ. Vault này đã chốt: dùng **ts-morph** cho custom AST script (Node/Angular fine-grained); dùng **CodeGraph** (`@colbymchenry/codegraph`, MIT) cho `npm run code-graph` overview — cài global, không clone source vào vault.
- BẮT BUỘC chạy bước 6 (log telemetry) sau MỌI câu trả lời, kể cả khi trả lời "wiki chưa có". Bỏ qua chỉ khi user gõ test/debug rõ ràng.

## Ví dụ

> User: "Auth flow như thế nào?"
>
> 1. Đọc `Vault_Index.json` → tìm entry có tag `auth` → `Auth_API.md` + `Frontend_Overview.md` (auth interceptor).
> 2. Đọc 2 file → tổng hợp: endpoint backend + interceptor flow frontend.
> 3. Trích `01_Raw/codebase/nestjs-backend/src/auth/auth.controller.ts:21` cho `POST /auth/login`.
> 4. Trả lời theo format trên.

> User: "Hệ thống có deploy lên k8s không?"
>
> Không có file nào trong vault đề cập k8s/Helm/Docker (chỉ có `docker-compose` trong code project, không phải spec deployment).
> Trả lời: "Wiki chưa có thông tin về deployment. File gần nhất là [[System_Overview]] nhưng cũng không nói về k8s."
