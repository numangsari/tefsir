import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { ContactForm } from "./ContactForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "tefsir.net ile iletişime geçin. Görüş, öneri ve hata bildirimlerinizi bize iletin.",
  alternates: { canonical: "/iletisim" },
};

export default async function IletisimPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold text-emerald-700 dark:text-emerald-300">
        İletişim
      </h1>
      <p className="mt-2 text-stone-600 dark:text-stone-400 leading-relaxed">
        Görüş, öneri ve hata bildirimleriniz için aşağıdaki formu doldurun. En kısa sürede
        size dönüş yapmaya çalışacağız.
      </p>

      <div className="mt-7">
        <ContactForm
          defaultName={user?.name ?? ""}
          defaultEmail={user?.email ?? ""}
        />
      </div>
    </main>
  );
}
