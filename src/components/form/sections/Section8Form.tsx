"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useSaveOnNext } from "@/lib/hooks/useSaveOnNext";
import { saveSection8 } from "@/lib/actions/section8";
import { saveSection8ForAffiliate } from "@/lib/actions/admin-sections";
import type { Section8Data } from "@/lib/validations/section8";
import { useCompletion } from "@/lib/contexts/CompletionContext";
import { useAdminForm } from "@/lib/contexts/AdminFormContext";
import { SectionNavButtons } from "../SectionNavButtons";

const RESULTS_OPTIONS = [
  { value: "fax", label: "Fax" },
  { value: "pacs", label: "PACS Integration" },
  { value: "ehr_portal", label: "EHR Portal" },
  { value: "other", label: "Other" },
];

export function Section8Form({ initialData, onNavigate, disabled }: { initialData: Section8Data; onNavigate?: (section: number) => void; disabled?: boolean }) {
  const [data, setData] = useState<Section8Data>(initialData);

  const { updateStatuses } = useCompletion();
  const adminCtx = useAdminForm();
  const onSave = useCallback(async (d: Section8Data) => {
    if (adminCtx?.isAdminEditing) return saveSection8ForAffiliate(adminCtx.affiliateId, d);
    return saveSection8(d);
  }, [adminCtx]);
  const { save } = useSaveOnNext({ data, onSave, onAfterSave: updateStatuses });

  function update(field: keyof Section8Data, value: unknown) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h3 className="text-lg font-heading font-semibold mb-4">Radiology Network</h3>
        <div className="grid gap-4">
          <Input label="Network / Facility Name" required value={data.networkName ?? ""} onChange={(e) => update("networkName", e.target.value)} placeholder="If centralized, enter network name. If facility-specific, enter facility name + address." />
          <Input label="Order Delivery Method" required value={data.orderDeliveryMethod ?? ""} onChange={(e) => update("orderDeliveryMethod", e.target.value)} placeholder="e.g., fax, EHR integration, portal" />
          <Input label="Order Delivery Endpoint" required value={data.orderDeliveryEndpoint ?? ""} onChange={(e) => update("orderDeliveryEndpoint", e.target.value)} placeholder="Fax number, portal URL, etc." />
          <Select label="Results Delivery Method" required value={data.resultsDeliveryMethod ?? ""} onChange={(e) => update("resultsDeliveryMethod", e.target.value || null)} options={RESULTS_OPTIONS} placeholder="Select method" />
          <Input label="Results Delivery Endpoint" required value={data.resultsDeliveryEndpoint ?? ""} onChange={(e) => update("resultsDeliveryEndpoint", e.target.value)} placeholder="Fax number, portal URL, etc." />
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-heading font-semibold mb-1">Radiology Coordination Contact</h3>
        <p className="text-xs text-muted mb-5">Your point person for radiology-related questions and setup.</p>
        <div className="grid gap-4">
          <Input label="Name" required value={data.coordinationContactName ?? ""} onChange={(e) => update("coordinationContactName", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" required type="email" value={data.coordinationContactEmail ?? ""} onChange={(e) => update("coordinationContactEmail", e.target.value)} />
            <Input label="Phone" required value={data.coordinationContactPhone ?? ""} onChange={(e) => update("coordinationContactPhone", e.target.value)} />
          </div>
        </div>
      </Card>

      <SectionNavButtons currentSection={8} onNavigate={onNavigate} onSave={save} />
    </div>
  );
}
