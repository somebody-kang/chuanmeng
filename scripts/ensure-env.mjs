/**
 * 确保本地存在可用的 .env（不提交进仓库）。
 * - 仅从 .env.example 或内置安全默认值生成
 * - 微信相关项保持为空
 * - AUTH_SECRET 使用本机随机值
 */
import crypto from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const envPath = resolve(root, ".env");
const examplePath = resolve(root, ".env.example");

function minimalEnv(authSecret) {
  return [
    `DATABASE_URL="file:./dev.db"`,
    `VOTE_TOTAL_LIMIT=5`,
    `PRISMA_ENGINES_MIRROR="https://npmmirror.com/mirrors/prisma"`,
    `WECHAT_APP_ID=`,
    `WECHAT_APP_SECRET=`,
    `WECHAT_REDIRECT_URI=http://localhost:3000/api/auth/wechat/callback`,
    `AUTH_SECRET=${authSecret}`,
    `REQUIRE_WECHAT_LOGIN=true`,
    `ALLOW_DEV_LOGIN=true`,
    `ADMIN_USERNAME=admin`,
    `ADMIN_PASSWORD=moe-admin-2026`,
    `WJ_WEBHOOK_SECRET=`,
    "",
  ].join("\n");
}

/** 去掉模板中可能被误填的字段，并写入随机 AUTH_SECRET */
function sanitizeTemplate(text, authSecret) {
  let out = text.replace(/\r\n/g, "\n");
  const set = (key, value) => {
    const re = new RegExp(`^\\s*${key}\\s*=.*$`, "m");
    if (re.test(out)) out = out.replace(re, `${key}=${value}`);
    else out += `\n${key}=${value}\n`;
  };

  set("DATABASE_URL", `"file:./dev.db"`);
  set("WECHAT_APP_ID", "");
  set("WECHAT_APP_SECRET", "");
  set("AUTH_SECRET", authSecret);
  set("ALLOW_DEV_LOGIN", "true");

  if (!/^\s*PRISMA_ENGINES_MIRROR\s*=/m.test(out)) {
    out += `\nPRISMA_ENGINES_MIRROR="https://npmmirror.com/mirrors/prisma"\n`;
  }
  return out.endsWith("\n") ? out : `${out}\n`;
}

function ensureDatabaseUrl(content) {
  if (/^\s*DATABASE_URL\s*=\s*\S+/m.test(content)) return content;
  return `DATABASE_URL="file:./dev.db"\n${content}`;
}

export function ensureLocalEnv() {
  const authSecret = crypto.randomBytes(24).toString("hex");

  if (existsSync(envPath)) {
    const current = readFileSync(envPath, "utf8");
    const next = ensureDatabaseUrl(current);
    if (next !== current) {
      writeFileSync(envPath, next, "utf8");
      console.log("[env] 已补全 DATABASE_URL");
    } else {
      console.log("[env] 本地 .env 已存在");
    }
    return { created: false, path: envPath };
  }

  if (existsSync(examplePath)) {
    const template = readFileSync(examplePath, "utf8");
    writeFileSync(envPath, sanitizeTemplate(template, authSecret), "utf8");
    console.log("[env] 已从 .env.example 生成本地 .env");
  } else {
    writeFileSync(envPath, minimalEnv(authSecret), "utf8");
    console.log("[env] 已写入默认本地 .env");
  }

  return { created: true, path: envPath };
}

const isDirectRun =
  Boolean(process.argv[1]) && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);

if (isDirectRun) {
  ensureLocalEnv();
}
