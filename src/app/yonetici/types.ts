// Yönetici paneli paylaşılan tipleri

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
  createdAt: string;
  deletedAt: string | null;
  highlightCount: number;
  noteCount: number;
  readMarkCount: number;
};

export type AuditEntry = {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string | null;
  metadata: unknown;
  createdAt: string;
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

// İletişim formundan gelen mesajlar
export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  body: string;
  userId: string | null;
  readAt: string | null;
  createdAt: string;
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
