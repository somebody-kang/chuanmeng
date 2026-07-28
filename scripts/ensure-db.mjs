import { execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dbPath = join(root, "prisma", "dev.db");
const envPath = join(root, ".env");
const envExample = join(root, ".env.example");

if (!process.env.PRISMA_ENGINES_MIRROR) {
  process.env.PRISMA_ENGINES_MIRROR = "https://npmmirror.com/mirrors/prisma";
}

if (!existsSync(envPath) && existsSync(envExample)) {
  copyFileSync(envExample, envPath);
  console.log("[setup] 已从 .env.example 创建本地 .env");
}

if (!existsSync(dbPath)) {
  console.log("[setup] 首次运行：正在初始化数据库...");
  execSync("npx prisma generate", { stdio: "inherit", env: process.env });
  execSync("npx prisma db push", { stdio: "inherit", env: process.env });
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: process.env });
  console.log("[setup] 数据库就绪。");
} else {
  console.log("[setup] 数据库已存在，跳过初始化。");
}
