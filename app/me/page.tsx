import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { getCurrentUser } from "@/lib/auth";
import { getUserRecords } from "@/lib/services";
import LogoutButton from "@/components/LogoutButton";

export default async function MePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <SiteNav active="me" />
        <main className="mx-auto max-w-6xl px-5 py-24 text-center">
          <p className="font-display text-2xl text-[var(--text-muted)]">请先登录</p>
          <Link
            href="/login?next=/me"
            className="mt-5 inline-block rounded-full bg-gradient-to-r from-[#fb7299] to-[#e85d84] px-6 py-2.5 text-sm font-semibold text-white"
          >
            去登录
          </Link>
        </main>
      </>
    );
  }

  const records = await getUserRecords(user.id);
  const name = user.nickname.replace(/^\[DEV\]\s*/, "");

  return (
    <>
      <SiteNav active="me" />
      <header className="hero-bleed !min-h-[240px] !items-end !pb-10">
        <div className="relative z-10 mx-auto w-full max-w-6xl anim-fade-up">
          <h1 className="font-display text-4xl text-white">我的投票</h1>
          <p className="mt-2 text-sm text-white/85">{name}</p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 md:px-5">
        <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
          <div>
            <h2 className="font-display text-xl text-white">{name}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              总配额 {user.totalLimit} · 已用 {user.usedCount} · 剩余{" "}
              <strong className="text-[#ff9eb5]">{user.remainingVotes}</strong>
            </p>
            {user.isAdmin && (
              <p className="mt-1 text-xs text-amber-300">管理员账号 · 可前往「管理」操作台</p>
            )}
          </div>
          <LogoutButton />
        </div>

        <h3 className="font-display text-lg text-white">投票记录</h3>
        {records.length ? (
          <div className="glass-panel overflow-hidden rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] text-[var(--text-muted)]">
                <tr>
                  <th className="p-3 font-medium">组别</th>
                  <th className="p-3 font-medium">支持</th>
                  <th className="p-3 font-medium">对手</th>
                  <th className="p-3 font-medium">票数</th>
                  <th className="p-3 font-medium">时间</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--border)]">
                    <td className="p-3">{r.groupLabel}组</td>
                    <td className="p-3 text-[#ff9eb5]">
                      {r.characterEmoji} {r.characterName}
                    </td>
                    <td className="p-3 text-[var(--text-secondary)]">vs {r.opponentName}</td>
                    <td className="p-3">{r.votes}</td>
                    <td className="p-3 text-[var(--text-muted)]">
                      {new Date(r.createdAt).toLocaleString("zh-CN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[var(--text-muted)]">
            还没有投票记录，
            <Link href="/" className="text-[#ff9eb5]">
              去对阵页投票 →
            </Link>
          </p>
        )}
      </main>
    </>
  );
}
