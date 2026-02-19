"use server";

import { prisma } from "@/lib/prisma";
import { getSuperAdminContext } from "./helpers";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";

// ─── Types ──────────────────────────────────────────────────────────

export interface AffiliateListItem {
  id: string;
  legalName: string | null;
  status: string;
  createdAt: Date;
  adminUser: { name: string | null; email: string } | null;
  programName: string | null;
  completionPct: number;
}

export interface AffiliateDetail {
  id: string;
  legalName: string | null;
  status: string;
  createdAt: Date;
  deletedAt: Date | null;
  users: {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    deletedAt: Date | null;
    createdAt: Date;
  }[];
}

export interface UserListItem {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  deletedAt: Date | null;
  createdAt: Date;
  affiliate: { id: string; legalName: string | null } | null;
}

// ─── List Affiliates ────────────────────────────────────────────────

export async function listAffiliates(): Promise<AffiliateListItem[]> {
  await getSuperAdminContext();

  const affiliates = await prisma.affiliate.findMany({
    where: { deletedAt: null },
    include: {
      users: {
        where: { role: "ADMIN", deletedAt: null },
        take: 1,
        select: { name: true, email: true },
      },
      programs: {
        take: 1,
        select: { programName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return affiliates.map((a) => ({
    id: a.id,
    legalName: a.legalName,
    status: a.status,
    createdAt: a.createdAt,
    adminUser: a.users[0] ?? null,
    programName: a.programs[0]?.programName ?? null,
    completionPct: 0, // Will be computed on detail page
  }));
}

// ─── Get Affiliate Detail ───────────────────────────────────────────

export async function getAffiliateDetail(affiliateId: string): Promise<AffiliateDetail | null> {
  await getSuperAdminContext();

  return prisma.affiliate.findUnique({
    where: { id: affiliateId },
    include: {
      users: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          deletedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

// ─── Create Affiliate + Admin ───────────────────────────────────────

export async function createAffiliateWithAdmin(input: {
  email: string;
  name: string;
  password?: string;
  legalName?: string;
}): Promise<{ affiliateId: string; userId: string }> {
  await getSuperAdminContext();

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("A user with this email already exists");

  const password = input.password || generateTempPassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const affiliate = await prisma.affiliate.create({
    data: {
      legalName: input.legalName || null,
      users: {
        create: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: "ADMIN",
        },
      },
    },
    include: { users: true },
  });

  // Create initial program
  await prisma.program.create({
    data: { affiliateId: affiliate.id },
  });

  return {
    affiliateId: affiliate.id,
    userId: affiliate.users[0].id,
  };
}

// ─── List All Users ─────────────────────────────────────────────────

export async function listAllUsers(): Promise<UserListItem[]> {
  await getSuperAdminContext();

  return prisma.user.findMany({
    where: { deletedAt: null, role: { not: "SUPER_ADMIN" } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      deletedAt: true,
      createdAt: true,
      affiliate: {
        select: { id: true, legalName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Create User for Affiliate ──────────────────────────────────────

export async function createUserForAffiliate(input: {
  email: string;
  name: string;
  affiliateId: string;
  role: "ADMIN" | "COLLABORATOR";
}): Promise<{ userId: string }> {
  await getSuperAdminContext();

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("A user with this email already exists");

  const password = generateTempPassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      affiliateId: input.affiliateId,
    },
  });

  return { userId: user.id };
}

// ─── Soft Delete ────────────────────────────────────────────────────

export async function softDeleteAffiliate(affiliateId: string): Promise<void> {
  await getSuperAdminContext();

  const now = new Date();

  await prisma.affiliate.update({
    where: { id: affiliateId },
    data: { deletedAt: now },
  });

  await prisma.user.updateMany({
    where: { affiliateId },
    data: { deletedAt: now },
  });
}

export async function softDeleteUser(userId: string): Promise<void> {
  await getSuperAdminContext();

  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });
}

export async function restoreAffiliate(affiliateId: string): Promise<void> {
  await getSuperAdminContext();

  await prisma.affiliate.update({
    where: { id: affiliateId },
    data: { deletedAt: null },
  });

  await prisma.user.updateMany({
    where: { affiliateId },
    data: { deletedAt: null },
  });
}

// ─── Unlock Submitted Form ──────────────────────────────────────────

export async function unlockAffiliate(affiliateId: string): Promise<void> {
  await getSuperAdminContext();

  await prisma.$transaction([
    prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        status: "DRAFT",
        submittedAt: null,
      },
    }),
    prisma.affiliatePhase.updateMany({
      where: { affiliateId, phase: 1 },
      data: { status: "DRAFT", submittedAt: null },
    }),
  ]);
}

// ─── Phase Management ───────────────────────────────────────────────

export interface PhaseStatus {
  phase: number;
  status: string;
  unlockedAt: Date | null;
  submittedAt: Date | null;
}

export async function getPhaseStatuses(affiliateId: string): Promise<PhaseStatus[]> {
  await getSuperAdminContext();

  const phases = await prisma.affiliatePhase.findMany({
    where: { affiliateId },
    orderBy: { phase: "asc" },
    select: { phase: true, status: true, unlockedAt: true, submittedAt: true },
  });
  return phases;
}

export async function unlockPhase(affiliateId: string, phaseNumber: number): Promise<void> {
  await getSuperAdminContext();

  await prisma.affiliatePhase.upsert({
    where: { affiliateId_phase: { affiliateId, phase: phaseNumber } },
    update: { status: "DRAFT", unlockedAt: new Date(), submittedAt: null },
    create: { affiliateId, phase: phaseNumber, status: "DRAFT", unlockedAt: new Date() },
  });
}

export async function lockPhase(affiliateId: string, phaseNumber: number): Promise<void> {
  await getSuperAdminContext();

  if (phaseNumber === 1) {
    // Phase 1 lock = submit the affiliate
    await prisma.$transaction([
      prisma.affiliate.update({
        where: { id: affiliateId },
        data: { status: "SUBMITTED", submittedAt: new Date() },
      }),
      prisma.affiliatePhase.upsert({
        where: { affiliateId_phase: { affiliateId, phase: 1 } },
        update: { status: "SUBMITTED", submittedAt: new Date() },
        create: { affiliateId, phase: 1, status: "SUBMITTED", submittedAt: new Date() },
      }),
    ]);
  } else {
    await prisma.affiliatePhase.update({
      where: { affiliateId_phase: { affiliateId, phase: phaseNumber } },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
  }
}

export async function unlockPhaseForEditing(affiliateId: string, phaseNumber: number): Promise<void> {
  await getSuperAdminContext();

  if (phaseNumber === 1) {
    return unlockAffiliate(affiliateId);
  }

  await prisma.affiliatePhase.update({
    where: { affiliateId_phase: { affiliateId, phase: phaseNumber } },
    data: { status: "DRAFT", submittedAt: null },
  });
}

// ─── Helpers ────────────────────────────────────────────────────────

function generateTempPassword(): string {
  return Math.random().toString(36).slice(-10) + "A1!";
}
