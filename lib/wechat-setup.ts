import { AUTH_SECRET } from "@/lib/constants";
import { getWeChatConfig } from "@/lib/wechat";

export type WeChatSetupItem = {
  id: string;
  label: string;
  done: boolean;
  hint?: string;
};

export type WeChatSetupStatus = {
  ready: boolean;
  wechatConfigured: boolean;
  redirectUri: string | null;
  oauthDomain: string | null;
  isLocalhost: boolean;
  checklist: WeChatSetupItem[];
};

function parseOAuthDomain(redirectUri: string | undefined): string | null {
  if (!redirectUri) return null;
  try {
    return new URL(redirectUri).hostname;
  } catch {
    return null;
  }
}

/** 检查真实微信 OAuth 是否可在当前环境启用 */
export function getWeChatSetupStatus(): WeChatSetupStatus {
  const { appId, appSecret, redirectUri } = getWeChatConfig();
  const oauthDomain = parseOAuthDomain(redirectUri);
  const isLocalhost =
    oauthDomain === "localhost" || oauthDomain === "127.0.0.1" || oauthDomain === "::1";

  const hasAppId = !!appId;
  const hasAppSecret = !!appSecret;
  const hasRedirectUri = !!redirectUri;
  const hasAuthSecret = AUTH_SECRET !== "change-me-in-production";
  const hasPublicDomain = !!oauthDomain && !isLocalhost;
  const redirectUsesHttps = redirectUri?.startsWith("https://") ?? false;

  const checklist: WeChatSetupItem[] = [
    {
      id: "service_account",
      label: "已注册并认证微信服务号（或使用测试号）",
      done: hasAppId && hasAppSecret,
      hint: "订阅号无法对未关注用户做网页授权；个人可申请「微信公众平台接口测试号」",
    },
    {
      id: "app_id",
      label: "已填写 WECHAT_APP_ID",
      done: hasAppId,
    },
    {
      id: "app_secret",
      label: "已填写 WECHAT_APP_SECRET",
      done: hasAppSecret,
    },
    {
      id: "redirect_uri",
      label: "已填写 WECHAT_REDIRECT_URI（与微信后台完全一致）",
      done: hasRedirectUri,
      hint: redirectUri ?? "示例：https://你的域名/api/auth/wechat/callback",
    },
    {
      id: "oauth_domain",
      label: "微信公众平台已配置「网页授权域名」",
      done: hasPublicDomain,
      hint: isLocalhost
        ? "localhost 无法作为授权域名，需公网域名（可用 ngrok / Cloudflare Tunnel）"
        : oauthDomain
          ? `后台填写的域名应为：${oauthDomain}`
          : undefined,
    },
    {
      id: "https",
      label: "回调地址使用 HTTPS（生产环境必需）",
      done: redirectUsesHttps || isLocalhost,
      hint: "本地隧道调试时也应使用 https://xxx.ngrok.io/...",
    },
    {
      id: "auth_secret",
      label: "已设置随机 AUTH_SECRET（OAuth state 签名）",
      done: hasAuthSecret,
    },
  ];

  const wechatConfigured = hasAppId && hasAppSecret && hasRedirectUri && hasAuthSecret;
  const ready = wechatConfigured && hasPublicDomain && (redirectUsesHttps || process.env.NODE_ENV !== "production");

  return {
    ready,
    wechatConfigured,
    redirectUri: redirectUri ?? null,
    oauthDomain,
    isLocalhost,
    checklist,
  };
}
