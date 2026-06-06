import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SurahIndexView } from "./SurahIndexView";

export const metadata: Metadata = {
  title: "Sûreler — Kur'an-ı Kerim fihristi",
  description:
    "Kur'an-ı Kerim'in 114 sûresi: ayet sayıları, Mekkî/Medenî bilgisi ve nüzul sırasıyla sûre fihristi.",
  alternates: { canonical: "/sureler" },
};

export default async function SurelerPage() {
  const surahs = await prisma.surah.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      nameTr: true,
      nameAr: true,
      ayetCount: true,
      revelationType: true,
      revelationOrder: true,
      meaning: true,
    },
  });
  return <SurahIndexView surahs={surahs} />;
}
