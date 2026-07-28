"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, Suspense } from "react";
import { VOTE_TOTAL_LIMIT } from "@/lib/constants";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devMode, setDevMode] = useState(false);
  const [wechatReady, setWechatReady] = useState(false);

  const next = searchParams.get("next") || "/";
  const urlError = searchParams.get("error");

  useEffect(() => {
    if (urlError) setError(decodeURIComponent(urlError));

    fetch("/api/auth/config")
      .then((r) => r.json())
      .then((data) => {
        setDevMode(!!data.allowDevLogin);
        setWechatReady(!!data.wechatReady);
      })
      .catch(() => {});
  }, [urlError]);

  async function wechatLogin() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/wechat?next=${encodeURIComponent(next)}&format=json`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "微信登录不可用");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "微信登录失败");
      setLoading(false);
    }
  }

  async function devLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const nickname = String(new FormData(e.currentTarget).get("nickname") ?? "").trim();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "登录失败");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <div className="glass-panel anim-fade-up rounded-2xl p-8">
        <p className="font-display text-sm tracking-widest text-[#ff9eb5]">红动漫社萌战</p>
        <h1 className="mt-1 font-display text-3xl text-white">登录参战</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          每人固定 {VOTE_TOTAL_LIMIT} 票 · 每组对阵限投 1 次
        </p>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        {devMode ? (
          <form onSubmit={devLogin} className="mt-6 space-y-3">
            <label className="block text-xs text-[var(--text-muted)]">本地开发登录（模拟微信身份）</label>
            <input
              name="nickname"
              required
              maxLength={32}
              placeholder="输入昵称即可开始投票"
              className="w-full rounded-xl border border-[var(--border)] bg-black/25 px-3 py-3 text-sm text-white outline-none placeholder:text-[var(--text-muted)] focus:border-[#fb7299]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#fb7299] to-[#e85d84] py-3 text-sm font-semibold text-white shadow-lg shadow-[#fb7299]/35 disabled:opacity-60"
            >
              {loading ? "登录中…" : "开始投票"}
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-[var(--text-muted)]">
            当前未开启开发登录。请配置微信 OAuth，或在 .env 设置 ALLOW_DEV_LOGIN=true。
          </p>
        )}

        <div className="mt-8 border-t border-[var(--border)] pt-5">
          <p className="text-xs text-[var(--text-muted)]">正式环境 · 微信授权（需公网域名）</p>
          <button
            type="button"
            disabled={loading || !wechatReady}
            onClick={wechatLogin}
            className="mt-3 w-full rounded-xl border border-[#07c160]/40 bg-[#07c160]/15 py-3 text-sm font-semibold text-[#7dffa8] disabled:opacity-45"
          >
            {wechatReady ? "微信授权登录" : "微信登录（待配置公网域名）"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginFormWrapper() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
