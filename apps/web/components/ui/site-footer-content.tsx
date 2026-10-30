"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMMON } from "@/lib/i18n/common";
import { LOCALES, LOCALE_LABELS, langTag, localeFromPath, localeHome } from "@/lib/i18n/config";
import { dashboardHref } from "@/lib/dashboard-url";
import { PAYMENT_METHODS } from "@/lib/wallet/topup";
import { LogoMark } from "./logo";

/** Footer markup; labels follow the page language (read from the URL). */
export function SiteFooterContent({ discordUrl, supportEmail }: { discordUrl: string | null; supportEmail: string | null }) {
  const locale = localeFromPath(usePathname());
  const t = COMMON[locale].footer;
  const home = localeHome(locale);

  const columns: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
    {
      title: t.product,
      links: [
        { label: COMMON[locale].nav.pricing, href: "/pricing" },
        { label: t.myPhones, href: dashboardHref() },
        { label: t.redeem, href: dashboardHref("/redeem") },
        { label: t.topup, href: dashboardHref("/wallet/topup") },
      ],
    },
    {
      title: t.help,
      links: [
        { label: t.gettingStarted, href: "/discover/getting-started" },
        { label: t.installApps, href: "/discover/install-apps-and-games" },
        { label: t.faq, href: `${home === "/" ? "" : home}/#faq` },
        { label: t.support, href: dashboardHref("/support") },
        ...(supportEmail ? [{ label: supportEmail, href: `mailto:${supportEmail}`, external: true }] : []),
      ],
    },
    {
      title: t.company,
      links: [
        { label: COMMON[locale].nav.discover, href: "/discover" },
        { label: t.news, href: "/discover/android-versions-available" },
        ...(discordUrl ? [{ label: t.discord, href: discordUrl, external: true }] : []),
      ],
    },
  ];

  return (
    <footer className="site-footer">
      <div className="container sf-top">
        <div className="sf-brand">
          <Link href={home} className="logo sf-logo" aria-label="JPPhone home">
            <LogoMark size={38} />
            <span className="logo-word">
              JP<span>Phone</span>
            </span>
          </Link>
          <p>{t.tagline}</p>
          <Link href="/register" className="sf-cta">
            {t.cta}
          </Link>
        </div>

        {columns.map((col) => (
          <nav key={col.title} className="sf-col" aria-label={col.title}>
            <h2>{col.title}</h2>
            <ul>
              {col.links.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href}>{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="container sf-pay">
        <span>{t.accept}</span>
        <ul>
          {PAYMENT_METHODS.map((m) => (
            <li key={m.id} style={{ ["--c" as string]: m.color }}>
              {m.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="container sf-bottom">
        <span>
          © {new Date().getFullYear()} JPPhone. {t.rights}
        </span>
        <nav className="sf-langs" aria-label={COMMON[locale].nav.language}>
          {LOCALES.map((l) => (
            <Link key={l} href={localeHome(l)} hrefLang={langTag(l)} lang={langTag(l)} className={l === locale ? "is-active" : undefined}>
              {LOCALE_LABELS[l].name}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
