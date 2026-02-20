"use server";

import { prisma } from "@/lib/prisma";
import { getSessionContext } from "./helpers";

// ─── Types ──────────────────────────────────────────────────────────

export interface NetworkLocationItem {
  id: string;
  sellerLocationId: string;
  locationName: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  phoneNumber: string;
  hoursOfOperation: string;
  accessType: string | null;
  latitude: number | null;
  longitude: number | null;
  sellerOrgName: string | null;
  sellerOrgId: string;
  isSelfOwned: boolean;
  contractId: string;
  included: boolean;
  services: string[];
}

export interface NetworkContractSummary {
  contractId: string;
  sellerId: string;
  sellerName: string | null;
  scopeAll: boolean;
  locationCount: number;
  includedCount: number;
}

// ─── Load Network Locations ─────────────────────────────────────────

export async function loadNetworkLocations(): Promise<NetworkLocationItem[]> {
  const ctx = await getSessionContext();
  const affiliateId = ctx.affiliateId;

  // Auto-ensure self-contract exists if this affiliate has seller locations
  const selfLocationCount = await prisma.sellerLocation.count({
    where: { affiliateId },
  });
  if (selfLocationCount > 0) {
    await prisma.networkContract.upsert({
      where: { affiliateId_sellerId: { affiliateId, sellerId: affiliateId } },
      update: { scopeAll: true },
      create: { affiliateId, sellerId: affiliateId, scopeAll: true },
    });
  }

  const contracts = await prisma.networkContract.findMany({
    where: { affiliateId },
    include: {
      seller: { select: { id: true, legalName: true } },
      scopedLocations: { select: { sellerLocationId: true } },
    },
  });

  if (contracts.length === 0) return [];

  // Gather all seller IDs from contracts
  const sellerIds = contracts.map((c) => c.sellerId);

  // Load all seller locations for contracted sellers
  const allLocations = await prisma.sellerLocation.findMany({
    where: { affiliateId: { in: sellerIds } },
    include: {
      serviceConfigs: { select: { serviceType: true, available: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const results: NetworkLocationItem[] = [];

  for (const contract of contracts) {
    const sellerLocations = allLocations.filter((l) => l.affiliateId === contract.sellerId);
    const scopedLocationIds = new Set(contract.scopedLocations.map((sl) => sl.sellerLocationId));

    for (const loc of sellerLocations) {
      const included = contract.scopeAll || scopedLocationIds.has(loc.id);
      const enabledServices = loc.serviceConfigs
        .filter((sc) => sc.available)
        .map((sc) => sc.serviceType);

      results.push({
        id: `${contract.id}:${loc.id}`,
        sellerLocationId: loc.id,
        locationName: loc.locationName ?? "",
        streetAddress: loc.streetAddress ?? "",
        city: loc.city ?? "",
        state: loc.state ?? "",
        zip: loc.zip ?? "",
        phoneNumber: loc.phoneNumber ?? "",
        hoursOfOperation: loc.hoursOfOperation ?? "",
        accessType: loc.accessType,
        latitude: loc.latitude,
        longitude: loc.longitude,
        sellerOrgName: contract.seller.legalName,
        sellerOrgId: contract.sellerId,
        isSelfOwned: contract.sellerId === affiliateId,
        contractId: contract.id,
        included,
        services: enabledServices,
      });
    }
  }

  return results;
}

// ─── Load Network Contracts Summary ─────────────────────────────────

export async function loadMyNetworkContracts(): Promise<NetworkContractSummary[]> {
  const ctx = await getSessionContext();

  const contracts = await prisma.networkContract.findMany({
    where: { affiliateId: ctx.affiliateId },
    include: {
      seller: { select: { legalName: true } },
      scopedLocations: { select: { id: true } },
    },
  });

  const results: NetworkContractSummary[] = [];

  for (const contract of contracts) {
    const totalLocations = await prisma.sellerLocation.count({
      where: { affiliateId: contract.sellerId },
    });

    results.push({
      contractId: contract.id,
      sellerId: contract.sellerId,
      sellerName: contract.seller.legalName,
      scopeAll: contract.scopeAll,
      locationCount: totalLocations,
      includedCount: contract.scopeAll ? totalLocations : contract.scopedLocations.length,
    });
  }

  return results;
}

// ─── Toggle Location Inclusion ──────────────────────────────────────

export async function toggleNetworkLocation(
  contractId: string,
  sellerLocationId: string,
  include: boolean,
): Promise<void> {
  const ctx = await getSessionContext();

  // Verify contract belongs to this affiliate
  const contract = await prisma.networkContract.findUnique({
    where: { id: contractId },
    select: { affiliateId: true, sellerId: true, scopeAll: true },
  });
  if (!contract || contract.affiliateId !== ctx.affiliateId) {
    throw new Error("Contract not found");
  }

  // Self-owned locations are always included — cannot toggle off
  if (contract.sellerId === ctx.affiliateId && !include) {
    throw new Error("Cannot exclude your own locations from the network");
  }

  if (contract.scopeAll && !include) {
    // Switching from scopeAll to explicit: add all locations EXCEPT the excluded one
    const allLocations = await prisma.sellerLocation.findMany({
      where: { affiliateId: contract.affiliateId },
      select: { id: true },
    });

    // Get the seller's affiliate ID from the contract
    const fullContract = await prisma.networkContract.findUnique({
      where: { id: contractId },
      select: { sellerId: true },
    });
    const sellerLocations = await prisma.sellerLocation.findMany({
      where: { affiliateId: fullContract!.sellerId },
      select: { id: true },
    });

    const toInclude = sellerLocations
      .filter((l) => l.id !== sellerLocationId)
      .map((l) => ({ sellerLocationId: l.id }));

    await prisma.$transaction([
      prisma.networkContract.update({
        where: { id: contractId },
        data: { scopeAll: false },
      }),
      prisma.networkContractLocation.deleteMany({
        where: { contractId },
      }),
      ...toInclude.map((loc) =>
        prisma.networkContractLocation.create({
          data: { contractId, sellerLocationId: loc.sellerLocationId },
        })
      ),
    ]);
  } else if (!contract.scopeAll && include) {
    // Add location to scoped list
    await prisma.networkContractLocation.upsert({
      where: { contractId_sellerLocationId: { contractId, sellerLocationId } },
      update: {},
      create: { contractId, sellerLocationId },
    });
  } else if (!contract.scopeAll && !include) {
    // Remove location from scoped list
    await prisma.networkContractLocation.deleteMany({
      where: { contractId, sellerLocationId },
    });
  }
  // scopeAll && include → no-op (already included)
}

// ─── Set Contract Scope All ─────────────────────────────────────────

export async function setContractScopeAll(
  contractId: string,
  scopeAll: boolean,
): Promise<void> {
  const ctx = await getSessionContext();

  const contract = await prisma.networkContract.findUnique({
    where: { id: contractId },
    select: { affiliateId: true },
  });
  if (!contract || contract.affiliateId !== ctx.affiliateId) {
    throw new Error("Contract not found");
  }

  if (scopeAll) {
    // Switch to include all — remove explicit entries
    await prisma.$transaction([
      prisma.networkContractLocation.deleteMany({ where: { contractId } }),
      prisma.networkContract.update({
        where: { id: contractId },
        data: { scopeAll: true },
      }),
    ]);
  } else {
    // Switch to explicit — add all current locations
    const fullContract = await prisma.networkContract.findUnique({
      where: { id: contractId },
      select: { sellerId: true },
    });
    const sellerLocations = await prisma.sellerLocation.findMany({
      where: { affiliateId: fullContract!.sellerId },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.networkContract.update({
        where: { id: contractId },
        data: { scopeAll: false },
      }),
      ...sellerLocations.map((loc) =>
        prisma.networkContractLocation.create({
          data: { contractId, sellerLocationId: loc.id },
        })
      ),
    ]);
  }
}
