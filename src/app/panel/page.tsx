import { prisma } from "@/lib/prisma";
import { PanelView } from "./PanelView";

export default async function PanelPage() {
  const [surahs, tafsirs] = await Promise.all([
    prisma.surah.findMany({
      orderBy: { id: "asc" },
      select: { id: true, nameTr: true },
    }),
    prisma.tafsir.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return <PanelView surahs={surahs} tafsirs={tafsirs} />;
}
