import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { prisma } from "@/lib/prisma";
import { parseGallery, type GalleryItem } from "@/lib/gallery";

export type { GalleryItem };
export { parseGallery };

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export async function saveCharacterImage(file: File, slug: string): Promise<string> {
  const rawExt = extname(file.name).toLowerCase();
  const mimeExt =
    file.type === "image/jpeg"
      ? ".jpg"
      : file.type === "image/png"
        ? ".png"
        : file.type === "image/webp"
          ? ".webp"
          : file.type === "image/gif"
            ? ".gif"
            : "";
  const ext = ALLOWED_EXT.has(rawExt) ? rawExt : mimeExt || ".png";
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error("仅支持 jpg / png / webp / gif");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("图片不能超过 5MB");
  }

  const dir = join(process.cwd(), "public", "uploads", "characters");
  await mkdir(dir, { recursive: true });

  const safeSlug = (slug || "char").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "char";
  const filename = `${safeSlug}-${Date.now()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, filename), buffer);

  return `/uploads/characters/${filename}`;
}

export async function removeUploadFile(url: string | null | undefined) {
  if (!url || !url.startsWith("/uploads/characters/")) return;
  const name = basename(url);
  if (!name || name.includes("..")) return;
  try {
    await unlink(join(process.cwd(), "public", "uploads", "characters", name));
  } catch {
    // 文件不存在时忽略
  }
}

export async function listAdminCharacters() {
  return prisma.character.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { comments: true } } },
  });
}

export async function listAdminMatchups() {
  return prisma.matchup.findMany({
    include: {
      round: true,
      participants: {
        include: { character: true },
        orderBy: { sortOrder: "asc" },
      },
      voteStats: true,
    },
    orderBy: [{ status: "asc" }, { groupLabel: "asc" }, { id: "desc" }],
  });
}

export async function listAdminComments(limit = 100) {
  return prisma.comment.findMany({
    include: {
      user: { select: { id: true, nickname: true } },
      character: { select: { id: true, name: true, slug: true, emoji: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getOrCreateActiveRound() {
  let round = await prisma.round.findFirst({
    where: { status: "active" },
    include: { tournament: true },
    orderBy: { id: "desc" },
  });

  if (!round) {
    let tournament = await prisma.tournament.findFirst({
      where: { status: "active" },
      orderBy: { id: "desc" },
    });
    if (!tournament) {
      tournament = await prisma.tournament.create({
        data: { name: "红动漫社萌战", status: "active" },
      });
    }
    round = await prisma.round.create({
      data: {
        tournamentId: tournament.id,
        roundNumber: 1,
        name: "本战 · 对阵",
        status: "active",
      },
      include: { tournament: true },
    });
  }

  return round;
}

export async function createMatchup(input: {
  mode?: "duel" | "group";
  characterIds: number[];
  groupLabel: string;
  voteLimit?: number;
  roundName?: string;
  startAt?: Date | null;
  endAt?: Date | null;
}) {
  const mode = input.mode === "group" ? "group" : "duel";
  const ids = [...new Set(input.characterIds.map(Number).filter(Boolean))];

  if (mode === "duel") {
    if (ids.length !== 2) throw new Error("决斗赛必须选择恰好 2 名角色");
  } else if (ids.length < 3) {
    throw new Error("小组赛至少选择 3 名角色");
  }

  const found = await prisma.character.findMany({ where: { id: { in: ids } } });
  if (found.length !== ids.length) throw new Error("部分角色不存在");

  const label = input.groupLabel.trim().toUpperCase();
  if (!/^[A-Z]$/.test(label)) {
    throw new Error("组别请填写单个字母，如 A / B / C");
  }

  const voteLimit =
    input.voteLimit !== undefined && input.voteLimit !== null
      ? Math.floor(Number(input.voteLimit))
      : mode === "duel"
        ? 1
        : 1;
  if (!Number.isFinite(voteLimit) || voteLimit < 1) {
    throw new Error("每人投票上限至少为 1");
  }
  if (voteLimit > ids.length) {
    throw new Error(`投票上限不能超过组内人数（${ids.length}）`);
  }

  const startAt = input.startAt ?? new Date();
  const endAt = input.endAt ?? null;
  if (endAt && endAt <= startAt) {
    throw new Error("结束时间必须晚于开始时间");
  }

  const round = await getOrCreateActiveRound();
  if (input.roundName?.trim()) {
    await prisma.round.update({
      where: { id: round.id },
      data: { name: input.roundName.trim() },
    });
  }

  const matchup = await prisma.matchup.create({
    data: {
      roundId: round.id,
      groupLabel: label,
      mode,
      voteLimit,
      status: "active",
      startAt,
      endAt,
      participants: {
        create: ids.map((characterId, index) => ({
          characterId,
          sortOrder: index,
        })),
      },
      voteStats: {
        create: ids.map((characterId) => ({
          characterId,
          voteCount: 0,
        })),
      },
    },
    include: {
      participants: { include: { character: true }, orderBy: { sortOrder: "asc" } },
      round: true,
    },
  });

  return matchup;
}

export async function updateMatchupStatus(id: number, status: "active" | "ended") {
  if (status === "ended") {
    return prisma.matchup.update({
      where: { id },
      data: { status: "ended", endAt: new Date() },
    });
  }
  return prisma.matchup.update({
    where: { id },
    data: {
      status: "active",
      // 重新开放：若已过期则延长 7 天
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startAt: new Date(),
    },
  });
}

export async function updateMatchupSchedule(
  id: number,
  data: { startAt?: Date | null; endAt?: Date | null; status?: "active" | "ended" }
) {
  const current = await prisma.matchup.findUnique({ where: { id } });
  if (!current) throw new Error("对阵不存在");

  const startAt = data.startAt !== undefined ? data.startAt : current.startAt;
  const endAt = data.endAt !== undefined ? data.endAt : current.endAt;
  if (startAt && endAt && endAt <= startAt) {
    throw new Error("结束时间必须晚于开始时间");
  }

  return prisma.matchup.update({
    where: { id },
    data: {
      ...(data.startAt !== undefined ? { startAt: data.startAt } : {}),
      ...(data.endAt !== undefined ? { endAt: data.endAt } : {}),
      ...(data.status ? { status: data.status } : {}),
    },
  });
}

export async function updateCharacter(
  id: number,
  data: {
    name?: string;
    anime?: string;
    description?: string;
    emoji?: string;
    color?: string;
    groupName?: string;
    slug?: string;
    imageUrl?: string | null;
    galleryJson?: string;
  }
) {
  if (data.slug) {
    const exists = await prisma.character.findFirst({
      where: { slug: data.slug, NOT: { id } },
    });
    if (exists) throw new Error("slug 已被占用");
  }

  return prisma.character.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.anime !== undefined ? { anime: data.anime.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description.trim() } : {}),
      ...(data.emoji !== undefined ? { emoji: data.emoji.trim() || "🌸" } : {}),
      ...(data.color !== undefined ? { color: data.color.trim() || "#FB7299" } : {}),
      ...(data.groupName !== undefined ? { groupName: data.groupName.trim() || "anime" } : {}),
      ...(data.slug !== undefined ? { slug: data.slug.trim() } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      ...(data.galleryJson !== undefined ? { galleryJson: data.galleryJson } : {}),
    },
  });
}

export async function clearCharacterPortrait(id: number) {
  const c = await prisma.character.findUnique({ where: { id } });
  if (!c) throw new Error("角色不存在");
  await removeUploadFile(c.imageUrl);
  return prisma.character.update({
    where: { id },
    data: { imageUrl: null },
  });
}

export async function addGalleryImage(
  id: number,
  file: File,
  caption?: string
): Promise<{ character: Awaited<ReturnType<typeof prisma.character.findUnique>>; item: GalleryItem }> {
  const c = await prisma.character.findUnique({ where: { id } });
  if (!c) throw new Error("角色不存在");

  const imageUrl = await saveCharacterImage(file, c.slug);
  const gallery = parseGallery(c.galleryJson);
  const item: GalleryItem = {
    id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    caption: (caption || "").trim() || `${c.name} 图集`,
    emoji: c.emoji,
    tint: c.color,
    imageUrl,
  };
  gallery.push(item);

  const character = await prisma.character.update({
    where: { id },
    data: { galleryJson: JSON.stringify(gallery) },
  });

  return { character, item };
}

export async function removeGalleryItem(characterId: number, itemId: string) {
  const c = await prisma.character.findUnique({ where: { id: characterId } });
  if (!c) throw new Error("角色不存在");

  const gallery = parseGallery(c.galleryJson);
  const target = gallery.find((g) => g.id === itemId);
  if (!target) throw new Error("图集项不存在");

  await removeUploadFile(target.imageUrl);

  // 删除图片后保留 emoji 占位项
  const next = gallery.map((g) =>
    g.id === itemId ? { ...g, imageUrl: null } : g
  );

  return prisma.character.update({
    where: { id: characterId },
    data: { galleryJson: JSON.stringify(next) },
  });
}

export async function deleteGalleryItemCompletely(characterId: number, itemId: string) {
  const c = await prisma.character.findUnique({ where: { id: characterId } });
  if (!c) throw new Error("角色不存在");

  const gallery = parseGallery(c.galleryJson);
  const target = gallery.find((g) => g.id === itemId);
  if (!target) throw new Error("图集项不存在");

  await removeUploadFile(target.imageUrl);
  const next = gallery.filter((g) => g.id !== itemId);

  return prisma.character.update({
    where: { id: characterId },
    data: { galleryJson: JSON.stringify(next) },
  });
}

export async function createCharacter(data: {
  name: string;
  slug: string;
  anime: string;
  description: string;
  emoji?: string;
  color?: string;
  groupName?: string;
  imageUrl?: string | null;
}) {
  const slug = data.slug.trim();
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error("slug 仅允许小写字母、数字与连字符");
  }
  const exists = await prisma.character.findUnique({ where: { slug } });
  if (exists) throw new Error("slug 已存在");

  const emoji = data.emoji?.trim() || "🌸";
  const color = data.color?.trim() || "#FB7299";
  const name = data.name.trim();

  return prisma.character.create({
    data: {
      name,
      slug,
      anime: data.anime.trim(),
      description: data.description.trim(),
      emoji,
      color,
      groupName: data.groupName?.trim() || "anime",
      imageUrl: data.imageUrl ?? null,
      galleryJson: JSON.stringify([
        {
          id: `g-init-${Date.now()}`,
          caption: name,
          emoji,
          tint: color,
          imageUrl: null,
        },
      ]),
    },
  });
}

export async function deleteCharacter(id: number) {
  const c = await prisma.character.findUnique({ where: { id } });
  if (!c) throw new Error("角色不存在");

  const parts = await prisma.matchupParticipant.findMany({
    where: { characterId: id },
    select: { matchupId: true },
  });
  const matchupIds = [...new Set(parts.map((p) => p.matchupId))];

  await prisma.$transaction(async (tx) => {
    if (matchupIds.length) {
      await tx.voteRecord.deleteMany({ where: { matchupId: { in: matchupIds } } });
      await tx.voteStat.deleteMany({ where: { matchupId: { in: matchupIds } } });
      await tx.matchupParticipant.deleteMany({ where: { matchupId: { in: matchupIds } } });
      await tx.matchup.deleteMany({ where: { id: { in: matchupIds } } });
    }
    await tx.voteRecord.deleteMany({ where: { characterId: id } });
    await tx.voteStat.deleteMany({ where: { characterId: id } });
    await tx.matchupParticipant.deleteMany({ where: { characterId: id } });
    await tx.comment.deleteMany({ where: { characterId: id } });
    await tx.character.delete({ where: { id } });
  });

  await removeUploadFile(c.imageUrl);
  for (const g of parseGallery(c.galleryJson)) {
    await removeUploadFile(g.imageUrl);
  }
}

export async function deleteComment(id: number) {
  await prisma.comment.delete({ where: { id } });
}
