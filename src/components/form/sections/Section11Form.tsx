"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { ServiceAccordion } from "@/components/ui/ServiceToggles";
import { useSaveOnNext } from "@/lib/hooks/useSaveOnNext";
import { saveSection11 } from "@/lib/actions/section11";
import { saveSection11ForAffiliate } from "@/lib/actions/admin-sections";
import { SUB_SERVICE_TYPES } from "@/lib/validations/section11";
import type { Section11Data } from "@/lib/validations/section11";
import { SERVICE_TYPES } from "@/lib/validations/section3";
import { useCompletion } from "@/lib/contexts/CompletionContext";
import { useAdminForm } from "@/lib/contexts/AdminFormContext";
import { SectionNavButtons } from "../SectionNavButtons";
import { useSyncSectionCache, useReportDirty } from "../OnboardingClient";
import type { CompletionStatus } from "@/types";

interface Section11FormProps {
  initialData?: Section11Data;
  onNavigate?: (section: number) => void;
  disabled?: boolean;
  unlockedPhases?: number[];
}

export function Section11Form({ initialData, onNavigate, disabled, unlockedPhases = [1, 2] }: Section11FormProps) {
  const [data, setData] = useState<Section11Data>(initialData ?? { categories: {} });
  useSyncSectionCache(11, data);
  const { updateStatuses } = useCompletion();
  const adminCtx = useAdminForm();

  const onSave = useCallback(async (d: Section11Data): Promise<Record<number, CompletionStatus>> => {
    if (adminCtx?.isAdminEditing) return saveSection11ForAffiliate(adminCtx.affiliateId, d);
    return saveSection11(d);
  }, [adminCtx]);

  const { save, isDirty } = useSaveOnNext({ data, onSave, onAfterSave: updateStatuses });
  useReportDirty(11, isDirty);

  function toggleItem(serviceType: string, subType: string) {
    setData((prev) => ({
      categories: {
        ...prev.categories,
        [serviceType]: (prev.categories[serviceType] ?? []).map((item) =>
          item.subType === subType ? { ...item, selected: !item.selected } : item
        ),
      },
    }));
  }

  function selectAll(serviceType: string) {
    setData((prev) => ({
      categories: {
        ...prev.categories,
        [serviceType]: (prev.categories[serviceType] ?? []).map((item) => ({
          ...item,
          selected: true,
        })),
      },
    }));
  }

  function deselectAll(serviceType: string) {
    setData((prev) => ({
      categories: {
        ...prev.categories,
        [serviceType]: (prev.categories[serviceType] ?? []).map((item) => ({
          ...item,
          selected: false,
        })),
      },
    }));
  }

  const serviceTypes = Object.keys(data.categories);

  if (serviceTypes.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <p className="text-sm text-muted">
            No services have been selected in Section 3 (In-Person & Extended Services).
            Please go back and select at least one service category first.
          </p>
        </Card>
        <SectionNavButtons currentSection={11} onNavigate={onNavigate} onSave={save} unlockedPhases={unlockedPhases} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <p className="text-sm text-muted mb-4">
          For each service category you selected, choose which specific sub-services are covered under your program.
          Items not selected will not be covered — members needing these will use traditional insurance or pay out of pocket.
        </p>
      </Card>

      {serviceTypes.map((serviceType) => {
        const items = data.categories[serviceType] ?? [];
        const selectedCount = items.filter((i) => i.selected).length;
        const totalCount = items.length;
        const serviceLabel = SERVICE_TYPES.find((st) => st.value === serviceType)?.label ?? serviceType;
        const subServiceDefs = SUB_SERVICE_TYPES[serviceType] ?? [];

        return (
          <ServiceAccordion
            key={serviceType}
            serviceType={serviceType}
            label={serviceLabel}
            items={items}
            subServiceDefs={subServiceDefs}
            selectedCount={selectedCount}
            totalCount={totalCount}
            onToggle={(subType) => toggleItem(serviceType, subType)}
            onSelectAll={() => selectAll(serviceType)}
            onDeselectAll={() => deselectAll(serviceType)}
            disabled={disabled}
          />
        );
      })}

      <SectionNavButtons currentSection={11} onNavigate={onNavigate} onSave={save} unlockedPhases={unlockedPhases} />
    </div>
  );
}
