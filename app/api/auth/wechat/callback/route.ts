import { NextRequest, NextResponse } from "next/server";
import {
  exchangeWeChatCode,
  fetchWeChatUserInfo,
  verifyOAuthState,
} from "@/lib/wechat";
import { loginWithWechat, setSessionCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateRaw = request.nextUrl.searchParams.get("state");
  const wechatError = request.nextUrl.searchParams.get("error");

  const fallbackNext = "/";

  if (wechatError || !code) {
    const msg = encodeURIComponent(wechatError || "微信授权已取消");
    return NextResponse.redirect(new URL(`/login?error=${msg}`, request.url));
  }

  const state = verifyOAuthState(stateRaw);
  const nextPath = state?.next && state.next.startsWith("/") ? state.next : fallbackNext;

  try {
    const tokenData = await exchangeWeChatCode(code);
    const profile = await fetchWeChatUserInfo(tokenData.accessToken, tokenData.openid);
    const { token } = await loginWithWechat(tokenData.openid, profile);

    const response = NextResponse.redirect(new URL(nextPath, request.url));
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    const msg = encodeURIComponent(err instanceof Error ? err.message : "微信登录失败");
    return NextResponse.redirect(new URL(`/login?error=${msg}`, request.url));
  }
}
