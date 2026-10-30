// Discover articles live in code: edit this file to add or change posts.
// Body blocks keep the renderer tiny: paragraphs, headings, bullet lists and tips.

export type ArticleTab = "tutorial" | "news" | "faq";
export type ArticleCategory = "beginner" | "game" | "troubleshooting" | "other";
export type Block = { h: string } | { p: string } | { ul: string[] } | { tip: string };

export interface Article {
  slug: string;
  title: string;
  summary: string;
  tab: ArticleTab;
  category: ArticleCategory;
  date: string; // YYYY-MM-DD
  hue: number; // thumbnail color
  glyph: string; // thumbnail mark
  featured?: boolean;
  body: Block[];
}

export const TABS: { id: ArticleTab; label: string }[] = [
  { id: "tutorial", label: "Tutorial" },
  { id: "news", label: "News" },
  { id: "faq", label: "FAQ" },
];

export const CATEGORIES: { id: ArticleCategory; label: string }[] = [
  { id: "beginner", label: "Beginner's Guide" },
  { id: "game", label: "Game tutorial" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "other", label: "Other" },
];

export const ARTICLES: Article[] = [
  {
    slug: "getting-started",
    title: "Getting started: create your first cloud phone",
    summary: "Pick a plan, choose a server and Android version, and open your phone in the browser.",
    tab: "tutorial",
    category: "beginner",
    date: "2026-10-20",
    hue: 72,
    glyph: "1",
    featured: true,
    body: [
      { p: "A cloud phone is a real Android device running in our data center. You control it from any browser and it keeps running when you close the tab." },
      { h: "1. Get a plan" },
      { p: "Open My Cloud Phones and press New device. Pick a plan (UVIP to SVIP) — each one sets the CPU, RAM, storage and how many devices you can run. You can also activate a plan with a code under Account → Redeem Code." },
      { h: "2. Choose server and Android version" },
      { p: "Pick the server closest to you for the lowest latency, and the Android version your apps need (10, 12, 13 or 15). The version can't be changed later, so pick the one your game supports." },
      { h: "3. Open your phone" },
      { p: "The device boots in about a minute. When the status shows Running, hover the card and press Enter." },
      { tip: "Your phone keeps running 24/7. Close the tab whenever you like — your apps keep going." },
    ],
  },
  {
    slug: "install-apps-and-games",
    title: "Install games and apps (APK)",
    summary: "Upload an APK from your computer or download it inside Android.",
    tab: "tutorial",
    category: "beginner",
    date: "2026-10-20",
    hue: 140,
    glyph: "APK",
    body: [
      { h: "Upload from your computer" },
      { ul: ["Open your device.", "Press Install APK in the toolbar.", "Pick an .apk file (up to 500 MB). It installs automatically and appears on the home screen."] },
      { h: "Download inside Android" },
      { p: "Open the browser on the cloud phone, download the APK from the developer's site and tap it to install. Allow installs from unknown sources when Android asks." },
      { tip: "Google Play isn't preinstalled. Only install APKs from sources you trust." },
    ],
  },
  {
    slug: "control-your-cloud-phone",
    title: "Control your cloud phone with mouse and keyboard",
    summary: "Tap, swipe, type, paste and use the Android buttons from your browser.",
    tab: "tutorial",
    category: "beginner",
    date: "2026-10-19",
    hue: 210,
    glyph: "⌨",
    body: [
      { ul: ["Click = tap, click and drag = swipe, mouse wheel = scroll.", "Type with your keyboard. Ctrl+V pastes text from your computer into the phone.", "Side buttons: Back, Home, Recent apps, volume, power, rotate and notifications.", "Fullscreen and Screenshot are in the top bar."] },
      { h: "Smooth stream on slow connections" },
      { p: "Lower the bitrate or frame rate in the top bar. The latency badge shows the round-trip time to the server." },
    ],
  },
  {
    slug: "afk-farming-24-7",
    title: "Keep games farming 24/7 (AFK tips)",
    summary: "Set up idle and MMO games so they keep running while you're away.",
    tab: "tutorial",
    category: "game",
    date: "2026-10-18",
    hue: 30,
    glyph: "AFK",
    body: [
      { p: "Your device runs around the clock, so auto-battle and idle games keep progressing after you close the tab." },
      { ul: ["Turn on the game's auto-battle or auto-quest before leaving.", "Disable battery saver or 'pause when inactive' options inside the game.", "Use one device per account — plans with more devices let you farm several accounts at once.", "Pick MVIP or SVIP for heavy 3D MMOs."] },
      { tip: "Check Subscriptions for remaining days — devices stop when the plan expires." },
    ],
  },
  {
    slug: "multiple-accounts",
    title: "Run several game accounts at the same time",
    summary: "Use multiple devices, batch actions and groups to manage many accounts.",
    tab: "tutorial",
    category: "game",
    date: "2026-10-17",
    hue: 280,
    glyph: "×4",
    body: [
      { p: "Each cloud phone is a separate Android, so every device can log in to a different account." },
      { ul: ["Create one device per account (up to your plan's limit).", "Name devices after the account, e.g. 'Farm 1', 'Farm 2'.", "Select several cards and use Start / Stop / Restart selected to manage them together."] },
    ],
  },
  {
    slug: "device-wont-start",
    title: "My device won't start or shows Error",
    summary: "What to do when a device is stuck booting or reports an error.",
    tab: "tutorial",
    category: "troubleshooting",
    date: "2026-10-19",
    hue: 0,
    glyph: "!",
    body: [
      { ul: ["Check Subscriptions — expired plans can't start devices. Renew, then press Power on.", "Press Restart on the device card.", "If it keeps failing, Factory reset (this erases apps and data).", "Still stuck? Contact Support with the device name."] },
    ],
  },
  {
    slug: "no-sound",
    title: "There's no sound from my cloud phone",
    summary: "Audio requirements and quick checks.",
    tab: "tutorial",
    category: "troubleshooting",
    date: "2026-10-19",
    hue: 190,
    glyph: "♪",
    body: [
      { p: "Audio streaming needs Android 11 or newer. Devices on Android 10 play without sound." },
      { ul: ["Make sure the browser tab isn't muted.", "Click inside the screen once — browsers only allow sound after you interact with the page."] },
    ],
  },
  {
    slug: "redeem-codes",
    title: "How to use a redeem code",
    summary: "Activate a plan or add days with a code.",
    tab: "tutorial",
    category: "other",
    date: "2026-10-21",
    hue: 72,
    glyph: "#",
    body: [
      { ul: ["Go to Account → Redeem Code.", "Choose Add New Cloud Phone for plan codes, or Renew Cloud Phone for renewal codes.", "Enter the code and press Redeem."] },
      { p: "Renewals extend every device on your plan. Each code can be used once per account." },
    ],
  },
  {
    slug: "android-versions-available",
    title: "Android 10, 12, 13 and 15 are now available",
    summary: "Pick the Android version your games need when creating a device.",
    tab: "news",
    category: "other",
    date: "2026-10-20",
    hue: 120,
    glyph: "15",
    body: [
      { p: "You can now choose between Android 10, 12, 13 and 15 when you create a cloud phone." },
      { ul: ["Android 10: best for older games.", "Android 12 / 13: widest app compatibility.", "Android 15: the newest apps and features."] },
      { tip: "Android 10 devices stream without sound (audio needs Android 11+)." },
    ],
  },
  {
    slug: "redeem-codes-launched",
    title: "Redeem codes, order history and messages are live",
    summary: "New Account pages to manage your plan.",
    tab: "news",
    category: "other",
    date: "2026-10-21",
    hue: 50,
    glyph: "NEW",
    body: [
      { p: "Activate plans or add days with redeem codes, see every purchase under Order History, and get notified about your plan under Messages." },
    ],
  },
  {
    slug: "faq-data-safety",
    title: "Is my data kept when my plan expires?",
    summary: "What happens to your apps and files after expiry.",
    tab: "faq",
    category: "other",
    date: "2026-10-20",
    hue: 160,
    glyph: "?",
    body: [
      { p: "When your plan expires your devices are stopped, but apps and data stay on the device. Renew and press Power on to continue where you left off." },
      { p: "Deleting a device or doing a Factory reset erases its data permanently." },
    ],
  },
  {
    slug: "faq-change-android",
    title: "Can I change the Android version of a device?",
    summary: "Android versions are fixed per device.",
    tab: "faq",
    category: "other",
    date: "2026-10-20",
    hue: 230,
    glyph: "?",
    body: [
      { p: "No — the version is chosen when the device is created. To switch, create a new device with the version you want (and delete the old one if you need the slot)." },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function readingMinutes(a: Article): number {
  const words = a.body
    .map((b) => ("p" in b ? b.p : "h" in b ? b.h : "tip" in b ? b.tip : b.ul.join(" ")))
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
