import type { Metadata } from "next";
import { Noto_Sans_SC, ZCOOL_QingKe_HuangYou } from "next/font/google";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

const display = ZCOOL_QingKe_HuangYou({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Noto_Sans_SC({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "红动漫社萌战",
  description: "四川大学二次元萌战投票 · B站萌战黑板风",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="page-shell">
          <ToastProvider>{children}</ToastProvider>
        </div>
      </body>
    </html>
  );
}
