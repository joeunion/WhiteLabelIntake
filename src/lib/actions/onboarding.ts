"use server";

import { prisma } from "@/lib/prisma";
import { getSessionContext, getContextForAffiliate } from "./helpers";
import { decryptField } from "@/lib/encryption";
import { SERVICE_TYPES } from "@/lib/validations/section3";
import { SUB_SERVICE_TYPES } from "@/lib/validations/section11";
import { defaultWeeklySchedule } from "@/lib/validations/section5";
import type { AllSectionData } from "@/components/form/OnboardingClient";
import type { CompletionStatus } from "@/types";
import type { Section1Data } from "@/lib/validations/section1";
import type { Section2Data } from "@/lib/validations/section2";
import type { Section3Data } from "@/lib/validations/section3";
import type { Section4Data } from "@/lib/validations/section4";
import type { Section5Data, LocationData } from "@/lib/validations/section5";
import type { Section6Data } from "@/lib/validations/section6";
import type { Section7Data } from "@/lib/validations/section7";
import type { Section8Data } from "@/lib/validations/section8";
import type { Section9Data } from "@/lib/validations/section9";
import type { Section11Data } from "@/lib/validations/section11";

interface PhaseInfo {
  phase: number;
  status: string;
}

interface OnboardingData {
  sections: AllSectionData;
  statuses: Record<number, CompletionStatus>;
  formStatus: string;
  phases: PhaseInfo[];
}

/**
 * Load onboarding data for a specific affiliate (admin use).
 * Auth-gated via getContextForAffiliate.
 */
export async function loadAllOnboardingDataForAffiliate(
  affiliateId: string
): Promise<OnboardingData> {
  await getContextForAffiliate(affiliateId);
  return loadOnboardingDataByAffiliateId(affiliateId);
}

export async function loadAllOnboardingData(): Promise<OnboardingData> {
  const ctx = await getSessionContext();
  return loadOnboardingDataByAffiliateId(ctx.affiliateId);
}

/**
 * Lightweight fetch of just the affiliate's form status (DRAFT / SUBMITTED).
 */
export async function getMyFormStatus(): Promise<string> {
  const ctx = await getSessionContext();
  const aff = await prisma.affiliate.findUnique({
    where: { id: ctx.affiliateId },
    select: { status: true },
  });
  return aff?.status ?? "DRAFT";
}

export async function getFormStatus(affiliateId: string): Promise<string> {
  await getContextForAffiliate(affiliateId);
  const aff = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    select: { status: true },
  });
  return aff?.status ?? "DRAFT";
}

/**
 * Fetch fresh phase info for the current user's affiliate.
 */
export async function getMyPhases(): Promise<PhaseInfo[]> {
  const ctx = await getSessionContext();
  return getPhasesByAffiliateId(ctx.affiliateId);
}

/**
 * Fetch fresh phase info for a specific affiliate (admin use).
 */
export async function getPhases(affiliateId: string): Promise<PhaseInfo[]> {
  await getContextForAffiliate(affiliateId);
  return getPhasesByAffiliateId(affiliateId);
}

async function getPhasesByAffiliateId(affiliateId: string): Promise<PhaseInfo[]> {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    select: { status: true, phases: { orderBy: { phase: "asc" as const } } },
  });
  if (!affiliate) return [{ phase: 1, status: "DRAFT" }];
  const phases: PhaseInfo[] = affiliate.phases.map((p) => ({
    phase: p.phase,
    status: p.status,
  }));
  if (!phases.find((p) => p.phase === 1)) {
    phases.unshift({ phase: 1, status: affiliate.status });
  }
  return phases;
}

async function loadOnboardingDataByAffiliateId(affiliateId: string): Promise<OnboardingData> {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    include: {
      programs: {
        take: 1,
        include: { services: true, subServices: true },
      },
      locations: {
        include: { schedulingIntegrations: true },
        orderBy: { createdAt: "asc" },
      },
      providers: {
        orderBy: { createdAt: "asc" },
      },
      labNetworks: { take: 1 },
      radiologyNetworks: { take: 1 },
      careNavConfigs: { take: 1 },
      phases: { orderBy: { phase: "asc" } },
    },
  });

  if (!affiliate) throw new Error("Affiliate not found");

  const program = affiliate.programs[0] ?? null;
  const lab = affiliate.labNetworks[0] ?? null;
  const rad = affiliate.radiologyNetworks[0] ?? null;
  const cn = affiliate.careNavConfigs[0] ?? null;

  // --- Phase data ---
  const phases: PhaseInfo[] = affiliate.phases.map((p) => ({
    phase: p.phase,
    status: p.status,
  }));
  // Ensure Phase 1 exists
  if (!phases.find((p) => p.phase === 1)) {
    phases.unshift({ phase: 1, status: affiliate.status });
  }
  const unlockedPhaseNumbers = phases.map((p) => p.phase);

  // --- Transform into section data shapes ---

  const s1: Section1Data = {
    legalName: affiliate.legalName ?? "",
    programName: program?.programName ?? "",
    adminContactName: program?.adminContactName ?? "",
    adminContactEmail: program?.adminContactEmail ?? "",
    executiveSponsorName: program?.executiveSponsorName ?? "",
    executiveSponsorEmail: program?.executiveSponsorEmail ?? "",
    itContactName: program?.itContactName ?? "",
    itContactEmail: program?.itContactEmail ?? "",
    itContactPhone: program?.itContactPhone ?? "",
  };

  const s2: Section2Data = {
    defaultServicesConfirmed: program?.defaultServicesConfirmed ?? false,
  };

  const serviceMap = new Map(
    (program?.services ?? []).map((s) => [s.serviceType, s])
  );
  const s3: Section3Data = {
    services: SERVICE_TYPES.map((st) => ({
      serviceType: st.value,
      selected: serviceMap.get(st.value)?.selected ?? false,
      otherName: serviceMap.get(st.value)?.otherName ?? "",
    })),
  };

  const s4: Section4Data = {
    w9FilePath: program?.w9FilePath ?? null,
    achRoutingNumber: program?.achRoutingNumber ? decryptField(program.achRoutingNumber) : "",
    achAccountNumber: program?.achAccountNumber ? decryptField(program.achAccountNumber) : "",
    achAccountType: (program?.achAccountType as Section4Data["achAccountType"]) ?? null,
    achAccountHolderName: program?.achAccountHolderName ?? "",
    bankDocFilePath: program?.bankDocFilePath ?? null,
    paymentAchAccountHolderName: program?.paymentAchAccountHolderName ?? "",
    paymentAchAccountType: (program?.paymentAchAccountType as Section4Data["paymentAchAccountType"]) ?? null,
    paymentAchRoutingNumber: program?.paymentAchRoutingNumber ? decryptField(program.paymentAchRoutingNumber) : "",
    paymentAchAccountNumber: program?.paymentAchAccountNumber ? decryptField(program.paymentAchAccountNumber) : "",
  };

  const s5: Section5Data = {
    defaultSchedulingSystem: affiliate.defaultSchedulingSystem ?? null,
    defaultSchedulingOtherName: affiliate.defaultSchedulingOtherName ?? null,
    defaultSchedulingAcknowledged: affiliate.defaultSchedulingAcknowledged ?? false,
    locations: affiliate.locations.map((loc) => ({
      id: loc.id,
      locationName: loc.locationName ?? "",
      streetAddress: loc.streetAddress ?? "",
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
      weeklySchedule: (loc.weeklySchedule as LocationData["weeklySchedule"]) ?? defaultWeeklySchedule(),
      schedulingSystemOverride: loc.schedulingSystemOverride ?? null,
      schedulingOverrideOtherName: loc.schedulingOverrideOtherName ?? null,
      schedulingOverrideAcknowledged: loc.schedulingOverrideAcknowledged ?? false,
      schedulingIntegrations: loc.schedulingIntegrations.map((si) => ({
        id: si.id,
        serviceType: si.serviceType as "office_365" | "google_calendar" | "other",
        serviceName: si.serviceName ?? "",
        accountIdentifier: si.accountIdentifier ?? "",
      })),
    })),
  };

  const s6: Section6Data = {
    providers: affiliate.providers.map((p) => ({
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

  const s7: Section7Data = {
    networkType: (lab?.networkType as Section7Data["networkType"]) ?? null,
    otherNetworkName: lab?.otherNetworkName ?? "",
    coordinationContactName: lab?.coordinationContactName ?? "",
    coordinationContactEmail: lab?.coordinationContactEmail ?? "",
    coordinationContactPhone: lab?.coordinationContactPhone ?? "",
    integrationAcknowledged: lab?.integrationAcknowledged ?? false,
  };

  const s8: Section8Data = {
    networkName: rad?.networkName ?? "",
    coordinationContactName: rad?.coordinationContactName ?? "",
    coordinationContactEmail: rad?.coordinationContactEmail ?? "",
    coordinationContactPhone: rad?.coordinationContactPhone ?? "",
    integrationAcknowledged: rad?.integrationAcknowledged ?? false,
  };

  const s9: Section9Data = {
    acknowledged: cn?.acknowledged ?? false,
    primaryEscalationName: cn?.primaryEscalationName ?? "",
    primaryEscalationEmail: cn?.primaryEscalationEmail ?? "",
    secondaryEscalationName: cn?.secondaryEscalationName ?? "",
    secondaryEscalationEmail: cn?.secondaryEscalationEmail ?? "",
  };

  // --- Section 11: Sub-Services (only if Phase 2 unlocked) ---
  let s11: Section11Data | undefined;
  if (unlockedPhaseNumbers.includes(2)) {
    const subServiceMap = new Map(
      (program?.subServices ?? []).map((ss) => [`${ss.serviceType}:${ss.subType}`, ss.selected])
    );
    // Get selected service types from Section 3
    const selectedServiceTypes = s3.services.filter((s) => s.selected).map((s) => s.serviceType);
    const categories: Section11Data["categories"] = {};
    for (const serviceType of selectedServiceTypes) {
      const subItems = SUB_SERVICE_TYPES[serviceType];
      if (!subItems) continue;
      categories[serviceType] = subItems.map((item) => ({
        subType: item.value,
        selected: subServiceMap.get(`${serviceType}:${item.value}`) ?? false,
      }));
    }
    s11 = { categories };
  }

  // --- Compute completion statuses in-memory ---
  const statuses = computeStatuses(affiliate, program, s3, s5, s6, lab, rad, cn, s11, unlockedPhaseNumbers);

  return {
    sections: { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5, 6: s6, 7: s7, 8: s8, 9: s9, 11: s11 },
    statuses,
    formStatus: affiliate.status,
    phases,
  };
}

// Same logic as completion.ts but computed from already-fetched data
function computeStatuses(
  affiliate: { legalName: string | null; status: string },
  program: {
    programName: string | null;
    adminContactName: string | null;
    adminContactEmail: string | null;
    executiveSponsorName: string | null;
    executiveSponsorEmail: string | null;
    itContactName: string | null;
    w9FilePath: string | null;
    achRoutingNumber: string | null;
    achAccountNumber: string | null;
    achAccountType: string | null;
    achAccountHolderName: string | null;
    bankDocFilePath: string | null;
    paymentAchAccountHolderName: string | null;
    paymentAchAccountType: string | null;
    paymentAchRoutingNumber: string | null;
    paymentAchAccountNumber: string | null;
    defaultServicesConfirmed: boolean;
    services: { selected: boolean }[];
  } | null,
  s3: Section3Data,
  s5: Section5Data,
  s6: Section6Data,
  lab: { networkType: string | null; coordinationContactName: string | null; integrationAcknowledged: boolean } | null,
  rad: { networkName: string | null; coordinationContactName: string | null } | null,
  cn: { acknowledged: boolean; primaryEscalationName: string | null; secondaryEscalationName: string | null } | null,
  s11: Section11Data | undefined,
  unlockedPhases: number[],
): Record<number, CompletionStatus> {
  const statuses: Record<number, CompletionStatus> = {};

  // Section 1
  if (program) {
    const fields = [affiliate.legalName, program.programName, program.adminContactName, program.adminContactEmail, program.executiveSponsorName, program.executiveSponsorEmail, program.itContactName];
    const filled = fields.filter(Boolean).length;
    statuses[1] = filled === 0 ? "not_started" : filled === fields.length ? "complete" : "in_progress";
  } else {
    statuses[1] = "not_started";
  }

  // Section 2
  statuses[2] = program?.defaultServicesConfirmed ? "complete" : "not_started";

  // Section 3
  const selectedServices = s3.services.filter((s) => s.selected);
  statuses[3] = selectedServices.length > 0 ? "complete" : (program?.services?.length ?? 0) > 0 ? "in_progress" : "not_started";

  // Section 4
  if (program) {
    const payoutFields = [program.w9FilePath, program.achRoutingNumber, program.achAccountNumber, program.achAccountType, program.achAccountHolderName, program.bankDocFilePath];
    const paymentFields = [program.paymentAchAccountHolderName, program.paymentAchAccountType, program.paymentAchRoutingNumber, program.paymentAchAccountNumber];
    const allFields = [...payoutFields, ...paymentFields];
    const filled = allFields.filter(Boolean).length;
    statuses[4] = filled === 0 ? "not_started" : filled === allFields.length ? "complete" : "in_progress";
  } else {
    statuses[4] = "not_started";
  }

  // Section 5
  const locations = s5.locations.filter((l) => l.id);
  const completeLocations = locations.filter((l) => l.locationName && l.streetAddress && l.city && l.state && l.zip && l.locationNpi && l.phoneNumber);
  statuses[5] = locations.length === 0 ? "not_started" : completeLocations.length === locations.length ? "complete" : "in_progress";

  // Section 6
  const providers = s6.providers.filter((p) => p.id);
  const completeProv = providers.filter((p) => p.firstName && p.lastName && p.npi && p.licenseNumber);
  statuses[6] = providers.length === 0 ? "not_started" : completeProv.length === providers.length ? "complete" : "in_progress";

  // Section 7
  statuses[7] = !lab ? "not_started" : lab.networkType && lab.coordinationContactName && (lab.networkType !== "other" || lab.integrationAcknowledged) ? "complete" : "in_progress";

  // Section 8
  statuses[8] = !rad ? "not_started" : rad.networkName && rad.coordinationContactName ? "complete" : "in_progress";

  // Section 9
  statuses[9] = !cn ? "not_started" : cn.acknowledged && cn.primaryEscalationName && cn.secondaryEscalationName ? "complete" : "in_progress";

  // Section 10
  statuses[10] = affiliate.status === "SUBMITTED" ? "complete" : "not_started";

  // Section 11: Sub-Service Configuration (only if Phase 2 unlocked)
  if (unlockedPhases.includes(2) && s11) {
    const cats = Object.entries(s11.categories);
    if (cats.length === 0) {
      statuses[11] = "not_started";
    } else {
      const allCategoriesHaveSelection = cats.every(([, items]) =>
        items.some((item) => item.selected)
      );
      const anyHasSelection = cats.some(([, items]) =>
        items.some((item) => item.selected)
      );
      statuses[11] = allCategoriesHaveSelection ? "complete" : anyHasSelection ? "in_progress" : "not_started";
    }
  }

  // Section 12 (Phase 2 review — not tracked for completion)

  return statuses;
}
