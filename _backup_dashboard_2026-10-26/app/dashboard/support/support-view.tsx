import Link from "next/link";
import type { SupportConfig } from "@/lib/support";
import { AccountShell } from "../account-shell";
import { ChevronDownIcon, HeadsetIcon, MessageIcon } from "../icons";

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "How to install a game or app",
    a: (
      <>
        Open your device and press <b>Install APK</b> in the toolbar, then pick an <code>.apk</code> file (up to 500 MB). You can also
        download APKs with the browser inside Android. Google Play isn&apos;t preinstalled.
      </>
    ),
  },
  {
    q: "How to control the cloud phone",
    a: (
      <>
        Click to tap, click and drag to swipe, and use the mouse wheel to scroll. Type with your keyboard; <b>Ctrl+V</b> pastes text from
        your computer. The side buttons give you Back, Home, Recent apps, volume, power, rotate and notifications. Lower the bitrate or
        frame rate if your connection is slow.
      </>
    ),
  },
  {
    q: "How to restart, reset or delete a cloud phone",
    a: (
      <>
        Use the icons under each device on <b>My Cloud Phones</b>. <b>Restart</b> reboots Android and keeps your data. <b>Factory reset</b>{" "}
        erases all apps and data. <b>Delete</b> removes the device permanently and frees a slot on your plan.
      </>
    ),
  },
  {
    q: "Why did my device stop?",
    a: (
      <>
        Devices stop when your plan expires. Your apps and data are kept — renew your plan (for example with a renewal code under{" "}
        <b>Redeem Code</b>) and press <b>Power on</b>.
      </>
    ),
  },
  {
    q: "How to renew or add more time",
    a: (
      <>
        Go to <b>Subscriptions</b> to see your remaining days, or redeem a renewal code under <b>Redeem Code → Renew cloud phone</b>.
        Renewing extends every device on your plan.
      </>
    ),
  },
  {
    q: "There's no sound on my device",
    a: (
      <>
        Audio streaming needs Android 11 or newer, so Android 10 devices play without sound. Also check that your browser tab
        isn&apos;t muted.
      </>
    ),
  },
];

export function SupportView({ config, backHref }: { config: SupportConfig; backHref?: string }) {
  const external = (url: string) => !url.startsWith("mailto:");

  return (
    <AccountShell title="Support" backHref={backHref}>
      <div className="sp">
        {config.chatUrl && (
          <a
            href={config.chatUrl}
            className="sp-card sp-chat"
            {...(external(config.chatUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            <span className="sp-icon">
              <HeadsetIcon />
            </span>
            <span className="sp-text">
              <strong>Online customer service</strong>
              <small>Questions about devices, billing or your account</small>
            </span>
          </a>
        )}

        {config.businessEmail && (
          <a href={`mailto:${config.businessEmail}`} className="sp-card sp-business">
            <span className="sp-icon">
              <MessageIcon />
            </span>
            <span className="sp-text">
              <strong>Business Cooperation</strong>
              <small>{config.businessEmail}</small>
            </span>
          </a>
        )}

        {config.discordUrl && (
          <section className="sp-community">
            <h2>Community</h2>
            <a href={config.discordUrl} target="_blank" rel="noopener noreferrer" className="sp-discord">
              <DiscordIcon />
              Discord
            </a>
          </section>
        )}

        {!config.chatUrl && !config.businessEmail && !config.discordUrl && (
          <p className="muted sp-none">Contact channels haven&apos;t been set up yet.</p>
        )}

        <section className="sp-faq">
          <h2>FAQ</h2>
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>
                {f.q}
                <ChevronDownIcon />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
          {config.supportEmail && (
            <p className="sp-more">
              Still stuck? Email <Link href={`mailto:${config.supportEmail}`}>{config.supportEmail}</Link>
            </p>
          )}
        </section>
      </div>
    </AccountShell>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.6 5.3A16.6 16.6 0 0 0 15.5 4l-.5 1a15.4 15.4 0 0 0-6 0L8.5 4a16.6 16.6 0 0 0-4.1 1.3C1.8 9.2 1.1 13 1.4 16.7a16.8 16.8 0 0 0 5.1 2.6l1.1-1.7c-.6-.2-1.2-.5-1.7-.9l.4-.3a11.9 11.9 0 0 0 11.4 0l.4.3c-.5.4-1.1.7-1.7.9l1.1 1.7a16.7 16.7 0 0 0 5.1-2.6c.4-4.3-.7-8-2.9-11.4zM8.7 14.5c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z" />
    </svg>
  );
}
