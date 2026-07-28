import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const dbPath = join(process.cwd(), "prisma", "dev.db");

if (!existsSync(dbPath)) {
  console.log("[setup] 首次运行：正在初始化数据库...");
  execSync("npx prisma db push", { stdio: "inherit" });
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
  console.log("[setup] 数据库就绪。");
} else {
  console.log("[setup] 数据库已存在，跳过初始化。");
}
