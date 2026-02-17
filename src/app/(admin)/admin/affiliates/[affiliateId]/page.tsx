export const dynamic = "force-dynamic";

import { getAffiliateDetail } from "@/lib/actions/admin";
import { getCompletionStatuses } from "@/lib/actions/completion";
import { AffiliateDetailView } from "@/components/admin/AffiliateDetailView";
import { notFound } from "next/navigation";

export default async function AffiliateDetailPage({
  params,
}: {
  params: Promise<{ affiliateId: string }>;
}) {
  const { affiliateId } = await params;

  const affiliate = await getAffiliateDetail(affiliateId);
  if (!affiliate) notFound();

  const statuses = await getCompletionStatuses(affiliateId);

  return <AffiliateDetailView affiliate={affiliate} statuses={statuses} />;
}
