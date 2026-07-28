import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import CharacterTabs from "@/components/CharacterTabs";
import CharacterPortrait from "@/components/CharacterPortrait";
import { getCurrentUser } from "@/lib/auth";
import { GROUP_LABELS, getCharacterBySlug } from "@/lib/services";

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [character, user] = await Promise.all([getCharacterBySlug(slug), getCurrentUser()]);
  if (!character) notFound();

  return (
    <>
      <SiteNav active="characters" />
      <header className="relative overflow-hidden px-4 pb-10 pt-12 md:px-5">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(ellipse 70% 80% at 30% 40%, ${character.color}66, transparent 60%), linear-gradient(135deg, #b01016 0%, #fb7299 100%)`,
          }}
        />
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-5 md:flex-row md:items-end">
          <CharacterPortrait
            name={character.name}
            emoji={character.emoji}
            color={character.color}
            imageUrl={character.imageUrl}
            className="anim-float h-32 w-32 rounded-2xl border border-white/30 shadow-2xl md:h-40 md:w-40"
            sizeClass="text-6xl md:text-7xl"
          />
          <div className="anim-fade-up text-center md:text-left">
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-0.5 text-xs">
              {GROUP_LABELS[character.group] || character.group}
            </span>
            <h1 className="mt-2 font-display text-4xl text-white md:text-5xl">{character.name}</h1>
            <p className="mt-1 text-[var(--text-secondary)]">
              《{character.anime}》 · 累计 {character.totalVotes} 票
            </p>
          </div>
        </div>
      </header>
      <CharacterTabs
        character={{
          ...character,
          groupLabel: GROUP_LABELS[character.group] || character.group,
        }}
        isLoggedIn={!!user?.wechatBound}
      />
    </>
  );
}
