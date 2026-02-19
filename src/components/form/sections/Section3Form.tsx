"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { useSaveOnNext } from "@/lib/hooks/useSaveOnNext";
import { saveSection3 } from "@/lib/actions/section3";
import { saveSection3ForAffiliate } from "@/lib/actions/admin-sections";
import { SERVICE_TYPES } from "@/lib/validations/section3";
import type { Section3Data } from "@/lib/validations/section3";
import { useCompletion } from "@/lib/contexts/CompletionContext";
import { useAdminForm } from "@/lib/contexts/AdminFormContext";
import { SectionNavButtons } from "../SectionNavButtons";
import { useSyncSectionCache, useReportDirty } from "../OnboardingClient";

export function Section3Form({ initialData, onNavigate, disabled }: { initialData: Section3Data; onNavigate?: (section: number) => void; disabled?: boolean }) {
  const [data, setData] = useState<Section3Data>(initialData);
  useSyncSectionCache(3, data);
  const { updateStatuses } = useCompletion();
  const adminCtx = useAdminForm();

  const onSave = useCallback(async (d: Section3Data) => {
    if (adminCtx?.isAdminEditing) return saveSection3ForAffiliate(adminCtx.affiliateId, d);
    return saveSection3(d);
  }, [adminCtx]);

  const { save, isDirty } = useSaveOnNext({ data, onSave, onAfterSave: updateStatuses });
  useReportDirty(3, isDirty);

  function toggleService(index: number) {
    setData((prev) => ({
      services: prev.services.map((s, i) =>
        i === index ? { ...s, selected: !s.selected } : s
      ),
    }));
  }

  function updateOtherName(index: number, name: string) {
    setData((prev) => ({
      services: prev.services.map((s, i) =>
        i === index ? { ...s, otherName: name } : s
      ),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h3 className="text-lg font-heading font-semibold mb-1">
          Which services are part of your program?
        </h3>
        <p className="text-xs text-muted mb-5">
          Select the services that are part of your program. After submission, our team will work with you to configure pricing, availability, and fulfillment details for each selected service.
        </p>

        <div className="flex flex-col gap-3">
          {data.services.map((service, index) => {
            const meta = SERVICE_TYPES.find((st) => st.value === service.serviceType);
            const isLocked = meta && "locked" in meta && meta.locked;
            return (
              <div key={service.serviceType}>
                <Checkbox
                  label={meta?.label ?? service.serviceType}
                  name={`service-${service.serviceType}`}
                  checked={isLocked ? true : service.selected}
                  onChange={isLocked ? undefined : () => toggleService(index)}
                  disabled={!!isLocked}
                />
                {service.serviceType === "other" && service.selected && (
                  <div className="ml-8 mt-2">
                    <Input
                      label="Specify service"
                      name="otherServiceName"
                      value={service.otherName ?? ""}
                      onChange={(e) => updateOtherName(index, e.target.value)}
                      placeholder="Describe the service"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted mt-4 italic">
          Selected services are covered under your program and utilization is reported back to you. Non-selected services are not covered — members needing these will be referred out and may use their traditional insurance or pay out of pocket.
        </p>
      </Card>

      <SectionNavButtons currentSection={3} onNavigate={onNavigate} onSave={save} />
    </div>
  );
}
