"use client";

import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useSaveOnNext } from "@/lib/hooks/useSaveOnNext";
import { saveSection5, deleteLocation } from "@/lib/actions/section5";
import { saveSection5ForAffiliate, deleteLocationForAffiliate } from "@/lib/actions/admin-sections";
import type { Section5Data, LocationData, DaySchedule } from "@/lib/validations/section5";
import { defaultWeeklySchedule } from "@/lib/validations/section5";
import { useCompletion } from "@/lib/contexts/CompletionContext";
import { useAdminForm } from "@/lib/contexts/AdminFormContext";
import { SectionNavButtons } from "../SectionNavButtons";
import { useSyncSectionCache, useReportDirty } from "../OnboardingClient";
import { CSVUploadButton } from "@/components/ui/CSVUploadButton";
import { LOCATION_CSV_COLUMNS, locationCSVRowSchema } from "@/lib/csv/locationColumns";
import type { LocationCSVRow } from "@/lib/csv/locationColumns";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
].map((s) => ({ value: s, label: s }));

const ACCESS_OPTIONS = [
  { value: "walk_in", label: "Walk-in accepted" },
  { value: "appointment_only", label: "Appointment only" },
  { value: "both", label: "Both" },
];

const SCHEDULING_OPTIONS = [
  { value: "office_365", label: "Office 365" },
  { value: "google_calendar", label: "Google Calendar" },
  { value: "other", label: "Other" },
];

function emptyLocation(): LocationData {
  return {
    locationName: "", streetAddress: "", streetAddress2: "", city: "", state: "", zip: "",
    closeByDescription: "", locationNpi: "", phoneNumber: "",
    hoursOfOperation: "", accessType: null,
    hasOnSiteLabs: false, hasOnSiteRadiology: false, hasOnSitePharmacy: false,
    weeklySchedule: defaultWeeklySchedule(),
    schedulingSystemOverride: null,
    schedulingOverrideOtherName: null,
    schedulingOverrideAcknowledged: false,
    schedulingIntegrations: [],
  };
}

function essentialsFilled(loc: LocationData): boolean {
  return !!(loc.locationName && loc.streetAddress && loc.city && loc.state && loc.zip && loc.phoneNumber && loc.locationNpi);
}

function locationHasData(loc: LocationData): boolean {
  if (loc.id) return true;
  return !!(loc.locationName || loc.streetAddress || loc.city || loc.state || loc.zip || loc.phoneNumber || loc.locationNpi);
}

// Dynamic import to avoid `document is not defined` on server
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AddressAutofill = dynamic(() => import("@mapbox/search-js-react").then((m) => m.AddressAutofill) as any, { ssr: false }) as React.ComponentType<{ accessToken: string; onRetrieve: (response: any) => void; options?: Record<string, unknown>; children: React.ReactNode }>;

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

function locationComplete(loc: LocationData): boolean {
  if (!essentialsFilled(loc)) return false;
  if (!loc.accessType) return false;
  const hasHours = (loc.weeklySchedule ?? []).some(
    (d) => !d.closed && d.openTime && d.closeTime
  );
  return hasHours;
}

function formatAddress(loc: LocationData): string {
  const parts = [loc.streetAddress];
  if (loc.streetAddress2) parts.push(loc.streetAddress2);
  if (loc.city) parts.push(loc.city);
  if (loc.state) parts[parts.length - 1] += ",";
  if (loc.state) parts.push(loc.state);
  if (loc.zip) parts.push(loc.zip);
  return parts.filter(Boolean).join(" ");
}

export function Section5Form({ initialData, onNavigate, disabled }: { initialData: Section5Data; onNavigate?: (section: number) => void; disabled?: boolean }) {
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [data, setData] = useState<Section5Data>(() => {
    if (initialData.locations.length === 0) {
      return {
        defaultSchedulingSystem: initialData.defaultSchedulingSystem ?? null,
        defaultSchedulingOtherName: initialData.defaultSchedulingOtherName ?? null,
        defaultSchedulingAcknowledged: initialData.defaultSchedulingAcknowledged ?? false,
        locations: [emptyLocation()],
      };
    }
    return {
      ...initialData,
      locations: initialData.locations.map((loc) => ({
        ...loc,
        weeklySchedule: loc.weeklySchedule?.length ? loc.weeklySchedule : defaultWeeklySchedule(),
      })),
    };
  });
  useSyncSectionCache(5, data);

  const { updateStatuses } = useCompletion();
  const adminCtx = useAdminForm();

  const onSave = useCallback(async (d: Section5Data) => {
    const result = adminCtx?.isAdminEditing
      ? await saveSection5ForAffiliate(adminCtx.affiliateId, d)
      : await saveSection5(d);
    // Assign server-generated IDs back into state immutably (no direct mutation)
    setData((prev) => {
      const updated = prev.locations.map((l, i) =>
        l.id !== result.locationIds[i] ? { ...l, id: result.locationIds[i] } : l
      );
      return updated.some((l, i) => l !== prev.locations[i])
        ? { ...prev, locations: updated }
        : prev;
    });
    return result.statuses;
  }, [adminCtx]);

  const { save, isDirty } = useSaveOnNext({ data, onSave, onAfterSave: updateStatuses });
  useReportDirty(5, isDirty);

  function updateLocation(index: number, field: keyof LocationData, value: unknown) {
    setData((prev) => ({
      ...prev,
      locations: prev.locations.map((loc, i) =>
        i === index ? { ...loc, [field]: value } : loc
      ),
    }));
  }

  function handleAddressRetrieve(locIndex: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (response: any) => {
      const feature = response.features?.[0];
      if (!feature) return;
      const p = feature.properties;
      if (p.address_line1) updateLocation(locIndex, "streetAddress", p.address_line1);
      if (p.place) updateLocation(locIndex, "city", p.place);
      const state = (p.region_code || "").toUpperCase();
      if (state) updateLocation(locIndex, "state", state);
      if (p.postcode) updateLocation(locIndex, "zip", p.postcode);
    };
  }

  function updateDaySchedule(locIndex: number, dayIndex: number, field: keyof DaySchedule, value: unknown) {
    setData((prev) => ({
      ...prev,
      locations: prev.locations.map((loc, li) =>
        li === locIndex
          ? {
              ...loc,
              weeklySchedule: (loc.weeklySchedule ?? defaultWeeklySchedule()).map((ds, di) =>
                di === dayIndex ? { ...ds, [field]: value } : ds
              ),
            }
          : loc
      ),
    }));
  }

  function addLocation() {
    setData((prev) => {
      setOpenIndex(prev.locations.length);
      return { ...prev, locations: [...prev.locations, emptyLocation()] };
    });
  }

  function removeLocation(index: number) {
    const loc = data.locations[index];
    if (!loc) return;
    const locId = loc.id;
    if (locationHasData(loc)) {
      const name = loc.locationName || `Location ${index + 1}`;
      if (!confirm(`Remove "${name}"? This location has data that will be lost.`)) return;
    }
    // Adjust openIndex before removing
    setOpenIndex((prev) => {
      if (index === prev) return Math.min(prev, data.locations.length - 2);
      if (index < prev) return prev - 1;
      return prev;
    });
    // Use identity (id or reference) instead of index to avoid stale-index
    // issues when rapidly removing multiple entries.
    setData((prev) => ({
      ...prev,
      locations: prev.locations.filter((l) =>
        locId ? l.id !== locId : l !== loc
      ),
    }));
    // Background: delete from DB if persisted
    if (locId) {
      const deleteFn = adminCtx?.isAdminEditing
        ? () => deleteLocationForAffiliate(adminCtx.affiliateId, locId)
        : () => deleteLocation(locId);
      deleteFn().catch((err) => {
        console.error("Failed to delete location:", err);
        toast.error("Failed to remove location. It may reappear on refresh.");
      });
    }
  }

  function updateScheduling(locIndex: number, siIndex: number, field: string, value: string) {
    setData((prev) => ({
      ...prev,
      locations: prev.locations.map((loc, li) =>
        li === locIndex
          ? {
              ...loc,
              schedulingIntegrations: (loc.schedulingIntegrations ?? []).map((si, si2) =>
                si2 === siIndex ? { ...si, [field]: value } : si
              ),
            }
          : loc
      ),
    }));
  }

  function addScheduling(locIndex: number) {
    setData((prev) => ({
      ...prev,
      locations: prev.locations.map((loc, li) =>
        li === locIndex
          ? {
              ...loc,
              schedulingIntegrations: [
                ...(loc.schedulingIntegrations ?? []),
                { serviceType: "office_365" as const, serviceName: "", accountIdentifier: "" },
              ],
            }
          : loc
      ),
    }));
  }

  function handleCSVImport(rows: LocationCSVRow[]) {
    const newLocations = rows.map((row) => ({
      ...emptyLocation(),
      ...row,
    } as LocationData));
    // Compute updated data outside the state setter so we can save
    // without side effects inside React's state updater (strict-mode safe).
    let updated: Section5Data;
    setData((prev) => {
      updated = { ...prev, locations: [...prev.locations, ...newLocations] };
      return updated;
    });
    // Save outside the setter — fires once even in React strict mode
    onSave(updated!).then(updateStatuses).catch(() => {
      toast.error("Some imported locations could not be saved.");
    });
  }

  function removeScheduling(locIndex: number, siIndex: number) {
    setData((prev) => ({
      ...prev,
      locations: prev.locations.map((loc, li) =>
        li === locIndex
          ? {
              ...loc,
              schedulingIntegrations: (loc.schedulingIntegrations ?? []).filter((_, i) => i !== siIndex),
            }
          : loc
      ),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-muted">
        This information allows our teams to schedule appointments accurately and guide members to the correct physical site.
      </p>

      <Card>
        <h3 className="text-lg font-heading font-semibold mb-1">Default Scheduling System</h3>
        <p className="text-xs text-muted mb-5">
          This applies to all locations unless overridden per-location below.
        </p>
        <Select
          label="Scheduling System"
          name="defaultSchedulingSystem"
          value={data.defaultSchedulingSystem ?? ""}
          onChange={(e) => setData((prev) => ({
            ...prev,
            defaultSchedulingSystem: e.target.value || null,
            ...(e.target.value !== "other" ? { defaultSchedulingOtherName: null, defaultSchedulingAcknowledged: false } : {}),
          }))}
          options={SCHEDULING_OPTIONS}
          placeholder="Select default system"
        />
        {data.defaultSchedulingSystem === "other" && (
          <div className="mt-4 space-y-3">
            <Input
              label="Scheduling System Name"
              required
              value={data.defaultSchedulingOtherName ?? ""}
              onChange={(e) => setData((prev) => ({ ...prev, defaultSchedulingOtherName: e.target.value }))}
              placeholder="e.g., eClinicalWorks, Athenahealth"
            />
            <Checkbox
              label="I understand that integrating with a non-standard scheduling system requires a scoped project. Our team will follow up to assess feasibility and timeline."
              checked={data.defaultSchedulingAcknowledged ?? false}
              onChange={(e) => setData((prev) => ({ ...prev, defaultSchedulingAcknowledged: e.target.checked }))}
            />
          </div>
        )}
      </Card>

      {data.locations.map((loc, locIndex) => {
        const isOpen = locIndex === openIndex;
        const isComplete = locationComplete(loc);

        /* ── Collapsed summary ── */
        if (!isOpen) {
          return (
            <Card key={locIndex}>
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setOpenIndex(locIndex)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-heading font-semibold truncate">
                    {loc.locationName || `Location ${locIndex + 1}`}
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
                {(loc.streetAddress || loc.city) && (
                  <p className="text-xs text-muted mt-1 truncate">{formatAddress(loc)}</p>
                )}
                {(loc.locationNpi || loc.phoneNumber) && (
                  <p className="text-xs text-muted mt-0.5">
                    {[loc.locationNpi && `NPI: ${loc.locationNpi}`, loc.phoneNumber].filter(Boolean).join(" · ")}
                  </p>
                )}
              </button>
              {data.locations.length > 1 && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeLocation(locIndex); }}
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
        const showAdvanced = essentialsFilled(loc);

        return (
          <Card key={locIndex}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-heading font-semibold">{loc.locationName || `Location ${locIndex + 1}`}</h3>
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
                {data.locations.length > 1 && (
                  <button type="button" onClick={() => setOpenIndex(-1)} className="text-xs text-muted hover:text-foreground flex items-center gap-1">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.78 11.78a.75.75 0 0 1-1.06 0L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" /></svg>
                    Collapse
                  </button>
                )}
                {data.locations.length > 1 && (
                  <button type="button" onClick={() => removeLocation(locIndex)} className="text-xs text-error hover:underline">Remove</button>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              <Input label="Location Name" required value={loc.locationName ?? ""} onChange={(e) => updateLocation(locIndex, "locationName", e.target.value)} placeholder="e.g., Main Street Clinic" />
              {mapboxToken ? (
                <AddressAutofill accessToken={mapboxToken} onRetrieve={handleAddressRetrieve(locIndex)} options={{ country: "US" }}>
                  <Input label="Street Address" required value={loc.streetAddress ?? ""} onChange={(e) => updateLocation(locIndex, "streetAddress", e.target.value)} autoComplete="address-line1" />
                </AddressAutofill>
              ) : (
                <Input label="Street Address" required value={loc.streetAddress ?? ""} onChange={(e) => updateLocation(locIndex, "streetAddress", e.target.value)} />
              )}
              <Input label="Street Address Line 2" value={loc.streetAddress2 ?? ""} onChange={(e) => updateLocation(locIndex, "streetAddress2", e.target.value)} placeholder="Suite, Unit, Apt, etc." autoComplete="address-line2" />
              <div className="grid grid-cols-3 gap-3">
                <Input label="City" required value={loc.city ?? ""} onChange={(e) => updateLocation(locIndex, "city", e.target.value)} autoComplete="address-level2" />
                <Select label="State" required value={loc.state ?? ""} onChange={(e) => updateLocation(locIndex, "state", e.target.value)} options={US_STATES} placeholder="State" />
                <Input label="ZIP" required value={loc.zip ?? ""} onChange={(e) => updateLocation(locIndex, "zip", e.target.value)} placeholder="5-digit" autoComplete="postal-code" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Location NPI" required value={loc.locationNpi ?? ""} onChange={(e) => updateLocation(locIndex, "locationNpi", e.target.value)} />
                <Input label="Phone Number" required value={loc.phoneNumber ?? ""} onChange={(e) => updateLocation(locIndex, "phoneNumber", e.target.value)} />
              </div>
            </div>

            {!showAdvanced && (
              <p className="text-xs text-muted mt-4 italic">
                Fill in the required fields above to reveal additional options (services, scheduling, hours).
              </p>
            )}

            {showAdvanced && (
              <div className="mt-6 space-y-6">
                <Input label="Close-by Description" value={loc.closeByDescription ?? ""} onChange={(e) => updateLocation(locIndex, "closeByDescription", e.target.value)} placeholder={`e.g., "Across from Denny's"`} helperText="Used by Care Nav when giving directions" />
                <Select label="Walk-in or Appointment" required value={loc.accessType ?? ""} onChange={(e) => updateLocation(locIndex, "accessType", e.target.value)} options={ACCESS_OPTIONS} placeholder="Select" />

                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">On-site Services</h4>
                  <div className="flex flex-col gap-2">
                    <Checkbox label="Labs" checked={loc.hasOnSiteLabs ?? false} onChange={(e) => updateLocation(locIndex, "hasOnSiteLabs", e.target.checked)} />
                    <Checkbox label="Radiology" checked={loc.hasOnSiteRadiology ?? false} onChange={(e) => updateLocation(locIndex, "hasOnSiteRadiology", e.target.checked)} />
                    <Checkbox label="Pharmacy" checked={loc.hasOnSitePharmacy ?? false} onChange={(e) => updateLocation(locIndex, "hasOnSitePharmacy", e.target.checked)} />
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold text-foreground mb-1">Scheduling</h4>
                  <p className="text-xs text-muted mb-3">
                    {data.defaultSchedulingSystem
                      ? `Default: ${SCHEDULING_OPTIONS.find((o) => o.value === data.defaultSchedulingSystem)?.label ?? data.defaultSchedulingSystem}. Toggle to override.`
                      : "No default set. Select a system for this location or set a default above."}
                  </p>
                  <Checkbox
                    label="Does this location use a different scheduling system?"
                    checked={loc.schedulingSystemOverride != null}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateLocation(locIndex, "schedulingSystemOverride", data.defaultSchedulingSystem ?? "office_365");
                      } else {
                        setData((prev) => ({
                          ...prev,
                          locations: prev.locations.map((l, i) =>
                            i === locIndex
                              ? { ...l, schedulingSystemOverride: null, schedulingOverrideOtherName: null, schedulingOverrideAcknowledged: false }
                              : l
                          ),
                        }));
                      }
                    }}
                  />
                  {loc.schedulingSystemOverride != null && (
                    <div className="mt-3 space-y-3">
                      <Select
                        label="Location Scheduling System"
                        value={loc.schedulingSystemOverride ?? ""}
                        onChange={(e) => {
                          const val = e.target.value || null;
                          setData((prev) => ({
                            ...prev,
                            locations: prev.locations.map((l, i) =>
                              i === locIndex
                                ? {
                                    ...l,
                                    schedulingSystemOverride: val,
                                    ...(val !== "other" ? { schedulingOverrideOtherName: null, schedulingOverrideAcknowledged: false } : {}),
                                  }
                                : l
                            ),
                          }));
                        }}
                        options={SCHEDULING_OPTIONS}
                        placeholder="Select system"
                      />
                      {loc.schedulingSystemOverride === "other" && (
                        <>
                          <Input
                            label="Scheduling System Name"
                            required
                            value={loc.schedulingOverrideOtherName ?? ""}
                            onChange={(e) => updateLocation(locIndex, "schedulingOverrideOtherName", e.target.value)}
                            placeholder="e.g., eClinicalWorks, Athenahealth"
                          />
                          <Checkbox
                            label="I understand that integrating with a non-standard scheduling system requires a scoped project. Our team will follow up to assess feasibility and timeline."
                            checked={loc.schedulingOverrideAcknowledged ?? false}
                            onChange={(e) => updateLocation(locIndex, "schedulingOverrideAcknowledged", e.target.checked)}
                          />
                        </>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <h5 className="text-xs font-medium text-muted mb-2">Connected Integrations</h5>
                    {(loc.schedulingIntegrations ?? []).map((si, siIndex) => (
                      <div key={siIndex} className="flex flex-col gap-3 mb-4 p-3 bg-gray-light rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-muted">Integration {siIndex + 1}</span>
                          {(loc.schedulingIntegrations?.length ?? 0) > 1 && (
                            <button type="button" onClick={() => removeScheduling(locIndex, siIndex)} className="text-xs text-error hover:underline">Remove</button>
                          )}
                        </div>
                        <Select label="Scheduling Service" required value={si.serviceType} onChange={(e) => updateScheduling(locIndex, siIndex, "serviceType", e.target.value)} options={SCHEDULING_OPTIONS} />
                        {si.serviceType === "other" && (
                          <>
                            <Input label="Service Name" required value={si.serviceName ?? ""} onChange={(e) => updateScheduling(locIndex, siIndex, "serviceName", e.target.value)} />
                            <p className="text-xs text-warm-orange italic">Integrating with a non-standard scheduling service requires a scoped project. Our team will follow up to assess feasibility and timeline.</p>
                          </>
                        )}
                        <Input label="Account or Calendar Identifier" required value={si.accountIdentifier ?? ""} onChange={(e) => updateScheduling(locIndex, siIndex, "accountIdentifier", e.target.value)} placeholder="Calendar URL, account email, or identifier" />
                      </div>
                    ))}
                    <button type="button" onClick={() => addScheduling(locIndex)} className="text-sm text-brand-teal hover:underline">
                      + Add scheduling integration
                    </button>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Weekly Schedule</h4>
                  <div className="space-y-2">
                    {(loc.weeklySchedule ?? defaultWeeklySchedule()).map((ds, dayIndex) => (
                      <div key={ds.day} className="flex items-center gap-3">
                        <span className="text-sm w-24 flex-shrink-0">{ds.day}</span>
                        <Checkbox label="Closed" checked={ds.closed} onChange={(e) => updateDaySchedule(locIndex, dayIndex, "closed", e.target.checked)} />
                        {!ds.closed && (
                          <>
                            <input type="time" value={ds.openTime ?? ""} onChange={(e) => updateDaySchedule(locIndex, dayIndex, "openTime", e.target.value)} className="border border-border rounded px-2 py-1 text-sm" />
                            <span className="text-sm text-muted">to</span>
                            <input type="time" value={ds.closeTime ?? ""} onChange={(e) => updateDaySchedule(locIndex, dayIndex, "closeTime", e.target.value)} className="border border-border rounded px-2 py-1 text-sm" />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      <div className="flex items-center gap-3">
        <Button variant="secondary" type="button" onClick={addLocation}>
          + Add Location
        </Button>
        <CSVUploadButton
          entityLabel="Locations"
          columns={LOCATION_CSV_COLUMNS}
          rowSchema={locationCSVRowSchema}
          onImport={handleCSVImport}
          templateFileName="locations-template.csv"
          dedupKey={(row) => row.locationNpi?.toLowerCase() ?? ""}
          existingKeys={new Set(data.locations.map((l) => (l.locationNpi ?? "").toLowerCase()).filter(Boolean))}
        />
      </div>

      <SectionNavButtons currentSection={5} onNavigate={onNavigate} onSave={save} />
    </div>
  );
}
