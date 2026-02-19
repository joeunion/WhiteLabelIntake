"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { useSaveOnNext } from "@/lib/hooks/useSaveOnNext";
import { saveSection8 } from "@/lib/actions/section8";
import { saveSection8ForAffiliate } from "@/lib/actions/admin-sections";
import type { Section8Data } from "@/lib/validations/section8";
import { useCompletion } from "@/lib/contexts/CompletionContext";
import { useAdminForm } from "@/lib/contexts/AdminFormContext";
import { SectionNavButtons } from "../SectionNavButtons";
import { useSyncSectionCache, useReportDirty } from "../OnboardingClient";

export function Section8Form({ initialData, onNavigate, disabled }: { initialData: Section8Data; onNavigate?: (section: number) => void; disabled?: boolean }) {
  const [data, setData] = useState<Section8Data>(initialData);
  useSyncSectionCache(8, data);

  const { updateStatuses } = useCompletion();
  const adminCtx = useAdminForm();
  const onSave = useCallback(async (d: Section8Data) => {
    if (adminCtx?.isAdminEditing) return saveSection8ForAffiliate(adminCtx.affiliateId, d);
    return saveSection8(d);
  }, [adminCtx]);
  const { save, isDirty } = useSaveOnNext({ data, onSave, onAfterSave: updateStatuses });
  useReportDirty(8, isDirty);

  function update(field: keyof Section8Data, value: unknown) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h3 className="text-lg font-heading font-semibold mb-4">Radiology Network</h3>
        <div className="grid gap-4">
          <Input label="Network / Facility Name" required value={data.networkName ?? ""} onChange={(e) => update("networkName", e.target.value)} placeholder="If centralized, enter network name. If facility-specific, enter facility name + address." />

          <h4 className="text-sm font-heading font-semibold mt-2">Coordination Contact</h4>
          <Input label="Name" required value={data.coordinationContactName ?? ""} onChange={(e) => update("coordinationContactName", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" required type="email" value={data.coordinationContactEmail ?? ""} onChange={(e) => update("coordinationContactEmail", e.target.value)} />
            <Input label="Phone" required value={data.coordinationContactPhone ?? ""} onChange={(e) => update("coordinationContactPhone", e.target.value)} />
          </div>

          <div className="mt-2">
            <Checkbox
              label="I understand that a scoped integration project will be scheduled to configure radiology order and results delivery."
              name="integrationAcknowledged"
              checked={data.integrationAcknowledged ?? false}
              onChange={(e) => update("integrationAcknowledged", e.target.checked)}
            />
          </div>
        </div>
      </Card>

      <SectionNavButtons currentSection={8} onNavigate={onNavigate} onSave={save} />
    </div>
  );
}
