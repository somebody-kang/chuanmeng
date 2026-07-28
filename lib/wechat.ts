import crypto from "node:crypto";
import { AUTH_SECRET } from "@/lib/constants";

type StatePayload = {
  next?: string;
};

export function signOAuthState(payload: StatePayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyOAuthState(state: string | null): StatePayload | null {
  if (!state) return null;
  const [data, sig] = state.split(".");
  if (!data || !sig) return null;

  const expected = crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("base64url");
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as StatePayload;
  } catch {
    return null;
  }
}

export function getWeChatConfig() {
  const appId = process.env.WECHAT_APP_ID?.trim();
  const appSecret = process.env.WECHAT_APP_SECRET?.trim();
  const redirectUri = process.env.WECHAT_REDIRECT_URI?.trim();
  return { appId, appSecret, redirectUri };
}

export function buildWeChatOAuthUrl(state: string, scope: "snsapi_base" | "snsapi_userinfo" = "snsapi_userinfo") {
  const { appId, redirectUri } = getWeChatConfig();
  if (!appId || !redirectUri) {
    throw new Error("微信 OAuth 未配置，请设置 WECHAT_APP_ID 与 WECHAT_REDIRECT_URI");
  }

  // 微信要求 redirect_uri 单独 urlEncode
  const query = [
    `appid=${appId}`,
    `redirect_uri=${encodeURIComponent(redirectUri)}`,
    "response_type=code",
    `scope=${scope}`,
    `state=${encodeURIComponent(state)}`,
  ].join("&");

  return `https://open.weixin.qq.com/connect/oauth2/authorize?${query}#wechat_redirect`;
}

type WeChatTokenResponse = {
  access_token?: string;
  openid?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
};

type WeChatUserInfo = {
  openid?: string;
  nickname?: string;
  headimgurl?: string;
  errcode?: number;
  errmsg?: string;
};

export async function exchangeWeChatCode(code: string) {
  const { appId, appSecret } = getWeChatConfig();
  if (!appId || !appSecret) {
    throw new Error("微信 OAuth 未配置 WECHAT_APP_SECRET");
  }

  const url = new URL("https://api.weixin.qq.com/sns/oauth2/access_token");
  url.searchParams.set("appid", appId);
  url.searchParams.set("secret", appSecret);
  url.searchParams.set("code", code);
  url.searchParams.set("grant_type", "authorization_code");

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = (await res.json()) as WeChatTokenResponse;

  if (data.errcode || !data.openid || !data.access_token) {
    throw new Error(data.errmsg || "微信授权失败，请重新登录");
  }

  return {
    openid: data.openid,
    unionid: data.unionid ?? null,
    accessToken: data.access_token,
  };
}

export async function fetchWeChatUserInfo(accessToken: string, openid: string) {
  const url = new URL("https://api.weixin.qq.com/sns/userinfo");
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("openid", openid);
  url.searchParams.set("lang", "zh_CN");

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = (await res.json()) as WeChatUserInfo;

  if (data.errcode) {
    return { nickname: `微信用户${openid.slice(-4)}`, avatar: null as string | null };
  }

  return {
    nickname: data.nickname?.trim() || `微信用户${openid.slice(-4)}`,
    avatar: data.headimgurl || null,
  };
}

export function isWeChatBrowser(userAgent: string | null): boolean {
  return !!userAgent && /MicroMessenger/i.test(userAgent);
}
