---
title: "Hướng dẫn thư mục: 09_Testing"
type: dashboard
source:
  - System/CLAUDE.md
status: reviewed
last_synced: "2026-06-09"
tags:
  - testing
  - readme
---

## 📂 Thư mục: 09_Testing (Chiến lược & Tài liệu Kiểm thử)

## 🎯 Tác dụng & Vai trò

Thư mục `09_Testing/` lưu trữ toàn bộ tài liệu về **chiến lược kiểm thử** và **kịch bản test** của hệ thống. Đây là nơi để team kỹ thuật biết "test cái gì, test ở đâu, và test như thế nào" — từ unit test cho đến E2E, bao gồm cả tài liệu về cấu hình CI/CD test pipeline.

## 🗂️ Cấu trúc file đề xuất

```
09_Testing/
├── README.md                            ← File này
├── <project>_Test_Strategy.md           ← Chiến lược test tổng thể
├── <project>_Unit_Test_Guide.md         ← Hướng dẫn unit test
├── <project>_E2E_Test_Guide.md          ← Hướng dẫn E2E test
└── <project>_Coverage_Report.md         ← Báo cáo coverage (auto-gen)
```

## 📐 Nội dung một file Test Strategy

Mỗi tài liệu test strategy cần bao gồm:

1. **Phạm vi kiểm thử (Test Scope)**: Những gì được test, những gì bị loại trừ.
2. **Chiến lược phân tầng (Test Pyramid)**:
   - Unit Tests: Test từng function/service độc lập.
   - Integration Tests: Test giao tiếp giữa các module/service.
   - E2E Tests: Test toàn bộ luồng từ UI đến database.
3. **Công cụ & Framework**: Jest, Playwright, Karma, Supertest...
4. **Tiêu chí Coverage**: Ngưỡng coverage tối thiểu yêu cầu.
5. **Kịch bản test quan trọng (Critical Test Cases)**: Các tính năng core PHẢI có test.
6. **Cấu hình CI/CD**: Test chạy ở stage nào trong pipeline.

### Định dạng Frontmatter Mẫu

```yaml
---
title: "Test Strategy: <project>"
type: testing
source:
  - "local: <local_path>/jest.config.ts"
  - "local: <local_path>/e2e/"
status: draft | reviewed | stale
last_synced: YYYY-MM-DD
tags:
  - testing
  - quality
---
```

## 🔧 Cách tạo tài liệu Testing

```
/spec-testing <project_name>
```

AI sẽ tự động đọc các file test (`.spec.ts`, `.e2e.ts`, `jest.config.ts`, `playwright.config.ts`) để trích xuất chiến lược và kịch bản test nổi bật.

## 🔗 Liên kết Hữu ích

- [[Index]] — Quay lại Trang chủ chính.
- [[04_API_Specs/README|Đặc tả API & Logic]] — API được test thông qua integration test.
- [[07_Tasks_&_Logs/README|Nhiệm vụ & Nhật ký]] — Bug report từ quá trình test.
