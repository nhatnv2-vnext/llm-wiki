#!/usr/bin/env node
/**
 * doc_parser_agent.js — Sub-agent bóc tách PDF → Markdown thô cho Ingestion Pipeline.
 *
 * Đọc các file *.pdf trong 01_Raw/drive_docs/ (ưu tiên PRD*.pdf), dùng
 * Microsoft MarkItDown (CLI `markitdown`) để bóc nội dung, chuẩn hoá heading
 * cho các mục chuyên đề (Business Rules, Use Cases...), rồi ghi ra
 * 01_Raw/drive_docs/parsed/<tên>.md.
 *
 * Triết lý vault: chỉ ĐỌC Layer 1 (file PDF gốc), KHÔNG sửa file gốc; output
 * ghi vào thư mục con parsed/.
 *
 * Chạy: npm run parse-docs
 * Yêu cầu: markitdown (cài qua `pipx install 'markitdown[pdf]'`).
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// --- Cờ dòng lệnh ------------------------------------------------------------
// Chế độ OCR (bổ sung Tesseract đọc chữ trong ẢNH nhúng / bảng dạng ảnh):
//   (mặc định) auto — tự bật OCR cho PDF nào CÓ ảnh nhúng (phát hiện qua pdfimages)
//   --ocr      — ép bật OCR cho MỌI file
//   --no-ocr   — tắt hoàn toàn, chỉ dùng text-layer
// Cần poppler (pdftoppm, pdfimages) + tesseract; thiếu thì tự bỏ qua OCR.
const OCR_MODE = process.argv.includes("--no-ocr")
  ? "off"
  : process.argv.includes("--ocr")
    ? "force"
    : "auto";
const OCR_LANG = (() => {
  const i = process.argv.indexOf("--lang");
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : "eng";
})();

// --- Đường dẫn ---------------------------------------------------------------
const VAULT_ROOT = path.resolve(__dirname, "..", "..", "..");
const DRIVE_DOCS = path.join(VAULT_ROOT, "01_Raw", "drive_docs");
const PARSED_DIR = path.join(DRIVE_DOCS, "parsed");

// --- Các mục chuyên đề cần chuẩn hoá thành heading `##` ----------------------
// Khoá: regex khớp dòng tiêu đề (không phân biệt hoa thường). Value: nhãn chuẩn.
const SECTION_PATTERNS = [
  { re: /^business\s*rules?$|^quy\s*t[ắa]c\s*nghi[ệe]p\s*v[ụu]$/i, label: "Business Rules" },
  { re: /^use\s*cases?$|^ca\s*s[ửu]\s*d[ụu]ng$|^tr[ưu][ờo]ng\s*h[ợo]p\s*s[ửu]\s*d[ụu]ng$/i, label: "Use Cases" },
  { re: /^t[ổo]ng\s*quan$|^overview$/i, label: "Tổng quan" },
  { re: /^ph[ụu]\s*l[ụu]c$|^appendix$/i, label: "Phụ lục" },
  { re: /^y[êe]u\s*c[ầa]u\s*ch[ứu]c\s*n[ăa]ng$|^functional\s*requirements?$/i, label: "Yêu cầu chức năng" },
  { re: /^y[êe]u\s*c[ầa]u\s*phi\s*ch[ứu]c\s*n[ăa]ng$|^non[-\s]*functional\s*requirements?$/i, label: "Yêu cầu phi chức năng" },
];

// --- MarkItDown CLI ----------------------------------------------------------

/** Tìm binary markitdown (PATH hoặc ~/.local/bin do pipx cài). */
function resolveMarkitdown() {
  const candidates = [
    "markitdown",
    path.join(os.homedir(), ".local", "bin", "markitdown"),
  ];
  for (const bin of candidates) {
    try {
      execFileSync(bin, ["--help"], { stdio: "ignore" });
      return bin;
    } catch {
      // thử ứng viên tiếp theo
    }
  }
  return null;
}

/** Bóc PDF → markdown thô bằng markitdown. */
function markitdownExtract(bin, pdfPath) {
  return execFileSync(bin, [pdfPath], {
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

// --- OCR (tùy chọn, --ocr) ---------------------------------------------------
// Đọc chữ nằm trong ẢNH nhúng / bảng dạng ảnh mà text-layer không có:
// render từng trang PDF → PNG (pdftoppm) → OCR (tesseract) → gộp vào text-layer.

/** Kiểm tra binary có chạy được không. */
function hasBin(bin, args = ["--version"]) {
  try {
    execFileSync(bin, args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Đếm số ảnh nhúng trong PDF (qua pdfimages -list). -1 nếu không kiểm được. */
function countPdfImages(pdfPath) {
  if (!hasBin("pdfimages", ["-v"])) return -1;
  try {
    const out = execFileSync("pdfimages", ["-list", pdfPath], {
      encoding: "utf-8",
      maxBuffer: 16 * 1024 * 1024,
    });
    // Bỏ 2 dòng header; mỗi dòng còn lại là 1 ảnh.
    const lines = out.split("\n").filter((l) => l.trim());
    return Math.max(0, lines.length - 2);
  } catch {
    return -1;
  }
}

/**
 * Quyết định có OCR cho 1 file không, theo OCR_MODE:
 *  off   → false
 *  force → true
 *  auto  → true nếu PDF có ảnh nhúng (>0).
 * Trả { ocr: boolean, reason: string }.
 */
function shouldOcr(pdfPath) {
  if (OCR_MODE === "off") return { ocr: false, reason: "" };
  if (OCR_MODE === "force") return { ocr: true, reason: "force" };
  const n = countPdfImages(pdfPath);
  if (n > 0) return { ocr: true, reason: `auto: ${n} ảnh nhúng` };
  return { ocr: false, reason: "" };
}

/** OCR toàn bộ trang PDF → text. Trả "" nếu thiếu công cụ. */
function ocrExtract(pdfPath, lang) {
  if (!hasBin("pdftoppm", ["-h"]) || !hasBin("tesseract")) {
    console.warn(
      "  ⚠️ Bỏ qua OCR: cần `poppler` (pdftoppm) + `tesseract`.\n" +
        "     Cài: brew install poppler tesseract",
    );
    return "";
  }
  // Dùng thư mục tạm CẠNH output (trong vault) thay vì os.tmpdir(): một số môi
  // trường sandbox đặt tmpdir ở nơi Tesseract/Leptonica không đọc được file.
  const tmp = fs.mkdtempSync(path.join(PARSED_DIR, ".ocr-tmp-"));
  try {
    // render 300 DPI PNG, tiền tố tmp/page
    execFileSync("pdftoppm", ["-r", "300", "-png", pdfPath, path.join(tmp, "page")], {
      stdio: "ignore",
    });
    const pages = fs
      .readdirSync(tmp)
      .filter((f) => f.endsWith(".png"))
      .sort();
    let text = "";
    for (const png of pages) {
      // tesseract <img> stdout (-) → text
      const out = execFileSync("tesseract", [path.join(tmp, png), "-", "-l", lang], {
        encoding: "utf-8",
        maxBuffer: 64 * 1024 * 1024,
        stdio: ["ignore", "pipe", "ignore"],
      });
      text += out + "\n";
    }
    return text;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * Gộp text-layer + OCR: thêm các DÒNG có trong OCR mà text-layer chưa có
 * (so khớp sau khi chuẩn hoá khoảng trắng) vào cuối, dưới một mục riêng.
 */
function mergeOcr(textLayer, ocrText) {
  if (!ocrText.trim()) return textLayer;
  const norm = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const have = new Set(textLayer.split("\n").map(norm).filter(Boolean));
  const extra = [];
  for (const line of ocrText.split("\n")) {
    const key = norm(line);
    if (key && key.length > 8 && !have.has(key)) {
      have.add(key);
      extra.push(line.trim());
    }
  }
  if (extra.length === 0) return textLayer;
  return (
    textLayer +
    "\n\n## Nội dung bổ sung từ OCR\n" +
    "_Phần text nằm trong ảnh/bảng, trích bằng Tesseract (có thể cần review)._\n\n" +
    extra.join("\n") +
    "\n"
  );
}

// --- Chuẩn hoá heading -------------------------------------------------------

/**
 * Promote các dòng tiêu đề section (Business Rules, Use Cases...) thành `##`.
 * Dòng đầu tiên không rỗng → dùng làm tiêu đề `#` của tài liệu nếu chưa có.
 * Giữ nguyên các dòng nội dung khác.
 */
function normalizeHeadings(raw, fallbackTitle) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let titleSet = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Dòng đã là heading markdown → giữ nguyên, đánh dấu đã có title nếu là `#`.
    if (/^#{1,6}\s/.test(trimmed)) {
      if (/^#\s/.test(trimmed)) titleSet = true;
      out.push(line);
      continue;
    }

    // Tiêu đề tài liệu: dòng nội dung đầu tiên → `#`.
    if (!titleSet && trimmed) {
      out.push(`# ${trimmed}`);
      titleSet = true;
      continue;
    }

    // Khớp mục chuyên đề → `##`.
    const section = SECTION_PATTERNS.find((s) => s.re.test(trimmed));
    if (section) {
      // chèn dòng trống trước heading cho sạch
      if (out.length && out[out.length - 1].trim() !== "") out.push("");
      out.push(`## ${section.label}`);
      continue;
    }

    out.push(line);
  }

  if (!titleSet) out.unshift(`# ${fallbackTitle}`);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/** Đếm số mục chuyên đề tìm được (để báo cáo). */
function detectedSections(markdown) {
  const found = [];
  for (const s of SECTION_PATTERNS) {
    if (new RegExp(`^##\\s+${s.label}$`, "m").test(markdown)) found.push(s.label);
  }
  return found;
}

// --- Main --------------------------------------------------------------------

function main() {
  if (!fs.existsSync(DRIVE_DOCS)) {
    console.error(`❌ Không tìm thấy thư mục: ${DRIVE_DOCS}`);
    process.exit(1);
  }

  const bin = resolveMarkitdown();
  if (!bin) {
    console.error(
      "❌ Không tìm thấy `markitdown`. Cài bằng:\n" +
        "   pipx install 'markitdown[pdf]'   (khuyến nghị)\n" +
        "   hoặc: pip install 'markitdown[pdf]'",
    );
    process.exit(1);
  }

  // Tìm PDF: ưu tiên PRD*.pdf, sau đó mọi *.pdf khác.
  const allPdfs = fs
    .readdirSync(DRIVE_DOCS)
    .filter((f) => f.toLowerCase().endsWith(".pdf"));
  const pdfs = [
    ...allPdfs.filter((f) => /^prd/i.test(f)),
    ...allPdfs.filter((f) => !/^prd/i.test(f)),
  ];

  if (pdfs.length === 0) {
    console.log(`ℹ️  Không có file PDF nào trong ${DRIVE_DOCS}. Bỏ qua.`);
    return;
  }

  fs.mkdirSync(PARSED_DIR, { recursive: true });
  console.log(`📄 Tìm thấy ${pdfs.length} PDF. Parse bằng MarkItDown (${bin})...\n`);

  let ok = 0;
  for (const pdf of pdfs) {
    const srcPath = path.join(DRIVE_DOCS, pdf);
    const baseName = pdf.replace(/\.pdf$/i, "");
    const outPath = path.join(PARSED_DIR, `${baseName}.md`);
    try {
      let raw = markitdownExtract(bin, srcPath);
      const { ocr, reason } = shouldOcr(srcPath);
      if (ocr) {
        const ocrText = ocrExtract(srcPath, OCR_LANG);
        raw = mergeOcr(raw, ocrText);
      }
      const md = normalizeHeadings(raw, baseName);
      fs.writeFileSync(outPath, md, "utf-8");
      const sections = detectedSections(md);
      ok++;
      console.log(
        `  ✓ ${pdf} → parsed/${baseName}.md` +
          (ocr ? ` [+OCR — ${reason}]` : "") +
          (sections.length ? `  [mục: ${sections.join(", ")}]` : "  [⚠️ không nhận diện mục chuyên đề]"),
      );
    } catch (err) {
      console.error(`  ✗ ${pdf}: ${err.message}`);
    }
  }

  console.log(
    `\n✅ Hoàn thành: ${ok}/${pdfs.length} file parse thành công → ${path.relative(VAULT_ROOT, PARSED_DIR)}/`,
  );
}

main();
