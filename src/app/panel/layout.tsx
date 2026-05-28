import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/giris?callbackUrl=/panel");
  const role = (session.user as { role?: string }).role;

  return (
    <div className="min-h-screen">
      <TopBar
        userName={session.user.name ?? session.user.email ?? "Misafir"}
        role={role}
      />
      {children}
    </div>
  );
}
