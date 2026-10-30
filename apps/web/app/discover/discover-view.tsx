"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, TABS, type Article, type ArticleCategory, type ArticleTab } from "@/lib/discover/articles";
import { formatDate } from "@/lib/format";
import { SearchIcon } from "@/components/ui/icons";

type Item = Omit<Article, "body"> & { minutes: number };

export function DiscoverView({ articles, communityUrl }: { articles: Item[]; communityUrl: string | null }) {
  const [tab, setTab] = useState<ArticleTab>("tutorial");
  const [category, setCategory] = useState<ArticleCategory | "all">("all");
  const [query, setQuery] = useState("");

  const featured = articles.find((a) => a.featured) ?? articles[0];
  const q = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      articles.filter((a) => {
        if (q) return a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q);
        if (a.tab !== tab) return false;
        return tab !== "tutorial" || category === "all" || a.category === category;
      }),
    [articles, tab, category, q],
  );

  return (
    <div className="dc">
      <header className="dc-top">
        <h1>Discover</h1>
        <label className="dc-search">
          <SearchIcon />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search articles" aria-label="Search articles" />
        </label>
      </header>

      {featured && (
        <Link href={`/discover/${featured.slug}`} className="dc-banner">
          <span className="dc-banner-tag">Beginner&apos;s guide</span>
          <strong>{featured.title}</strong>
          <span className="dc-banner-sub">{featured.summary}</span>
          <span className="dc-banner-art" aria-hidden>
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        </Link>
      )}

      <section className="dc-panel">
        <div className="dc-tabsrow">
          <div className="dc-tabs" role="tablist" aria-label="Article type">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={!q && tab === t.id}
                className={!q && tab === t.id ? "is-active" : undefined}
                onClick={() => {
                  setTab(t.id);
                  setQuery("");
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          {communityUrl && (
            <a href={communityUrl} target="_blank" rel="noopener noreferrer" className="dc-community">
              Community
            </a>
          )}
        </div>

        {!q && tab === "tutorial" && (
          <div className="dc-chips" role="group" aria-label="Category">
            <button className={category === "all" ? "is-active" : undefined} onClick={() => setCategory("all")} aria-pressed={category === "all"}>
              All
            </button>
            {CATEGORIES.map((c) => (
              <button key={c.id} className={category === c.id ? "is-active" : undefined} onClick={() => setCategory(c.id)} aria-pressed={category === c.id}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {q && (
          <p className="dc-results">
            {visible.length} result{visible.length === 1 ? "" : "s"} for “{query.trim()}”
          </p>
        )}

        {visible.length === 0 ? (
          <p className="muted dc-empty">No articles here yet.</p>
        ) : (
          <ul className="dc-list">
            {visible.map((a) => (
              <li key={a.slug}>
                <Link href={`/discover/${a.slug}`} className="dc-item">
                  <span className="dc-thumb" style={{ ["--h" as string]: a.hue }} aria-hidden>
                    {a.glyph}
                  </span>
                  <span className="dc-item-main">
                    <strong>{a.title}</strong>
                    <span className="dc-item-sum">{a.summary}</span>
                    <span className="dc-item-meta">
                      {formatDate(a.date)} · {a.minutes} min read
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
