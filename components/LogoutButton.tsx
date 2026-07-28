"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE", credentials: "include" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[#fb7299] hover:text-[#ff9eb5]"
      data-tip="退出当前账号"
    >
      退出登录
    </button>
  );
}
