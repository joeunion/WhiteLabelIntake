import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CompletionDashboard } from "@/components/dashboard/CompletionDashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, affiliateId: true },
  });

  if (user?.role !== "ADMIN") redirect("/onboarding");

  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-heading font-semibold text-brand-black mb-6">
          Completion Dashboard
        </h1>
        <CompletionDashboard affiliateId={user.affiliateId!} />
      </div>
    </div>
  );
}
