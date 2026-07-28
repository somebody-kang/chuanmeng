/**
 * npm postinstall：生成 Prisma Client。
 * 国内默认走引擎镜像，避免卡在 binaries.prisma.sh。
 */
import { spawnSync } from "node:child_process";
import { ensureLocalEnv } from "./ensure-env.mjs";

if (!process.env.PRISMA_ENGINES_MIRROR) {
  process.env.PRISMA_ENGINES_MIRROR = "https://npmmirror.com/mirrors/prisma";
}
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

try {
  ensureLocalEnv();
} catch (err) {
  console.warn("[postinstall] 创建 .env 跳过:", err instanceof Error ? err.message : err);
}

const result = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

if (result.status !== 0) {
  console.warn(
    "[postinstall] prisma generate 未成功。启动时 start.bat / ensure-db 会再次尝试。"
  );
  process.exit(0);
}
