"use server";

import { prisma } from "@/lib/prisma";
import { getSessionContext, writeSectionSnapshot } from "./helpers";
import { sellerLabSchema, type SellerLabData } from "@/lib/validations/seller-lab";
import { computeSellerStatuses } from "./seller-org";
import type { Prisma } from "@prisma/client";
import type { CompletionStatus, SellerSectionId } from "@/types";

// ─── Load ────────────────────────────────────────────────────────

export async function loadSellerLab(): Promise<SellerLabData> {
  const ctx = await getSessionContext();

  const lab = await prisma.sellerLabNetwork.findFirst({
    where: { affiliateId: ctx.affiliateId },
  });

  return {
    networkType: (lab?.networkType as SellerLabData["networkType"]) ?? null,
    otherNetworkName: lab?.otherNetworkName ?? "",
    coordinationContactName: lab?.coordinationContactName ?? "",
    coordinationContactEmail: lab?.coordinationContactEmail ?? "",
    coordinationContactPhone: lab?.coordinationContactPhone ?? "",
    integrationAcknowledged: lab?.integrationAcknowledged ?? false,
  };
}

// ─── Save ────────────────────────────────────────────────────────

export async function saveSellerLab(
  data: SellerLabData
): Promise<Record<SellerSectionId, CompletionStatus>> {
  const ctx = await getSessionContext();
  const parsed = sellerLabSchema.parse(data);

  const labData = {
    networkType: parsed.networkType,
    otherNetworkName: parsed.otherNetworkName || null,
    coordinationContactName: parsed.coordinationContactName || null,
    coordinationContactEmail: parsed.coordinationContactEmail || null,
    coordinationContactPhone: parsed.coordinationContactPhone || null,
    integrationAcknowledged: parsed.integrationAcknowledged ?? false,
  };

  const existing = await prisma.sellerLabNetwork.findFirst({
    where: { affiliateId: ctx.affiliateId },
  });

  if (existing) {
    await prisma.sellerLabNetwork.update({ where: { id: existing.id }, data: labData });
  } else {
    await prisma.sellerLabNetwork.create({
      data: { affiliateId: ctx.affiliateId, ...labData },
    });
  }

  await writeSectionSnapshot(
    105,
    parsed as unknown as Prisma.InputJsonValue,
    ctx.userId,
    ctx.affiliateId
  );

  return computeSellerStatuses(ctx.affiliateId);
}
