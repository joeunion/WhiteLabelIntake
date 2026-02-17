"use server";

import { prisma } from "@/lib/prisma";
import { getSessionContext } from "./helpers";
import { getCompletionStatuses } from "./completion";
import { getSectionMeta } from "@/types";

export async function submitForm() {
  const ctx = await getSessionContext();

  // Server-side gate: all sections 1-9 must be complete
  const statuses = await getCompletionStatuses(ctx.affiliateId);
  const incomplete = Array.from({ length: 9 }, (_, i) => i + 1)
    .filter((id) => statuses[id] !== "complete");

  if (incomplete.length > 0) {
    const names = incomplete
      .map((id) => getSectionMeta(id)?.title ?? `Section ${id}`)
      .join(", ");
    throw new Error(`Cannot submit: incomplete sections — ${names}`);
  }

  await prisma.affiliate.update({
    where: { id: ctx.affiliateId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });
}
