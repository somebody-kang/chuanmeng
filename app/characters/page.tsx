import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import CharacterPortrait from "@/components/CharacterPortrait";
import { GROUP_LABELS, getCharacters } from "@/lib/services";

export default async function CharactersPage() {
  const characters = await getCharacters();

  return (
    <>
      <SiteNav active="characters" />
      <header className="hero-bleed !min-h-[280px] !items-end !pb-10">
        <div className="relative z-10 mx-auto w-full max-w-6xl anim-fade-up">
          <h1 className="font-display text-4xl text-white md:text-5xl">参选角色</h1>
          <p className="mt-2 text-sm text-white/85">点击角色查看图集、评论与得票</p>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 px-4 py-10 md:px-5">
        {characters.map((c, i) => (
          <Link
            key={c.id}
            href={`/characters/${c.slug}`}
            data-tip="点击查看详情"
            className="anim-fade-up glass-panel group overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(251,114,153,0.25)]"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="relative flex aspect-[3/4] items-end justify-center overflow-hidden transition group-hover:scale-[1.03]">
              <CharacterPortrait
                name={c.name}
                emoji={c.emoji}
                color={c.color}
                imageUrl={c.imageUrl}
                className="absolute inset-0"
              />
              <span className="relative z-[1] w-full bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-8">
                <span className="mb-1 inline-block rounded bg-[#fb7299]/25 px-1.5 py-0.5 text-[10px] text-[#ff9eb5]">
                  {GROUP_LABELS[c.group] || c.group}
                </span>
                <span className="block truncate font-bold text-white">{c.name}</span>
                <span className="block truncate text-[11px] text-white/65">《{c.anime}》</span>
                <span className="mt-1 block text-sm font-bold text-[#ff9eb5]">
                  {c.totalVotes.toLocaleString()} 票
                </span>
              </span>
            </div>
          </Link>
        ))}
      </main>
    </>
  );
}
