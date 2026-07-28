import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type GalleryItem = { id: string; caption: string; emoji: string; tint: string; imageUrl: null };

function g(slug: string, i: number, caption: string, emoji: string, tint: string): GalleryItem {
  return { id: `g-${slug}-${i}`, caption, emoji, tint, imageUrl: null };
}

const CHARACTERS: Array<{
  slug: string;
  name: string;
  anime: string;
  groupName: string;
  description: string;
  emoji: string;
  color: string;
  gallery: GalleryItem[];
}> = [
  {
    slug: "miku",
    name: "初音未来",
    anime: "VOCALOID",
    groupName: "vtuber",
    description: "世界上最知名的虚拟歌手，标志性的蓝绿色双马尾。用歌声连接世界的「初音未来」。",
    emoji: "🎤",
    color: "#39C5BB",
    gallery: [
      g("miku", 1, "舞台闪光", "🎤", "#39C5BB"),
      g("miku", 2, "葱色双马尾", "🌿", "#7FE7DF"),
      g("miku", 3, "演唱会应援", "💡", "#1FA6A0"),
    ],
  },
  {
    slug: "rem",
    name: "蕾姆",
    anime: "Re:从零开始的异世界生活",
    groupName: "anime",
    description: "罗兹瓦尔邸的双子女仆之一，蓝发蓝眸的鬼族少女。温柔、坚韧、愿意为爱献出一切。",
    emoji: "💙",
    color: "#5B8CFF",
    gallery: [
      g("rem", 1, "女仆装日常", "💙", "#5B8CFF"),
      g("rem", 2, "鬼化觉醒", "😈", "#3D5AFE"),
      g("rem", 3, "花田午后", "🌸", "#90CAF9"),
    ],
  },
  {
    slug: "frieren",
    name: "芙莉莲",
    anime: "葬送的芙莉莲",
    groupName: "anime",
    description: "活了千年以上的精灵魔法使。冷静而温柔，在漫长旅途中慢慢学会「人类的时间」。",
    emoji: "✨",
    color: "#9B8CFF",
    gallery: [
      g("frieren", 1, "旅途晨光", "✨", "#9B8CFF"),
      g("frieren", 2, "魔法咏唱", "🪄", "#B39DDB"),
      g("frieren", 3, "墓碑前的花", "🌼", "#CE93D8"),
    ],
  },
  {
    slug: "2b",
    name: "2B",
    anime: "尼尔：机械纪元",
    groupName: "game",
    description: "YoRHa 部队二号 B 型战斗用人造人。黑裙、白发、利剑——以及被隐藏的感情。",
    emoji: "⚔️",
    color: "#888888",
    gallery: [
      g("2b", 1, "作战姿态", "⚔️", "#888888"),
      g("2b", 2, "废墟黄昏", "🏙️", "#616161"),
      g("2b", 3, "目镜之下", "🕶️", "#424242"),
    ],
  },
  {
    slug: "anyan",
    name: "阿尼亚",
    anime: "SPY×FAMILY",
    groupName: "anime",
    description: "拥有读心能力的可爱小女孩。哇酷哇酷！花生爱好者，邦德的好朋友。",
    emoji: "🥜",
    color: "#FFB347",
    gallery: [
      g("anyan", 1, "哇酷哇酷", "🥜", "#FFB347"),
      g("anyan", 2, "伊甸学院", "🎒", "#FFCC80"),
      g("anyan", 3, "邦德同行", "🐕", "#FFE0B2"),
    ],
  },
  {
    slug: "raiden",
    name: "雷电将军",
    anime: "原神",
    groupName: "game",
    description: "稻妻的雷神，追求永恒的神明。紫电一闪，刹那即永恒。",
    emoji: "⚡",
    color: "#7B5CFF",
    gallery: [
      g("raiden", 1, "一心净土", "⚡", "#7B5CFF"),
      g("raiden", 2, "影之思绪", "🏯", "#9575CD"),
      g("raiden", 3, "雷樱之下", "🌸", "#B39DDB"),
    ],
  },
  {
    slug: "mikoto",
    name: "御坂美琴",
    anime: "某科学的超电磁炮",
    groupName: "anime",
    description: "学园都市 Level 5 超能力者，电击使。傲娇、正义，以及永远吃不腻的面包。",
    emoji: "⚡",
    color: "#FF8FAB",
    gallery: [
      g("mikoto", 1, "超电磁炮", "⚡", "#FF8FAB"),
      g("mikoto", 2, "常盘台制服", "🏫", "#F48FB1"),
      g("mikoto", 3, "呱太同行", "🐸", "#FFCDD2"),
    ],
  },
  {
    slug: "lty",
    name: "洛天依",
    anime: "VOCALOID",
    groupName: "vtuber",
    description: "中国最具人气的虚拟歌手，灰发绿瞳。用中文歌声讲述少年少女的故事。",
    emoji: "🎵",
    color: "#66CCFF",
    gallery: [
      g("lty", 1, "天依应援色", "🎵", "#66CCFF"),
      g("lty", 2, "舞台灯海", "🌌", "#4FC3F7"),
      g("lty", 3, "灰发绿瞳", "💚", "#81D4FA"),
    ],
  },
];

async function createMatchupSeed(opts: {
  roundId: number;
  groupLabel: string;
  mode: "duel" | "group";
  voteLimit: number;
  slugs: string[];
  slugToId: Record<string, number>;
  startAt: Date;
  endAt: Date;
  status: string;
  voteCounts?: Record<string, number>;
}) {
  const ids = opts.slugs.map((s) => opts.slugToId[s]);
  const matchup = await prisma.matchup.create({
    data: {
      roundId: opts.roundId,
      groupLabel: opts.groupLabel,
      mode: opts.mode,
      voteLimit: opts.voteLimit,
      status: opts.status,
      startAt: opts.startAt,
      endAt: opts.endAt,
      participants: {
        create: ids.map((characterId, index) => ({ characterId, sortOrder: index })),
      },
      voteStats: {
        create: opts.slugs.map((slug, i) => ({
          characterId: ids[i],
          voteCount: opts.voteCounts?.[slug] ?? 0,
        })),
      },
    },
  });
  return matchup;
}

async function main() {
  const tournament = await prisma.tournament.create({
    data: { name: "2026 红动漫社萌战", status: "active" },
  });

  const round = await prisma.round.create({
    data: {
      tournamentId: tournament.id,
      roundNumber: 1,
      name: "32强 · 小组赛",
      status: "active",
    },
  });

  const slugToId: Record<string, number> = {};
  for (const char of CHARACTERS) {
    const created = await prisma.character.create({
      data: {
        slug: char.slug,
        name: char.name,
        anime: char.anime,
        groupName: char.groupName,
        description: char.description,
        emoji: char.emoji,
        color: char.color,
        imageUrl: null,
        galleryJson: JSON.stringify(char.gallery),
      },
    });
    slugToId[char.slug] = created.id;
  }

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // A：决斗 · 进行中
  await createMatchupSeed({
    roundId: round.id,
    groupLabel: "A",
    mode: "duel",
    voteLimit: 1,
    slugs: ["miku", "rem"],
    slugToId,
    startAt: new Date(now - day),
    endAt: new Date(now + 7 * day),
    status: "active",
  });

  // B：决斗 · 进行中
  await createMatchupSeed({
    roundId: round.id,
    groupLabel: "B",
    mode: "duel",
    voteLimit: 1,
    slugs: ["frieren", "2b"],
    slugToId,
    startAt: new Date(now - day),
    endAt: new Date(now + 7 * day),
    status: "active",
  });

  // C：决斗 · 未开始
  await createMatchupSeed({
    roundId: round.id,
    groupLabel: "C",
    mode: "duel",
    voteLimit: 1,
    slugs: ["anyan", "raiden"],
    slugToId,
    startAt: new Date(now + 2 * day),
    endAt: new Date(now + 9 * day),
    status: "active",
  });

  // D：决斗 · 已结束
  await createMatchupSeed({
    roundId: round.id,
    groupLabel: "D",
    mode: "duel",
    voteLimit: 1,
    slugs: ["mikoto", "lty"],
    slugToId,
    startAt: new Date(now - 10 * day),
    endAt: new Date(now - day),
    status: "ended",
    voteCounts: { mikoto: 12, lty: 7 },
  });

  // G：小组赛 8 选 3 · 进行中
  await createMatchupSeed({
    roundId: round.id,
    groupLabel: "G",
    mode: "group",
    voteLimit: 3,
    slugs: ["miku", "rem", "frieren", "2b", "anyan", "raiden", "mikoto", "lty"],
    slugToId,
    startAt: new Date(now - day),
    endAt: new Date(now + 7 * day),
    status: "active",
    voteCounts: {
      miku: 42,
      rem: 38,
      frieren: 35,
      "2b": 28,
      anyan: 31,
      raiden: 22,
      mikoto: 19,
      lty: 25,
    },
  });

  console.log("Seed completed (duel + group).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
