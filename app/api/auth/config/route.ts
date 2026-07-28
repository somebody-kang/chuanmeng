import { NextResponse } from "next/server";
import { ALLOW_DEV_LOGIN, REQUIRE_WECHAT_LOGIN } from "@/lib/constants";
import { getWeChatSetupStatus } from "@/lib/wechat-setup";

export async function GET() {
  const setup = getWeChatSetupStatus();
  return NextResponse.json({
    requireWechatLogin: REQUIRE_WECHAT_LOGIN,
    allowDevLogin: ALLOW_DEV_LOGIN,
    wechatConfigured: setup.wechatConfigured,
    wechatReady: setup.ready,
    redirectUri: setup.redirectUri,
    oauthDomain: setup.oauthDomain,
    isLocalhost: setup.isLocalhost,
    checklist: setup.checklist,
  });
}
