import type { Metadata } from "next";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "红动漫社萌战",
  description: "四川大学二次元萌战投票 · B站萌战黑板风",
};

/**
 * 不使用 next/font/google：校园网常无法访问 Google Fonts，
 * 会导致编译/首屏报错。改用系统中文字体栈（见 globals.css）。
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="page-shell">
          <ToastProvider>{children}</ToastProvider>
        </div>
      </body>
    </html>
  );
}
