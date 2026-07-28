export type GalleryItem = {
  id: string;
  caption: string;
  emoji: string;
  tint: string;
  imageUrl?: string | null;
};

export function parseGallery(json: string): GalleryItem[] {
  try {
    const data = JSON.parse(json) as Array<Partial<GalleryItem> & { caption?: string }>;
    if (!Array.isArray(data)) return [];
    return data.map((item, i) => ({
      id: item.id || `g-${i}`,
      caption: item.caption || "图集",
      emoji: item.emoji || "🌸",
      tint: item.tint || "#FB7299",
      imageUrl: item.imageUrl ?? null,
    }));
  } catch {
    return [];
  }
}
