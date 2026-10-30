import type { Locale } from "./config";

/** Strings for the site header and footer. */
export interface CommonDict {
  nav: { pricing: string; discover: string; devices: string; admin: string; login: string; getPhone: string; signOut: string; language: string };
  footer: {
    tagline: string;
    cta: string;
    product: string;
    help: string;
    company: string;
    myPhones: string;
    redeem: string;
    topup: string;
    gettingStarted: string;
    installApps: string;
    faq: string;
    support: string;
    news: string;
    discord: string;
    accept: string;
    rights: string;
    strap: string;
  };
}

export const COMMON: Record<Locale, CommonDict> = {
  en: {
    nav: { pricing: "Pricing", discover: "Discover", devices: "Devices", admin: "Admin", login: "Log in", getPhone: "Get a phone", signOut: "Sign out", language: "Language" },
    footer: {
      tagline: "Android cloud phones that run your games 24/7 — play, AFK and farm from any browser.",
      cta: "Get a phone",
      product: "Product",
      help: "Help",
      company: "Company",
      myPhones: "My Cloud Phones",
      redeem: "Redeem Code",
      topup: "Top-up",
      gettingStarted: "Getting started",
      installApps: "Install games & apps",
      faq: "FAQ",
      support: "Support",
      news: "News",
      discord: "Discord community",
      accept: "We accept",
      rights: "All rights reserved.",
      strap: "Cloud Android phones · 24/7 uptime · Global servers",
    },
  },
  id: {
    nav: { pricing: "Harga", discover: "Jelajahi", devices: "Perangkat", admin: "Admin", login: "Masuk", getPhone: "Dapatkan HP", signOut: "Keluar", language: "Bahasa" },
    footer: {
      tagline: "HP Android cloud yang menjalankan game kamu 24/7 — main, AFK, dan farming dari browser mana pun.",
      cta: "Dapatkan HP",
      product: "Produk",
      help: "Bantuan",
      company: "Perusahaan",
      myPhones: "HP Cloud Saya",
      redeem: "Tukar Kode",
      topup: "Isi Saldo",
      gettingStarted: "Cara memulai",
      installApps: "Pasang game & aplikasi",
      faq: "FAQ",
      support: "Dukungan",
      news: "Berita",
      discord: "Komunitas Discord",
      accept: "Metode pembayaran",
      rights: "Hak cipta dilindungi.",
      strap: "HP Android cloud · Online 24/7 · Server global",
    },
  },
  de: {
    nav: { pricing: "Preise", discover: "Entdecken", devices: "Geräte", admin: "Admin", login: "Anmelden", getPhone: "Handy holen", signOut: "Abmelden", language: "Sprache" },
    footer: {
      tagline: "Android-Cloud-Handys, die deine Spiele rund um die Uhr laufen lassen — spielen, AFK und farmen im Browser.",
      cta: "Handy holen",
      product: "Produkt",
      help: "Hilfe",
      company: "Unternehmen",
      myPhones: "Meine Cloud-Handys",
      redeem: "Code einlösen",
      topup: "Guthaben aufladen",
      gettingStarted: "Erste Schritte",
      installApps: "Spiele & Apps installieren",
      faq: "FAQ",
      support: "Support",
      news: "Neuigkeiten",
      discord: "Discord-Community",
      accept: "Wir akzeptieren",
      rights: "Alle Rechte vorbehalten.",
      strap: "Android-Cloud-Handys · 24/7 online · Globale Server",
    },
  },
  es: {
    nav: {
      pricing: "Precios",
      discover: "Descubrir",
      devices: "Dispositivos",
      admin: "Admin",
      login: "Iniciar sesión",
      getPhone: "Consigue un móvil",
      signOut: "Cerrar sesión",
      language: "Idioma"
    },
    footer: {
      tagline: "Móviles Android en la nube que ejecutan tus juegos 24/7: juega, deja en AFK y farmea desde cualquier navegador.",
      cta: "Consigue un móvil",
      product: "Producto",
      help: "Ayuda",
      company: "Empresa",
      myPhones: "Mis móviles en la nube",
      redeem: "Canjear código",
      topup: "Recargar saldo",
      gettingStarted: "Primeros pasos",
      installApps: "Instalar juegos y apps",
      faq: "Preguntas frecuentes",
      support: "Soporte",
      news: "Noticias",
      discord: "Comunidad de Discord",
      accept: "Aceptamos",
      rights: "Todos los derechos reservados.",
      strap: "Móviles Android en la nube · 24/7 en línea · Servidores globales"
    }
  },
  fr: {
    nav: {
      pricing: "Tarifs",
      discover: "Découvrir",
      devices: "Appareils",
      admin: "Admin",
      login: "Connexion",
      getPhone: "Obtenir un téléphone",
      signOut: "Déconnexion",
      language: "Langue"
    },
    footer: {
      tagline: "Des téléphones Android dans le cloud qui font tourner vos jeux 24h/24 : jouez, restez AFK et farmez depuis n'importe quel navigateur.",
      cta: "Obtenir un téléphone",
      product: "Produit",
      help: "Aide",
      company: "Entreprise",
      myPhones: "Mes téléphones cloud",
      redeem: "Utiliser un code",
      topup: "Recharger",
      gettingStarted: "Premiers pas",
      installApps: "Installer jeux et apps",
      faq: "FAQ",
      support: "Support",
      news: "Actualités",
      discord: "Communauté Discord",
      accept: "Nous acceptons",
      rights: "Tous droits réservés.",
      strap: "Téléphones Android cloud · En ligne 24h/24 · Serveurs mondiaux"
    }
  },
  it: {
    nav: {
      pricing: "Prezzi",
      discover: "Scopri",
      devices: "Dispositivi",
      admin: "Admin",
      login: "Accedi",
      getPhone: "Ottieni un telefono",
      signOut: "Esci",
      language: "Lingua"
    },
    footer: {
      tagline: "Telefoni Android nel cloud che fanno girare i tuoi giochi 24/7: gioca, vai in AFK e farma da qualsiasi browser.",
      cta: "Ottieni un telefono",
      product: "Prodotto",
      help: "Aiuto",
      company: "Azienda",
      myPhones: "I miei telefoni cloud",
      redeem: "Riscatta codice",
      topup: "Ricarica",
      gettingStarted: "Per iniziare",
      installApps: "Installa giochi e app",
      faq: "FAQ",
      support: "Assistenza",
      news: "Novità",
      discord: "Community Discord",
      accept: "Accettiamo",
      rights: "Tutti i diritti riservati.",
      strap: "Telefoni Android cloud · Online 24/7 · Server globali"
    }
  },
  nl: {
    nav: {
      pricing: "Prijzen",
      discover: "Ontdekken",
      devices: "Apparaten",
      admin: "Admin",
      login: "Inloggen",
      getPhone: "Telefoon nemen",
      signOut: "Uitloggen",
      language: "Taal"
    },
    footer: {
      tagline: "Android-cloudtelefoons die je games 24/7 laten draaien — spelen, AFK en farmen vanuit elke browser.",
      cta: "Telefoon nemen",
      product: "Product",
      help: "Hulp",
      company: "Bedrijf",
      myPhones: "Mijn cloudtelefoons",
      redeem: "Code inwisselen",
      topup: "Opwaarderen",
      gettingStarted: "Aan de slag",
      installApps: "Games en apps installeren",
      faq: "Veelgestelde vragen",
      support: "Support",
      news: "Nieuws",
      discord: "Discord-community",
      accept: "Wij accepteren",
      rights: "Alle rechten voorbehouden.",
      strap: "Android-cloudtelefoons · 24/7 online · Wereldwijde servers"
    }
  },
  th: {
    nav: {
      pricing: "ราคา",
      discover: "สำรวจ",
      devices: "อุปกรณ์",
      admin: "ผู้ดูแล",
      login: "เข้าสู่ระบบ",
      getPhone: "รับโทรศัพท์",
      signOut: "ออกจากระบบ",
      language: "ภาษา"
    },
    footer: {
      tagline: "โทรศัพท์ Android บนคลาวด์ที่รันเกมของคุณตลอด 24 ชั่วโมง — เล่น AFK และฟาร์มได้จากทุกเบราว์เซอร์",
      cta: "รับโทรศัพท์",
      product: "ผลิตภัณฑ์",
      help: "ช่วยเหลือ",
      company: "บริษัท",
      myPhones: "โทรศัพท์คลาวด์ของฉัน",
      redeem: "แลกโค้ด",
      topup: "เติมเงิน",
      gettingStarted: "เริ่มต้นใช้งาน",
      installApps: "ติดตั้งเกมและแอป",
      faq: "คำถามที่พบบ่อย",
      support: "ฝ่ายสนับสนุน",
      news: "ข่าวสาร",
      discord: "ชุมชน Discord",
      accept: "ช่องทางชำระเงิน",
      rights: "สงวนลิขสิทธิ์",
      strap: "โทรศัพท์ Android บนคลาวด์ · ออนไลน์ 24/7 · เซิร์ฟเวอร์ทั่วโลก"
    }
  },
  vi: {
    nav: {
      pricing: "Bảng giá",
      discover: "Khám phá",
      devices: "Thiết bị",
      admin: "Quản trị",
      login: "Đăng nhập",
      getPhone: "Nhận điện thoại",
      signOut: "Đăng xuất",
      language: "Ngôn ngữ"
    },
    footer: {
      tagline: "Điện thoại Android đám mây chạy game của bạn 24/7 — chơi, treo máy và farm từ mọi trình duyệt.",
      cta: "Nhận điện thoại",
      product: "Sản phẩm",
      help: "Trợ giúp",
      company: "Công ty",
      myPhones: "Điện thoại đám mây của tôi",
      redeem: "Đổi mã",
      topup: "Nạp tiền",
      gettingStarted: "Bắt đầu",
      installApps: "Cài game và ứng dụng",
      faq: "Câu hỏi thường gặp",
      support: "Hỗ trợ",
      news: "Tin tức",
      discord: "Cộng đồng Discord",
      accept: "Chấp nhận thanh toán",
      rights: "Bảo lưu mọi quyền.",
      strap: "Điện thoại Android đám mây · Online 24/7 · Máy chủ toàn cầu"
    }
  },
  pt: {
    nav: {
      pricing: "Preços",
      discover: "Descobrir",
      devices: "Dispositivos",
      admin: "Admin",
      login: "Entrar",
      getPhone: "Obter um celular",
      signOut: "Sair",
      language: "Idioma"
    },
    footer: {
      tagline: "Celulares Android na nuvem que rodam seus jogos 24/7 — jogue, deixe no AFK e farme de qualquer navegador.",
      cta: "Obter um celular",
      product: "Produto",
      help: "Ajuda",
      company: "Empresa",
      myPhones: "Meus celulares na nuvem",
      redeem: "Resgatar código",
      topup: "Recarregar",
      gettingStarted: "Primeiros passos",
      installApps: "Instalar jogos e apps",
      faq: "Perguntas frequentes",
      support: "Suporte",
      news: "Novidades",
      discord: "Comunidade no Discord",
      accept: "Aceitamos",
      rights: "Todos os direitos reservados.",
      strap: "Celulares Android na nuvem · Online 24/7 · Servidores globais"
    }
  },
  ar: {
    nav: {
      pricing: "الأسعار",
      discover: "استكشف",
      devices: "الأجهزة",
      admin: "الإدارة",
      login: "تسجيل الدخول",
      getPhone: "احصل على هاتف",
      signOut: "تسجيل الخروج",
      language: "اللغة"
    },
    footer: {
      tagline: "هواتف أندرويد سحابية تشغّل ألعابك على مدار الساعة — العب، اترك اللعبة تعمل تلقائيًا، واجمع الموارد من أي متصفح.",
      cta: "احصل على هاتف",
      product: "المنتج",
      help: "المساعدة",
      company: "الشركة",
      myPhones: "هواتفي السحابية",
      redeem: "استبدال الرمز",
      topup: "شحن الرصيد",
      gettingStarted: "البدء",
      installApps: "تثبيت الألعاب والتطبيقات",
      faq: "الأسئلة الشائعة",
      support: "الدعم",
      news: "الأخبار",
      discord: "مجتمع ديسكورد",
      accept: "نقبل",
      rights: "جميع الحقوق محفوظة.",
      strap: "هواتف أندرويد سحابية · متصلة 24/7 · خوادم عالمية"
    }
  },
  fil: {
    nav: {
      pricing: "Presyo",
      discover: "Tuklasin",
      devices: "Mga Device",
      admin: "Admin",
      login: "Mag-log in",
      getPhone: "Kumuha ng phone",
      signOut: "Mag-sign out",
      language: "Wika"
    },
    footer: {
      tagline: "Android cloud phones na nagpapatakbo ng mga laro mo 24/7 — maglaro, mag-AFK at mag-farm mula sa kahit anong browser.",
      cta: "Kumuha ng phone",
      product: "Produkto",
      help: "Tulong",
      company: "Kumpanya",
      myPhones: "Aking Cloud Phones",
      redeem: "I-redeem ang Code",
      topup: "Mag-top up",
      gettingStarted: "Pagsisimula",
      installApps: "Mag-install ng laro at app",
      faq: "FAQ",
      support: "Suporta",
      news: "Balita",
      discord: "Discord community",
      accept: "Tumatanggap kami ng",
      rights: "Lahat ng karapatan ay nakalaan.",
      strap: "Android cloud phones · 24/7 online · Global servers"
    }
  },
  tr: {
    nav: {
      pricing: "Fiyatlar",
      discover: "Keşfet",
      devices: "Cihazlar",
      admin: "Yönetim",
      login: "Giriş yap",
      getPhone: "Telefon al",
      signOut: "Çıkış yap",
      language: "Dil"
    },
    footer: {
      tagline: "Oyunlarını 7/24 çalıştıran bulut Android telefonlar — her tarayıcıdan oyna, AFK bırak ve farm yap.",
      cta: "Telefon al",
      product: "Ürün",
      help: "Yardım",
      company: "Şirket",
      myPhones: "Bulut telefonlarım",
      redeem: "Kod kullan",
      topup: "Bakiye yükle",
      gettingStarted: "Başlarken",
      installApps: "Oyun ve uygulama yükle",
      faq: "SSS",
      support: "Destek",
      news: "Haberler",
      discord: "Discord topluluğu",
      accept: "Kabul ettiğimiz ödemeler",
      rights: "Tüm hakları saklıdır.",
      strap: "Bulut Android telefonlar · 7/24 çevrimiçi · Küresel sunucular"
    }
  },
  tw: {
    nav: {
      pricing: "價格",
      discover: "探索",
      devices: "裝置",
      admin: "管理",
      login: "登入",
      getPhone: "取得雲手機",
      signOut: "登出",
      language: "語言"
    },
    footer: {
      tagline: "24 小時運行遊戲的 Android 雲手機——隨時用任何瀏覽器遊玩、掛機與刷資源。",
      cta: "取得雲手機",
      product: "產品",
      help: "說明",
      company: "公司",
      myPhones: "我的雲手機",
      redeem: "兌換代碼",
      topup: "儲值",
      gettingStarted: "新手入門",
      installApps: "安裝遊戲與 App",
      faq: "常見問題",
      support: "客服支援",
      news: "最新消息",
      discord: "Discord 社群",
      accept: "支付方式",
      rights: "版權所有。",
      strap: "Android 雲手機 · 24/7 在線 · 全球伺服器"
    }
  },
  ko: {
    nav: {
      pricing: "요금",
      discover: "둘러보기",
      devices: "기기",
      admin: "관리자",
      login: "로그인",
      getPhone: "폰 시작하기",
      signOut: "로그아웃",
      language: "언어"
    },
    footer: {
      tagline: "게임을 24시간 돌려 주는 안드로이드 클라우드 폰 — 어떤 브라우저에서든 플레이, 방치, 파밍하세요.",
      cta: "폰 시작하기",
      product: "제품",
      help: "도움말",
      company: "회사",
      myPhones: "내 클라우드 폰",
      redeem: "코드 등록",
      topup: "충전",
      gettingStarted: "시작하기",
      installApps: "게임·앱 설치",
      faq: "자주 묻는 질문",
      support: "고객 지원",
      news: "소식",
      discord: "디스코드 커뮤니티",
      accept: "결제 수단",
      rights: "All rights reserved.",
      strap: "안드로이드 클라우드 폰 · 24시간 온라인 · 글로벌 서버"
    }
  },
};
