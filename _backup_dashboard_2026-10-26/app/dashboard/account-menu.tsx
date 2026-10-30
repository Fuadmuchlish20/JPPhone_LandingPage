import Link from "next/link";
import {
  BookIcon,
  CardIcon,
  ChevronRightIcon,
  GiftIcon,
  HeadsetIcon,
  LogoutIcon,
  MessageIcon,
  PlanetIcon,
  ReceiptIcon,
  TicketIcon,
} from "./icons";

// Sections without a real page yet render the "coming soon" page at /dashboard/[section].
export const ACCOUNT_SECTIONS = {
  rewards: { label: "Rewards", icon: GiftIcon, body: "Earn free device time by checking in daily and inviting friends." },
  guide: { label: "Function Introduction", icon: BookIcon, body: "A tour of every feature: multi-device control, batch actions, APK install and more." },
} as const;

export type AccountSection = keyof typeof ACCOUNT_SECTIONS;

type Item = { href: string; demoHref?: string; label: string; icon: () => React.ReactElement; badge?: "unread" };

const ITEMS: Item[] = [
  { href: "/dashboard/rewards", label: ACCOUNT_SECTIONS.rewards.label, icon: GiftIcon },
  { href: "/dashboard/redeem", demoHref: "/demo/redeem", label: "Redeem Code", icon: TicketIcon },
  { href: "/dashboard/subscriptions", demoHref: "/demo/subscriptions", label: "Subscriptions", icon: CardIcon },
  { href: "/dashboard/messages", demoHref: "/demo/messages", label: "Messages", icon: MessageIcon, badge: "unread" },
  { href: "/dashboard/orders", demoHref: "/demo/orders", label: "Order History", icon: ReceiptIcon },
  { href: "/discover", label: "Discover", icon: PlanetIcon },
  { href: "/dashboard/support", demoHref: "/demo/support", label: "Support", icon: HeadsetIcon },
  { href: "/dashboard/guide", label: ACCOUNT_SECTIONS.guide.label, icon: BookIcon },
];

export function AccountMenu({ unread = 0, demo }: { unread?: number; demo?: boolean }) {
  return (
    <nav className="dd-menu" aria-label="Account">
      <span className="dd-groups-title">Account</span>
      <ul>
        {ITEMS.map(({ href, demoHref, label, icon: Icon, badge }) => (
          <li key={href}>
            <Link href={(demo && demoHref) || href} className="dd-menu-item">
              <Icon />
              <span>{label}</span>
              {badge === "unread" && unread > 0 && (
                <em className="dd-menu-badge" aria-label={`${unread} unread`}>
                  {unread > 99 ? "99+" : unread}
                </em>
              )}
              <ChevronRightIcon />
            </Link>
          </li>
        ))}
        <li>
          <form action="/auth/signout" method="post">
            <button type="submit" className="dd-menu-item">
              <LogoutIcon />
              <span>Sign Out</span>
              <ChevronRightIcon />
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
