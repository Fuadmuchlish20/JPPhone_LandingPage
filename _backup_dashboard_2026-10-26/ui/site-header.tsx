"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { COMMON } from "@/lib/i18n/common";
import { LOCALES, LOCALE_LABELS, dirOf, langTag, localeFromPath, localeHome, type Locale } from "@/lib/i18n/config";
import { Logo } from "./logo";

type Me = { email: string; is_admin: boolean } | null;

// Signed-in state is fetched in the browser so every page (incl. the static homepage) can stay static.
let mePromise: Promise<Me> | null = null;
function loadMe(): Promise<Me> {
  mePromise ??= fetch("/api/me", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { profile: null }))
    .then((d: { profile: Me }) => d.profile)
    .catch(() => null);
  return mePromise;
}

export function SiteHeader() {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  const t = COMMON[locale].nav;
  const [me, setMe] = useState<Me | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    void loadMe().then((m) => alive && setMe(m));
    return () => {
      alive = false;
    };
  }, []);

  // Keep <html lang/dir> in step with the page language (root layout defaults to "en").
  useEffect(() => {
    document.documentElement.lang = langTag(locale);
    document.documentElement.dir = dirOf(locale);
  }, [locale]);

  return (
    <header className="site-header">
      <div className="container">
        <Link href={localeHome(locale)} className="logo" aria-label="Comodophone home">
          <Logo />
        </Link>
        <nav className="nav">
          <Link href="/pricing">{t.pricing}</Link>
          <Link href="/discover">{t.discover}</Link>
          {me && <Link href="/dashboard">{t.devices}</Link>}
          {me?.is_admin && <Link href="/admin">{t.admin}</Link>}
        </nav>
        <span className="spacer" />

        <LanguageMenu locale={locale} label={t.language} />

        {me === undefined ? (
          <div className="row header-auth-wait" aria-hidden />
        ) : me ? (
          <form action="/auth/signout" method="post" className="row">
            <span className="muted hide-sm" style={{ fontSize: 13 }}>
              {me.email}
            </span>
            <button className="btn btn-sm btn-ghost" type="submit">
              {t.signOut}
            </button>
          </form>
        ) : (
          <div className="row">
            <Link className="btn btn-sm btn-ghost" href="/login">
              {t.login}
            </Link>
            <Link className="btn btn-sm btn-primary" href="/register">
              {t.getPhone}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

/** Language dropdown: links to each localized homepage (crawlable, works as plain links). */
function LanguageMenu({ locale, label }: { locale: Locale; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lang-menu" ref={ref}>
      <button className="lang-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="true" aria-label={`${label}: ${LOCALE_LABELS[locale].name}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>
        <span className="lang-name">{LOCALE_LABELS[locale].name}</span>
        <span className="lang-code">{LOCALE_LABELS[locale].short}</span>
        <svg className="lang-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul className="lang-list">
          {LOCALES.map((l) => (
            <li key={l}>
              <Link
                href={localeHome(l)}
                hrefLang={langTag(l)}
                lang={langTag(l)}
                onClick={() => setOpen(false)}
                aria-current={l === locale ? "true" : undefined}
                className={l === locale ? "is-active" : undefined}
              >
                <span>{LOCALE_LABELS[l].name}</span>
                <em>{LOCALE_LABELS[l].short}</em>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
