import { getSupportConfig } from "@/lib/support";
import { SiteFooterContent } from "./site-footer-content";

/** Site-wide footer; hidden on full-screen app pages via CSS (see .site-footer in globals.css). */
export function SiteFooter() {
  const { discordUrl, supportEmail } = getSupportConfig();
  return <SiteFooterContent discordUrl={discordUrl} supportEmail={supportEmail} />;
}
