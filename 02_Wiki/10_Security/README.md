---
title: "Hướng dẫn thư mục: 10_Security"
type: dashboard
source:
  - System/CLAUDE.md
status: reviewed
last_synced: "2026-06-09"
tags:
  - security
  - readme
---

## 📂 Thư mục: 10_Security (Bảo mật & Audit)

## 🎯 Tác dụng & Vai trò

Thư mục `10_Security/` lưu trữ toàn bộ tài liệu liên quan đến **bảo mật hệ thống**: cơ chế xác thực & phân quyền, chính sách API security, bản đồ dữ liệu nhạy cảm (PII), và security checklist. Đây là nơi tham chiếu khi team cần audit bảo mật hoặc onboard thành viên mới về các quyết định security.

## 🗂️ Cấu trúc file đề xuất

```
10_Security/
├── README.md                      ← File này
├── Auth_&_RBAC.md                 ← Cơ chế xác thực & ma trận phân quyền
├── API_Security_Policy.md         ← Rate limiting, CORS, input validation
├── PII_Data_Map.md                ← Bản đồ dữ liệu cá nhân nhạy cảm
└── Security_Checklist.md          ← Checklist trước khi deploy
```

## 🔐 Nội dung cần tài liệu hóa

### 1. Auth & RBAC (`Auth_&_RBAC.md`)
- **Cơ chế xác thực**: JWT / Session / OAuth2 / API Key
- **Luồng đăng nhập / refresh token**: Sequence diagram Mermaid
- **Ma trận phân quyền (RBAC Matrix)**:

| Role | Endpoint / Resource | Quyền |
|------|---------------------|-------|
| Admin | `*` | Full CRUD |
| User | `/api/products` | Read |
| Guest | `/api/auth/login` | Write |

- **Guards & Interceptors**: File path + logic guard

### 2. API Security Policy (`API_Security_Policy.md`)
- Rate limiting: giới hạn request/phút per IP / per user
- CORS: danh sách origin được phép
- Input validation: DTO validation rules, sanitization
- Helmet / Security headers đã cấu hình
- SQL Injection / XSS protection strategy

### 3. PII Data Map (`PII_Data_Map.md`)
- Liệt kê các trường dữ liệu cá nhân trong DB (email, phone, address...)
- Cơ chế mã hóa / hash đang dùng (bcrypt, AES...)
- Chính sách retention và xóa dữ liệu
- Tuân thủ GDPR / PDPA nếu có

### Định dạng Frontmatter Mẫu
```yaml
---
title: "Security: <Chủ đề>"
type: security
source:
  - "local: <local_path>/src/auth/"
  - "01_Raw/drive_docs/<security_policy_doc>"
status: draft | reviewed | stale
last_synced: YYYY-MM-DD
tags:
  - security
  - auth
  - rbac
---
```

## ⚠️ Lưu ý quan trọng

> **KHÔNG** lưu thông tin nhạy cảm thực tế vào đây:
> - Không lưu private key, secret key, password
> - Không lưu connection string thực tế
> - Không lưu token hoặc credential
>
> File wiki chỉ mô tả **chiến lược và cấu trúc**, không chứa **giá trị bí mật**. Các giá trị bí mật thuộc về `.env.*` và secret manager.

## 🔗 Liên kết Hữu ích

- [[Index]] — Quay lại Trang chủ chính.
- [[04_API_Specs/README|Đặc tả API & Logic]] — Chi tiết endpoint và business rule.
- [[05_Database/README|Cơ sở dữ liệu]] — Schema lưu trữ dữ liệu người dùng.
- [[08_ADR/README|Architecture Decisions]] — Quyết định chọn cơ chế xác thực.
