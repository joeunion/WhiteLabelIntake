"use server";

import { prisma } from "@/lib/prisma";
import { getSessionContext, writeSectionSnapshot } from "./helpers";
import { getCompletionStatuses } from "./completion";
import type { Section8Data } from "@/lib/validations/section8";
import type { CompletionStatus } from "@/types";

export async function loadSection8(): Promise<Section8Data> {
  const ctx = await getSessionContext();

  const network = await prisma.radiologyNetwork.findFirst({
    where: { affiliateId: ctx.affiliateId },
  });

  return {
    networkName: network?.networkName ?? "",
    orderDeliveryMethod: network?.orderDeliveryMethod ?? "",
    orderDeliveryEndpoint: network?.orderDeliveryEndpoint ?? "",
    resultsDeliveryMethod: (network?.resultsDeliveryMethod as Section8Data["resultsDeliveryMethod"]) ?? null,
    resultsDeliveryEndpoint: network?.resultsDeliveryEndpoint ?? "",
    coordinationContactName: network?.coordinationContactName ?? "",
    coordinationContactEmail: network?.coordinationContactEmail ?? "",
    coordinationContactPhone: network?.coordinationContactPhone ?? "",
  };
}

export async function saveSection8(data: Section8Data): Promise<Record<number, CompletionStatus>> {
  const ctx = await getSessionContext();

  const existing = await prisma.radiologyNetwork.findFirst({
    where: { affiliateId: ctx.affiliateId },
  });

  const netData = {
    networkName: data.networkName || null,
    orderDeliveryMethod: data.orderDeliveryMethod || null,
    orderDeliveryEndpoint: data.orderDeliveryEndpoint || null,
    resultsDeliveryMethod: data.resultsDeliveryMethod || null,
    resultsDeliveryEndpoint: data.resultsDeliveryEndpoint || null,
    coordinationContactName: data.coordinationContactName || null,
    coordinationContactEmail: data.coordinationContactEmail || null,
    coordinationContactPhone: data.coordinationContactPhone || null,
  };

  if (existing) {
    await prisma.radiologyNetwork.update({ where: { id: existing.id }, data: netData });
  } else {
    await prisma.radiologyNetwork.create({
      data: { affiliateId: ctx.affiliateId, ...netData },
    });
  }

  await writeSectionSnapshot(8, data, ctx.userId, ctx.affiliateId);

  return getCompletionStatuses(ctx.affiliateId);
}
