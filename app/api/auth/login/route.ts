import { NextRequest, NextResponse } from "next/server";
import {
  ALLOW_DEV_LOGIN,
  clearSessionCookie,
  loginWithDevMock,
  REQUIRE_WECHAT_LOGIN,
  SESSION_COOKIE,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (REQUIRE_WECHAT_LOGIN && !ALLOW_DEV_LOGIN) {
    return NextResponse.json(
      {
        detail: "已启用微信强制登录，请使用微信授权。PC 端请用微信扫描二维码或在微信内打开链接。",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const nickname = String(body.nickname ?? "").trim();

    if (!nickname) {
      return NextResponse.json({ detail: "昵称不能为空" }, { status: 400 });
    }

    const { user, token } = await loginWithDevMock(nickname);
    const response = NextResponse.json({
      success: true,
      user,
      devMode: true,
      message: "开发模拟登录：已绑定模拟微信 openid",
    });
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "登录失败" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  await import("@/lib/auth").then((m) => m.logout(token));
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
