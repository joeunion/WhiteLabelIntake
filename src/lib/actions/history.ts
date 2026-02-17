"use server";

import { prisma } from "@/lib/prisma";
import { getSessionContext, writeSectionSnapshot } from "./helpers";

export async function getSectionHistory(affiliateId: string) {
  return prisma.sectionSnapshot.findMany({
    where: { affiliateId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
    },
  });
}

export async function rollbackToTimestamp(timestamp: Date) {
  const ctx = await getSessionContext();

  const sections = Array.from({ length: 14 }, (_, i) => i + 1);

  for (const sectionId of sections) {
    const snapshot = await prisma.sectionSnapshot.findFirst({
      where: {
        affiliateId: ctx.affiliateId,
        sectionId,
        createdAt: { lte: timestamp },
      },
      orderBy: { createdAt: "desc" },
    });

    if (snapshot) {
      await writeSectionSnapshot(
        sectionId,
        { ...(snapshot.data as object), _rolledBackFrom: timestamp.toISOString() },
        ctx.userId,
        ctx.affiliateId,
        snapshot.programId
      );
    }
  }
}
