"use server";

import { prisma } from "@/lib/prisma";
import { getContextForAffiliate, writeSectionSnapshot } from "./helpers";
import { getCompletionStatuses } from "./completion";
import { encryptField } from "@/lib/encryption";
import { section1Schema, type Section1Data } from "@/lib/validations/section1";
import type { Section2Data } from "@/lib/validations/section2";
import type { Section3Data } from "@/lib/validations/section3";
import type { Section4Data } from "@/lib/validations/section4";
import type { Section5Data } from "@/lib/validations/section5";
import type { Section6Data } from "@/lib/validations/section6";
import type { Section7Data } from "@/lib/validations/section7";
import type { Section8Data } from "@/lib/validations/section8";
import type { Section9Data } from "@/lib/validations/section9";
import { Prisma } from "@prisma/client";
import type { CompletionStatus } from "@/types";

// ─── Section 1 ──────────────────────────────────────────────────────

export async function saveSection1ForAffiliate(
  affiliateId: string,
  data: Section1Data
): Promise<Record<number, CompletionStatus>> {
  const ctx = await getContextForAffiliate(affiliateId);
  const parsed = section1Schema.parse(data);

  await prisma.affiliate.update({
    where: { id: ctx.affiliateId },
    data: { legalName: parsed.legalName || null },
  });

  if (ctx.programId) {
    await prisma.program.update({
      where: { id: ctx.programId },
      data: {
        programName: parsed.programName || null,
        adminContactName: parsed.adminContactName || null,
        adminContactEmail: parsed.adminContactEmail || null,
        executiveSponsorName: parsed.executiveSponsorName || null,
        executiveSponsorEmail: parsed.executiveSponsorEmail || null,
        itContactName: parsed.itContactName || null,
        itContactEmail: parsed.itContactEmail || null,
        itContactPhone: parsed.itContactPhone || null,
      },
    });
  }

  await writeSectionSnapshot(1, parsed as unknown as Prisma.InputJsonValue, ctx.userId, ctx.affiliateId, ctx.programId);
  return getCompletionStatuses(ctx.affiliateId);
}

// ─── Section 2 ──────────────────────────────────────────────────────

export async function saveSection2ForAffiliate(
  affiliateId: string,
  data: Section2Data
): Promise<Record<number, CompletionStatus>> {
  const ctx = await getContextForAffiliate(affiliateId);

  if (ctx.programId) {
    await prisma.program.update({
      where: { id: ctx.programId },
      data: { defaultServicesConfirmed: data.defaultServicesConfirmed },
    });
  }

  await writeSectionSnapshot(2, data, ctx.userId, ctx.affiliateId, ctx.programId);
  return getCompletionStatuses(ctx.affiliateId);
}

// ─── Section 3 ──────────────────────────────────────────────────────

export async function saveSection3ForAffiliate(
  affiliateId: string,
  data: Section3Data
): Promise<Record<number, CompletionStatus>> {
  const ctx = await getContextForAffiliate(affiliateId);
  if (!ctx.programId) return getCompletionStatuses(ctx.affiliateId);

  await prisma.$transaction([
    prisma.service.deleteMany({ where: { programId: ctx.programId } }),
    prisma.service.createMany({
      data: data.services.map((svc) => ({
        programId: ctx.programId!,
        serviceType: svc.serviceType,
        selected: svc.selected,
        otherName: svc.otherName || null,
      })),
    }),
  ]);

  await writeSectionSnapshot(3, { services: data.services }, ctx.userId, ctx.affiliateId, ctx.programId);
  return getCompletionStatuses(ctx.affiliateId);
}

// ─── Section 4 ──────────────────────────────────────────────────────

export async function saveSection4ForAffiliate(
  affiliateId: string,
  data: Section4Data
): Promise<Record<number, CompletionStatus>> {
  const ctx = await getContextForAffiliate(affiliateId);
  if (!ctx.programId) return getCompletionStatuses(ctx.affiliateId);

  await prisma.program.update({
    where: { id: ctx.programId },
    data: {
      w9FilePath: data.w9FilePath,
      achRoutingNumber: data.achRoutingNumber ? encryptField(data.achRoutingNumber) : null,
      achAccountNumber: data.achAccountNumber ? encryptField(data.achAccountNumber) : null,
      achAccountType: data.achAccountType,
      achAccountHolderName: data.achAccountHolderName || null,
      bankDocFilePath: data.bankDocFilePath,
      paymentAchAccountHolderName: data.paymentAchAccountHolderName || null,
      paymentAchAccountType: data.paymentAchAccountType,
      paymentAchRoutingNumber: data.paymentAchRoutingNumber ? encryptField(data.paymentAchRoutingNumber) : null,
      paymentAchAccountNumber: data.paymentAchAccountNumber ? encryptField(data.paymentAchAccountNumber) : null,
    },
  });

  await writeSectionSnapshot(
    4,
    {
      w9FilePath: data.w9FilePath,
      achAccountType: data.achAccountType,
      achAccountHolderName: data.achAccountHolderName,
      bankDocFilePath: data.bankDocFilePath,
      hasAchRouting: !!data.achRoutingNumber,
      hasAchAccount: !!data.achAccountNumber,
      paymentAchAccountHolderName: data.paymentAchAccountHolderName,
      paymentAchAccountType: data.paymentAchAccountType,
      hasPaymentAchRouting: !!data.paymentAchRoutingNumber,
      hasPaymentAchAccount: !!data.paymentAchAccountNumber,
    },
    ctx.userId,
    ctx.affiliateId,
    ctx.programId
  );

  return getCompletionStatuses(ctx.affiliateId);
}

// ─── Section 5 ──────────────────────────────────────────────────────

export async function saveSection5ForAffiliate(
  affiliateId: string,
  data: Section5Data
): Promise<Record<number, CompletionStatus>> {
  const ctx = await getContextForAffiliate(affiliateId);

  await prisma.affiliate.update({
    where: { id: ctx.affiliateId },
    data: { defaultSchedulingSystem: data.defaultSchedulingSystem || null },
  });

  for (const loc of data.locations) {
    const locationData = {
      locationName: loc.locationName || null,
      streetAddress: loc.streetAddress || null,
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
      await prisma.location.update({ where: { id: loc.id }, data: locationData });

      if (loc.schedulingIntegrations) {
        await prisma.$transaction([
          prisma.schedulingIntegration.deleteMany({ where: { locationId: loc.id } }),
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
        data: { affiliateId: ctx.affiliateId, ...locationData },
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

export async function deleteLocationForAffiliate(affiliateId: string, locationId: string) {
  const ctx = await getContextForAffiliate(affiliateId);

  const location = await prisma.location.findFirst({
    where: { id: locationId, affiliateId: ctx.affiliateId },
  });
  if (!location) throw new Error("Location not found");

  await prisma.location.delete({ where: { id: locationId } });
}

// ─── Section 6 ──────────────────────────────────────────────────────

export async function saveSection6ForAffiliate(
  affiliateId: string,
  data: Section6Data
): Promise<Record<number, CompletionStatus>> {
  const ctx = await getContextForAffiliate(affiliateId);

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
      await prisma.provider.update({ where: { id: prov.id }, data: providerData });
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

export async function deleteProviderForAffiliate(affiliateId: string, providerId: string) {
  const ctx = await getContextForAffiliate(affiliateId);

  const provider = await prisma.provider.findFirst({
    where: { id: providerId, affiliateId: ctx.affiliateId },
  });
  if (!provider) throw new Error("Provider not found");

  await prisma.provider.delete({ where: { id: providerId } });
}

// ─── Section 7 ──────────────────────────────────────────────────────

export async function saveSection7ForAffiliate(
  affiliateId: string,
  data: Section7Data
): Promise<Record<number, CompletionStatus>> {
  const ctx = await getContextForAffiliate(affiliateId);

  const existing = await prisma.labNetwork.findFirst({
    where: { affiliateId: ctx.affiliateId },
  });

  const labData = {
    networkType: data.networkType,
    otherNetworkName: data.otherNetworkName || null,
    coordinationContactName: data.coordinationContactName || null,
    coordinationContactEmail: data.coordinationContactEmail || null,
    coordinationContactPhone: data.coordinationContactPhone || null,
    requiresScopedProject: data.networkType === "other",
  };

  if (existing) {
    await prisma.labNetwork.update({ where: { id: existing.id }, data: labData });
  } else {
    await prisma.labNetwork.create({ data: { affiliateId: ctx.affiliateId, ...labData } });
  }

  await writeSectionSnapshot(7, data, ctx.userId, ctx.affiliateId);
  return getCompletionStatuses(ctx.affiliateId);
}

// ─── Section 8 ──────────────────────────────────────────────────────

export async function saveSection8ForAffiliate(
  affiliateId: string,
  data: Section8Data
): Promise<Record<number, CompletionStatus>> {
  const ctx = await getContextForAffiliate(affiliateId);

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
    await prisma.radiologyNetwork.create({ data: { affiliateId: ctx.affiliateId, ...netData } });
  }

  await writeSectionSnapshot(8, data, ctx.userId, ctx.affiliateId);
  return getCompletionStatuses(ctx.affiliateId);
}

// ─── Section 9 ──────────────────────────────────────────────────────

export async function saveSection9ForAffiliate(
  affiliateId: string,
  data: Section9Data
): Promise<Record<number, CompletionStatus>> {
  const ctx = await getContextForAffiliate(affiliateId);

  const existing = await prisma.careNavConfig.findFirst({
    where: { affiliateId: ctx.affiliateId },
  });

  const configData = {
    acknowledged: data.acknowledged,
    primaryEscalationName: data.primaryEscalationName || null,
    primaryEscalationEmail: data.primaryEscalationEmail || null,
    secondaryEscalationName: data.secondaryEscalationName || null,
    secondaryEscalationEmail: data.secondaryEscalationEmail || null,
  };

  if (existing) {
    await prisma.careNavConfig.update({ where: { id: existing.id }, data: configData });
  } else {
    await prisma.careNavConfig.create({ data: { affiliateId: ctx.affiliateId, ...configData } });
  }

  await writeSectionSnapshot(9, data, ctx.userId, ctx.affiliateId);
  return getCompletionStatuses(ctx.affiliateId);
}
