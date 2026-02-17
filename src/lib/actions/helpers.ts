"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Gets the authenticated user's affiliate and program IDs.
 * Throws if not authenticated or no affiliate found.
 */
export async function getSessionContext() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, affiliateId: true, role: true },
  });

  if (!user?.affiliateId) throw new Error("No affiliate found for user");

  const program = await prisma.program.findFirst({
    where: { affiliateId: user.affiliateId },
    select: { id: true },
  });

  return {
    userId: user.id,
    affiliateId: user.affiliateId,
    programId: program?.id ?? null,
    role: user.role,
  };
}

/**
 * Auth gate for super-admin-only actions.
 * Throws if the user is not SUPER_ADMIN.
 */
export async function getSuperAdminContext(): Promise<{ userId: string; role: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "SUPER_ADMIN") throw new Error("Forbidden: requires SUPER_ADMIN role");

  return { userId: user.id, role: user.role };
}

/**
 * Resolves context for a specific affiliate.
 * SUPER_ADMIN can target any affiliate; other roles can only access their own.
 */
export async function getContextForAffiliate(targetAffiliateId: string): Promise<{
  userId: string;
  affiliateId: string;
  programId: string | null;
  role: string;
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, affiliateId: true, role: true },
  });

  if (!user) throw new Error("User not found");

  // Non-super-admins can only access their own affiliate
  if (user.role !== "SUPER_ADMIN" && user.affiliateId !== targetAffiliateId) {
    throw new Error("Forbidden: cannot access this affiliate");
  }

  const program = await prisma.program.findFirst({
    where: { affiliateId: targetAffiliateId },
    select: { id: true },
  });

  return {
    userId: user.id,
    affiliateId: targetAffiliateId,
    programId: program?.id ?? null,
    role: user.role,
  };
}

/**
 * Writes a section snapshot to the history table.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function writeSectionSnapshot(
  sectionId: number,
  data: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  userId: string,
  affiliateId: string,
  programId?: string | null
) {
  await prisma.sectionSnapshot.create({
    data: {
      sectionId,
      data,
      userId,
      affiliateId,
      programId: programId ?? undefined,
    },
  });
}
