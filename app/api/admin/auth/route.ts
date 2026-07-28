import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, logout, SESSION_COOKIE, setSessionCookie } from "@/lib/auth";
import { isAdminAuthenticated, loginAsAdmin } from "@/lib/admin";

export async function GET() {
  const ok = await isAdminAuthenticated();
  return NextResponse.json({ authenticated: ok });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body.username ?? body.account ?? "");
    const password = String(body.password ?? "");

    const { user, token } = await loginAsAdmin(username, password);
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, nickname: user.nickname, isAdmin: user.isAdmin },
    });
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "登录失败" },
      { status: 401 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  await logout(token);
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
