// 11 Türkçe tefsir kataloğu. order: kronolojik (eskiden yeniye), 1=en eski.
export type TafsirMeta = {
  id: number;
  code: string;
  name: string;
  author: string;
  slug: string;
  order: number;
  deathYearHijri: number | null;
  deathYearGregorian: number | null;
};

// Sıralama: müellifin vefat yılına (miladi) göre artan
export const TAFSIRS: TafsirMeta[] = [
  {
    id: 11,
    code: "T011",
    name: "Taberî Tefsiri",
    author: "İbn Cerîr et-Taberî",
    slug: "taberi",
    order: 1,
    deathYearHijri: 310,
    deathYearGregorian: 923,
  },
  {
    id: 10,
    code: "T010",
    name: "Semerkandî Tefsiri",
    author: "Ebü'l-Leys es-Semerkandî",
    slug: "semerkandi",
    order: 2,
    deathYearHijri: 373,
    deathYearGregorian: 983,
  },
  {
    id: 5,
    code: "T005",
    name: "Ez-Zâdü'l-Mesîr",
    author: "İbnü'l-Cevzî",
    slug: "zadul-mesir",
    order: 3,
    deathYearHijri: 597,
    deathYearGregorian: 1201,
  },
  {
    id: 6,
    code: "T006",
    name: "Fahreddîn Râzî",
    author: "Fahreddin er-Râzî",
    slug: "fahreddin-razi",
    order: 4,
    deathYearHijri: 606,
    deathYearGregorian: 1209,
  },
  {
    id: 7,
    code: "T007",
    name: "Kurtubî Tefsiri",
    author: "el-Kurtubî",
    slug: "kurtubi",
    order: 5,
    deathYearHijri: 671,
    deathYearGregorian: 1273,
  },
  {
    id: 1,
    code: "T001",
    name: "Beydâvî Tefsiri",
    author: "Kâdî Beydâvî",
    slug: "beydavi",
    order: 6,
    deathYearHijri: 685,
    deathYearGregorian: 1286,
  },
  {
    id: 8,
    code: "T008",
    name: "Medârik (Nesefî)",
    author: "Ebü'l-Berekât en-Nesefî",
    slug: "medarik-nesefi",
    order: 7,
    deathYearHijri: 710,
    deathYearGregorian: 1310,
  },
  {
    id: 2,
    code: "T002",
    name: "Celâleyn Tefsiri",
    author: "Celâleddîn el-Mahallî & es-Suyûtî",
    slug: "celaleyn",
    order: 8,
    deathYearHijri: 864,
    deathYearGregorian: 1459,
  },
  {
    id: 4,
    code: "T004",
    name: "Ed-Dürrü'l-Mensûr",
    author: "Celâleddîn es-Suyûtî",
    slug: "durrul-mensur",
    order: 9,
    deathYearHijri: 911,
    deathYearGregorian: 1505,
  },
  {
    id: 3,
    code: "T003",
    name: "Ebu's-Suûd Efendi",
    author: "Ebu's-Suûd Efendi",
    slug: "ebussuud",
    order: 10,
    deathYearHijri: 982,
    deathYearGregorian: 1574,
  },
  {
    id: 9,
    code: "T009",
    name: "Rûhu'l-Beyân",
    author: "İsmâil Hakkı Bursevî",
    slug: "ruhul-beyan",
    order: 11,
    deathYearHijri: 1137,
    deathYearGregorian: 1725,
  },
];
