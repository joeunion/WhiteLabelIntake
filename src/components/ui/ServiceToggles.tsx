"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { getGroupsForServiceType } from "@/lib/validations/section11";
import type { SubServiceItem } from "@/lib/validations/section11";

// ─── Toggle Item ────────────────────────────────────────────────────

export function ToggleItem({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={label}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onChange}
      onKeyDown={disabled ? undefined : (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange(); } }}
      className={`
        flex items-center gap-2.5 px-2 py-1.5 rounded cursor-pointer text-sm
        transition-colors select-none
        ${checked ? "bg-brand-teal/5 text-brand-black" : "text-muted hover:bg-gray-light"}
        ${disabled ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      <div
        className={`
          w-8 h-4.5 rounded-full transition-colors flex-shrink-0 relative
          ${checked ? "bg-brand-teal" : "bg-gray-300"}
        `}
        style={{ width: "2rem", height: "1.125rem" }}
      >
        <div
          className={`
            absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform
            ${checked ? "translate-x-[0.875rem]" : "translate-x-0.5"}
          `}
          style={{ width: "0.875rem", height: "0.875rem" }}
        />
      </div>
      <span className="truncate">{label}</span>
    </div>
  );
}

// ─── Grouped Toggle Grid ────────────────────────────────────────────
// Renders the group headers + 2-column toggle layout used by both
// ServiceAccordion and SubServiceModal.

export function GroupedToggleGrid({
  serviceType,
  subServiceDefs,
  items,
  onToggle,
  disabled,
}: {
  serviceType: string;
  subServiceDefs: SubServiceItem[];
  items: { subType: string; selected: boolean }[];
  onToggle: (subType: string) => void;
  disabled?: boolean;
}) {
  const groups = getGroupsForServiceType(serviceType);
  const hasGroups = groups.length > 1;

  if (hasGroups) {
    return (
      <>
        {groups.map((group) => {
          const groupItems = subServiceDefs.filter((d) => d.group === group);
          return (
            <div key={group} className="mb-4 last:mb-0">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{group}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {groupItems.map((def) => {
                  const item = items.find((i) => i.subType === def.value);
                  const checked = item?.selected ?? false;
                  return (
                    <ToggleItem
                      key={def.value}
                      label={def.label}
                      checked={checked}
                      onChange={() => onToggle(def.value)}
                      disabled={disabled}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
      {subServiceDefs.map((def) => {
        const item = items.find((i) => i.subType === def.value);
        const checked = item?.selected ?? false;
        return (
          <ToggleItem
            key={def.value}
            label={def.label}
            checked={checked}
            onChange={() => onToggle(def.value)}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}

// ─── Service Accordion ──────────────────────────────────────────────

export interface ServiceAccordionProps {
  serviceType: string;
  label: string;
  items: { subType: string; selected: boolean }[];
  subServiceDefs: SubServiceItem[];
  selectedCount: number;
  totalCount: number;
  onToggle: (subType: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  disabled?: boolean;
}

export function ServiceAccordion({
  serviceType,
  label,
  items,
  subServiceDefs,
  selectedCount,
  totalCount,
  onToggle,
  onSelectAll,
  onDeselectAll,
  disabled,
}: ServiceAccordionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-1 text-left"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`h-4 w-4 text-muted transition-transform ${expanded ? "rotate-90" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-base font-heading font-semibold text-brand-black">{label}</span>
        </div>
        <span className={`text-sm font-medium ${selectedCount > 0 ? "text-brand-teal" : "text-muted"}`}>
          {selectedCount} of {totalCount} selected
        </span>
      </button>

      {expanded && (
        <div className="mt-4 border-t border-border pt-4">
          {/* Select/Deselect All */}
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={onSelectAll}
              disabled={disabled}
              className="text-xs text-brand-teal hover:underline disabled:opacity-50"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={onDeselectAll}
              disabled={disabled}
              className="text-xs text-muted hover:underline disabled:opacity-50"
            >
              Deselect All
            </button>
          </div>

          <GroupedToggleGrid
            serviceType={serviceType}
            subServiceDefs={subServiceDefs}
            items={items}
            onToggle={onToggle}
            disabled={disabled}
          />
        </div>
      )}
    </Card>
  );
}
