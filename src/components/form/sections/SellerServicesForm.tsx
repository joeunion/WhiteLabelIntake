"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { useSaveOnNext } from "@/lib/hooks/useSaveOnNext";
import { saveSellerServices } from "@/lib/actions/seller-services";
import { SELLER_SERVICE_TYPES } from "@/lib/validations/seller-services";
import type { SellerServicesData } from "@/lib/validations/seller-services";

interface Props {
  initialData: SellerServicesData;
  onNavigate?: (sectionId: string) => void;
  onStatusUpdate?: (statuses: Record<string, string>) => void;
  onServicesChange?: (data: SellerServicesData) => void;
  disabled?: boolean;
}

export function SellerServicesForm({ initialData, onNavigate, onStatusUpdate, onServicesChange, disabled }: Props) {
  const [data, setData] = useState<SellerServicesData>(initialData);

  const onSave = useCallback(async (d: SellerServicesData) => {
    const statuses = await saveSellerServices(d);
    onStatusUpdate?.(statuses);
    onServicesChange?.(d);
    return {};
  }, [onStatusUpdate, onServicesChange]);

  const { save, isDirty } = useSaveOnNext({ data, onSave });

  function toggleService(index: number) {
    setData((prev) => ({
      services: prev.services.map((s, i) =>
        i === index ? { ...s, selected: !s.selected } : s
      ),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h3 className="text-lg font-heading font-semibold mb-1">
          Services Your Organization Offers
        </h3>
        <p className="text-xs text-muted mb-5">
          Select the services your care delivery organization provides. This defines the default
          service catalog for your locations.
        </p>

        <div className="flex flex-col gap-3">
          {data.services.map((service, index) => {
            const meta = SELLER_SERVICE_TYPES.find((st) => st.value === service.serviceType);
            return (
              <Checkbox
                key={service.serviceType}
                label={meta?.label ?? service.serviceType}
                name={`seller-service-${service.serviceType}`}
                checked={service.selected}
                onChange={() => toggleService(index)}
                disabled={disabled}
              />
            );
          })}
        </div>

        <p className="text-xs text-muted mt-4">
          You can configure per-location availability and sub-service details in the Physical Locations section.
        </p>
      </Card>

      {!disabled && (
        <div className="flex justify-between pt-4">
          <Button variant="secondary" type="button" onClick={() => onNavigate?.("S-1")}>
            &larr; Previous
          </Button>
          <Button
            variant="cta"
            type="button"
            onClick={async () => {
              await save();
              onNavigate?.("S-2");
            }}
          >
            {isDirty ? "Save & Next \u2192" : "Next \u2192"}
          </Button>
        </div>
      )}
    </div>
  );
}
