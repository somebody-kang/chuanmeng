import { timingSafeEqual } from "node:crypto";
import { getCurrentUser, loginWithWechat, type AuthUser } from "@/lib/auth";
import { ADMIN_OPENID, ADMIN_PASSWORD, ADMIN_USERNAME } from "@/lib/constants";

export { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_OPENID };

export function checkAdminCredentials(username: string, password: string): boolean {
  const uOk = username.trim() === ADMIN_USERNAME;
  const expected = Buffer.from(ADMIN_PASSWORD);
  const actual = Buffer.from(password);
  const pOk = expected.length === actual.length && timingSafeEqual(expected, actual);
  return uOk && pOk;
}

export function isAdminUser(user: AuthUser | null | undefined): boolean {
  return !!user?.isAdmin;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return isAdminUser(user);
}

/** 管理员登录：写入与普通用户相同的 Session */
export async function loginAsAdmin(username: string, password: string) {
  if (!checkAdminCredentials(username, password)) {
    throw new Error("账号或密码错误");
  }
  return loginWithWechat(ADMIN_OPENID, {
    nickname: ADMIN_USERNAME,
    avatar: null,
  });
}

export function assertAdmin(ok: boolean): asserts ok is true {
  if (!ok) throw new Error("未授权：请使用管理员账号登录");
}
