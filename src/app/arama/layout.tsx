import { auth } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";

export default async function AramaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;
  const role = (user as { role?: string } | undefined)?.role;

  return (
    <div className="min-h-screen">
      <TopBar
        userName={user?.name ?? user?.email ?? undefined}
        role={role}
        isGuest={!user}
      />
      {children}
    </div>
  );
}
