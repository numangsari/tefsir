import { prisma } from "@/lib/prisma";
import { SurahIndexView } from "./SurahIndexView";

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
