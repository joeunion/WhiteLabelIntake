export const dynamic = "force-dynamic";

import { getAffiliateDetail, getPhaseStatuses, getSellerFlowStatus } from "@/lib/actions/admin";
import { getCompletionStatuses } from "@/lib/actions/completion";
import { AffiliateDetailView } from "@/components/admin/AffiliateDetailView";
import { notFound } from "next/navigation";

export default async function AffiliateDetailPage({
  params,
}: {
  params: Promise<{ affiliateId: string }>;
}) {
  const { affiliateId } = await params;

  const [affiliate, statuses, phaseStatuses, sellerFlowStatus] = await Promise.all([
    getAffiliateDetail(affiliateId),
    getCompletionStatuses(affiliateId),
    getPhaseStatuses(affiliateId),
    getSellerFlowStatus(affiliateId),
  ]);

  if (!affiliate) notFound();

  return (
    <AffiliateDetailView
      affiliate={affiliate}
      statuses={statuses}
      phaseStatuses={phaseStatuses}
      sellerFlowStatus={sellerFlowStatus}
    />
  );
}
