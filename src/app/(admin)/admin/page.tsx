export const dynamic = "force-dynamic";

import { listAffiliates } from "@/lib/actions/admin";
import { AffiliateList } from "@/components/admin/AffiliateList";

export default async function AdminPage() {
  const affiliates = await listAffiliates();

  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold text-brand-black mb-6">
        Clients
      </h1>
      <AffiliateList affiliates={affiliates} />
    </div>
  );
}
