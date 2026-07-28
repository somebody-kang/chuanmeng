"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import type { GalleryItem } from "@/lib/gallery";

type Tab = "matchups" | "characters" | "comments";

type Character = {
  id: number;
  slug: string;
  name: string;
  anime: string;
  groupName: string;
  description: string;
  emoji: string;
  color: string;
  imageUrl: string | null;
  gallery: GalleryItem[];
  commentCount: number;
};

type Matchup = {
  id: number;
  groupLabel: string;
  mode: string;
  modeLabel?: string;
  voteLimit: number;
  status: string;
  phase?: string;
  roundName: string;
  startAt: string | null;
  endAt: string | null;
  characters: Array<{ id: number; name: string; emoji: string; votes: number }>;
  characterA: { id: number; name: string; emoji: string } | null;
  characterB: { id: number; name: string; emoji: string } | null;
  votesA: number;
  votesB: number;
};

type CommentRow = {
  id: number;
  content: string;
  createdAt: string;
  user: { id: number; nickname: string };
  character: { id: number; name: string; slug: string; emoji: string };
};

export default function AdminPanel() {
  const { toast } = useToast();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("matchups");
  const [loading, setLoading] = useState(false);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);

  const refresh = useCallback(async () => {
    const [cRes, mRes, cmRes] = await Promise.all([
      fetch("/api/admin/characters", { credentials: "include" }),
      fetch("/api/admin/matchups", { credentials: "include" }),
      fetch("/api/admin/comments", { credentials: "include" }),
    ]);
    if (cRes.status === 401 || mRes.status === 401) {
      setAuthed(false);
      return;
    }
    const cJson = await cRes.json();
    const mJson = await mRes.json();
    const cmJson = await cmRes.json();
    setCharacters(cJson.characters ?? []);
    setMatchups(mJson.matchups ?? []);
    setComments(cmJson.comments ?? []);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/auth", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(async ([adminData, meData]) => {
        if (adminData.authenticated) {
          setAuthed(true);
          await refresh();
          return;
        }
        // 已登录普通用户：不可见管理台，提示无权限
        if (meData.authenticated && !meData.user?.isAdmin) {
          setAuthed(false);
          setForbidden(true);
          return;
        }
        setAuthed(false);
        setForbidden(false);
      })
      .catch(() => {
        setAuthed(false);
        setForbidden(false);
      });
  }, [refresh]);

  async function login(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "登录失败");
      setAuthed(true);
      setPassword("");
      toast("管理员已登录");
      await refresh();
      // 刷新导航以显示「管理」入口
      window.location.href = "/admin";
    } catch (err) {
      toast(err instanceof Error ? err.message : "登录失败", "err");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE", credentials: "include" });
    setAuthed(false);
    toast("已退出管理账号", "info");
    window.location.href = "/";
  }

  if (authed === null) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center text-[var(--text-muted)]">加载中…</div>
    );
  }

  if (!authed) {
    if (forbidden) {
      return (
        <div className="mx-auto max-w-md px-5 py-20 text-center">
          <h1 className="font-display text-3xl text-white">无权访问</h1>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            管理界面仅对管理员账号开放。请先在「我的」退出当前账号，再访问{" "}
            <code className="text-[#ff9eb5]">/admin</code> 使用 admin 登录。
          </p>
          <div className="mt-6 flex justify-center gap-4 text-sm">
            <a href="/me" className="text-[#ff9eb5]">
              去退出登录 →
            </a>
            <a href="/" className="text-[var(--text-muted)]">
              返回首页
            </a>
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-md px-5 py-16">
        <form onSubmit={login} className="glass-panel anim-fade-up rounded-2xl p-8">
          <p className="font-display text-sm tracking-widest text-[#ff9eb5]">ADMIN</p>
          <h1 className="mt-1 font-display text-3xl text-white">管理员登录</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            仅特殊账号 <strong className="text-[#ff9eb5]">admin</strong> 可进入管理界面。普通用户无法看到此入口。
          </p>
          <label className="mt-6 block text-sm">
            <span className="mb-1 block text-[var(--text-muted)]">账号</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-xl border border-[var(--border)] bg-black/25 px-3 py-3 text-sm text-white outline-none focus:border-[#fb7299]"
            />
          </label>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block text-[var(--text-muted)]">密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="管理员密码"
              className="w-full rounded-xl border border-[var(--border)] bg-black/25 px-3 py-3 text-sm text-white outline-none focus:border-[#fb7299]"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#fb7299] to-[#e85d84] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "验证中…" : "登录管理后台"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-5">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-white">管理操作台</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            新建对阵 · 编辑角色/图集 · 删除评论
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[#ff9eb5]"
        >
          退出后台
        </button>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["matchups", "对阵管理"],
            ["characters", "角色管理"],
            ["comments", "评论管理"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`group-tab ${tab === key ? "active" : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "matchups" && (
        <MatchupAdmin characters={characters} matchups={matchups} onChanged={refresh} toast={toast} />
      )}
      {tab === "characters" && (
        <CharacterAdmin characters={characters} onChanged={refresh} toast={toast} />
      )}
      {tab === "comments" && (
        <CommentAdmin comments={comments} onChanged={refresh} toast={toast} />
      )}
    </div>
  );
}

function defaultStartLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultEndLocal(days = 7) {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PHASE_TEXT: Record<string, string> = {
  live: "进行中",
  upcoming: "未开始",
  ended: "已结束",
};

function MatchupAdmin({
  characters,
  matchups,
  onChanged,
  toast,
}: {
  characters: Character[];
  matchups: Matchup[];
  onChanged: () => Promise<void>;
  toast: (m: string, t?: "ok" | "err" | "info") => void;
}) {
  const [mode, setMode] = useState<"duel" | "group">("duel");
  const [characterAId, setA] = useState("");
  const [characterBId, setB] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [groupLabel, setGroup] = useState("E");
  const [voteLimit, setVoteLimit] = useState(1);
  const [roundName, setRoundName] = useState("");
  const [startAt, setStartAt] = useState(defaultStartLocal);
  const [endAt, setEndAt] = useState(() => defaultEndLocal(7));
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  function toggleChar(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const characterIds =
        mode === "duel" ? [Number(characterAId), Number(characterBId)] : selectedIds;
      const res = await fetch("/api/admin/matchups", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          characterIds,
          groupLabel,
          voteLimit: mode === "duel" ? 1 : voteLimit,
          roundName: roundName || undefined,
          startAt: startAt || undefined,
          endAt: endAt || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "创建失败");
      toast(mode === "group" ? "小组赛对阵组已创建" : "决斗赛对阵已创建");
      setA("");
      setB("");
      setSelectedIds([]);
      setVoteLimit(1);
      setStartAt(defaultStartLocal());
      setEndAt(defaultEndLocal(7));
      await onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : "创建失败", "err");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: number, status: "active" | "ended") {
    const res = await fetch("/api/admin/matchups", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast(json.detail || "更新失败", "err");
      return;
    }
    toast(status === "ended" ? "对阵已结束" : "对阵已重新开放");
    await onChanged();
  }

  function openSchedule(m: Matchup) {
    setEditingId(m.id);
    setEditStart(toLocalInput(m.startAt));
    setEditEnd(toLocalInput(m.endAt));
  }

  async function saveSchedule(id: number) {
    const res = await fetch("/api/admin/matchups", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        action: "schedule",
        startAt: editStart || null,
        endAt: editEnd || null,
        status: "active",
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast(json.detail || "保存失败", "err");
      return;
    }
    toast("投票时段已更新");
    setEditingId(null);
    await onChanged();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="glass-panel grid gap-3 rounded-2xl p-5 md:grid-cols-2">
        <h2 className="font-display text-xl text-white md:col-span-2">新建对阵组</h2>

        <div className="md:col-span-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={`group-tab ${mode === "duel" ? "active" : ""}`}
            onClick={() => {
              setMode("duel");
              setVoteLimit(1);
            }}
          >
            决斗赛（1v1）
          </button>
          <button
            type="button"
            className={`group-tab ${mode === "group" ? "active" : ""}`}
            onClick={() => {
              setMode("group");
              setVoteLimit(2);
            }}
          >
            小组赛（n选m）
          </button>
        </div>

        {mode === "duel" ? (
          <>
            <label className="text-sm">
              <span className="mb-1 block text-[var(--text-muted)]">角色 A</span>
              <select
                required
                value={characterAId}
                onChange={(e) => setA(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-black/30 px-3 py-2 text-white"
              >
                <option value="">选择角色</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-[var(--text-muted)]">角色 B</span>
              <select
                required
                value={characterBId}
                onChange={(e) => setB(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-black/30 px-3 py-2 text-white"
              >
                <option value="">选择角色</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <div className="md:col-span-2">
            <p className="mb-2 text-sm text-[var(--text-muted)]">
              选择组内角色（已选 {selectedIds.length}）· 每人可选上限 m
            </p>
            <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-[var(--border)] bg-black/20 p-3 sm:grid-cols-3 md:grid-cols-4">
              {characters.map((c) => {
                const on = selectedIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleChar(c.id)}
                    className={`rounded-lg border px-2 py-2 text-left text-xs transition ${
                      on
                        ? "border-[#fb7299] bg-[#fb7299]/25 text-white"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[#fb7299]/50"
                    }`}
                  >
                    {c.emoji} {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">组别（A–Z）</span>
          <input
            value={groupLabel}
            onChange={(e) => setGroup(e.target.value)}
            maxLength={1}
            required
            className="w-full rounded-xl border border-[var(--border)] bg-black/30 px-3 py-2 uppercase text-white"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">
            每人投票上限 m{mode === "group" ? `（n=${selectedIds.length || "…"}）` : "（决斗固定 1）"}
          </span>
          <input
            type="number"
            min={1}
            max={mode === "group" ? Math.max(selectedIds.length, 1) : 1}
            value={mode === "duel" ? 1 : voteLimit}
            disabled={mode === "duel"}
            onChange={(e) => setVoteLimit(Number(e.target.value) || 1)}
            className="w-full rounded-xl border border-[var(--border)] bg-black/30 px-3 py-2 text-white disabled:opacity-60"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">轮次名称（可选）</span>
          <input
            value={roundName}
            onChange={(e) => setRoundName(e.target.value)}
            placeholder="例如：32强 · 小组赛"
            className="w-full rounded-xl border border-[var(--border)] bg-black/30 px-3 py-2 text-white placeholder:text-[var(--text-muted)]"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">开始投票时间</span>
          <input
            type="datetime-local"
            required
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-black/30 px-3 py-2 text-white"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-[var(--text-muted)]">结束投票时间</span>
          <input
            type="datetime-local"
            required
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-black/30 px-3 py-2 text-white"
          />
        </label>
        <p className="text-xs text-[var(--text-muted)] md:col-span-2">
          决斗赛：二选一，每人限投 1。小组赛：n 人中每人最多选 m 人，各角色独立计票。
        </p>
        <button
          type="submit"
          disabled={busy || (mode === "group" && selectedIds.length < 3)}
          className="rounded-xl bg-[#fb7299] py-2.5 text-sm font-semibold text-white md:col-span-2 disabled:opacity-60"
        >
          {busy ? "创建中…" : "创建对阵组"}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-display text-lg text-white">现有对阵组</h2>
        {matchups.map((m) => (
          <div key={m.id} className="glass-panel space-y-3 rounded-xl px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <span className="mr-2 rounded bg-[#fb7299]/25 px-2 py-0.5 text-xs text-[#ff9eb5]">
                  {m.groupLabel}组
                </span>
                <span className="mr-2 rounded bg-white/10 px-2 py-0.5 text-xs text-white/80">
                  {m.modeLabel ?? (m.mode === "group" ? "小组赛" : "决斗赛")}
                  {m.mode === "group"
                    ? ` · ${m.characters.length}选${m.voteLimit}`
                    : ` · 上限${m.voteLimit}`}
                </span>
                <span className="text-white">
                  {(m.characters ?? []).map((c) => `${c.emoji}${c.name}`).join(" · ") ||
                    `${m.characterA?.emoji ?? ""} ${m.characterA?.name ?? ""} VS ${m.characterB?.emoji ?? ""} ${m.characterB?.name ?? ""}`}
                </span>
                <span className="ml-3 text-xs text-[var(--text-muted)]">
                  {m.roundName} ·{" "}
                  {PHASE_TEXT[m.phase ?? ""] ?? (m.status === "active" ? "进行中" : "已结束")}
                </span>
                <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                  {(m.characters ?? [])
                    .map((c) => `${c.name} ${c.votes}`)
                    .join(" / ") || `${m.votesA}:${m.votesB}`}
                  <span className="ml-2">
                    {toLocalInput(m.startAt) || "—"} → {toLocalInput(m.endAt) || "不限"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openSchedule(m)}
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:text-white"
                >
                  改时段
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStatus(m.id, m.status === "ended" || m.phase === "ended" ? "active" : "ended")
                  }
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:text-white"
                >
                  {m.phase === "ended" || m.status === "ended" ? "重新开放" : "立即结束"}
                </button>
              </div>
            </div>
            {editingId === m.id && (
              <div className="grid gap-2 border-t border-[var(--border)] pt-3 md:grid-cols-[1fr_1fr_auto_auto]">
                <label className="text-xs">
                  <span className="mb-1 block text-[var(--text-muted)]">开始</span>
                  <input
                    type="datetime-local"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-black/30 px-2 py-1.5 text-white"
                  />
                </label>
                <label className="text-xs">
                  <span className="mb-1 block text-[var(--text-muted)]">结束</span>
                  <input
                    type="datetime-local"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-black/30 px-2 py-1.5 text-white"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => saveSchedule(m.id)}
                  className="self-end rounded-lg bg-[#fb7299] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="self-end rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CharacterAdmin({
  characters,
  onChanged,
  toast,
}: {
  characters: Character[];
  onChanged: () => Promise<void>;
  toast: (m: string, t?: "ok" | "err" | "info") => void;
}) {
  const [editing, setEditing] = useState<Character | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
          className="rounded-full bg-[#fb7299] px-4 py-2 text-sm font-semibold text-white"
        >
          + 新建角色
        </button>
      </div>

      {(creating || editing) && (
        <CharacterForm
          initial={editing}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={async (msg) => {
            toast(msg);
            await onChanged();
            // 保持编辑态刷新后的最新数据
            if (editing) {
              const res = await fetch("/api/admin/characters", { credentials: "include" });
              const json = await res.json();
              const latest = (json.characters as Character[] | undefined)?.find((c) => c.id === editing.id);
              if (latest) setEditing(latest);
              else {
                setEditing(null);
                setCreating(false);
              }
            } else {
              setCreating(false);
              setEditing(null);
            }
          }}
          onDeleted={async () => {
            setCreating(false);
            setEditing(null);
            toast("角色已删除");
            await onChanged();
          }}
          onError={(m) => toast(m, "err")}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {characters.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setEditing(c);
              setCreating(false);
            }}
            className="glass-panel flex gap-3 rounded-xl p-3 text-left transition hover:border-[#fb7299]/50"
          >
            <div
              className="h-16 w-16 shrink-0 overflow-hidden rounded-lg"
              style={{ background: `linear-gradient(160deg, ${c.color}66, ${c.color}22)` }}
            >
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-2xl">{c.emoji}</div>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate font-bold text-white">{c.name}</div>
              <div className="truncate text-xs text-[var(--text-muted)]">
                《{c.anime}》 · {c.slug}
              </div>
              <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
                图集 {c.gallery?.length ?? 0} · 评论 {c.commentCount}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CharacterForm({
  initial,
  onCancel,
  onSaved,
  onDeleted,
  onError,
}: {
  initial: Character | null;
  onCancel: () => void;
  onSaved: (msg: string) => Promise<void>;
  onDeleted: () => Promise<void>;
  onError: (m: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(initial?.imageUrl ?? null);
  const [gallery, setGallery] = useState<GalleryItem[]>(initial?.gallery ?? []);
  const [galleryCaption, setGalleryCaption] = useState("");

  useEffect(() => {
    setPreview(initial?.imageUrl ?? null);
    setGallery(initial?.gallery ?? []);
  }, [initial]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(e.currentTarget);
      if (initial) form.set("id", String(initial.id));

      const res = await fetch("/api/admin/characters", {
        method: initial ? "PATCH" : "POST",
        credentials: "include",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "保存失败");
      await onSaved(initial ? "角色已更新" : "角色已创建");
    } catch (err) {
      onError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function clearPortrait() {
    if (!initial) return;
    if (!confirm("删除立绘后将用 emoji 占位，确认？")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/characters", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: initial.id, action: "clearPortrait" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "删除失败");
      setPreview(null);
      await onSaved("立绘已删除，已回退为 emoji");
    } catch (err) {
      onError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  async function uploadGallery(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!initial) return;
    const formEl = e.currentTarget;
    const fileInput = formEl.elements.namedItem("galleryImage") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      onError("请选择图片");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.set("action", "gallery");
      form.set("id", String(initial.id));
      form.set("caption", galleryCaption);
      form.set("image", file);
      const res = await fetch("/api/admin/characters", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "上传失败");
      setGallery(json.gallery ?? []);
      setGalleryCaption("");
      formEl.reset();
      await onSaved("图集已上传");
    } catch (err) {
      onError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setBusy(false);
    }
  }

  async function clearGalleryImage(itemId: string) {
    if (!initial) return;
    if (!confirm("删除该图集图片后将用 emoji 占位，确认？")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/characters", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: initial.id, action: "clearGalleryImage", itemId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "删除失败");
      setGallery(json.character?.gallery ?? []);
      await onSaved("图集图片已删除");
    } catch (err) {
      onError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  async function removeGalleryItem(itemId: string) {
    if (!initial) return;
    if (!confirm("彻底移除此图集项？")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/characters", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: initial.id, action: "deleteGalleryItem", itemId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "删除失败");
      setGallery(json.character?.gallery ?? []);
      await onSaved("图集项已移除");
    } catch (err) {
      onError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  async function removeCharacter() {
    if (!initial) return;
    if (!confirm(`确认删除角色「${initial.name}」？相关对阵与评论将一并删除。`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/characters?id=${initial.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "删除失败");
      await onDeleted();
    } catch (err) {
      onError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="glass-panel anim-fade-up space-y-3 rounded-2xl p-5">
        <h2 className="font-display text-xl text-white">
          {initial ? `编辑 · ${initial.name}` : "新建角色"}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field name="name" label="名称" defaultValue={initial?.name} required />
          <Field name="slug" label="slug（英文）" defaultValue={initial?.slug} required />
          <Field name="anime" label="作品" defaultValue={initial?.anime} required />
          <Field
            name="groupName"
            label="分区（anime/game/vtuber）"
            defaultValue={initial?.groupName ?? "anime"}
          />
          <Field name="emoji" label="Emoji 占位" defaultValue={initial?.emoji ?? "🌸"} />
          <Field name="color" label="主题色" defaultValue={initial?.color ?? "#FB7299"} />
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">简介</span>
          <textarea
            name="description"
            required
            rows={3}
            defaultValue={initial?.description}
            className="w-full rounded-xl border border-[var(--border)] bg-black/30 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-muted)]">上传立绘（对阵页主图）</span>
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPreview(URL.createObjectURL(f));
            }}
            className="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:rounded-lg file:border-0 file:bg-[#fb7299]/25 file:px-3 file:py-1.5 file:text-[#ff9eb5]"
          />
        </label>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="预览" className="h-40 w-auto rounded-xl object-cover" />
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            当前无立绘，前台将显示 emoji：{initial?.emoji ?? "🌸"}
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-[#fb7299] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "保存中…" : "保存资料"}
          </button>
          {initial?.imageUrl && (
            <button
              type="button"
              disabled={busy}
              onClick={clearPortrait}
              className="rounded-xl border border-amber-400/40 px-4 py-2 text-sm text-amber-200 hover:bg-amber-500/10"
            >
              删除立绘 → emoji
            </button>
          )}
          {initial && (
            <button
              type="button"
              disabled={busy}
              onClick={removeCharacter}
              className="rounded-xl border border-red-400/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
            >
              删除角色
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--border)] px-5 py-2 text-sm text-[var(--text-secondary)]"
          >
            关闭
          </button>
        </div>
      </form>

      {initial && (
        <div className="glass-panel space-y-4 rounded-2xl p-5">
          <h3 className="font-display text-lg text-white">详情页图集</h3>
          <form onSubmit={uploadGallery} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-[var(--text-muted)]">图注（可选）</span>
              <input
                value={galleryCaption}
                onChange={(e) => setGalleryCaption(e.target.value)}
                placeholder="例如：舞台闪光"
                className="w-full rounded-xl border border-[var(--border)] bg-black/30 px-3 py-2 text-white"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-[var(--text-muted)]">上传图集图片</span>
              <input
                type="file"
                name="galleryImage"
                accept="image/jpeg,image/png,image/webp,image/gif"
                required
                className="w-full text-sm text-[var(--text-secondary)] file:mr-3 file:rounded-lg file:border-0 file:bg-[#00a1d6]/25 file:px-3 file:py-1.5 file:text-[#5ecfff]"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-[#00a1d6] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              添加到图集
            </button>
          </form>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {gallery.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] sm:col-span-2">暂无图集项</p>
            ) : (
              gallery.map((g) => (
                <div key={g.id} className="overflow-hidden rounded-xl border border-[var(--border)]">
                  <div
                    className="relative flex aspect-[4/5] items-center justify-center text-4xl"
                    style={{
                      background: `linear-gradient(160deg, ${g.tint}66, ${g.tint}22)`,
                    }}
                  >
                    {g.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.imageUrl} alt={g.caption} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      g.emoji
                    )}
                  </div>
                  <div className="space-y-2 p-2">
                    <p className="truncate text-xs text-[var(--text-secondary)]">{g.caption}</p>
                    <div className="flex flex-wrap gap-1">
                      {g.imageUrl && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => clearGalleryImage(g.id)}
                          className="rounded-lg border border-amber-400/40 px-2 py-1 text-[11px] text-amber-200"
                        >
                          删图→emoji
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => removeGalleryItem(g.id)}
                        className="rounded-lg border border-red-400/40 px-2 py-1 text-[11px] text-red-300"
                      >
                        移除项
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-[var(--text-muted)]">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-xl border border-[var(--border)] bg-black/30 px-3 py-2 text-white"
      />
    </label>
  );
}

function CommentAdmin({
  comments,
  onChanged,
  toast,
}: {
  comments: CommentRow[];
  onChanged: () => Promise<void>;
  toast: (m: string, t?: "ok" | "err" | "info") => void;
}) {
  async function remove(id: number) {
    if (!confirm("确认删除这条评论？")) return;
    const res = await fetch(`/api/admin/comments?id=${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) {
      toast(json.detail || "删除失败", "err");
      return;
    }
    toast("评论已删除");
    await onChanged();
  }

  if (!comments.length) {
    return <p className="py-10 text-center text-sm text-[var(--text-muted)]">暂无评论</p>;
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div
          key={c.id}
          className="glass-panel flex flex-wrap items-start justify-between gap-3 rounded-xl px-4 py-3"
        >
          <div className="min-w-0 flex-1 text-sm">
            <div className="text-xs text-[var(--text-muted)]">
              {c.character.emoji} {c.character.name} ·{" "}
              {c.user.nickname.replace(/^\[DEV\]\s*/, "")} ·{" "}
              {new Date(c.createdAt).toLocaleString("zh-CN")}
            </div>
            <p className="mt-1 text-[var(--text-secondary)]">{c.content}</p>
          </div>
          <button
            type="button"
            onClick={() => remove(c.id)}
            className="rounded-full border border-red-400/40 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20"
          >
            删除
          </button>
        </div>
      ))}
    </div>
  );
}
