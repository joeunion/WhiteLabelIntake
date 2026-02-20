"use server";

import { prisma } from "@/lib/prisma";
import { getSessionContext } from "./helpers";
import { locationServicesSchema, type LocationServicesData } from "@/lib/validations/location-services";
import { computeSellerStatuses } from "./seller-org";
import type { CompletionStatus, SellerSectionId } from "@/types";

// ─── Load (for a single seller location) ────────────────────────

export interface LocationServiceState {
  overrides: Array<{ serviceType: string; available: boolean }>;
  subServices: Array<{ serviceType: string; subType: string; available: boolean }>;
}

export async function loadLocationServices(sellerLocationId: string): Promise<LocationServiceState> {
  await getSessionContext(); // auth gate

  const [configs, subs] = await Promise.all([
    prisma.sellerLocationServiceConfig.findMany({ where: { sellerLocationId } }),
    prisma.sellerLocationSubService.findMany({ where: { sellerLocationId } }),
  ]);

  return {
    overrides: configs.map((c) => ({ serviceType: c.serviceType, available: c.available })),
    subServices: subs.map((s) => ({ serviceType: s.serviceType, subType: s.subType, available: s.available })),
  };
}

// ─── Load all seller location service configs for an affiliate ──

export async function loadAllLocationServices(affiliateId: string): Promise<
  Record<string, LocationServiceState>
> {
  const locations = await prisma.sellerLocation.findMany({
    where: { affiliateId },
    select: { id: true },
  });

  const locationIds = locations.map((l) => l.id);

  const [configs, subs] = await Promise.all([
    prisma.sellerLocationServiceConfig.findMany({ where: { sellerLocationId: { in: locationIds } } }),
    prisma.sellerLocationSubService.findMany({ where: { sellerLocationId: { in: locationIds } } }),
  ]);

  const result: Record<string, LocationServiceState> = {};
  for (const locId of locationIds) {
    result[locId] = {
      overrides: configs.filter((c) => c.sellerLocationId === locId).map((c) => ({ serviceType: c.serviceType, available: c.available })),
      subServices: subs.filter((s) => s.sellerLocationId === locId).map((s) => ({ serviceType: s.serviceType, subType: s.subType, available: s.available })),
    };
  }

  return result;
}

// ─── Save ────────────────────────────────────────────────────────

export async function saveLocationServices(
  data: LocationServicesData
): Promise<Record<SellerSectionId, CompletionStatus>> {
  const ctx = await getSessionContext();
  const parsed = locationServicesSchema.parse(data);

  // Verify the seller location belongs to this affiliate
  const location = await prisma.sellerLocation.findFirst({
    where: { id: parsed.locationId, affiliateId: ctx.affiliateId },
    select: { id: true },
  });
  if (!location) throw new Error("Seller location not found");

  // Upsert overrides
  await Promise.all(
    parsed.overrides.map((o) =>
      prisma.sellerLocationServiceConfig.upsert({
        where: {
          sellerLocationId_serviceType: {
            sellerLocationId: parsed.locationId,
            serviceType: o.serviceType,
          },
        },
        update: { available: o.available },
        create: {
          sellerLocationId: parsed.locationId,
          serviceType: o.serviceType,
          available: o.available,
        },
      })
    )
  );

  // Upsert sub-services
  await Promise.all(
    parsed.subServices.map((s) =>
      prisma.sellerLocationSubService.upsert({
        where: {
          sellerLocationId_serviceType_subType: {
            sellerLocationId: parsed.locationId,
            serviceType: s.serviceType,
            subType: s.subType,
          },
        },
        update: { available: s.available },
        create: {
          sellerLocationId: parsed.locationId,
          serviceType: s.serviceType,
          subType: s.subType,
          available: s.available,
        },
      })
    )
  );

  return computeSellerStatuses(ctx.affiliateId);
}
