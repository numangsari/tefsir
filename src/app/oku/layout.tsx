import { auth } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { ResumeButton } from "@/components/ResumeButton";

export const dynamic = "force-dynamic";

export default async function OkuLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;
  const role = (user as { role?: string } | undefined)?.role;
  const isGuest = !user;

  return (
    <div className="min-h-screen">
      <TopBar
        userName={user?.name ?? user?.email ?? undefined}
        role={role}
        isGuest={isGuest}
      />
      <div className="mx-auto max-w-[1400px] px-4 pt-2">
        {!isGuest && <ResumeButton />}
      </div>
      {children}
    </div>
  );
}
