import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { VOTE_TOTAL_LIMIT } from "@/lib/constants";

export default function AboutPage() {
  return (
    <>
      <SiteNav active="about" />
      <header className="hero-bleed !min-h-[260px] !items-end !pb-10">
        <div className="relative z-10 mx-auto w-full max-w-6xl anim-fade-up">
          <h1 className="font-display text-4xl text-white md:text-5xl">赛制说明</h1>
          <p className="mt-2 text-sm text-white/85">提名 → 海选 → 本战 → 决战</p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-10 md:px-5">
        <Section title="最萌三原则">
          <p>壹 · 萌有千差万别，各人有自己的萌</p>
          <p>贰 · 不因己萌，否定他萌</p>
          <p>叁 · 赌上荣耀，为自己的萌投下干净一票</p>
        </Section>
        <Section title="投票规则（本地 Demo）">
          <ul className="list-disc space-y-1 pl-5 text-[var(--text-secondary)]">
            <li>本地开发可用昵称模拟登录（对应固定模拟 OpenID）</li>
            <li>每人共有全局票数配额（默认 {VOTE_TOTAL_LIMIT} 票）</li>
            <li>决斗赛：二选一，每人每组限投 1</li>
            <li>小组赛：n 选 m，管理员设定每人可选上限 m</li>
            <li>仅在对阵开放时间窗口内可投票</li>
            <li>票比每 10 秒自动刷新</li>
            <li>角色页可发评论（含敏感词过滤）</li>
          </ul>
        </Section>
        <Section title="后续上线">
          <p className="text-[var(--text-secondary)]">
            正式环境将启用微信 OAuth 强制绑定；公网域名与公众平台配置完成后再开启。
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#fb7299] to-[#e85d84] px-5 py-2.5 text-sm font-semibold text-white"
          >
            前往对阵投票 →
          </Link>
        </Section>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-2xl p-6 leading-relaxed">
      <h2 className="mb-3 font-display text-xl text-white">{title}</h2>
      <div className="text-[var(--text-secondary)]">{children}</div>
    </div>
  );
}
