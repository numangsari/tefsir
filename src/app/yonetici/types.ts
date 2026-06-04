// Yönetici paneli paylaşılan tipleri

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
  createdAt: string;
  highlightCount: number;
  noteCount: number;
  readMarkCount: number;
};

export type TopUser = {
  id: string;
  email: string;
  name: string | null;
  total: number;
  highlights: number;
  notes: number;
};

export type GrowthPoint = {
  date: string; // ISO gün (YYYY-MM-DD)
  users: number;
  notes: number;
  highlights: number;
};

export type Stats = {
  userCount: number;
  verifiedUserCount: number;
  highlightCount: number;
  noteCount: number;
  readMarkCount: number;
  tafsirContentCount: number;
  modernizedCount: number;
  ayahCount: number;
  expectedTafsirContent: number;
  topUsers: TopUser[];
  growth: GrowthPoint[];
};

// Site trafiği (kendi çerezsiz analitiğimiz)
export type TrafficStats = {
  pageViews: { today: number; week: number; month: number };
  visitors: { today: number; week: number; month: number };
  daily: { date: string; pageViews: number; visitors: number }[];
  topPages: { path: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
};

// İçerik & modernizasyon kapsama
export type TafsirCoverage = {
  tafsirId: number;
  code: string;
  name: string;
  total: number;
  modernized: number;
};

export type SurahCoverage = {
  surahId: number;
  nameTr: string;
  total: number;
  modernized: number;
};

export type ContentStats = {
  totalContent: number;
  modernizedContent: number;
  byTafsir: TafsirCoverage[];
  bySurah: SurahCoverage[];
};
