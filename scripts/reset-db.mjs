import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dbPath = join(root, "prisma", "dev.db");
const dbJournal = join(root, "prisma", "dev.db-journal");
const uploadDir = join(root, "public", "uploads", "characters");

console.log("[reset] 重置数据库为初始 seed 状态…");

function tryUnlink(p) {
  if (!existsSync(p)) return true;
  try {
    unlinkSync(p);
    console.log(`[reset] 已删除 ${p}`);
    return true;
  } catch {
    console.warn(`[reset] 无法删除 ${p}（可能被占用），改为清空表数据…`);
    return false;
  }
}

const removedDb = tryUnlink(dbPath);
tryUnlink(dbJournal);

if (existsSync(uploadDir)) {
  for (const name of readdirSync(uploadDir)) {
    if (name === ".gitkeep" || name === ".gitignore") continue;
    try {
      unlinkSync(join(uploadDir, name));
    } catch {
      /* ignore */
    }
  }
  console.log("[reset] 已清理上传图片");
}

if (!removedDb && existsSync(dbPath)) {
  const require = createRequire(import.meta.url);
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    await prisma.voteRecord.deleteMany();
    await prisma.voteStat.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.matchupParticipant.deleteMany();
    await prisma.matchup.deleteMany();
    await prisma.round.deleteMany();
    await prisma.tournament.deleteMany();
    await prisma.session.deleteMany();
    await prisma.voteQuota.deleteMany();
    await prisma.user.deleteMany();
    await prisma.character.deleteMany();
    console.log("[reset] 已清空全部业务表");
  } finally {
    await prisma.$disconnect();
  }
} else if (removedDb || !existsSync(dbPath)) {
  execSync("npx prisma db push", { stdio: "inherit", cwd: root });
}

execSync("npx tsx prisma/seed.ts", { stdio: "inherit", cwd: root });
console.log("[reset] 完成：角色 + 决斗/小组赛对阵已重新播种。");
