import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthUnified } from "@/components/AuthUnified";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();

  if (session?.user) {
    redirect("/oku");
  }

  return <AuthUnified defaultTab={sp.tab === "kayit" ? "kayit" : "giris"} />;
}
