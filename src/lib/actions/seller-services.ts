"use server";

import { prisma } from "@/lib/prisma";
import { getSessionContext, writeSectionSnapshot } from "./helpers";
import { sellerServicesSchema, SELLER_SERVICE_TYPES, type SellerServicesData } from "@/lib/validations/seller-services";
import { computeSellerStatuses } from "./seller-org";
import type { Prisma } from "@prisma/client";
import type { CompletionStatus, SellerSectionId } from "@/types";

// ─── Load ────────────────────────────────────────────────────────

export async function loadSellerServices(): Promise<SellerServicesData> {
  const ctx = await getSessionContext();

  const offerings = await prisma.sellerServiceOffering.findMany({
    where: { affiliateId: ctx.affiliateId },
  });

  const offeringMap = new Map(offerings.map((o) => [o.serviceType, o.selected]));

  return {
    services: SELLER_SERVICE_TYPES.map((st) => ({
      serviceType: st.value,
      selected: offeringMap.get(st.value) ?? false,
    })),
  };
}

// ─── Save ────────────────────────────────────────────────────────

export async function saveSellerServices(
  data: SellerServicesData
): Promise<Record<SellerSectionId, CompletionStatus>> {
  const ctx = await getSessionContext();
  const parsed = sellerServicesSchema.parse(data);

  // Upsert each service offering
  await Promise.all(
    parsed.services.map((s) =>
      prisma.sellerServiceOffering.upsert({
        where: {
          affiliateId_serviceType: {
            affiliateId: ctx.affiliateId,
            serviceType: s.serviceType,
          },
        },
        update: { selected: s.selected },
        create: {
          affiliateId: ctx.affiliateId,
          serviceType: s.serviceType,
          selected: s.selected,
        },
      })
    )
  );

  await writeSectionSnapshot(
    104, // S-4 → snapshot id 104
    parsed as unknown as Prisma.InputJsonValue,
    ctx.userId,
    ctx.affiliateId,
    ctx.programId
  );

  return computeSellerStatuses(ctx.affiliateId);
}
