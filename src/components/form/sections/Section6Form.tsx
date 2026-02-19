"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useSaveOnNext } from "@/lib/hooks/useSaveOnNext";
import { saveSection6, deleteProvider } from "@/lib/actions/section6";
import { saveSection6ForAffiliate, deleteProviderForAffiliate } from "@/lib/actions/admin-sections";
import type { Section6Data, ProviderData } from "@/lib/validations/section6";
import { useCompletion } from "@/lib/contexts/CompletionContext";
import { useAdminForm } from "@/lib/contexts/AdminFormContext";
import { SectionNavButtons } from "../SectionNavButtons";
import { useSyncSectionCache, useReportDirty } from "../OnboardingClient";
import { CSVUploadButton } from "@/components/ui/CSVUploadButton";
import { PROVIDER_CSV_COLUMNS, providerCSVRowSchema } from "@/lib/csv/providerColumns";
import type { ProviderCSVRow } from "@/lib/csv/providerColumns";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
].map((s) => ({ value: s, label: s }));

function emptyProvider(): ProviderData {
  return {
    firstName: "", lastName: "", providerType: null, licenseNumber: "",
    licenseState: "", npi: "", deaNumber: "",
  };
}

function providerComplete(prov: ProviderData): boolean {
  return !!(prov.firstName && prov.lastName && prov.providerType &&
            prov.licenseNumber && prov.licenseState && prov.npi);
}

function providerHasData(prov: ProviderData): boolean {
  if (prov.id) return true;
  return !!(prov.firstName || prov.lastName || prov.providerType ||
            prov.licenseNumber || prov.licenseState || prov.npi);
}

function formatProviderName(prov: ProviderData, index: number): string {
  const name = [prov.firstName, prov.lastName].filter(Boolean).join(" ");
  return name || `Provider ${index + 1}`;
}

export function Section6Form({ initialData, onNavigate, disabled }: { initialData: Section6Data; onNavigate?: (section: number) => void; disabled?: boolean }) {
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [data, setData] = useState<Section6Data>(() => {
    if (initialData.providers.length === 0) {
      return { providers: [emptyProvider()] };
    }
    return initialData;
  });
  useSyncSectionCache(6, data);

  const { updateStatuses } = useCompletion();
  const adminCtx = useAdminForm();

  const onSave = useCallback(async (d: Section6Data) => {
    const result = adminCtx?.isAdminEditing
      ? await saveSection6ForAffiliate(adminCtx.affiliateId, d)
      : await saveSection6(d);
    // Assign server-generated IDs back into state immutably (no direct mutation)
    setData((prev) => {
      const updated = prev.providers.map((p, i) =>
        p.id !== result.providerIds[i] ? { ...p, id: result.providerIds[i] } : p
      );
      return updated.some((p, i) => p !== prev.providers[i])
        ? { providers: updated }
        : prev;
    });
    return result.statuses;
  }, [adminCtx]);

  const { save, isDirty } = useSaveOnNext({ data, onSave, onAfterSave: updateStatuses });
  useReportDirty(6, isDirty);

  function updateProvider(index: number, field: keyof ProviderData, value: unknown) {
    setData((prev) => ({
      providers: prev.providers.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  }

  function addProvider() {
    setData((prev) => {
      setOpenIndex(prev.providers.length);
      return { providers: [...prev.providers, emptyProvider()] };
    });
  }

  function handleCSVImport(rows: ProviderCSVRow[]) {
    const newProviders = rows.map((row) => ({
      ...emptyProvider(),
      ...row,
    } as ProviderData));
    // Compute the updated data outside the state setter so we can save
    // without side effects inside React's state updater (strict-mode safe).
    let updated: Section6Data;
    setData((prev) => {
      updated = { providers: [...prev.providers, ...newProviders] };
      return updated;
    });
    // Save outside the setter — fires once even in React strict mode.
    // onSave handles ID assignment and returns statuses.
    onSave(updated!).then(updateStatuses).catch(() => {
      toast.error("Some imported providers could not be saved.");
    });
  }

  function removeProvider(index: number) {
    const prov = data.providers[index];
    if (!prov) return;
    const provId = prov.id;
    if (providerHasData(prov)) {
      const name = formatProviderName(prov, index);
      if (!confirm(`Remove "${name}"? This provider has data that will be lost.`)) return;
    }
    // Use provider identity (id or reference) instead of index to avoid
    // stale-index issues when rapidly removing multiple providers.
    setOpenIndex((prev) => {
      if (index === prev) return Math.min(prev, data.providers.length - 2);
      if (index < prev) return prev - 1;
      return prev;
    });
    setData((prev) => ({
      providers: prev.providers.filter((p) =>
        provId ? p.id !== provId : p !== prov
      ),
    }));
    if (provId) {
      const deleteFn = adminCtx?.isAdminEditing
        ? () => deleteProviderForAffiliate(adminCtx.affiliateId, provId)
        : () => deleteProvider(provId);
      deleteFn().catch((err) => {
        console.error("Failed to delete provider:", err);
        toast.error("Failed to remove provider. It may reappear on refresh.");
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-muted">
        These providers will be granted access to scheduling and clinical systems used to support your program participants.
      </p>

      {data.providers.map((prov, index) => {
        const isOpen = index === openIndex;
        const isComplete = providerComplete(prov);

        /* ── Collapsed summary ── */
        if (!isOpen) {
          const details = [
            prov.npi && `NPI: ${prov.npi}`,
            prov.licenseNumber && `License: ${prov.licenseNumber}${prov.licenseState ? ` (${prov.licenseState})` : ""}`,
          ].filter(Boolean).join(" \u00b7 ");

          return (
            <Card key={index}>
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setOpenIndex(index)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-heading font-semibold truncate">
                    {formatProviderName(prov, index)}
                  </h3>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {isComplete ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm3.78-9.72a.75.75 0 0 0-1.06-1.06L7 8.94 5.28 7.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4.25-4.25Z" clipRule="evenodd" /></svg>
                        Complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <svg className="w-3 h-3" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="4" /></svg>
                        Incomplete
                      </span>
                    )}
                    <svg className="w-4 h-4 text-muted" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
                  </div>
                </div>
                {details && (
                  <p className="text-xs text-muted mt-0.5">{details}</p>
                )}
              </button>
              {data.providers.length > 1 && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeProvider(index); }}
                    className="text-xs text-error hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </Card>
          );
        }

        /* ── Expanded card ── */
        return (
          <Card key={index}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-heading font-semibold">{formatProviderName(prov, index)}</h3>
                {isComplete ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm3.78-9.72a.75.75 0 0 0-1.06-1.06L7 8.94 5.28 7.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4.25-4.25Z" clipRule="evenodd" /></svg>
                    Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                    <svg className="w-3 h-3" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="4" /></svg>
                    Incomplete
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {data.providers.length > 1 && (
                  <button type="button" onClick={() => setOpenIndex(-1)} className="text-xs text-muted hover:text-foreground flex items-center gap-1">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.78 11.78a.75.75 0 0 1-1.06 0L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" /></svg>
                    Collapse
                  </button>
                )}
                {data.providers.length > 1 && (
                  <button type="button" onClick={() => removeProvider(index)} className="text-xs text-error hover:underline">Remove</button>
                )}
              </div>
            </div>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name" required value={prov.firstName ?? ""} onChange={(e) => updateProvider(index, "firstName", e.target.value)} />
                <Input label="Last Name" required value={prov.lastName ?? ""} onChange={(e) => updateProvider(index, "lastName", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="License Number" required value={prov.licenseNumber ?? ""} onChange={(e) => updateProvider(index, "licenseNumber", e.target.value)} />
                <Select label="License State" required value={prov.licenseState ?? ""} onChange={(e) => updateProvider(index, "licenseState", e.target.value)} options={US_STATES} placeholder="State" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="NPI" required value={prov.npi ?? ""} onChange={(e) => updateProvider(index, "npi", e.target.value)} />
                <Input label="DEA Number" value={prov.deaNumber ?? ""} onChange={(e) => updateProvider(index, "deaNumber", e.target.value)} helperText="Optional" />
              </div>
            </div>
          </Card>
        );
      })}

      <div className="flex items-center gap-3">
        <Button variant="secondary" type="button" onClick={addProvider}>
          + Add Provider
        </Button>
        <CSVUploadButton
          entityLabel="Providers"
          columns={PROVIDER_CSV_COLUMNS}
          rowSchema={providerCSVRowSchema}
          onImport={handleCSVImport}
          templateFileName="providers-template.csv"
          dedupKey={(row) => `${(row.firstName ?? "").toLowerCase()}|${(row.lastName ?? "").toLowerCase()}`}
          existingKeys={new Set(data.providers.map((p) => `${(p.firstName ?? "").toLowerCase()}|${(p.lastName ?? "").toLowerCase()}`).filter((k) => k !== "|"))}
        />
      </div>

      <SectionNavButtons currentSection={6} onNavigate={onNavigate} onSave={save} />
    </div>
  );
}
