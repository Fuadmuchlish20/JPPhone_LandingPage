import type { Metadata } from "next";
import { homeMetadata } from "@/lib/i18n/metadata";
import LocalizedHome from "./[lang]/page";

// English homepage at "/": same page as /id and /de, rendered with lang "en".
export const dynamic = "force-static";
export const metadata: Metadata = homeMetadata("en");

export default function HomePage() {
  return <LocalizedHome params={Promise.resolve({ lang: "en" })} />;
}
