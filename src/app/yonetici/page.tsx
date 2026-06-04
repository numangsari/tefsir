"use client";

import { useState } from "react";
import { GenelBakisTab } from "./GenelBakisTab";
import { TrafikTab } from "./TrafikTab";
import { KullanicilarTab } from "./KullanicilarTab";
import { IcerikTab } from "./IcerikTab";
import { Tabs, type TabDef } from "./ui";

type TabKey = "genel" | "trafik" | "kullanicilar" | "icerik";

const TABS: TabDef<TabKey>[] = [
  { key: "genel", label: "Genel Bakış" },
  { key: "trafik", label: "Trafik" },
  { key: "kullanicilar", label: "Kullanıcılar" },
  { key: "icerik", label: "İçerik & Modernizasyon" },
];

export default function YoneticiPage() {
  const [tab, setTab] = useState<TabKey>("genel");

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-amber-700 dark:text-amber-300 mb-6">
        Yönetici Paneli
      </h1>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "genel" && <GenelBakisTab />}
      {tab === "trafik" && <TrafikTab />}
      {tab === "kullanicilar" && <KullanicilarTab />}
      {tab === "icerik" && <IcerikTab />}
    </main>
  );
}
