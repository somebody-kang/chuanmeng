import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ensureLocalEnv } from "./ensure-env.mjs";

const root = process.cwd();
const dbPath = join(root, "prisma", "dev.db");

if (!process.env.PRISMA_ENGINES_MIRROR) {
  process.env.PRISMA_ENGINES_MIRROR = "https://npmmirror.com/mirrors/prisma";
}
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

ensureLocalEnv();

if (!existsSync(dbPath)) {
  console.log("[setup] 首次运行：正在初始化数据库...");
  execSync("npx prisma generate", { stdio: "inherit", env: process.env });
  execSync("npx prisma db push", { stdio: "inherit", env: process.env });
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: process.env });
  console.log("[setup] 数据库就绪。");
} else {
  console.log("[setup] 数据库已存在，跳过初始化。");
}
