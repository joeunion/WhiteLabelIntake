"use client";

import { useEffect, useRef } from "react";
import { GroupedToggleGrid } from "@/components/ui/ServiceToggles";
import type { SubServiceItem } from "@/lib/validations/section11";

interface SubServiceModalProps {
  open: boolean;
  onClose: () => void;
  serviceType: string;
  serviceLabel: string;
  subServiceDefs: SubServiceItem[];
  /** Current availability map: subType → available */
  subServiceState: Record<string, boolean>;
  onToggle: (subType: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function SubServiceModal({
  open,
  onClose,
  serviceType,
  serviceLabel,
  subServiceDefs,
  subServiceState,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: SubServiceModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  // Build items array matching the shape GroupedToggleGrid expects
  const items = subServiceDefs.map((def) => ({
    subType: def.value,
    selected: subServiceState[def.value] ?? true, // default available
  }));

  const selectedCount = items.filter((i) => i.selected).length;
  const totalCount = items.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto mx-4"
        role="dialog"
        aria-modal="true"
        aria-label={`${serviceLabel} sub-services`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-base font-heading font-semibold text-brand-black">{serviceLabel}</h3>
            <span className={`text-sm font-medium ${selectedCount > 0 ? "text-brand-teal" : "text-muted"}`}>
              {selectedCount} of {totalCount} selected
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-light text-muted hover:text-brand-black transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Select All / Deselect All */}
        <div className="px-5 pt-4">
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-xs text-brand-teal hover:underline"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={onDeselectAll}
              className="text-xs text-muted hover:underline"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Grouped toggles */}
        <div className="px-5 pb-5">
          <GroupedToggleGrid
            serviceType={serviceType}
            subServiceDefs={subServiceDefs}
            items={items}
            onToggle={onToggle}
          />
        </div>
      </div>
    </div>
  );
}
