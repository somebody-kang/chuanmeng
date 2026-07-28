import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";

const baseLinks = [
  { href: "/", label: "对阵", key: "bracket", tip: "查看当前对阵并投票" },
  { href: "/report", label: "战报", key: "report", tip: "历史对阵得票与胜者统计" },
  { href: "/characters", label: "角色", key: "characters", tip: "浏览全部参选角色" },
  { href: "/about", label: "赛制", key: "about", tip: "萌战规则与赛制说明" },
];

export default async function SiteNav({ active }: { active: string }) {
  const user = await getCurrentUser();
  const showAdmin = isAdminUser(user);
  const links = showAdmin
    ? [...baseLinks, { href: "/admin", label: "管理", key: "admin", tip: "管理对阵、角色与评论" }]
    : baseLinks;

  const displayName = user
    ? user.isAdmin
      ? user.nickname
      : user.nickname.replace(/^\[DEV\]\s*/, "")
    : "";

  const accountTip = user
    ? user.isAdmin
      ? `管理员 ${displayName} · 点击进入个人中心`
      : `${displayName} · 剩余 ${user.remainingVotes} 票 · 点击查看我的投票`
    : "登录后参与投票";

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(18,8,14,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 md:px-5">
        <Link
          href="/"
          data-tip="返回对阵首页"
          data-tip-pos="bottom"
          className="flex min-w-0 items-center gap-2"
        >
          <span className="font-display text-lg text-white md:text-xl">红动漫社萌战</span>
          <span className="hidden rounded-full bg-gradient-to-r from-[#fb7299] to-[#ff9eb5] px-2 py-0.5 text-[10px] font-bold text-white sm:inline">
            2026
          </span>
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {links.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              data-tip={l.tip}
              data-tip-pos="bottom"
              className={`rounded-lg px-2.5 py-1.5 text-xs transition sm:px-3 sm:text-sm ${
                active === l.key
                  ? "bg-[#fb7299]/20 text-[#ff9eb5]"
                  : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {user ? (
          <Link
            href="/me"
            data-tip={accountTip}
            data-tip-pos="bottom"
            className={`flex max-w-[180px] items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs transition hover:border-[#fb7299]/50 hover:bg-[#fb7299]/10 ${
              active === "me"
                ? "border-[#fb7299]/45 bg-[#fb7299]/15 text-[#ff9eb5]"
                : "border-[var(--border)] text-[var(--text-secondary)]"
            }`}
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#fb7299] to-[#e85d84] text-[10px] font-bold text-white">
              {displayName.slice(0, 1) || "我"}
            </span>
            <span className="min-w-0 truncate">
              <strong className="text-[#ff9eb5]">{displayName}</strong>
              {user.isAdmin ? (
                <span className="ml-1 text-amber-300">管理</span>
              ) : (
                <span className="ml-1 opacity-80">剩 {user.remainingVotes}</span>
              )}
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            data-tip="登录后即可投票与评论"
            data-tip-pos="bottom"
            className="rounded-full bg-gradient-to-r from-[#fb7299] to-[#e85d84] px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-[#fb7299]/30 sm:text-sm"
          >
            登录
          </Link>
        )}
      </div>
    </nav>
  );
}
