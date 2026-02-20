"use server";

import { prisma } from "@/lib/prisma";
import { getSessionContext, writeSectionSnapshot } from "./helpers";
import { computeSellerStatuses } from "./seller-org";
import type { CompletionStatus, SellerSectionId } from "@/types";

export interface SellerProviderData {
  id?: string;
  firstName: string;
  lastName: string;
  providerType: "physician" | "np" | "pa" | "other" | null;
  licenseNumber: string;
  licenseState: string;
  npi: string;
  deaNumber: string;
}

export interface SellerProvidersData {
  providers: SellerProviderData[];
}

// ─── Load ────────────────────────────────────────────────────────

export async function loadSellerProviders(): Promise<SellerProvidersData> {
  const ctx = await getSessionContext();

  const providers = await prisma.sellerProvider.findMany({
    where: { affiliateId: ctx.affiliateId },
    orderBy: { createdAt: "asc" },
  });

  return {
    providers: providers.map((p) => ({
      id: p.id,
      firstName: p.firstName ?? "",
      lastName: p.lastName ?? "",
      providerType: p.providerType as SellerProviderData["providerType"],
      licenseNumber: p.licenseNumber ?? "",
      licenseState: p.licenseState ?? "",
      npi: p.npi ?? "",
      deaNumber: p.deaNumber ?? "",
    })),
  };
}

// ─── Save ────────────────────────────────────────────────────────

interface SaveSellerProvidersResult {
  statuses: Record<SellerSectionId, CompletionStatus>;
  providerIds: string[];
}

export async function saveSellerProviders(data: SellerProvidersData): Promise<SaveSellerProvidersResult> {
  const ctx = await getSessionContext();

  const providerIds: string[] = [];

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
      await prisma.sellerProvider.update({
        where: { id: prov.id },
        data: providerData,
      });
      providerIds.push(prov.id);
    } else {
      const created = await prisma.sellerProvider.create({
        data: { affiliateId: ctx.affiliateId, ...providerData },
      });
      providerIds.push(created.id);
    }
  }

  await writeSectionSnapshot(
    103,
    { providerCount: providerIds.length },
    ctx.userId,
    ctx.affiliateId
  );

  const statuses = await computeSellerStatuses(ctx.affiliateId);
  return { statuses, providerIds };
}

// ─── Delete ──────────────────────────────────────────────────────

export async function deleteSellerProvider(providerId: string) {
  const ctx = await getSessionContext();

  const provider = await prisma.sellerProvider.findFirst({
    where: { id: providerId, affiliateId: ctx.affiliateId },
  });
  if (!provider) throw new Error("Seller provider not found");

  await prisma.sellerProvider.delete({ where: { id: providerId } });
}
