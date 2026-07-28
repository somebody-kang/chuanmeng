import { readFileSync } from "node:fs";
import { join } from "node:path";

let cachedWords: string[] | null = null;

function loadBannedWords(): string[] {
  if (cachedWords) return cachedWords;
  try {
    const raw = readFileSync(join(process.cwd(), "data", "banned-words.txt"), "utf8");
    cachedWords = raw
      .split(/\r?\n/)
      .map((w) => w.trim())
      .filter((w) => w && !w.startsWith("#"));
  } catch {
    cachedWords = [];
  }
  return cachedWords;
}

/** 简易子串匹配；命中返回第一个敏感词，否则 null */
export function findBannedWord(text: string): string | null {
  const normalized = text.replace(/\s+/g, "").toLowerCase();
  for (const word of loadBannedWords()) {
    if (normalized.includes(word.toLowerCase())) return word;
  }
  return null;
}

export function assertCleanComment(content: string): void {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("评论不能为空");
  if (trimmed.length > 200) throw new Error("评论最多 200 字");
  const hit = findBannedWord(trimmed);
  if (hit) throw new Error("评论包含敏感内容，请修改后重试");
}
