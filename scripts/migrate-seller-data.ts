/**
 * Data migration: Copy existing Location, Provider, LabNetwork data
 * from affiliate tables to seller-owned tables for orgs where isSeller = true.
 * Also creates SellerProfile from Affiliate + Program data.
 *
 * Run with: npx tsx scripts/migrate-seller-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sellers = await prisma.affiliate.findMany({
    where: { isSeller: true },
    include: {
      programs: { take: 1 },
      locations: {
        include: {
          schedulingIntegrations: true,
        },
      },
      providers: true,
      labNetworks: { take: 1 },
    },
  });

  console.log(`Found ${sellers.length} seller org(s) to migrate.`);

  for (const seller of sellers) {
    const program = seller.programs[0] ?? null;
    const lab = seller.labNetworks[0] ?? null;

    // 1. Create SellerProfile (upsert)
    await prisma.sellerProfile.upsert({
      where: { affiliateId: seller.id },
      update: {},
      create: {
        affiliateId: seller.id,
        legalName: seller.legalName,
        adminContactName: program?.adminContactName ?? null,
        adminContactEmail: program?.adminContactEmail ?? null,
        adminContactPhone: null,
        operationsContactName: program?.itContactName ?? null,
        operationsContactEmail: program?.itContactEmail ?? null,
        operationsContactPhone: program?.itContactPhone ?? null,
        w9FilePath: program?.w9FilePath ?? null,
        achRoutingNumber: program?.achRoutingNumber ?? null,
        achAccountNumber: program?.achAccountNumber ?? null,
        achAccountType: program?.achAccountType ?? null,
        achAccountHolderName: program?.achAccountHolderName ?? null,
        bankDocFilePath: program?.bankDocFilePath ?? null,
      },
    });
    console.log(`  SellerProfile created for ${seller.legalName ?? seller.id}`);

    // 2. Copy Locations → SellerLocations
    const locationIdMap = new Map<string, string>(); // old → new
    for (const loc of seller.locations) {
      const existing = await prisma.sellerLocation.findFirst({
        where: { affiliateId: seller.id, locationNpi: loc.locationNpi },
      });
      if (existing) {
        locationIdMap.set(loc.id, existing.id);
        continue;
      }

      const sellerLoc = await prisma.sellerLocation.create({
        data: {
          affiliateId: seller.id,
          locationName: loc.locationName,
          streetAddress: loc.streetAddress,
          streetAddress2: loc.streetAddress2,
          city: loc.city,
          state: loc.state,
          zip: loc.zip,
          closeByDescription: loc.closeByDescription,
          locationNpi: loc.locationNpi,
          phoneNumber: loc.phoneNumber,
          hoursOfOperation: loc.hoursOfOperation,
          accessType: loc.accessType,
          hasOnSiteLabs: loc.hasOnSiteLabs,
          hasOnSiteRadiology: loc.hasOnSiteRadiology,
          hasOnSitePharmacy: loc.hasOnSitePharmacy,
          weeklySchedule: loc.weeklySchedule ?? undefined,
          schedulingSystemOverride: loc.schedulingSystemOverride,
          schedulingOverrideOtherName: loc.schedulingOverrideOtherName,
          schedulingOverrideAcknowledged: loc.schedulingOverrideAcknowledged,
        },
      });
      locationIdMap.set(loc.id, sellerLoc.id);

      // Copy scheduling integrations
      for (const si of loc.schedulingIntegrations) {
        await prisma.sellerSchedulingIntegration.create({
          data: {
            sellerLocationId: sellerLoc.id,
            serviceType: si.serviceType,
            serviceName: si.serviceName,
            accountIdentifier: si.accountIdentifier,
          },
        });
      }
    }
    console.log(`  ${locationIdMap.size} location(s) migrated`);

    // 3. Copy LocationServiceConfig → SellerLocationServiceConfig
    const oldLocationIds = Array.from(locationIdMap.keys());
    if (oldLocationIds.length > 0) {
      const configs = await prisma.locationServiceConfig.findMany({
        where: { locationId: { in: oldLocationIds } },
      });
      for (const cfg of configs) {
        const newLocId = locationIdMap.get(cfg.locationId);
        if (!newLocId) continue;
        await prisma.sellerLocationServiceConfig.upsert({
          where: { sellerLocationId_serviceType: { sellerLocationId: newLocId, serviceType: cfg.serviceType } },
          update: { available: cfg.available },
          create: { sellerLocationId: newLocId, serviceType: cfg.serviceType, available: cfg.available },
        });
      }

      const subServices = await prisma.locationSubService.findMany({
        where: { locationId: { in: oldLocationIds } },
      });
      for (const sub of subServices) {
        const newLocId = locationIdMap.get(sub.locationId);
        if (!newLocId) continue;
        await prisma.sellerLocationSubService.upsert({
          where: { sellerLocationId_serviceType_subType: { sellerLocationId: newLocId, serviceType: sub.serviceType, subType: sub.subType } },
          update: { available: sub.available },
          create: { sellerLocationId: newLocId, serviceType: sub.serviceType, subType: sub.subType, available: sub.available },
        });
      }
      console.log(`  Service configs migrated`);
    }

    // 4. Copy Providers → SellerProviders
    for (const prov of seller.providers) {
      const existing = await prisma.sellerProvider.findFirst({
        where: { affiliateId: seller.id, npi: prov.npi },
      });
      if (existing) continue;

      await prisma.sellerProvider.create({
        data: {
          affiliateId: seller.id,
          firstName: prov.firstName,
          lastName: prov.lastName,
          providerType: prov.providerType,
          licenseNumber: prov.licenseNumber,
          licenseState: prov.licenseState,
          npi: prov.npi,
          deaNumber: prov.deaNumber,
        },
      });
    }
    console.log(`  ${seller.providers.length} provider(s) migrated`);

    // 5. Copy LabNetwork → SellerLabNetwork
    if (lab) {
      const existingLab = await prisma.sellerLabNetwork.findFirst({
        where: { affiliateId: seller.id },
      });
      if (!existingLab) {
        await prisma.sellerLabNetwork.create({
          data: {
            affiliateId: seller.id,
            networkType: lab.networkType,
            otherNetworkName: lab.otherNetworkName,
            coordinationContactName: lab.coordinationContactName,
            coordinationContactEmail: lab.coordinationContactEmail,
            coordinationContactPhone: lab.coordinationContactPhone,
            integrationAcknowledged: lab.integrationAcknowledged,
          },
        });
        console.log(`  Lab network migrated`);
      }
    }

    console.log(`Done: ${seller.legalName ?? seller.id}`);
  }

  console.log("\nMigration complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
