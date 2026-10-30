import type { Locale } from "./config";
import { es, fr, it, nl, th, vi } from "./home-extra";
import { ar, fil, pt } from "./home-extra2";
import { ko, tr, tw } from "./home-extra3";

type QA = { q: string; a: string };
type TitleBody = { title: string; body: string };

/** All homepage copy. Product names (UVIP…SVIP), game names and the dashboard mockup stay in English. */
export interface HomeDict {
  meta: { title: string; description: string; keywords: string[] };
  hero: {
    line1: string;
    for: string;
    accent: string;
    lead: string;
    features: string[];
    cta: string;
    worksOn: string;
    noInstall: string;
    hosting: string;
    autoSub: string;
    multi: string;
    multiSub: string;
  };
  why: {
    before: string;
    /** text after the brand, for languages that put it last (e.g. Korean) */
    after?: string;
    items: TitleBody[];
    deviceRunning: string;
    uptimeToday: string;
    daysAgo: string;
    online: string;
    today: string;
    wallet: string;
    confirm: string;
    connected: string;
  };
  plans: {
    before: string;
    accent: string;
    hot: string;
    servers: string;
    system: string;
    cores: string;
    perDays: (days: number) => string;
    play: string;
    show: (from: number, to: number) => string;
    taglines: Record<string, string>;
  };
  games: { line1: string; accent: string; p1: string; cta: string; shotAlt: string };
  features: { before: string; accent: string; intro: string; items: TitleBody[] };
  how: { before: string; accent: string; steps: TitleBody[] };
  reviews: { before: string; accent: string; stat: string; intro: string };
  board: { title: string; sub: string; flag: (country: string) => string };
  devices: { before: string; accent: string; sub: string; cta: string; plans: string };
  faq: { before: string; accent: string; items: QA[] };
  /** English place name → localized name */
  places: Record<string, string>;
}

const en: HomeDict = {
  meta: {
    title: "Android Cloud Phone for AFK & Gaming — JPPhone",
    description:
      "Run multiple games in the cloud phone online with 24/7 uptime, no lag and zero downtime. Multi-Device Operations, 100% Native Android OS, global servers, low latency.",
    keywords: ["cloud phone", "android cloud phone", "cloud android", "android emulator online", "afk farming", "auto farming", "cloud gaming phone", "multi instance android"],
  },
  hero: {
    line1: "Android Cloud Phone",
    for: "for",
    accent: "AFK & Gaming",
    lead: "Run multiple games in the cloud phone online with 24/7 uptime, no lag and zero downtime.",
    features: ["100% Native Android OS", "Multi-Device Operations", "Auto Farming & Grinding", "Cross-Platform Access", "Global servers, low latency"],
    cta: "Play Now",
    worksOn: "Works on",
    noInstall: "No install",
    hosting: "24/7 HOSTING",
    autoSub: "farming / grinding",
    multi: "MULTI-DEVICE",
    multiSub: "operation",
  },
  why: {
    before: "Why Choose",
    items: [
      {
        title: "Run Multiple Games with No Lag",
        body: "With JPPhone, you can play multiple Android games, manage multiple gaming accounts, automate farming, and stay AFK without keeping your own phone running.",
      },
      {
        title: "24/7 Cloud Online",
        body: "Your cloud phone will run 24/7 with no lag and no server errors. Your games keep farming in the data center around the clock.",
      },
      {
        title: "Global Server, Low-Latency, Stable",
        body: "Pick the region near to you to get low latency and speed gaming farming. Servers in Jakarta, Singapore, Vietnam, Thailand, Hong Kong, Taiwan, Tokyo, Frankfurt and US.",
      },
      {
        title: "Multiple Payment Methods",
        body: "Top up your subscriptions with Dana, QRIS, Visa, Mastercard and more. Your wallet balance can pay for any plan or renewal in one click.",
      },
      {
        title: "Cross-Platform Accessibility",
        body: "With JPPhone, you can access your virtual Android device across multiple platforms, whether you're using an Android APK, Windows PC, web browser, or iOS device.",
      },
    ],
    deviceRunning: "Device running · browser closed",
    uptimeToday: "uptime today",
    daysAgo: "30 days ago",
    online: "99.9% online",
    today: "today",
    wallet: "Wallet Balance",
    confirm: "Confirm payment",
    connected: "Connected",
  },
  plans: {
    before: "Multiple Device Models,",
    accent: "Fast Performance",
    hot: "Hot Recommendation",
    servers: "Servers",
    system: "System Version",
    cores: "Cores",
    perDays: (d) => ` / ${d} days`,
    play: "Play Now",
    show: (a, b) => `Show plans ${a} to ${b}`,
    taglines: {
      uvip: "Popular games support, smooth experience",
      gvip: "Bigger RAM, 24/7 AFK",
      kvip: "Cost effective, smooth AFK",
      mvip: "Higher performance, stable AFK",
      svip: "Premium RAM, stable AFK",
    },
  },
  games: {
    line1: "Play a Variety of Games",
    accent: "Earn 24/7 Profits",
    p1: "Play a variety of games and earn 24/7 with JPPhone. Run your favorite mobile games in the cloud, automate farming and grinding, and keep progress going even when your device is offline — from Blox Fruits and Fisch to Steal a Brainrot and Steal an Egg.",
    cta: "Start Farming",
    shotAlt: "play on an Android cloud phone",
  },
  features: {
    before: "Supporting",
    accent: "Features",
    intro: "A Wide Range of Features to Meet Different User Needs",
    items: [
      { title: "Virtual Environment", body: "Simulates a realistic phone environment." },
      { title: "Device Manager", body: "Modify device attributes and more." },
      { title: "App Downloads", body: "Download apps directly to your cloud phone." },
      { title: "File Import", body: "Import files and APKs to your cloud phone." },
      { title: "Camera", body: "Scan QR codes and support facial recognition verification." },
      { title: "Audio", body: "Send voice messages within apps." },
    ],
  },
  how: {
    before: "How",
    accent: "It Works",
    steps: [
      { title: "Choose a plan", body: "Pick UVIP, GVIP, KVIP, MVIP or SVIP depending on how heavy your games are and how many devices you need." },
      { title: "Create your cloud phone", body: "Select a server near you and your Android version (10, 12, 13 or 15). Your device boots in about a minute." },
      { title: "Play and farm 24/7", body: "Open the phone in your browser, install your games and leave them running — even after you close the tab." },
    ],
  },
  reviews: {
    before: "JPPhone Receives",
    accent: "Rave Reviews",
    stat: "Trusted by gamers & farmers worldwide",
    intro:
      "Players use JPPhone to keep idle games running overnight, manage several accounts at once and play mobile games on a big screen without draining their phones.",
  },
  board: { title: "Internationally Leading Cloud Phone Platform", sub: "Most Active Player Regions", flag: (c) => `${c} flag` },
  devices: {
    before: "Play on",
    accent: "Any Device",
    sub: "No client to download. Open your cloud phones from any browser on desktop, tablet or mobile and continue exactly where you left off.",
    cta: "Get Your Cloud Phone",
    plans: "See Plans",
  },
  faq: {
    before: "Frequently Asked",
    accent: "Questions",
    items: [
      {
        q: "What is a cloud phone?",
        a: "A cloud phone is a real Android device that runs in a data center instead of in your pocket. You see its screen and control it from your browser, while the phone itself keeps running 24/7.",
      },
      {
        q: "Is JPPhone an Android emulator?",
        a: "No local emulator is needed. Your Android runs on our servers, so it doesn't use your computer's CPU, RAM or battery, and it keeps running when your PC is off.",
      },
      {
        q: "Can I run several games or accounts at once?",
        a: "Yes. Every plan includes one or more devices, and each device is a separate Android phone — ideal for running multiple game accounts or farming several games at the same time.",
      },
      { q: "Which devices can I use to control my cloud phone?", a: "Any modern browser on Windows, macOS, Linux, Android or iOS. There is nothing to install." },
      { q: "Which Android versions are available?", a: "You can choose Android 10, 12, 13 or 15 when you create a device. Pick the version your games support." },
      {
        q: "How do I pay?",
        a: "Top up your wallet with e-wallets, QRIS or cards and use the balance to buy or renew any plan. You can also activate plans with redeem codes.",
      },
    ],
  },
  places: {},
};

const id: HomeDict = {
  meta: {
    title: "HP Android Cloud untuk AFK & Gaming — JPPhone",
    description:
      "Jalankan banyak game di HP cloud online 24/7 tanpa lag dan tanpa downtime. Multi-device, 100% Android asli, server global dengan latensi rendah.",
    keywords: ["cloud phone", "hp cloud android", "android cloud", "emulator android online", "afk farming", "auto farming", "hp cloud gaming", "multi instance android"],
  },
  hero: {
    line1: "HP Android Cloud",
    for: "untuk",
    accent: "AFK & Gaming",
    lead: "Jalankan banyak game di HP cloud online 24/7, tanpa lag dan tanpa downtime.",
    features: ["100% Android OS Asli", "Operasi Multi-Device", "Auto Farming & Grinding", "Akses Lintas Platform", "Server global, latensi rendah"],
    cta: "Main Sekarang",
    worksOn: "Bisa dipakai di",
    noInstall: "Tanpa instal",
    hosting: "HOSTING 24/7",
    autoSub: "farming / grinding",
    multi: "MULTI-DEVICE",
    multiSub: "operasi",
  },
  why: {
    before: "Kenapa Pilih",
    items: [
      {
        title: "Main Banyak Game Tanpa Lag",
        body: "Dengan JPPhone, kamu bisa main banyak game Android, mengelola banyak akun game, mengotomatiskan farming, dan tetap AFK tanpa harus menyalakan HP sendiri.",
      },
      {
        title: "Online 24/7 di Cloud",
        body: "HP cloud kamu berjalan 24/7 tanpa lag dan tanpa error server. Game kamu tetap farming di data center sepanjang waktu.",
      },
      {
        title: "Server Global, Latensi Rendah, Stabil",
        body: "Pilih region terdekat untuk latensi rendah dan farming yang lebih cepat. Server di Jakarta, Singapura, Vietnam, Thailand, Hong Kong, Taiwan, Tokyo, Frankfurt, dan AS.",
      },
      {
        title: "Banyak Metode Pembayaran",
        body: "Isi saldo langganan dengan DANA, QRIS, Visa, Mastercard, dan lainnya. Saldo wallet bisa dipakai untuk beli atau perpanjang plan dalam satu klik.",
      },
      {
        title: "Akses Lintas Platform",
        body: "Dengan JPPhone, kamu bisa mengakses perangkat Android virtual dari berbagai platform, baik lewat APK Android, PC Windows, browser web, maupun perangkat iOS.",
      },
    ],
    deviceRunning: "Perangkat aktif · browser ditutup",
    uptimeToday: "uptime hari ini",
    daysAgo: "30 hari lalu",
    online: "99,9% online",
    today: "hari ini",
    wallet: "Saldo Wallet",
    confirm: "Konfirmasi pembayaran",
    connected: "Terhubung",
  },
  plans: {
    before: "Banyak Model Perangkat,",
    accent: "Performa Cepat",
    hot: "Paling Direkomendasikan",
    servers: "Server",
    system: "Versi Sistem",
    cores: "Core",
    perDays: (d) => ` / ${d} hari`,
    play: "Main Sekarang",
    show: (a, b) => `Tampilkan plan ${a} sampai ${b}`,
    taglines: {
      uvip: "Mendukung game populer, pengalaman lancar",
      gvip: "RAM lebih besar, AFK 24/7",
      kvip: "Hemat biaya, AFK lancar",
      mvip: "Performa lebih tinggi, AFK stabil",
      svip: "RAM premium, AFK stabil",
    },
  },
  games: {
    line1: "Mainkan Berbagai Game",
    accent: "Cuan 24/7",
    p1: "Mainkan berbagai game dan cuan 24/7 dengan JPPhone. Jalankan game mobile favoritmu di cloud, otomatiskan farming dan grinding, dan progres tetap jalan walau perangkatmu offline — dari Blox Fruits dan Fisch sampai Steal a Brainrot dan Steal an Egg.",
    cta: "Mulai Farming",
    shotAlt: "main di HP Android cloud",
  },
  features: {
    before: "Fitur",
    accent: "Pendukung",
    intro: "Beragam fitur untuk memenuhi kebutuhan setiap pengguna",
    items: [
      { title: "Lingkungan Virtual", body: "Mensimulasikan lingkungan HP yang realistis." },
      { title: "Pengelola Perangkat", body: "Ubah atribut perangkat dan lainnya." },
      { title: "Unduh Aplikasi", body: "Unduh aplikasi langsung ke HP cloud kamu." },
      { title: "Impor File", body: "Impor file dan APK ke HP cloud kamu." },
      { title: "Kamera", body: "Pindai kode QR dan dukung verifikasi pengenalan wajah." },
      { title: "Audio", body: "Kirim pesan suara di dalam aplikasi." },
    ],
  },
  how: {
    before: "Cara",
    accent: "Kerjanya",
    steps: [
      { title: "Pilih plan", body: "Pilih UVIP, GVIP, KVIP, MVIP, atau SVIP sesuai berat game dan jumlah perangkat yang kamu butuhkan." },
      { title: "Buat HP cloud kamu", body: "Pilih server terdekat dan versi Android (10, 12, 13, atau 15). Perangkat menyala dalam sekitar satu menit." },
      { title: "Main dan farming 24/7", body: "Buka HP di browser, pasang game, dan biarkan tetap berjalan — bahkan setelah tab ditutup." },
    ],
  },
  reviews: {
    before: "JPPhone Mendapat",
    accent: "Ulasan Positif",
    stat: "Dipercaya gamer & farmer di seluruh dunia",
    intro:
      "Pemain memakai JPPhone untuk menjalankan game idle semalaman, mengelola banyak akun sekaligus, dan main game mobile di layar besar tanpa menguras baterai HP.",
  },
  board: { title: "Platform Cloud Phone Terdepan di Dunia", sub: "Region Pemain Paling Aktif", flag: (c) => `Bendera ${c}` },
  devices: {
    before: "Main di",
    accent: "Perangkat Apa Pun",
    sub: "Tidak perlu unduh aplikasi. Buka HP cloud kamu dari browser mana pun di desktop, tablet, atau HP, lalu lanjutkan dari terakhir kali kamu main.",
    cta: "Dapatkan HP Cloud",
    plans: "Lihat Plan",
  },
  faq: {
    before: "Pertanyaan yang",
    accent: "Sering Diajukan",
    items: [
      {
        q: "Apa itu HP cloud?",
        a: "HP cloud adalah perangkat Android asli yang berjalan di data center, bukan di saku kamu. Kamu melihat layarnya dan mengendalikannya dari browser, sementara HP-nya tetap berjalan 24/7.",
      },
      {
        q: "Apakah JPPhone emulator Android?",
        a: "Tidak perlu emulator di komputer. Android kamu berjalan di server kami, jadi tidak memakai CPU, RAM, atau baterai komputer kamu, dan tetap berjalan saat PC dimatikan.",
      },
      {
        q: "Bisakah saya menjalankan beberapa game atau akun sekaligus?",
        a: "Bisa. Setiap plan berisi satu atau lebih perangkat, dan setiap perangkat adalah HP Android terpisah — cocok untuk menjalankan banyak akun game atau farming beberapa game sekaligus.",
      },
      { q: "Perangkat apa saja yang bisa dipakai untuk mengendalikan HP cloud?", a: "Browser modern apa pun di Windows, macOS, Linux, Android, atau iOS. Tidak ada yang perlu diinstal." },
      { q: "Versi Android apa saja yang tersedia?", a: "Kamu bisa memilih Android 10, 12, 13, atau 15 saat membuat perangkat. Pilih versi yang didukung game kamu." },
      {
        q: "Bagaimana cara membayar?",
        a: "Isi saldo wallet dengan e-wallet, QRIS, atau kartu, lalu pakai saldonya untuk membeli atau memperpanjang plan apa pun. Plan juga bisa diaktifkan dengan kode redeem.",
      },
    ],
  },
  places: {
    Singapore: "Singapura",
    "United States": "Amerika Serikat",
    Germany: "Jerman",
    "US West": "AS Barat",
    Philippines: "Filipina",
    Brazil: "Brasil",
    "South Korea": "Korea Selatan",
    Japan: "Jepang",
    Turkey: "Turki",
  },
};

const de: HomeDict = {
  meta: {
    title: "Android-Cloud-Handy für AFK & Gaming — JPPhone",
    description:
      "Spiele mehrere Games auf einem Cloud-Handy, das 24/7 online ist — ohne Lag und ohne Ausfallzeit. Multi-Device, 100 % natives Android, globale Server mit niedriger Latenz.",
    keywords: ["cloud phone", "android cloud handy", "cloud android", "android emulator online", "afk farming", "auto farming", "cloud gaming handy", "multi instanz android"],
  },
  hero: {
    line1: "Android-Cloud-Handy",
    for: "für",
    accent: "AFK & Gaming",
    lead: "Spiele mehrere Games auf deinem Cloud-Handy — 24/7 online, ohne Lag und ohne Ausfallzeit.",
    features: ["100 % natives Android", "Multi-Device-Betrieb", "Auto-Farming & Grinding", "Plattformübergreifend", "Globale Server, niedrige Latenz"],
    cta: "Jetzt spielen",
    worksOn: "Funktioniert auf",
    noInstall: "Keine Installation",
    hosting: "24/7 HOSTING",
    autoSub: "Farming / Grinding",
    multi: "MULTI-DEVICE",
    multiSub: "Betrieb",
  },
  why: {
    before: "Warum",
    items: [
      {
        title: "Mehrere Spiele ohne Lag",
        body: "Mit JPPhone spielst du mehrere Android-Spiele, verwaltest mehrere Spielkonten, automatisierst das Farming und bleibst AFK, ohne dein eigenes Handy laufen zu lassen.",
      },
      {
        title: "24/7 in der Cloud online",
        body: "Dein Cloud-Handy läuft 24/7 ohne Lag und ohne Serverfehler. Deine Spiele farmen im Rechenzentrum rund um die Uhr weiter.",
      },
      {
        title: "Globale Server, niedrige Latenz, stabil",
        body: "Wähle die Region in deiner Nähe für niedrige Latenz und schnelleres Farming. Server in Jakarta, Singapur, Vietnam, Thailand, Hongkong, Taiwan, Tokio, Frankfurt und den USA.",
      },
      {
        title: "Viele Zahlungsmethoden",
        body: "Lade dein Abo mit DANA, QRIS, Visa, Mastercard und mehr auf. Mit deinem Wallet-Guthaben kaufst oder verlängerst du jeden Plan mit einem Klick.",
      },
      {
        title: "Plattformübergreifender Zugriff",
        body: "Mit JPPhone greifst du plattformübergreifend auf dein virtuelles Android-Gerät zu – ob per Android-APK, Windows-PC, Webbrowser oder iOS-Gerät.",
      },
    ],
    deviceRunning: "Gerät läuft · Browser geschlossen",
    uptimeToday: "Uptime heute",
    daysAgo: "vor 30 Tagen",
    online: "99,9 % online",
    today: "heute",
    wallet: "Wallet-Guthaben",
    confirm: "Zahlung bestätigen",
    connected: "Verbunden",
  },
  plans: {
    before: "Viele Gerätemodelle,",
    accent: "schnelle Leistung",
    hot: "Top-Empfehlung",
    servers: "Server",
    system: "Systemversion",
    cores: "Kerne",
    perDays: (d) => ` / ${d} Tage`,
    play: "Jetzt spielen",
    show: (a, b) => `Pläne ${a} bis ${b} anzeigen`,
    taglines: {
      uvip: "Unterstützt beliebte Spiele, flüssiges Erlebnis",
      gvip: "Mehr RAM, 24/7 AFK",
      kvip: "Preiswert, flüssiges AFK",
      mvip: "Mehr Leistung, stabiles AFK",
      svip: "Premium-RAM, stabiles AFK",
    },
  },
  games: {
    line1: "Spiele die verschiedensten Games",
    accent: "Gewinne rund um die Uhr",
    p1: "Spiele viele Games und verdiene rund um die Uhr mit JPPhone. Lass deine Mobile-Games in der Cloud laufen, automatisiere Farming und Grinding und mach Fortschritte, auch wenn dein Gerät offline ist — von Blox Fruits und Fisch bis Steal a Brainrot.",
    cta: "Farming starten",
    shotAlt: "auf einem Android-Cloud-Handy spielen",
  },
  features: {
    before: "Unterstützte",
    accent: "Funktionen",
    intro: "Vielfältige Funktionen für unterschiedliche Anforderungen",
    items: [
      { title: "Virtuelle Umgebung", body: "Simuliert eine realistische Handy-Umgebung." },
      { title: "Geräteverwaltung", body: "Geräteeigenschaften ändern und mehr." },
      { title: "App-Downloads", body: "Apps direkt auf dein Cloud-Handy herunterladen." },
      { title: "Dateiimport", body: "Dateien und APKs auf dein Cloud-Handy importieren." },
      { title: "Kamera", body: "QR-Codes scannen und Gesichtserkennung unterstützen." },
      { title: "Audio", body: "Sprachnachrichten in Apps senden." },
    ],
  },
  how: {
    before: "So",
    accent: "funktioniert's",
    steps: [
      { title: "Plan wählen", body: "Wähle UVIP, GVIP, KVIP, MVIP oder SVIP — je nachdem, wie anspruchsvoll deine Spiele sind und wie viele Geräte du brauchst." },
      { title: "Cloud-Handy erstellen", body: "Wähle einen Server in deiner Nähe und deine Android-Version (10, 12, 13 oder 15). Dein Gerät startet in etwa einer Minute." },
      { title: "24/7 spielen und farmen", body: "Öffne das Handy im Browser, installiere deine Spiele und lass sie laufen — auch nachdem du den Tab geschlossen hast." },
    ],
  },
  reviews: {
    before: "JPPhone erhält",
    accent: "Top-Bewertungen",
    stat: "Vertraut von Gamern & Farmern weltweit",
    intro:
      "Spieler nutzen JPPhone, um Idle-Games über Nacht laufen zu lassen, mehrere Accounts gleichzeitig zu verwalten und Mobile-Games auf dem großen Bildschirm zu spielen — ohne den Handy-Akku zu belasten.",
  },
  board: { title: "Internationale führende Cloud-Phone-Plattform", sub: "Aktivste Spielerregionen", flag: (c) => `Flagge ${c}` },
  devices: {
    before: "Spiele auf",
    accent: "jedem Gerät",
    sub: "Kein Client zum Herunterladen. Öffne deine Cloud-Handys in jedem Browser auf Desktop, Tablet oder Smartphone und mach genau dort weiter, wo du aufgehört hast.",
    cta: "Cloud-Handy holen",
    plans: "Pläne ansehen",
  },
  faq: {
    before: "Häufig gestellte",
    accent: "Fragen",
    items: [
      {
        q: "Was ist ein Cloud-Handy?",
        a: "Ein Cloud-Handy ist ein echtes Android-Gerät, das in einem Rechenzentrum läuft statt in deiner Tasche. Du siehst den Bildschirm und steuerst es im Browser, während das Handy selbst 24/7 weiterläuft.",
      },
      {
        q: "Ist JPPhone ein Android-Emulator?",
        a: "Du brauchst keinen lokalen Emulator. Dein Android läuft auf unseren Servern, nutzt also weder CPU, RAM noch Akku deines Computers und läuft weiter, wenn dein PC aus ist.",
      },
      {
        q: "Kann ich mehrere Spiele oder Accounts gleichzeitig nutzen?",
        a: "Ja. Jeder Plan enthält ein oder mehrere Geräte, und jedes Gerät ist ein eigenes Android-Handy — ideal für mehrere Spiel-Accounts oder das gleichzeitige Farmen mehrerer Spiele.",
      },
      { q: "Mit welchen Geräten kann ich mein Cloud-Handy steuern?", a: "Mit jedem modernen Browser unter Windows, macOS, Linux, Android oder iOS. Es muss nichts installiert werden." },
      { q: "Welche Android-Versionen gibt es?", a: "Du kannst beim Erstellen eines Geräts Android 10, 12, 13 oder 15 wählen. Nimm die Version, die deine Spiele unterstützen." },
      {
        q: "Wie bezahle ich?",
        a: "Lade dein Wallet per E-Wallet, QRIS oder Karte auf und nutze das Guthaben, um jeden Plan zu kaufen oder zu verlängern. Pläne lassen sich auch mit Einlösecodes aktivieren.",
      },
    ],
  },
  places: {
    Singapore: "Singapur",
    "Hong Kong": "Hongkong",
    Tokyo: "Tokio",
    "United States": "USA",
    Germany: "Deutschland",
    "US West": "USA West",
    Philippines: "Philippinen",
    Brazil: "Brasilien",
    "South Korea": "Südkorea",
    Turkey: "Türkei",
    Indonesia: "Indonesien",
  },
};

export const HOME: Record<Locale, HomeDict> = { en, id, de, es, fr, it, nl, pt, fil, tr, th, vi, tw, ko, ar };

/** Localized place name (falls back to English). */
export function place(t: HomeDict, name: string): string {
  return t.places[name] ?? name;
}
