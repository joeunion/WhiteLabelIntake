"use server";

import { prisma } from "@/lib/prisma";
import { getSessionContext, writeSectionSnapshot } from "./helpers";
import { getCompletionStatuses } from "./completion";
import type { Section5Data, LocationData } from "@/lib/validations/section5";
import { Prisma } from "@prisma/client";
import type { CompletionStatus } from "@/types";

export async function loadSection5(): Promise<Section5Data> {
  const ctx = await getSessionContext();

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: ctx.affiliateId },
    select: { defaultSchedulingSystem: true },
  });

  const locations = await prisma.location.findMany({
    where: { affiliateId: ctx.affiliateId },
    include: { schedulingIntegrations: true },
    orderBy: { createdAt: "asc" },
  });

  return {
    defaultSchedulingSystem: affiliate?.defaultSchedulingSystem ?? null,
    locations: locations.map((loc) => ({
      id: loc.id,
      locationName: loc.locationName ?? "",
      streetAddress: loc.streetAddress ?? "",
      streetAddress2: loc.streetAddress2 ?? "",
      city: loc.city ?? "",
      state: loc.state ?? "",
      zip: loc.zip ?? "",
      closeByDescription: loc.closeByDescription ?? "",
      locationNpi: loc.locationNpi ?? "",
      phoneNumber: loc.phoneNumber ?? "",
      hoursOfOperation: loc.hoursOfOperation ?? "",
      accessType: loc.accessType as LocationData["accessType"],
      hasOnSiteLabs: loc.hasOnSiteLabs,
      hasOnSiteRadiology: loc.hasOnSiteRadiology,
      hasOnSitePharmacy: loc.hasOnSitePharmacy,
      weeklySchedule: (loc.weeklySchedule as LocationData["weeklySchedule"]) ?? undefined,
      schedulingSystemOverride: loc.schedulingSystemOverride ?? null,
      schedulingIntegrations: loc.schedulingIntegrations.map((si) => ({
        id: si.id,
        serviceType: si.serviceType as "office_365" | "google_calendar" | "other",
        serviceName: si.serviceName ?? "",
        accountIdentifier: si.accountIdentifier ?? "",
      })),
    })),
  };
}

export async function saveSection5(data: Section5Data): Promise<Record<number, CompletionStatus>> {
  const ctx = await getSessionContext();

  await prisma.affiliate.update({
    where: { id: ctx.affiliateId },
    data: { defaultSchedulingSystem: data.defaultSchedulingSystem || null },
  });

  for (const loc of data.locations) {
    const locationData = {
      locationName: loc.locationName || null,
      streetAddress: loc.streetAddress || null,
      streetAddress2: loc.streetAddress2 || null,
      city: loc.city || null,
      state: loc.state || null,
      zip: loc.zip || null,
      closeByDescription: loc.closeByDescription || null,
      locationNpi: loc.locationNpi || null,
      phoneNumber: loc.phoneNumber || null,
      hoursOfOperation: loc.hoursOfOperation || null,
      accessType: loc.accessType || null,
      hasOnSiteLabs: loc.hasOnSiteLabs ?? false,
      hasOnSiteRadiology: loc.hasOnSiteRadiology ?? false,
      hasOnSitePharmacy: loc.hasOnSitePharmacy ?? false,
      weeklySchedule: loc.weeklySchedule ? (loc.weeklySchedule as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      schedulingSystemOverride: loc.schedulingSystemOverride || null,
    };

    if (loc.id) {
      await prisma.location.update({
        where: { id: loc.id },
        data: locationData,
      });

      // Batch scheduling integrations: deleteMany + createMany (PgBouncer-safe)
      if (loc.schedulingIntegrations) {
        await prisma.$transaction([
          prisma.schedulingIntegration.deleteMany({
            where: { locationId: loc.id },
          }),
          prisma.schedulingIntegration.createMany({
            data: loc.schedulingIntegrations.map((si) => ({
              locationId: loc.id!,
              serviceType: si.serviceType,
              serviceName: si.serviceName || null,
              accountIdentifier: si.accountIdentifier || null,
              requiresScopedProject: si.serviceType === "other",
            })),
          }),
        ]);
      }
    } else {
      const created = await prisma.location.create({
        data: {
          affiliateId: ctx.affiliateId,
          ...locationData,
        },
      });

      if (loc.schedulingIntegrations && loc.schedulingIntegrations.length > 0) {
        await prisma.schedulingIntegration.createMany({
          data: loc.schedulingIntegrations.map((si) => ({
            locationId: created.id,
            serviceType: si.serviceType,
            serviceName: si.serviceName || null,
            accountIdentifier: si.accountIdentifier || null,
            requiresScopedProject: si.serviceType === "other",
          })),
        });
      }

      loc.id = created.id;
    }
  }

  await writeSectionSnapshot(5, { defaultSchedulingSystem: data.defaultSchedulingSystem, locations: data.locations }, ctx.userId, ctx.affiliateId);

  return getCompletionStatuses(ctx.affiliateId);
}

export async function deleteLocation(locationId: string) {
  const ctx = await getSessionContext();

  const location = await prisma.location.findFirst({
    where: { id: locationId, affiliateId: ctx.affiliateId },
  });

  if (!location) throw new Error("Location not found");

  await prisma.location.delete({ where: { id: locationId } });
}
