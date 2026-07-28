/**
 * npm postinstall：生成 Prisma Client。
 * 国内默认走引擎镜像，避免卡在 binaries.prisma.sh。
 */
import { spawnSync } from "node:child_process";

if (!process.env.PRISMA_ENGINES_MIRROR) {
  process.env.PRISMA_ENGINES_MIRROR = "https://npmmirror.com/mirrors/prisma";
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
  // 不让整个 npm install 因引擎下载失败而中断
  process.exit(0);
}
