"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/** Lựa chọn người dùng đặt (system = theo hệ điều hành). */
export type ThemePreference = "light" | "dark" | "system";
/** Theme đã resolve thực sự áp lên giao diện. */
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (p: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Đọc lựa chọn đã lưu (an toàn SSR). */
function readStored(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

/** Resolve preference → light/dark, hỏi hệ điều hành nếu là "system". */
function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return pref;
}

/** Áp theme đã resolve lên <html data-theme>. */
function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.setAttribute("data-theme", resolved);
}

/**
 * Quản lý theme do người dùng chọn (dark/light/system), lưu localStorage và
 * đồng bộ `data-theme` trên <html>. Khi chọn "system", tự đổi theo hệ điều
 * hành ngay cả khi OS đổi lúc đang mở app.
 *
 * Cặp với <ThemeScript/> (chèn trước hydrate) để tránh nhấp nháy theme.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Khởi tạo bằng lazy initializer (đọc localStorage 1 lần) thay vì set trong
  // effect — tránh cascading render. ThemeScript đã set data-theme trên <html>
  // trước hydrate nên DOM khớp ngay từ lần paint đầu.
  const [preference, setPref] = useState<ThemePreference>(() => readStored());
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    resolveTheme(readStored()),
  );

  // Khi preference đổi → áp lên DOM (side-effect thuần, không setState ở đây).
  // resolved được cập nhật ngay trong setPreference/handler nên không cần set
  // lại trong effect.
  useEffect(() => {
    applyTheme(resolveTheme(preference));
  }, [preference]);

  // Theo dõi OS đổi theme khi đang ở chế độ "system".
  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r = mq.matches ? "dark" : "light";
      setResolved(r); // trong callback sự kiện ngoài → hợp lệ
      applyTheme(r);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((p: ThemePreference) => {
    window.localStorage.setItem(STORAGE_KEY, p);
    setPref(p);
    setResolved(resolveTheme(p));
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Hook truy cập theme; ném lỗi nếu dùng ngoài ThemeProvider. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme phải dùng trong <ThemeProvider>");
  return ctx;
}

/**
 * Script chạy TRƯỚC khi React hydrate: đọc localStorage và set data-theme ngay,
 * tránh nhấp nháy (FOUC). Render trong <head> qua dangerouslySetInnerHTML.
 */
export function ThemeScript() {
  const code = `(function(){try{
    var p = localStorage.getItem('${STORAGE_KEY}') || 'system';
    var dark = p === 'dark' || (p === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
