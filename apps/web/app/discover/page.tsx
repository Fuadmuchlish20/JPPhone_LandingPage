import type { Metadata } from "next";
import { ARTICLES, readingMinutes } from "@/lib/discover/articles";
import { getSupportConfig } from "@/lib/support";
import { DiscoverView } from "./discover-view";

export const metadata: Metadata = {
  title: "Discover",
  description: "Tutorials, news and answers for your cloud Android phone.",
};

export default function DiscoverPage() {
  const items = [...ARTICLES]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({ body: _body, ...a }) => ({ ...a, minutes: readingMinutes({ ...a, body: _body }) }));
  return <DiscoverView articles={items} communityUrl={getSupportConfig().discordUrl} />;
}
