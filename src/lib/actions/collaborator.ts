"use server";

import { prisma } from "@/lib/prisma";
import { getSessionContext } from "./helpers";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function addCollaborator(email: string) {
  const ctx = await getSessionContext();

  if (ctx.role !== "ADMIN") {
    throw new Error("Only admins can add collaborators");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.affiliateId === ctx.affiliateId) {
      throw new Error("This person is already a collaborator");
    }
    throw new Error("This email is already associated with another account");
  }

  const tempPassword = crypto.randomBytes(8).toString("hex");
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "COLLABORATOR",
      affiliateId: ctx.affiliateId,
    },
  });

  return { email, tempPassword };
}

export async function getCollaborators() {
  const ctx = await getSessionContext();

  return prisma.user.findMany({
    where: { affiliateId: ctx.affiliateId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}
