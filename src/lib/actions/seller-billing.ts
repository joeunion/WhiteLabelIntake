"use server";

import { prisma } from "@/lib/prisma";
import { getSessionContext, writeSectionSnapshot } from "./helpers";
import { sellerBillingSchema, type SellerBillingData } from "@/lib/validations/seller-billing";
import { encryptField, decryptField } from "@/lib/encryption";
import { computeSellerStatuses } from "./seller-org";
import type { CompletionStatus, SellerSectionId } from "@/types";

// ─── Load ────────────────────────────────────────────────────────

export async function loadSellerBilling(): Promise<SellerBillingData> {
  const ctx = await getSessionContext();

  const profile = await prisma.sellerProfile.findUnique({
    where: { affiliateId: ctx.affiliateId },
    select: {
      w9FilePath: true,
      achAccountHolderName: true,
      achAccountType: true,
      achRoutingNumber: true,
      achAccountNumber: true,
      bankDocFilePath: true,
    },
  });

  return {
    w9FilePath: profile?.w9FilePath ?? null,
    achAccountHolderName: profile?.achAccountHolderName ?? "",
    achAccountType: (profile?.achAccountType as SellerBillingData["achAccountType"]) ?? null,
    achRoutingNumber: profile?.achRoutingNumber ? decryptField(profile.achRoutingNumber) : "",
    achAccountNumber: profile?.achAccountNumber ? decryptField(profile.achAccountNumber) : "",
    bankDocFilePath: profile?.bankDocFilePath ?? null,
  };
}

// ─── Save ────────────────────────────────────────────────────────

export async function saveSellerBilling(
  data: SellerBillingData
): Promise<Record<SellerSectionId, CompletionStatus>> {
  const ctx = await getSessionContext();
  const parsed = sellerBillingSchema.parse(data);

  await prisma.sellerProfile.upsert({
    where: { affiliateId: ctx.affiliateId },
    update: {
      w9FilePath: parsed.w9FilePath,
      achAccountHolderName: parsed.achAccountHolderName || null,
      achAccountType: parsed.achAccountType,
      achRoutingNumber: parsed.achRoutingNumber ? encryptField(parsed.achRoutingNumber) : null,
      achAccountNumber: parsed.achAccountNumber ? encryptField(parsed.achAccountNumber) : null,
      bankDocFilePath: parsed.bankDocFilePath,
    },
    create: {
      affiliateId: ctx.affiliateId,
      w9FilePath: parsed.w9FilePath,
      achAccountHolderName: parsed.achAccountHolderName || null,
      achAccountType: parsed.achAccountType,
      achRoutingNumber: parsed.achRoutingNumber ? encryptField(parsed.achRoutingNumber) : null,
      achAccountNumber: parsed.achAccountNumber ? encryptField(parsed.achAccountNumber) : null,
      bankDocFilePath: parsed.bankDocFilePath,
    },
  });

  await writeSectionSnapshot(
    106,
    {
      w9FilePath: parsed.w9FilePath,
      achAccountType: parsed.achAccountType,
      achAccountHolderName: parsed.achAccountHolderName,
      bankDocFilePath: parsed.bankDocFilePath,
      hasAchRouting: !!parsed.achRoutingNumber,
      hasAchAccount: !!parsed.achAccountNumber,
    },
    ctx.userId,
    ctx.affiliateId
  );

  return computeSellerStatuses(ctx.affiliateId);
}
