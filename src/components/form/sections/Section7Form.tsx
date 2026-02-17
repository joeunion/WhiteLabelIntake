"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { useSaveOnNext } from "@/lib/hooks/useSaveOnNext";
import { saveSection7 } from "@/lib/actions/section7";
import { saveSection7ForAffiliate } from "@/lib/actions/admin-sections";
import type { Section7Data } from "@/lib/validations/section7";
import { useCompletion } from "@/lib/contexts/CompletionContext";
import { useAdminForm } from "@/lib/contexts/AdminFormContext";
import { SectionNavButtons } from "../SectionNavButtons";

const LAB_OPTIONS = [
  { value: "quest", label: "Quest Diagnostics" },
  { value: "labcorp", label: "Labcorp" },
  { value: "other", label: "Other" },
];

export function Section7Form({ initialData, onNavigate, disabled }: { initialData: Section7Data; onNavigate?: (section: number) => void; disabled?: boolean }) {
  const [data, setData] = useState<Section7Data>(initialData);

  const { updateStatuses } = useCompletion();
  const adminCtx = useAdminForm();
  const onSave = useCallback(async (d: Section7Data) => {
    if (adminCtx?.isAdminEditing) return saveSection7ForAffiliate(adminCtx.affiliateId, d);
    return saveSection7(d);
  }, [adminCtx]);
  const { save } = useSaveOnNext({ data, onSave, onAfterSave: updateStatuses });

  function update(field: keyof Section7Data, value: unknown) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h3 className="text-lg font-heading font-semibold mb-4">Lab Network</h3>
        <RadioGroup name="networkType" label="Which lab network does your organization use?" options={LAB_OPTIONS} value={data.networkType ?? undefined} onChange={(v) => update("networkType", v)} required />

        {data.networkType === "other" && (
          <div className="mt-4">
            <Input label="Network Name" required value={data.otherNetworkName ?? ""} onChange={(e) => update("otherNetworkName", e.target.value)} />
            <p className="text-xs text-warm-orange italic mt-2">
              Integrating with a non-standard lab network requires a scoped project. Our team will follow up with your lab coordination contact to assess feasibility and timeline.
            </p>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-heading font-semibold mb-1">Lab Coordination Contact</h3>
        <p className="text-xs text-muted mb-5">Your point person for lab-related questions and setup.</p>
        <div className="grid gap-4">
          <Input label="Name" required value={data.coordinationContactName ?? ""} onChange={(e) => update("coordinationContactName", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" required type="email" value={data.coordinationContactEmail ?? ""} onChange={(e) => update("coordinationContactEmail", e.target.value)} />
            <Input label="Phone" required value={data.coordinationContactPhone ?? ""} onChange={(e) => update("coordinationContactPhone", e.target.value)} />
          </div>
        </div>
      </Card>

      <SectionNavButtons currentSection={7} onNavigate={onNavigate} onSave={save} />
    </div>
  );
}
