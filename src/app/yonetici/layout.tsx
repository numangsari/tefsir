import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";

export default async function YoneticiLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/giris?callbackUrl=/yonetici");
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen">
      <TopBar
        userName={session.user.name ?? session.user.email ?? "Yönetici"}
        role={role}
      />
      {children}
    </div>
  );
}
