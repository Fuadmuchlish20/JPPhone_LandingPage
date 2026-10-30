import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ACCOUNT_SECTIONS, type AccountSection } from "../account-menu";
import { ArrowLeftIcon } from "../icons";

type Props = { params: Promise<{ section: string }> };

function lookup(section: string) {
  return Object.hasOwn(ACCOUNT_SECTIONS, section) ? ACCOUNT_SECTIONS[section as AccountSection] : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = lookup((await params).section);
  return { title: s?.label ?? "Not found" };
}

export default async function AccountSectionPage({ params }: Props) {
  await requireUser();
  const s = lookup((await params).section);
  if (!s) notFound();
  const Icon = s.icon;

  return (
    <section className="dd-section">
      <Link href="/dashboard" className="dd-back">
        <ArrowLeftIcon /> Back to devices
      </Link>
      <div className="dd-soon">
        <span className="dd-soon-icon">
          <Icon />
        </span>
        <h1>{s.label}</h1>
        <p className="muted">{s.body}</p>
        <span className="dd-soon-tag">Coming soon</span>
      </div>
    </section>
  );
}
