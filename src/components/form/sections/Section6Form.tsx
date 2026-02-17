"use client";

import { useState, useCallback } from "react";
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
import { CSVUploadButton } from "@/components/ui/CSVUploadButton";
import { PROVIDER_CSV_COLUMNS, providerCSVRowSchema } from "@/lib/csv/providerColumns";
import type { ProviderCSVRow } from "@/lib/csv/providerColumns";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
].map((s) => ({ value: s, label: s }));

const PROVIDER_TYPES = [
  { value: "physician", label: "Physician (MD/DO)" },
  { value: "np", label: "Nurse Practitioner (NP)" },
  { value: "pa", label: "Physician Assistant (PA)" },
  { value: "other", label: "Other" },
];

function emptyProvider(): ProviderData {
  return {
    firstName: "", lastName: "", providerType: null, licenseNumber: "",
    licenseState: "", npi: "", deaNumber: "",
  };
}

export function Section6Form({ initialData, onNavigate, disabled }: { initialData: Section6Data; onNavigate?: (section: number) => void; disabled?: boolean }) {
  const [data, setData] = useState<Section6Data>(() => {
    if (initialData.providers.length === 0) {
      return { providers: [emptyProvider()] };
    }
    return initialData;
  });

  const { updateStatuses } = useCompletion();
  const adminCtx = useAdminForm();

  const onSave = useCallback(async (d: Section6Data) => {
    if (adminCtx?.isAdminEditing) return saveSection6ForAffiliate(adminCtx.affiliateId, d);
    return saveSection6(d);
  }, [adminCtx]);

  const { save } = useSaveOnNext({ data, onSave, onAfterSave: updateStatuses });

  function updateProvider(index: number, field: keyof ProviderData, value: unknown) {
    setData((prev) => ({
      providers: prev.providers.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  }

  function addProvider() {
    setData((prev) => ({ providers: [...prev.providers, emptyProvider()] }));
  }

  function handleCSVImport(rows: ProviderCSVRow[]) {
    const newProviders = rows.map((row) => ({
      ...emptyProvider(),
      ...row,
    } as ProviderData));
    setData((prev) => ({ providers: [...prev.providers, ...newProviders] }));
  }

  async function removeProvider(index: number) {
    const prov = data.providers[index];
    if (prov.id) {
      if (adminCtx?.isAdminEditing) {
        await deleteProviderForAffiliate(adminCtx.affiliateId, prov.id);
      } else {
        await deleteProvider(prov.id);
      }
    }
    setData((prev) => ({ providers: prev.providers.filter((_, i) => i !== index) }));
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-muted">
        These providers will be granted access to scheduling and clinical systems used to support your program participants.
      </p>

      {data.providers.map((prov, index) => (
        <Card key={index}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-heading font-semibold">Provider {index + 1}</h3>
            {data.providers.length > 1 && (
              <button type="button" onClick={() => removeProvider(index)} className="text-xs text-error hover:underline">Remove</button>
            )}
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" required value={prov.firstName ?? ""} onChange={(e) => updateProvider(index, "firstName", e.target.value)} />
              <Input label="Last Name" required value={prov.lastName ?? ""} onChange={(e) => updateProvider(index, "lastName", e.target.value)} />
            </div>
            <Select label="Provider Type" required value={prov.providerType ?? ""} onChange={(e) => updateProvider(index, "providerType", e.target.value)} options={PROVIDER_TYPES} placeholder="Select type" />
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
      ))}

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
