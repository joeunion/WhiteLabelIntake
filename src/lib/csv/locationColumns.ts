import { z } from "zod";
import type { CSVColumnDef } from "@/components/ui/CSVUploadButton";

export interface LocationCSVRow {
  locationName: string;
  streetAddress: string;
  streetAddress2?: string;
  city: string;
  state: string;
  zip: string;
  phoneNumber: string;
  locationNpi: string;
  closeByDescription?: string;
  hoursOfOperation?: string;
  accessType?: string | null;
  hasOnSiteLabs?: boolean;
  hasOnSiteRadiology?: boolean;
  hasOnSitePharmacy?: boolean;
}

function toBool(raw: string): boolean {
  return ["yes", "true", "1"].includes(raw.trim().toLowerCase());
}

function normalizeAccessType(raw: string): string | null {
  const lower = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const map: Record<string, string> = {
    walk_in: "walk_in",
    walkin: "walk_in",
    appointment_only: "appointment_only",
    appointmentonly: "appointment_only",
    both: "both",
  };
  return map[lower] ?? null;
}

export const LOCATION_CSV_COLUMNS: CSVColumnDef<LocationCSVRow>[] = [
  { header: "location_name", field: "locationName", label: "Location Name" },
  { header: "street_address", field: "streetAddress", label: "Address" },
  { header: "street_address_2", field: "streetAddress2", label: "Address 2", showInPreview: false },
  { header: "city", field: "city", label: "City" },
  { header: "state", field: "state", label: "State" },
  { header: "zip", field: "zip", label: "ZIP" },
  { header: "phone_number", field: "phoneNumber", label: "Phone" },
  { header: "location_npi", field: "locationNpi", label: "NPI" },
  { header: "close_by_description", field: "closeByDescription", label: "Close-by", showInPreview: false },
  { header: "hours_of_operation", field: "hoursOfOperation", label: "Hours", showInPreview: false },
  { header: "access_type", field: "accessType", label: "Access", showInPreview: false, transform: normalizeAccessType },
  { header: "has_on_site_labs", field: "hasOnSiteLabs", label: "Labs", showInPreview: false, transform: toBool },
  { header: "has_on_site_radiology", field: "hasOnSiteRadiology", label: "Radiology", showInPreview: false, transform: toBool },
  { header: "has_on_site_pharmacy", field: "hasOnSitePharmacy", label: "Pharmacy", showInPreview: false, transform: toBool },
];

export const locationCSVRowSchema: z.ZodType<LocationCSVRow> = z.object({
  locationName: z.string().min(1, "Required"),
  streetAddress: z.string().min(1, "Required"),
  streetAddress2: z.string().optional(),
  city: z.string().min(1, "Required"),
  state: z.string().length(2, "Must be 2-letter state code"),
  zip: z.string().regex(/^\d{5}$/, "Must be 5-digit ZIP"),
  phoneNumber: z.string().min(1, "Required"),
  locationNpi: z.string().min(1, "Required"),
  closeByDescription: z.string().optional(),
  hoursOfOperation: z.string().optional(),
  accessType: z.enum(["walk_in", "appointment_only", "both"]).optional().nullable(),
  hasOnSiteLabs: z.boolean().default(false),
  hasOnSiteRadiology: z.boolean().default(false),
  hasOnSitePharmacy: z.boolean().default(false),
});
