import { NextRequest, NextResponse } from "next/server";
import {
  buildWeChatOAuthUrl,
  getWeChatConfig,
  isWeChatBrowser,
  signOAuthState,
} from "@/lib/wechat";

export async function GET(request: NextRequest) {
  const { appId, redirectUri } = getWeChatConfig();
  if (!appId || !redirectUri) {
    return NextResponse.json(
      {
        detail:
          "微信登录未配置。请在 .env 中设置 WECHAT_APP_ID、WECHAT_APP_SECRET、WECHAT_REDIRECT_URI。",
      },
      { status: 503 }
    );
  }

  const next = request.nextUrl.searchParams.get("next") || "/";
  const state = signOAuthState({ next });
  const url = buildWeChatOAuthUrl(state, "snsapi_userinfo");

  const wantsJson = request.nextUrl.searchParams.get("format") === "json";
  if (wantsJson) {
    return NextResponse.json({ url });
  }

  return NextResponse.redirect(url);
}

export async function POST(request: NextRequest) {
  const ua = request.headers.get("user-agent");
  if (!isWeChatBrowser(ua) && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { detail: "请在微信内打开本页面完成授权登录" },
      { status: 403 }
    );
  }

  const next = request.nextUrl.searchParams.get("next") || "/";
  const state = signOAuthState({ next });

  try {
    const url = buildWeChatOAuthUrl(state, "snsapi_userinfo");
    return NextResponse.json({ url, wechatBrowser: isWeChatBrowser(ua) });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "微信登录不可用" },
      { status: 503 }
    );
  }
}
