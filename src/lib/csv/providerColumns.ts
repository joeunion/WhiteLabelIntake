import { z } from "zod";
import type { CSVColumnDef } from "@/components/ui/CSVUploadButton";

export interface ProviderCSVRow {
  firstName: string;
  lastName: string;
  providerType?: string | null;
  licenseNumber?: string;
  licenseState?: string;
  npi?: string;
  deaNumber?: string;
}

function normalizeProviderType(raw: string): string | null {
  const lower = raw.trim().toLowerCase();
  const map: Record<string, string> = {
    md: "physician",
    do: "physician",
    physician: "physician",
    np: "np",
    "nurse practitioner": "np",
    pa: "pa",
    "physician assistant": "pa",
    other: "other",
  };
  return map[lower] ?? null;
}

export const PROVIDER_CSV_COLUMNS: CSVColumnDef<ProviderCSVRow>[] = [
  { header: "first_name", field: "firstName", label: "First Name" },
  { header: "last_name", field: "lastName", label: "Last Name" },
  { header: "provider_type", field: "providerType", label: "Type", transform: normalizeProviderType },
  { header: "license_number", field: "licenseNumber", label: "License #" },
  { header: "license_state", field: "licenseState", label: "License State" },
  { header: "npi", field: "npi", label: "NPI" },
  { header: "dea_number", field: "deaNumber", label: "DEA #" },
];

export const providerCSVRowSchema: z.ZodType<ProviderCSVRow> = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  providerType: z.enum(["physician", "np", "pa", "other"]).optional().nullable(),
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  npi: z.string().optional(),
  deaNumber: z.string().optional(),
});
