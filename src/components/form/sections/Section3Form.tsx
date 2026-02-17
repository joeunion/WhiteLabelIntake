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

export function Section3Form({ initialData, onNavigate, disabled }: { initialData: Section3Data; onNavigate?: (section: number) => void; disabled?: boolean }) {
  const [data, setData] = useState<Section3Data>(initialData);
  const { updateStatuses } = useCompletion();
  const adminCtx = useAdminForm();

  const onSave = useCallback(async (d: Section3Data) => {
    if (adminCtx?.isAdminEditing) return saveSection3ForAffiliate(adminCtx.affiliateId, d);
    return saveSection3(d);
  }, [adminCtx]);

  const { save } = useSaveOnNext({ data, onSave, onAfterSave: updateStatuses });

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
            return (
              <div key={service.serviceType}>
                <Checkbox
                  label={meta?.label ?? service.serviceType}
                  name={`service-${service.serviceType}`}
                  checked={service.selected}
                  onChange={() => toggleService(index)}
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
          If a service is not selected, Care Navigation will not reference or offer it as part of your program.
        </p>
      </Card>

      <SectionNavButtons currentSection={3} onNavigate={onNavigate} onSave={save} />
    </div>
  );
}
