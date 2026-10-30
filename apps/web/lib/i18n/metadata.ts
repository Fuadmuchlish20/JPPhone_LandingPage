import type { Metadata } from "next";
import { LOCALES, LOCALE_LABELS, langTag, localeHome, type Locale } from "./config";
import { HOME } from "./home";

/** Metadata for one locale, with hreflang links to every language version. */
export function homeMetadata(locale: Locale): Metadata {
  const t = HOME[locale];
  const url = localeHome(locale);
  return {
    title: { absolute: t.meta.title },
    description: t.meta.description,
    keywords: t.meta.keywords,
    alternates: {
      canonical: url,
      languages: { ...Object.fromEntries(LOCALES.map((l) => [langTag(l), localeHome(l)])), "x-default": "/" },
    },
    openGraph: {
      type: "website",
      url,
      siteName: "JPPhone",
      title: t.meta.title,
      description: t.meta.description,
      locale: LOCALE_LABELS[locale].og,
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => LOCALE_LABELS[l].og),
    },
    twitter: { card: "summary_large_image", title: t.meta.title, description: t.meta.description },
    robots: { index: true, follow: true },
  };
}
