import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/ui/site-footer";
import { SiteHeader } from "@/components/ui/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "JPPhone — Android Cloud Phone for AFK & Gaming", template: "%s · JPPhone" },
  description:
    "Rent an Android cloud phone that runs 24/7. Play and farm multiple games from any browser — no install, no battery drain.",
  applicationName: "JPPhone",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
