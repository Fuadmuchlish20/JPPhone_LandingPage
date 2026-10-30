import "server-only";

export interface SupportConfig {
  /** Live chat link (WhatsApp, Telegram, Crisp, …). Falls back to mailto:supportEmail. */
  chatUrl: string | null;
  supportEmail: string | null;
  businessEmail: string | null;
  discordUrl: string | null;
}

const clean = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

/** Contact channels for Account → Support; any unset channel is hidden. */
export function getSupportConfig(): SupportConfig {
  const supportEmail = clean(process.env.SUPPORT_EMAIL);
  return {
    chatUrl: clean(process.env.SUPPORT_CHAT_URL) ?? (supportEmail ? `mailto:${supportEmail}` : null),
    supportEmail,
    businessEmail: clean(process.env.BUSINESS_EMAIL),
    discordUrl: clean(process.env.DISCORD_URL),
  };
}
