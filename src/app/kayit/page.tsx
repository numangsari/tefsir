import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthUnified } from "@/components/AuthUnified";

export const dynamic = "force-dynamic";

export default async function KayitPage() {
  const session = await auth();
  if (session?.user) redirect("/oku");

  return <AuthUnified defaultTab="kayit" />;
}
