import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  ALLOW_DEV_LOGIN,
  ADMIN_OPENID,
  ADMIN_USERNAME,
  AUTH_SECRET,
  REQUIRE_WECHAT_LOGIN,
  SESSION_COOKIE,
  SESSION_DAYS,
  VOTE_TOTAL_LIMIT,
} from "@/lib/constants";

export { SESSION_COOKIE, VOTE_TOTAL_LIMIT, REQUIRE_WECHAT_LOGIN, ALLOW_DEV_LOGIN } from "@/lib/constants";

export type AuthUser = {
  id: number;
  nickname: string;
  email: string | null;
  avatar: string | null;
  wechatBound: boolean;
  isAdmin: boolean;
  totalLimit: number;
  usedCount: number;
  remainingVotes: number;
};

export function toUserPayload(user: {
  id: number;
  nickname: string;
  email: string | null;
  avatar: string | null;
  wechatOpenid: string | null;
  voteQuota: { totalLimit: number; usedCount: number } | null;
}): AuthUser {
  const totalLimit = user.voteQuota?.totalLimit ?? VOTE_TOTAL_LIMIT;
  const usedCount = user.voteQuota?.usedCount ?? 0;
  const isAdmin = user.wechatOpenid === ADMIN_OPENID;
  return {
    id: user.id,
    nickname: user.nickname,
    email: user.email,
    avatar: user.avatar,
    wechatBound: !!user.wechatOpenid,
    isAdmin,
    totalLimit,
    usedCount,
    remainingVotes: totalLimit - usedCount,
  };
}

export async function createSession(userId: number): Promise<string> {
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.deleteMany({ where: { userId } });
  await prisma.session.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

export async function getUserBySession(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;

  const session = await prisma.session.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
    include: { user: { include: { voteQuota: true } } },
  });

  if (!session?.user) return null;

  if (REQUIRE_WECHAT_LOGIN && !session.user.wechatOpenid) {
    return null;
  }

  return toUserPayload(session.user);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return getUserBySession(token);
}

export function assertWechatBound(user: AuthUser | null): asserts user is AuthUser {
  if (!user) {
    throw new Error("请先使用微信登录");
  }
  if (REQUIRE_WECHAT_LOGIN && !user.wechatBound) {
    throw new Error("投票需绑定微信账号，请重新授权登录");
  }
}

/** 微信 OAuth 登录：以 openid 为唯一身份，防止刷票 */
export async function loginWithWechat(
  openid: string,
  profile?: { nickname?: string; avatar?: string | null }
): Promise<{ user: AuthUser; token: string }> {
  const isAdminOpenid = openid === ADMIN_OPENID;
  const nickname = isAdminOpenid
    ? ADMIN_USERNAME
    : profile?.nickname?.trim() || `微信用户${openid.slice(-4)}`;

  let user = await prisma.user.findUnique({
    where: { wechatOpenid: openid },
    include: { voteQuota: true },
  });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        nickname,
        avatar: profile?.avatar ?? user.avatar,
      },
      include: { voteQuota: true },
    });
  } else {
    user = await prisma.user.create({
      data: {
        nickname,
        avatar: profile?.avatar ?? null,
        wechatOpenid: openid,
        voteQuota: {
          create: {
            totalLimit: isAdminOpenid ? 0 : VOTE_TOTAL_LIMIT,
            usedCount: 0,
          },
        },
      },
      include: { voteQuota: true },
    });
  }

  const token = await createSession(user.id);
  return { user: toUserPayload(user), token };
}

/** 开发环境模拟微信身份（每个昵称对应固定 dev openid） */
export async function loginWithDevMock(nickname: string): Promise<{ user: AuthUser; token: string }> {
  if (!ALLOW_DEV_LOGIN) {
    throw new Error("开发模拟登录未开启");
  }
  const trimmed = nickname.trim();
  if (!trimmed) throw new Error("昵称不能为空");

  if (trimmed.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
    throw new Error("该账号为管理员专用，请前往 /admin 使用账号密码登录");
  }

  const openid = `dev:${crypto.createHash("sha256").update(trimmed).digest("hex").slice(0, 24)}`;
  return loginWithWechat(openid, { nickname: `[DEV] ${trimmed}`, avatar: null });
}

export async function logout(token: string | undefined): Promise<void> {
  if (!token) return;
  await prisma.session.deleteMany({ where: { token } });
}

export function setSessionCookie(response: Response, token: string): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}`
  );
}

export function clearSessionCookie(response: Response): void {
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

export function isAuthConfigured(): boolean {
  return !!process.env.WECHAT_APP_ID && !!process.env.WECHAT_APP_SECRET && AUTH_SECRET !== "change-me-in-production";
}
