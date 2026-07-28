import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import {
  addGalleryImage,
  clearCharacterPortrait,
  createCharacter,
  deleteCharacter,
  deleteGalleryItemCompletely,
  listAdminCharacters,
  parseGallery,
  removeGalleryItem,
  saveCharacterImage,
  updateCharacter,
} from "@/lib/admin-services";

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ detail: "未授权" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const characters = await listAdminCharacters();
  return NextResponse.json({
    characters: characters.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      anime: c.anime,
      groupName: c.groupName,
      description: c.description,
      emoji: c.emoji,
      color: c.color,
      imageUrl: c.imageUrl,
      gallery: parseGallery(c.galleryJson),
      commentCount: c._count.comments,
    })),
  });
}

export async function POST(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const action = String(form.get("action") ?? "create");

      if (action === "gallery") {
        const id = Number(form.get("id"));
        const caption = String(form.get("caption") ?? "");
        const file = form.get("image");
        if (!id || !(file instanceof File) || file.size === 0) {
          return NextResponse.json({ detail: "请选择图集图片" }, { status: 400 });
        }
        const result = await addGalleryImage(id, file, caption);
        return NextResponse.json({
          success: true,
          character: result.character,
          item: result.item,
          gallery: parseGallery(result.character!.galleryJson),
        });
      }

      const name = String(form.get("name") ?? "");
      const slug = String(form.get("slug") ?? "");
      const anime = String(form.get("anime") ?? "");
      const description = String(form.get("description") ?? "");
      const emoji = String(form.get("emoji") ?? "🌸");
      const color = String(form.get("color") ?? "#FB7299");
      const groupName = String(form.get("groupName") ?? "anime");
      const file = form.get("image");

      let imageUrl: string | null = null;
      if (file instanceof File && file.size > 0) {
        imageUrl = await saveCharacterImage(file, slug || "char");
      }

      const character = await createCharacter({
        name,
        slug,
        anime,
        description,
        emoji,
        color,
        groupName,
        imageUrl,
      });
      return NextResponse.json({ success: true, character });
    }

    const body = await request.json();
    const character = await createCharacter({
      name: String(body.name ?? ""),
      slug: String(body.slug ?? ""),
      anime: String(body.anime ?? ""),
      description: String(body.description ?? ""),
      emoji: body.emoji ? String(body.emoji) : undefined,
      color: body.color ? String(body.color) : undefined,
      groupName: body.groupName ? String(body.groupName) : undefined,
    });
    return NextResponse.json({ success: true, character });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "创建失败" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const id = Number(form.get("id"));
      if (!id) return NextResponse.json({ detail: "缺少 id" }, { status: 400 });

      const patch: Parameters<typeof updateCharacter>[1] = {};
      for (const key of ["name", "anime", "description", "emoji", "color", "groupName", "slug"] as const) {
        const val = form.get(key);
        if (typeof val === "string" && val.length > 0) patch[key] = val;
      }

      const file = form.get("image");
      const slugHint = String(form.get("slug") || form.get("name") || "char");
      if (file instanceof File && file.size > 0) {
        patch.imageUrl = await saveCharacterImage(file, slugHint);
      }

      const character = await updateCharacter(id, patch);
      return NextResponse.json({
        success: true,
        character: { ...character, gallery: parseGallery(character.galleryJson) },
      });
    }

    const body = await request.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ detail: "缺少 id" }, { status: 400 });

    if (body.action === "clearPortrait") {
      const character = await clearCharacterPortrait(id);
      return NextResponse.json({ success: true, character });
    }

    if (body.action === "clearGalleryImage") {
      const itemId = String(body.itemId ?? "");
      const character = await removeGalleryItem(id, itemId);
      return NextResponse.json({
        success: true,
        character: { ...character, gallery: parseGallery(character.galleryJson) },
      });
    }

    if (body.action === "deleteGalleryItem") {
      const itemId = String(body.itemId ?? "");
      const character = await deleteGalleryItemCompletely(id, itemId);
      return NextResponse.json({
        success: true,
        character: { ...character, gallery: parseGallery(character.galleryJson) },
      });
    }

    const character = await updateCharacter(id, {
      name: body.name,
      anime: body.anime,
      description: body.description,
      emoji: body.emoji,
      color: body.color,
      groupName: body.groupName,
      slug: body.slug,
      imageUrl: body.imageUrl,
    });
    return NextResponse.json({ success: true, character });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "更新失败" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const id = Number(request.nextUrl.searchParams.get("id"));
    if (!id) return NextResponse.json({ detail: "缺少 id" }, { status: 400 });
    await deleteCharacter(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "删除失败" },
      { status: 400 }
    );
  }
}
