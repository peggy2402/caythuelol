'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

/* ============================= */
/*            TYPES              */
/* ============================= */

export type Language = 'vi' | 'en' | 'kr' | 'jp';

type Dictionary = typeof dictionaries.vi;
type TranslationKey = keyof Dictionary;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: I18nTranslationKey) => string;
}

/* ============================= */
/*         DICTIONARIES          */
/* ============================= */

const dictionaries = {
  vi: {
    services: 'Dịch vụ',
    boosters: 'Booster',
    blog: 'Tin tức',
    login: 'Đăng nhập',
    rentNow: 'Thuê Ngay',
    dashboard: 'Tổng quan',
    orders: 'Đơn hàng',
    wallet: 'Ví tiền',
    profile: 'Hồ sơ',
    history: 'Lịch sử đặt hàng',
    logout: 'Đăng xuất',
    heroBadge: 'Dịch vụ Cày Thuê Uy Tín #1 Việt Nam',
    heroTitle1: 'LEO RANK',
    heroTitle2: 'THẦN TỐC & AN TOÀN',
    heroDesc:
      'Đội ngũ Thách Đấu chuyên nghiệp sẵn sàng hỗ trợ bạn đạt được mức rank mong muốn.',
    startNow: 'Bắt đầu ngay',
    viewPricing: 'Xem bảng giá',
    welcomeBack: 'Chào mừng bạn quay trở lại!',
    email: 'Email',
    password: 'Mật khẩu',
    loginBtn: 'Đăng Nhập',
    registerNow: 'Đăng ký ngay',
    hello: 'Xin chào',
    balance: 'Số dư ví',
    forgotPassword: 'Quên mật khẩu?',
    rememberMe: 'Ghi nhớ đăng nhập',
    orContinue: 'Hoặc tiếp tục với',
    noAccount: 'Chưa có tài khoản?',
    registerTitle: 'Đăng ký',
    registerDesc: 'Tạo tài khoản mới để bắt đầu',
    username: 'Tên đăng nhập',
    role: 'Bạn là?',
    roleCustomer: 'Người thuê (Customer)',
    roleBooster: 'Người cày (Booster)',
    registerBtn: 'Đăng Ký',
    hasAccount: 'Đã có tài khoản?',
    statsCompleted: 'Đơn hoàn thành',
    statsBooster: 'Booster',
    statsCustomer: 'Khách hàng',
    statsRating: 'Đánh giá',
    whyChoose: 'TẠI SAO CHỌN',
    whyChooseUs: 'CHÚNG TÔI?',
    whyDesc: 'Cam kết mang lại trải nghiệm dịch vụ tốt nhất với đội ngũ chuyên nghiệp và hệ thống hiện đại.',
    secSecurity: 'Bảo Mật Tuyệt Đối',
    secSpeed: 'Tốc Độ Thần Tốc',
    secPrice: 'Giá Cả Hợp Lý',
    processTitle: 'QUY TRÌNH ĐƠN GIẢN',
    processDesc: 'Chỉ với 3 bước để bắt đầu hành trình leo rank',
    step1: 'Chọn Dịch Vụ',
    step2: 'Thanh Toán',
    step3: 'Leo Rank',
    reviewsTitle: 'KHÁCH HÀNG NÓI GÌ?',
    totalOrders: 'Tổng đơn hàng',
    processing: 'Đang xử lý',
    totalSpent: 'Tổng chi tiêu',
    welcomeDash: 'Chào mừng bạn quay trở lại. Bạn đang có',
    ordersProcessing: 'đơn hàng đang xử lý.',
    createOrder: 'Tạo đơn mới',
    depositNow: 'Nạp tiền ngay',
    recentOrders: 'Đơn hàng gần đây',
    viewAll: 'Xem tất cả',
    noOrders: 'Chưa có đơn hàng nào',
    startRank: 'Hãy tạo đơn hàng đầu tiên để bắt đầu leo rank!',
    colId: 'Mã đơn',
    colService: 'Dịch vụ',
    colStatus: 'Trạng thái',
    colPrice: 'Giá trị',
    colDate: 'Ngày tạo',
    introService: 'Hệ thống cày thuê Liên Minh Huyền Thoại chuyên nghiệp số 1 Việt Nam. Đội ngũ Thách Đấu sẵn sàng hỗ trợ bạn 24/7. An toàn, bảo mật, và nhanh chóng với quy trình đơn giản.',
    footerDesc: "Hệ thống cày thuê Liên Minh Huyền Thoại chuyên nghiệp, uy tín hàng đầu Việt Nam. Nâng tầm đẳng cấp game thủ.",
    support: "Hỗ trợ",
    contact: "Liên hệ",

    serviceList: {
        boostRank: "Cày Rank",
        placement: "Cày Thuê Placement",
        mastery: "Cày Thông Thạo",
        coaching: "Coaching 1-1",
    },

    supportList: {
        helpCenter: "Trung tâm trợ giúp",
        terms: "Điều khoản dịch vụ",
        privacy: "Chính sách bảo mật",
        contact: "Liên hệ",
    },

    copyright: "© 2026 CAYTHUELOL. All rights reserved.",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    shieldCheck: "Bảo mật tài khoản tuyệt đối 100%",
    teamBooster: "Đội ngũ Booster Thách Đấu/Cao Thủ",
    zap: "Hoàn tiền ngay nếu không đạt yêu cầu",
    contactHours: "Thời gian hoạt động 8:00 - 22:00",
  },

  en: {
    services: 'Services',
    boosters: 'Boosters',
    blog: 'Blog',
    login: 'Login',
    rentNow: 'Rent Now',
    dashboard: 'Dashboard',
    orders: 'Orders',
    wallet: 'Wallet',
    profile: 'Profile',
    history: 'Order History',
    logout: 'Logout',
    heroBadge: '#1 Trusted Boosting Service in Vietnam',
    heroTitle1: 'RANK UP',
    heroTitle2: 'FAST & SECURE',
    heroDesc:
      'Professional Challenger team ready to help you reach your desired rank.',
    startNow: 'Start Now',
    viewPricing: 'View Pricing',
    welcomeBack: 'Welcome back!',
    email: 'Email',
    password: 'Password',
    loginBtn: 'Login',
    registerNow: 'Register now',
    hello: 'Hello',
    balance: 'Wallet Balance',
    forgotPassword: 'Forgot password?',
    rememberMe: 'Remember me',
    orContinue: 'Or continue with',
    noAccount: 'No account?',
    registerTitle: 'Register',
    registerDesc: 'Create a new account to get started',
    username: 'Username',
    role: 'You are?',
    roleCustomer: 'Customer',
    roleBooster: 'Booster',
    registerBtn: 'Register',
    hasAccount: 'Already have an account?',
    statsCompleted: 'Orders Completed',
    statsBooster: 'Boosters',
    statsCustomer: 'Customers',
    statsRating: 'Rating',
    whyChoose: 'WHY CHOOSE',
    whyChooseUs: 'US?',
    whyDesc: 'Committed to providing the best service experience with a professional team and modern system.',
    secSecurity: 'Absolute Security',
    secSpeed: 'Super Fast Speed',
    secPrice: 'Reasonable Price',
    processTitle: 'SIMPLE PROCESS',
    processDesc: 'Just 3 steps to start your ranking journey',
    step1: 'Select Service',
    step2: 'Payment',
    step3: 'Rank Up',
    reviewsTitle: 'WHAT CUSTOMERS SAY?',
    totalOrders: 'Total Orders',
    processing: 'Processing',
    totalSpent: 'Total Spent',
    welcomeDash: 'Welcome back. You have',
    ordersProcessing: 'orders processing.',
    createOrder: 'New Order',
    depositNow: 'Deposit Now',
    recentOrders: 'Recent Orders',
    viewAll: 'View All',
    noOrders: 'No orders yet',
    startRank: 'Create your first order to start ranking up!',
    colId: 'Order ID',
    colService: 'Service',
    colStatus: 'Status',
    colPrice: 'Price',
    colDate: 'Date',
    introService: "Vietnam’s #1 professional League of Legends boosting service. Our Challenger-tier team is ready to support you 24/7. Safe, secure, and fast with a simple process.",
    footerDesc: "Professional League of Legends boosting system, one of the most trusted services in Vietnam. Elevate your gaming level.",
    support: "Support",
    contact: "Contact",

    serviceList: {
        boostRank: "Rank Boosting",
        placement: "Placement Matches",
        mastery: "Mastery Boost",
        coaching: "1-1 Coaching",
    },

    supportList: {
        helpCenter: "Help Center",
        terms: "Terms of Service",
        privacy: "Privacy Policy",
        contact: "Contact",
    },

    copyright: "© 2026 CAYTHUELOL. All rights reserved.",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    shieldCheck: "100% absolute account security",
    teamBooster: "Challenger / Grandmaster booster team",
    zap: "Instant refund if requirements are not met",
    contactHours: "Business Hours 8:00 - 22:00",
  },

  kr: {
    services: '서비스',
    boosters: '부스터',
    blog: '블로그',
    login: '로그인',
    rentNow: '지금 대여',
    dashboard: '대시보드',
    orders: '주문',
    wallet: '지갑',
    profile: '프로필',
    history: '주문 내역',
    logout: '로그아웃',
    heroBadge: '베트남 #1 신뢰할 수 있는 부스팅 서비스',
    heroTitle1: '랭크 상승',
    heroTitle2: '빠르고 안전하게',
    heroDesc: '챌린저 팀이 원하는 랭크에 도달하도록 도와드립니다.',
    startNow: '지금 시작',
    viewPricing: '가격 보기',
    welcomeBack: '다시 오신 것을 환영합니다!',
    email: '이메일',
    password: '비밀번호',
    loginBtn: '로그인',
    registerNow: '지금 가입',
    hello: '안녕하세요',
    balance: '지갑 잔액',
    forgotPassword: '비밀번호를 잊으셨나요?',
    rememberMe: '로그인 유지',
    orContinue: '또는 계속하기',
    noAccount: '계정이 없으신가요?',
    registerTitle: '회원가입',
    registerDesc: '시작하려면 새 계정을 만드세요',
    username: '사용자 이름',
    role: '당신은?',
    roleCustomer: '고객 (Customer)',
    roleBooster: '부스터 (Booster)',
    registerBtn: '가입하기',
    hasAccount: '이미 계정이 있으신가요?',
    statsCompleted: '완료된 주문',
    statsBooster: '부스터',
    statsCustomer: '고객',
    statsRating: '평가',
    whyChoose: '왜 우리를',
    whyChooseUs: '선택해야 할까요?',
    whyDesc: '전문 팀과 현대적인 시스템으로 최고의 서비스 경험을 제공합니다.',
    secSecurity: '절대 보안',
    secSpeed: '초고속',
    secPrice: '합리적인 가격',
    processTitle: '간단한 절차',
    processDesc: '랭크 상승을 시작하는 3단계',
    step1: '서비스 선택',
    step2: '결제',
    step3: '랭크 업',
    reviewsTitle: '고객 후기',
    totalOrders: '총 주문',
    processing: '처리 중',
    totalSpent: '총 지출',
    welcomeDash: '환영합니다. 현재 처리 중인 주문:',
    ordersProcessing: '건.',
    createOrder: '새 주문',
    depositNow: '지금 입금',
    recentOrders: '최근 주문',
    viewAll: '모두 보기',
    noOrders: '주문이 없습니다',
    startRank: '첫 주문을 생성하여 랭크를 올리세요!',
    colId: '주문 ID',
    colService: '서비스',
    colStatus: '상태',
    colPrice: '가격',
    colDate: '날짜',
    introService: "베트남 1위 프로 리그 오브 레전드 대리 랭크 서비스. 챌린저 등급 팀이 24시간 언제든지 지원합니다. 간단한 절차로 안전하고 빠르게 진행됩니다.",
    footerDesc: "베트남에서 가장 신뢰받는 리그 오브 레전드 대리 랭크 시스템. 당신의 게임 실력을 한 단계 끌어올리세요.",
    support: "고객 지원",
    contact: "문의하기",

    serviceList: {
        boostRank: "랭크 대리",
        placement: "배치 경기 대리",
        mastery: "숙련도 대리",
        coaching: "1-1 코칭",
    },

    supportList: {
        helpCenter: "고객 센터",
        terms: "서비스 이용약관",
        privacy: "개인정보 처리방침",
        contact: "문의하기",
    },

    copyright: "© 2026 CAYTHUELOL. All rights reserved.",
    privacyPolicy: "개인정보 처리방침",
    termsOfService: "서비스 이용약관",
    shieldCheck: "계정 100% 완벽 보안 보장",
    teamBooster: "챌린저 / 그랜드마스터 부스터 팀",
    zap: "요구 사항을 충족하지 못할 경우 즉시 환불",
    contactHours: "영업 시간 8:00 - 22:00",
  },

  jp: {
    services: 'サービス',
    boosters: 'ブースター',
    blog: 'ブログ',
    login: 'ログイン',
    rentNow: '今すぐレンタル',
    dashboard: 'ダッシュボード',
    orders: '注文',
    wallet: 'ウォレット',
    profile: 'プロフィール',
    history: '注文履歴',
    logout: 'ログアウト',
    heroBadge: 'ベトナムで信頼性No.1のブースティングサービス',
    heroTitle1: 'ランクアップ',
    heroTitle2: '高速かつ安全',
    heroDesc:
      'チャレンジャーチームが希望のランクに到達するのを手助けします。',
    startNow: '今すぐ開始',
    viewPricing: '価格を見る',
    welcomeBack: 'お帰りなさい！',
    email: 'メール',
    password: 'パスワード',
    loginBtn: 'ログイン',
    registerNow: '今すぐ登録',
    hello: 'こんにちは',
    balance: 'ウォレット残高',
    forgotPassword: 'パスワードをお忘れですか？',
    rememberMe: 'ログイン状態を保持',
    orContinue: 'または次で続行',
    noAccount: 'アカウントをお持ちでないですか？',
    registerTitle: '登録',
    registerDesc: '新しいアカウントを作成して始めましょう',
    username: 'ユーザー名',
    role: 'あなたは？',
    roleCustomer: '顧客 (Customer)',
    roleBooster: 'ブースター (Booster)',
    registerBtn: '登録する',
    hasAccount: 'すでにアカウントをお持ちですか？',
    statsCompleted: '完了した注文',
    statsBooster: 'ブースター',
    statsCustomer: '顧客',
    statsRating: '評価',
    whyChoose: 'なぜ私たちを',
    whyChooseUs: '選ぶのか？',
    whyDesc: 'プロフェッショナルなチームと最新のシステムで最高のサービス体験を提供することをお約束します。',
    secSecurity: '絶対的なセキュリティ',
    secSpeed: '超高速',
    secPrice: '手頃な価格',
    processTitle: '簡単なプロセス',
    processDesc: 'ランクアップを始めるための3つのステップ',
    step1: 'サービス選択',
    step2: '支払い',
    step3: 'ランクアップ',
    reviewsTitle: 'お客様の声',
    totalOrders: '総注文数',
    processing: '処理中',
    totalSpent: '総支出',
    welcomeDash: 'お帰りなさい。処理中の注文：',
    ordersProcessing: '件。',
    createOrder: '新規注文',
    depositNow: '今すぐ入金',
    recentOrders: '最近の注文',
    viewAll: 'すべて見る',
    noOrders: '注文はまだありません',
    startRank: '最初の注文を作成してランクを上げましょう！',
    colId: '注文ID',
    colService: 'サービス',
    colStatus: 'ステータス',
    colPrice: '価格',
    colDate: '日付',
    introService: "ベトナムNo.1のプロフェッショナルなリーグ・オブ・レジェンドブースティングサービス。チャレンジャーランクのチームが24時間365日サポートします。シンプルな手続きで安全・安心・スピーディーに対応します。",
    footerDesc: "ベトナムで最も信頼されているリーグ・オブ・レジェンドのブースティングサービス。あなたのゲームレベルを引き上げます。",
    support: "サポート",
    contact: "お問い合わせ",

    serviceList: {
        boostRank: "ランクブースト",
        placement: "プレースメント代行",
        mastery: "熟練度ブースト",
        coaching: "1対1コーチング",
    },

    supportList: {
        helpCenter: "ヘルプセンター",
        terms: "利用規約",
        privacy: "プライバシーポリシー",
        contact: "お問い合わせ",
    },

    copyright: "© 2026 CAYTHUELOL. All rights reserved.",
    privacyPolicy: "プライバシーポリシー",
    termsOfService: "利用規約",
    shieldCheck: "アカウントを100％完全に保護",
    teamBooster: "チャレンジャー／グランドマスターブースターチーム",
    zap: "条件を満たさない場合は即時返金",
    contactHours: "営業時間 8:00 - 22:00",
  },
  
} as const;

/* =======================================================
   TYPE MAGIC – NESTED KEY SUPPORT
======================================================= */

type I18nDictionary = typeof dictionaries.vi;

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & string]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : Key;
}[keyof ObjectType & string];

type I18nTranslationKey = NestedKeyOf<I18nDictionary>;

/* =======================================================
   HELPER: GET VALUE FROM PATH
======================================================= */

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

/* =======================================================
   CONTEXT
======================================================= */

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: I18nTranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

/* =======================================================
   PROVIDER
======================================================= */

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('vi');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language | null;
    if (saved && dictionaries[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: I18nTranslationKey): string => {
    const value =
      getNestedValue(dictionaries[language], key) ??
      getNestedValue(dictionaries.vi, key);

    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/* =======================================================
   HOOK
======================================================= */

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}