import SiteNav from "@/components/SiteNav";
import QuotaBanner from "@/components/QuotaBanner";
import BracketView from "@/components/BracketView";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <>
      <SiteNav active="bracket" />

      <header className="hero-bleed">
        <div className="relative z-10 mx-auto w-full max-w-6xl anim-fade-up">
          <p className="font-display text-sm tracking-[0.2em] text-white/85 md:text-base">
            四川大学 · 红动漫社
          </p>
          <h1 className="mt-2 font-display text-5xl leading-none text-white drop-shadow-lg md:text-7xl">
            红动漫社萌战
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/90 md:text-base">
            赌上荣耀，为自己的萌投下干净一票
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/80">
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1">32强小组赛</span>
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1">单败淘汰</span>
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1">票比实时刷新</span>
          </div>
        </div>
      </header>

      <div className="relative z-10 -mt-8 mb-8">
        <QuotaBanner user={user} />
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-16 md:px-5">
        <div className="mb-5">
          <h2 className="font-display text-2xl text-white">对阵投票</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            决斗赛 1v1 · 小组赛 n选m · 按进行中/未开始/已结束切换 · 仅开放时段可投票
          </p>
        </div>
        <BracketView
          initialGroup="all"
          isLoggedIn={!!user?.wechatBound}
          hasRemainingVotes={!!user?.wechatBound && user.remainingVotes > 0}
        />
      </main>

      <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-[var(--text-muted)]">
        <p className="font-display text-sm text-[var(--text-secondary)]">红动漫社萌战</p>
        <p className="mt-1">由红动漫社萌战委员会主办</p>
      </footer>
    </>
  );
}
