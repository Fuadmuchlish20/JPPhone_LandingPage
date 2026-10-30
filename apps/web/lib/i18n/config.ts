// Locales for the marketing pages. English lives at "/", the others at "/<locale>".
export const LOCALES = ["en", "id", "de", "es", "fr", "it", "nl", "pt", "fil", "tr", "th", "vi", "tw", "ko", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** short: button label · name: native name · og: Open Graph locale · tag: BCP 47 code for hreflang/lang (defaults to the URL code) */
export const LOCALE_LABELS: Record<Locale, { short: string; name: string; og: string; tag?: string }> = {
  en: { short: "EN", name: "English", og: "en_US" },
  id: { short: "ID", name: "Bahasa Indonesia", og: "id_ID" },
  de: { short: "DE", name: "Deutsch", og: "de_DE" },
  es: { short: "ES", name: "Español", og: "es_ES" },
  fr: { short: "FR", name: "Français", og: "fr_FR" },
  it: { short: "IT", name: "Italiano", og: "it_IT" },
  nl: { short: "NL", name: "Nederlands", og: "nl_NL" },
  pt: { short: "PT", name: "Português", og: "pt_BR" },
  fil: { short: "FIL", name: "Filipino", og: "tl_PH" },
  tr: { short: "TR", name: "Türkçe", og: "tr_TR" },
  th: { short: "TH", name: "ไทย", og: "th_TH" },
  vi: { short: "VI", name: "Tiếng Việt", og: "vi_VN" },
  tw: { short: "TW", name: "繁體中文", og: "zh_TW", tag: "zh-TW" },
  ko: { short: "KO", name: "한국어", og: "ko_KR" },
  ar: { short: "AR", name: "العربية", og: "ar_AR" },
};

/** Language tag for hreflang, <html lang> and JSON-LD (e.g. "zh-TW" for the /tw pages). */
export function langTag(locale: Locale): string {
  return LOCALE_LABELS[locale].tag ?? locale;
}

/** Right-to-left scripts. */
export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function isLocale(v: string | undefined): v is Locale {
  return !!v && (LOCALES as readonly string[]).includes(v);
}

/** "/" for English, "/id", "/de" otherwise. */
export function localeHome(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "/" : `/${locale}`;
}

/** Locale from a pathname such as "/id/..." (falls back to English). */
export function localeFromPath(pathname: string | null): Locale {
  const seg = pathname?.split("/")[1];
  return isLocale(seg) ? seg : DEFAULT_LOCALE;
}
