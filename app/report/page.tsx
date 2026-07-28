import SiteNav from "@/components/SiteNav";
import ReportView from "@/components/ReportView";

export default function ReportPage() {
  return (
    <>
      <SiteNav active="report" />

      <header className="report-hero">
        <div className="relative z-10 mx-auto w-full max-w-6xl anim-fade-up px-4 pb-10 pt-16 md:px-5 md:pt-20">
          <p className="font-display text-sm tracking-[0.25em] text-[#ff9eb5]">BATTLE REPORT</p>
          <h1 className="mt-2 font-display text-4xl text-white md:text-6xl">萌战战报</h1>
          <p className="mt-3 max-w-lg text-sm text-white/80 md:text-base">
            历史对阵得票、胜者一览 · 实时同步投票数据
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 md:px-5">
        <ReportView />
      </main>

      <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-[var(--text-muted)]">
        <p className="font-display text-sm text-[var(--text-secondary)]">红动漫社萌战</p>
        <p className="mt-1">由红动漫社萌战委员会主办</p>
      </footer>
    </>
  );
}
