export const SESSION_COOKIE = "moe_session";
export const SESSION_DAYS = 7;
export const VOTE_TOTAL_LIMIT = Number(process.env.VOTE_TOTAL_LIMIT ?? 5);

/** 默认强制微信登录；生产环境勿设为 false */
export const REQUIRE_WECHAT_LOGIN = process.env.REQUIRE_WECHAT_LOGIN !== "false";

/** 仅开发环境：允许昵称模拟微信 openid（REQUIRE_WECHAT_LOGIN=false 或 NODE_ENV=development 且显式开启） */
export const ALLOW_DEV_LOGIN =
  process.env.ALLOW_DEV_LOGIN === "true" && process.env.NODE_ENV !== "production";

export const AUTH_SECRET = process.env.AUTH_SECRET || "change-me-in-production";

export const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "admin").trim();
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "moe-admin-2026";
export const ADMIN_OPENID = "admin:system";
