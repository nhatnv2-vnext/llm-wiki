/**
 * Phòng thủ ReDoS cho regex do người dùng cung cấp (grep_wiki nhận pattern tự
 * do, và endpoint HTTP chưa có auth → input là không tin cậy).
 *
 * JS không cho hủy một lần regex.test() đang chạy đồng bộ, nên ta dùng phòng
 * thủ TĨNH + giới hạn input thay vì timeout:
 *   1. Giới hạn độ dài pattern.
 *   2. Từ chối các dạng nested-quantifier dễ "catastrophic backtracking".
 *   3. Caller chỉ match trên dòng có độ dài bị giới hạn (backtracking bùng nổ
 *      cần input đủ dài) — xem MAX_LINE_LENGTH.
 *
 * Logic thuần (không I/O) để unit-test trực tiếp.
 */

export const MAX_PATTERN_LENGTH = 256;
/** Dòng dài hơn ngưỡng này bị bỏ qua khi match — chặn bùng nổ backtracking. */
export const MAX_LINE_LENGTH = 2000;

/**
 * Các dạng nested quantifier điển hình gây catastrophic backtracking:
 *   (a+)+   (a*)*   (a+)*   (a*)+   (.+)+   (\w+)*  ... kể cả khi có {m,n}.
 * Heuristic: một nhóm `( ... <quantifier> )` ngay sau đó lại có quantifier.
 */
const NESTED_QUANTIFIER =
  /\([^)]*[+*}]\s*\)\s*[+*]/;
/** `(a|aa)+`, `(a|a)*` — alternation trùng lặp trong nhóm có quantifier. */
const QUANTIFIED_ALTERNATION_GROUP =
  /\((?:[^()|]+\|)+[^()|]*\)\s*[+*]/;

export type RegexCheck =
  | { ok: true }
  | { ok: false; reason: "too_long" | "redos_risk"; message: string };

/** Kiểm tra một pattern (chuỗi regex thô) có an toàn để compile + chạy không. */
export function checkPatternSafety(pattern: string): RegexCheck {
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return {
      ok: false,
      reason: "too_long",
      message: `Pattern quá dài (tối đa ${MAX_PATTERN_LENGTH} ký tự).`,
    };
  }
  if (NESTED_QUANTIFIER.test(pattern) || QUANTIFIED_ALTERNATION_GROUP.test(pattern)) {
    return {
      ok: false,
      reason: "redos_risk",
      message:
        "Pattern có dạng quantifier lồng nhau (vd `(a+)+`) dễ gây treo. " +
        "Hãy đơn giản hoá hoặc dùng từ khoá nguyên văn.",
    };
  }
  return { ok: true };
}

/**
 * Compile pattern thành RegExp một cách an toàn:
 *  - Nếu pattern KHÔNG phải regex hợp lệ → escape, coi như chuỗi nguyên văn
 *    (an toàn tuyệt đối, không backtracking).
 *  - Nếu là regex hợp lệ nhưng dính heuristic ReDoS → ném lỗi để caller từ chối.
 */
export function compileSafeRegex(
  pattern: string,
  caseSensitive: boolean,
): RegExp {
  const flags = caseSensitive ? "" : "i";

  // Pattern không hợp lệ → literal: an toàn, bỏ qua kiểm tra ReDoS.
  try {
    new RegExp(pattern, flags);
  } catch {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(escaped, flags);
  }

  const safety = checkPatternSafety(pattern);
  if (!safety.ok) {
    throw new Error(safety.message);
  }
  return new RegExp(pattern, flags);
}
