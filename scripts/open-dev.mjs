import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const isWin = process.platform === "win32";

if (!process.env.PRISMA_ENGINES_MIRROR) {
  process.env.PRISMA_ENGINES_MIRROR = "https://npmmirror.com/mirrors/prisma";
}
if (!process.env.NPM_CONFIG_REGISTRY) {
  process.env.NPM_CONFIG_REGISTRY = "https://registry.npmmirror.com";
}

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, {
    stdio: "inherit",
    shell: isWin,
    cwd: root,
    env: process.env,
    ...opts,
  });
}

const depsOk =
  existsSync(join(root, "node_modules", "next", "package.json")) &&
  existsSync(join(root, "node_modules", "prisma", "package.json"));

if (!depsOk) {
  console.log("正在安装依赖 npm install ...");
  console.log(`镜像: ${process.env.NPM_CONFIG_REGISTRY}`);
  const install = run("npm", ["install", "--no-audit", "--no-fund", "--no-update-notifier"]);
  install.on("close", (code) => {
    if (code !== 0) process.exit(code ?? 1);
    startDev();
  });
} else {
  startDev();
}

function startDev() {
  console.log("\n========================================");
  console.log("  红动漫社萌战 Demo");
  console.log("  启动后请在浏览器打开:");
  console.log("  http://localhost:3000");
  console.log("========================================\n");

  setTimeout(() => {
    const open = isWin ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
    spawn(open, ["http://localhost:3000"], {
      shell: isWin,
      detached: true,
      stdio: "ignore",
    }).unref();
  }, 3500);

  const dev = run("npm", ["run", "dev"]);
  dev.on("close", (code) => process.exit(code ?? 0));
}
