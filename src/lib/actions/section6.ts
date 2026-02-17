"use server";

import { prisma } from "@/lib/prisma";
import { getSessionContext, writeSectionSnapshot } from "./helpers";
import { getCompletionStatuses } from "./completion";
import type { Section6Data } from "@/lib/validations/section6";
import type { CompletionStatus } from "@/types";

export async function loadSection6(): Promise<Section6Data> {
  const ctx = await getSessionContext();

  const providers = await prisma.provider.findMany({
    where: { affiliateId: ctx.affiliateId },
    orderBy: { createdAt: "asc" },
  });

  return {
    providers: providers.map((p) => ({
      id: p.id,
      firstName: p.firstName ?? "",
      lastName: p.lastName ?? "",
      providerType: p.providerType as "physician" | "np" | "pa" | "other" | null,
      licenseNumber: p.licenseNumber ?? "",
      licenseState: p.licenseState ?? "",
      npi: p.npi ?? "",
      deaNumber: p.deaNumber ?? "",
    })),
  };
}

export async function saveSection6(data: Section6Data): Promise<Record<number, CompletionStatus>> {
  const ctx = await getSessionContext();

  for (const prov of data.providers) {
    const providerData = {
      firstName: prov.firstName || null,
      lastName: prov.lastName || null,
      providerType: prov.providerType || null,
      licenseNumber: prov.licenseNumber || null,
      licenseState: prov.licenseState || null,
      npi: prov.npi || null,
      deaNumber: prov.deaNumber || null,
    };

    if (prov.id) {
      await prisma.provider.update({
        where: { id: prov.id },
        data: providerData,
      });
    } else {
      const created = await prisma.provider.create({
        data: { affiliateId: ctx.affiliateId, ...providerData },
      });
      prov.id = created.id;
    }
  }

  await writeSectionSnapshot(6, { providers: data.providers }, ctx.userId, ctx.affiliateId);

  return getCompletionStatuses(ctx.affiliateId);
}

export async function deleteProvider(providerId: string) {
  const ctx = await getSessionContext();
  const provider = await prisma.provider.findFirst({
    where: { id: providerId, affiliateId: ctx.affiliateId },
  });
  if (!provider) throw new Error("Provider not found");
  await prisma.provider.delete({ where: { id: providerId } });
}
