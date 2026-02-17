import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminTopNav } from "@/components/admin/AdminTopNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Defense-in-depth: verify SUPER_ADMIN role (middleware also checks)
  const role = (session.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN") redirect("/onboarding");

  return (
    <div className="min-h-screen bg-off-white">
      <AdminTopNav />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
