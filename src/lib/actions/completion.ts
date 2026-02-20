"use server";

import { prisma } from "@/lib/prisma";
import type { CompletionStatus } from "@/types";
import { getSessionContext } from "./helpers";
import { SUB_SERVICE_TYPES } from "@/lib/validations/section11";

/**
 * Session-aware wrapper — resolves affiliateId from the current session
 * so client code never needs to know it.
 */
export async function getMyCompletionStatuses(): Promise<Record<number, CompletionStatus>> {
  const ctx = await getSessionContext();
  return getCompletionStatuses(ctx.affiliateId);
}

export async function getCompletionStatuses(affiliateId: string): Promise<Record<number, CompletionStatus>> {
  const statuses: Record<number, CompletionStatus> = {};

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    select: { legalName: true, status: true },
  });

  const program = await prisma.program.findFirst({
    where: { affiliateId },
  });

  // Section 1: Client & Program Overview
  if (program) {
    const fields = [affiliate?.legalName, program.programName, program.adminContactName, program.adminContactEmail, program.executiveSponsorName, program.executiveSponsorEmail, program.itContactName];
    const filled = fields.filter(Boolean).length;
    statuses[1] = filled === 0 ? "not_started" : filled === fields.length ? "complete" : "in_progress";
  } else {
    statuses[1] = "not_started";
  }

  // Section 2: Default Program Services
  statuses[2] = program?.defaultServicesConfirmed ? "complete" : "not_started";

  // Section 3: In-Person & Extended Services
  const services = await prisma.service.findMany({ where: { programId: program?.id ?? "" } });
  const selectedServices = services.filter((s) => s.selected);
  statuses[3] = selectedServices.length > 0 ? "complete" : services.length > 0 ? "in_progress" : "not_started";

  // Section 4: Payouts & Payments
  if (program) {
    const payoutFields = [program.w9FilePath, program.achRoutingNumber, program.achAccountNumber, program.achAccountType, program.achAccountHolderName, program.bankDocFilePath];
    const paymentFields = [program.paymentAchAccountHolderName, program.paymentAchAccountType, program.paymentAchRoutingNumber, program.paymentAchAccountNumber];
    const allFields = [...payoutFields, ...paymentFields];
    const filled = allFields.filter(Boolean).length;
    statuses[4] = filled === 0 ? "not_started" : filled === allFields.length ? "complete" : "in_progress";
  } else {
    statuses[4] = "not_started";
  }

  // Section 5: Care Network — complete when at least 1 location in network
  const networkContractCount = await prisma.networkContract.count({
    where: { affiliateId, scopeAll: true },
  });
  const networkLocationCount = networkContractCount + await prisma.networkContractLocation.count({
    where: { contract: { affiliateId } },
  });
  statuses[5] = networkLocationCount > 0 ? "complete" : "not_started";

  // Section 9: Care Navigation
  const cn = await prisma.careNavConfig.findFirst({ where: { affiliateId } });
  statuses[9] = !cn ? "not_started" : cn.acknowledged && cn.primaryEscalationName && cn.secondaryEscalationName ? "complete" : "in_progress";

  // Section 10: Review & Submit
  statuses[10] = affiliate?.status === "SUBMITTED" ? "complete" : "not_started";

  // Section 11: Sub-Service Configuration (only if Phase 2 exists)
  const phase2 = await prisma.affiliatePhase.findUnique({
    where: { affiliateId_phase: { affiliateId, phase: 2 } },
  });
  if (phase2 && program) {
    const selectedServiceTypes = services.filter((s) => s.selected).map((s) => s.serviceType);
    const subServices = await prisma.subService.findMany({
      where: { programId: program.id },
    });
    const subsByType = new Map<string, boolean[]>();
    for (const ss of subServices) {
      if (!subsByType.has(ss.serviceType)) subsByType.set(ss.serviceType, []);
      if (ss.selected) subsByType.get(ss.serviceType)!.push(true);
    }
    // Complete when every selected service type with sub-items has at least one sub-item selected
    const categoriesWithSubItems = selectedServiceTypes.filter((st) => SUB_SERVICE_TYPES[st]);
    if (categoriesWithSubItems.length === 0) {
      statuses[11] = "not_started";
    } else {
      const allHaveSelection = categoriesWithSubItems.every(
        (st) => (subsByType.get(st)?.length ?? 0) > 0
      );
      const anyHasSelection = categoriesWithSubItems.some(
        (st) => (subsByType.get(st)?.length ?? 0) > 0
      );
      statuses[11] = allHaveSelection ? "complete" : anyHasSelection ? "in_progress" : "not_started";
    }
  }

  return statuses;
}
