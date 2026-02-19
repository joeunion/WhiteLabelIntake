import { z } from "zod";

export const dayScheduleSchema = z.object({
  day: z.string(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  closed: z.boolean().default(false),
});

export const locationSchema = z.object({
  id: z.string().optional(),
  locationName: z.string().optional(),
  streetAddress: z.string().optional(),
  streetAddress2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  closeByDescription: z.string().optional(),
  locationNpi: z.string().optional(),
  phoneNumber: z.string().optional(),
  hoursOfOperation: z.string().optional(),
  accessType: z.enum(["walk_in", "appointment_only", "both"]).optional().nullable(),
  hasOnSiteLabs: z.boolean().default(false),
  hasOnSiteRadiology: z.boolean().default(false),
  hasOnSitePharmacy: z.boolean().default(false),
  weeklySchedule: z.array(dayScheduleSchema).optional(),
  schedulingSystemOverride: z.string().optional().nullable(),
  schedulingOverrideOtherName: z.string().optional().nullable(),
  schedulingOverrideAcknowledged: z.boolean().default(false),
  schedulingIntegrations: z.array(
    z.object({
      id: z.string().optional(),
      serviceType: z.enum(["office_365", "google_calendar", "other"]),
      serviceName: z.string().optional(),
      accountIdentifier: z.string().optional(),
    })
  ).optional(),
});

export const section5Schema = z.object({
  defaultSchedulingSystem: z.string().optional().nullable(),
  defaultSchedulingOtherName: z.string().optional().nullable(),
  defaultSchedulingAcknowledged: z.boolean().default(false),
  locations: z.array(locationSchema),
});

export type DaySchedule = z.infer<typeof dayScheduleSchema>;
export type LocationData = z.infer<typeof locationSchema>;
export type Section5Data = z.infer<typeof section5Schema>;

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export function defaultWeeklySchedule(): DaySchedule[] {
  return DAYS_OF_WEEK.map((day) => ({
    day,
    openTime: day === "Saturday" || day === "Sunday" ? "" : "08:00",
    closeTime: day === "Saturday" || day === "Sunday" ? "" : "17:00",
    closed: day === "Saturday" || day === "Sunday",
  }));
}
