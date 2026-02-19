"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { useSaveOnNext } from "@/lib/hooks/useSaveOnNext";
import { saveSection7 } from "@/lib/actions/section7";
import { saveSection7ForAffiliate } from "@/lib/actions/admin-sections";
import type { Section7Data } from "@/lib/validations/section7";
import { useCompletion } from "@/lib/contexts/CompletionContext";
import { useAdminForm } from "@/lib/contexts/AdminFormContext";
import { SectionNavButtons } from "../SectionNavButtons";
import { useSyncSectionCache, useReportDirty } from "../OnboardingClient";

const LAB_OPTIONS = [
  { value: "quest", label: "Quest Diagnostics" },
  { value: "labcorp", label: "Labcorp" },
  { value: "other", label: "Other" },
];

export function Section7Form({ initialData, onNavigate, disabled }: { initialData: Section7Data; onNavigate?: (section: number) => void; disabled?: boolean }) {
  const [data, setData] = useState<Section7Data>(initialData);
  useSyncSectionCache(7, data);

  const { updateStatuses } = useCompletion();
  const adminCtx = useAdminForm();
  const onSave = useCallback(async (d: Section7Data) => {
    if (adminCtx?.isAdminEditing) return saveSection7ForAffiliate(adminCtx.affiliateId, d);
    return saveSection7(d);
  }, [adminCtx]);
  const { save, isDirty } = useSaveOnNext({ data, onSave, onAfterSave: updateStatuses });
  useReportDirty(7, isDirty);

  function update(field: keyof Section7Data, value: unknown) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h3 className="text-lg font-heading font-semibold mb-4">Lab Network</h3>
        <RadioGroup name="networkType" label="Which lab network does your organization use?" options={LAB_OPTIONS} value={data.networkType ?? undefined} onChange={(v) => update("networkType", v)} required />

        {data.networkType === "other" && (
          <div className="mt-4 flex flex-col gap-4">
            <Input label="Network Name" required value={data.otherNetworkName ?? ""} onChange={(e) => update("otherNetworkName", e.target.value)} />
            <Checkbox
              label="I understand that a scoped integration project will be scheduled to configure lab order and results delivery."
              name="integrationAcknowledged"
              checked={data.integrationAcknowledged ?? false}
              onChange={(e) => update("integrationAcknowledged", e.target.checked)}
            />
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
