"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Button } from "@/components/ui/Button";
import { useSaveOnNext } from "@/lib/hooks/useSaveOnNext";
import { saveSellerLab } from "@/lib/actions/seller-lab";
import type { SellerLabData } from "@/lib/validations/seller-lab";

const LAB_OPTIONS = [
  { value: "quest", label: "Quest Diagnostics" },
  { value: "labcorp", label: "Labcorp" },
  { value: "other", label: "Other" },
];

interface Props {
  initialData: SellerLabData;
  onNavigate?: (sectionId: string) => void;
  onStatusUpdate?: (statuses: Record<string, string>) => void;
  disabled?: boolean;
}

export function SellerLabForm({ initialData, onNavigate, onStatusUpdate, disabled }: Props) {
  const [data, setData] = useState<SellerLabData>(initialData);

  const onSave = useCallback(async (d: SellerLabData) => {
    const statuses = await saveSellerLab(d);
    onStatusUpdate?.(statuses);
    return {};
  }, [onStatusUpdate]);

  const { save, isDirty } = useSaveOnNext({ data, onSave });

  function update(field: keyof SellerLabData, value: unknown) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h3 className="text-lg font-heading font-semibold mb-4">Lab Network</h3>
        <RadioGroup
          name="sellerNetworkType"
          label="Which lab network does your organization use?"
          options={LAB_OPTIONS}
          value={data.networkType ?? undefined}
          onChange={(v) => update("networkType", v)}
          required
        />

        {data.networkType === "other" && (
          <div className="mt-4 flex flex-col gap-4">
            <Input
              label="Network Name"
              required
              value={data.otherNetworkName ?? ""}
              onChange={(e) => update("otherNetworkName", e.target.value)}
              disabled={disabled}
            />
            <Checkbox
              label="I understand that a scoped integration project will be scheduled to configure lab order and results delivery."
              name="sellerIntegrationAcknowledged"
              checked={data.integrationAcknowledged ?? false}
              onChange={(e) => update("integrationAcknowledged", e.target.checked)}
              disabled={disabled}
            />
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-heading font-semibold mb-1">Lab Coordination Contact</h3>
        <p className="text-xs text-muted mb-5">Your point person for lab-related questions and setup.</p>
        <div className="grid gap-4">
          <Input
            label="Name"
            required
            value={data.coordinationContactName ?? ""}
            onChange={(e) => update("coordinationContactName", e.target.value)}
            disabled={disabled}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              required
              type="email"
              value={data.coordinationContactEmail ?? ""}
              onChange={(e) => update("coordinationContactEmail", e.target.value)}
              disabled={disabled}
            />
            <Input
              label="Phone"
              required
              value={data.coordinationContactPhone ?? ""}
              onChange={(e) => update("coordinationContactPhone", e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </Card>

      {!disabled && (
        <div className="flex justify-between pt-4">
          <Button variant="secondary" type="button" onClick={() => onNavigate?.("S-3")}>
            &larr; Previous
          </Button>
          <Button
            variant="cta"
            type="button"
            onClick={async () => {
              await save();
              onNavigate?.("S-6");
            }}
          >
            {isDirty ? "Save & Next \u2192" : "Next \u2192"}
          </Button>
        </div>
      )}
    </div>
  );
}
