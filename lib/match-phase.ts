export type MatchPhase = "live" | "upcoming" | "ended";

export const PHASE_LABEL: Record<MatchPhase, string> = {
  live: "进行中",
  upcoming: "未开始",
  ended: "已结束",
};

/** 根据 status + 起止时间判定对阵阶段 */
export function resolveMatchPhase(
  m: { status: string; startAt: Date | string | null; endAt: Date | string | null },
  now = new Date()
): MatchPhase {
  if (m.status === "ended") return "ended";

  const start = m.startAt ? new Date(m.startAt) : null;
  const end = m.endAt ? new Date(m.endAt) : null;

  if (end && !Number.isNaN(end.getTime()) && now >= end) return "ended";
  if (start && !Number.isNaN(start.getTime()) && now < start) return "upcoming";
  return "live";
}

export function assertMatchupOpenForVote(m: {
  status: string;
  startAt: Date | string | null;
  endAt: Date | string | null;
}) {
  const phase = resolveMatchPhase(m);
  if (phase === "upcoming") throw new Error("该对阵尚未开始，暂不可投票");
  if (phase === "ended") throw new Error("该对阵已结束，不可再投票");
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** datetime-local 输入框值 */
export function toDatetimeLocalValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseDatetimeLocal(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("时间格式无效");
  return d;
}
