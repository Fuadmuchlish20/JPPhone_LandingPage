import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, CATEGORIES, TABS, getArticle, readingMinutes, type Block } from "@/lib/discover/articles";
import { formatDate } from "@/lib/format";
import { ArrowLeftIcon } from "../../dashboard/icons";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = getArticle((await params).slug);
  return a ? { title: a.title, description: a.summary } : { title: "Not found" };
}

function render(b: Block, i: number) {
  if ("h" in b) return <h2 key={i}>{b.h}</h2>;
  if ("p" in b) return <p key={i}>{b.p}</p>;
  if ("tip" in b)
    return (
      <aside key={i} className="dc-tip">
        {b.tip}
      </aside>
    );
  return (
    <ul key={i}>
      {b.ul.map((li) => (
        <li key={li}>{li}</li>
      ))}
    </ul>
  );
}

export default async function ArticlePage({ params }: Props) {
  const a = getArticle((await params).slug);
  if (!a) notFound();
  const label = a.tab === "tutorial" ? CATEGORIES.find((c) => c.id === a.category)?.label : TABS.find((t) => t.id === a.tab)?.label;
  const related = ARTICLES.filter((x) => x.slug !== a.slug && x.tab === a.tab).slice(0, 3);

  return (
    <article className="dc dc-article">
      <Link href="/discover" className="dd-back">
        <ArrowLeftIcon /> Discover
      </Link>
      <header>
        <span className="dc-banner-tag">{label}</span>
        <h1>{a.title}</h1>
        <p className="muted">
          {formatDate(a.date)} · {readingMinutes(a)} min read
        </p>
      </header>
      <div className="dc-body">{a.body.map(render)}</div>

      {related.length > 0 && (
        <section className="dc-related">
          <h2>Related</h2>
          <ul className="dc-list">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/discover/${r.slug}`} className="dc-item">
                  <span className="dc-thumb" style={{ ["--h" as string]: r.hue }} aria-hidden>
                    {r.glyph}
                  </span>
                  <span className="dc-item-main">
                    <strong>{r.title}</strong>
                    <span className="dc-item-sum">{r.summary}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
