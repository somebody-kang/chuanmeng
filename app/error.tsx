"use client";

import Link from "next/link";

export default function SetupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <nav className="border-b border-[var(--border)] bg-[rgba(18,8,14,0.9)] px-5 py-3 text-center font-display text-sm text-white">
        红动漫社萌战
      </nav>
      <main className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="font-display text-3xl text-[#ff9eb5]">网站未能正常加载</h1>
        <p className="mt-4 text-sm text-[var(--text-secondary)]">{error.message}</p>
        <div className="glass-panel mt-8 space-y-3 rounded-2xl p-6 text-left text-sm">
          <p className="font-semibold text-white">请按顺序在终端执行：</p>
          <pre className="overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-[var(--text-secondary)]">
{`cd demo
npm install
npm run setup
npm run dev`}
          </pre>
          <p className="text-[var(--text-muted)]">
            或双击 <code className="text-[#ff9eb5]">demo/start.bat</code>，然后打开{" "}
            <Link href="http://localhost:3000" className="text-[#ff9eb5] underline">
              http://localhost:3000
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-gradient-to-r from-[#fb7299] to-[#e85d84] px-6 py-2.5 text-white"
        >
          重试
        </button>
      </main>
    </>
  );
}
