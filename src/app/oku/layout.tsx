import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { ResumeButton } from "@/components/ResumeButton";

export const dynamic = "force-dynamic";

export default async function OkuLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/?callbackUrl=/oku");
  const role = (session.user as { role?: string }).role;

  return (
    <div className="min-h-screen">
      <TopBar
        userName={session.user.name ?? session.user.email ?? "Misafir"}
        role={role}
      />
      <div className="mx-auto max-w-[1400px] px-4 pt-2">
        <ResumeButton />
      </div>
      {children}
    </div>
  );
}
