import Link from "next/link";
import type { AuthUser } from "@/lib/auth";
import { VOTE_TOTAL_LIMIT } from "@/lib/constants";

export default function QuotaBanner({ user }: { user: AuthUser | null }) {
  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 md:px-5">
        <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-4 md:px-5">
          <div>
            <h3 className="font-display text-lg text-white">登录后投下干净一票</h3>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              每人 {VOTE_TOTAL_LIMIT} 票 · 本地开发可用昵称模拟登录
            </p>
          </div>
          <Link
            href="/login"
            data-tip="登录后即可投票与评论"
            className="rounded-full bg-gradient-to-r from-[#fb7299] to-[#e85d84] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fb7299]/35"
          >
            立即登录
          </Link>
        </div>
      </div>
    );
  }

  const name = user.nickname.replace(/^\[DEV\]\s*/, "");

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-5">
      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl px-4 py-4 md:px-5">
        <div>
          <h3 className="font-display text-lg text-white">{name}，欢迎参战</h3>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            将剩余票数投给你支持的角色 · 每组对阵限投 1 次
          </p>
        </div>
        <div className="flex gap-6">
          <Stat num={user.remainingVotes} label="剩余" />
          <Stat num={user.usedCount} label="已用" />
          <Stat num={user.totalLimit} label="总配额" />
        </div>
      </div>
    </div>
  );
}

function Stat({ num, label }: { num: number; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-2xl text-[#ff9eb5]">{num}</div>
      <div className="text-[11px] text-[var(--text-muted)]">{label}</div>
    </div>
  );
}
