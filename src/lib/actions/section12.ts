"use server";

import { prisma } from "@/lib/prisma";
import { getSessionContext } from "./helpers";
import { SUB_SERVICE_TYPES } from "@/lib/validations/section11";
import { SERVICE_TYPES } from "@/lib/validations/section3";

export interface Section12ReviewData {
  categories: {
    serviceType: string;
    label: string;
    selectedItems: number;
    items: { subType: string; label: string }[];
  }[];
}

export async function loadSection12(): Promise<Section12ReviewData> {
  const ctx = await getSessionContext();

  const program = await prisma.program.findFirst({
    where: { affiliateId: ctx.affiliateId },
    include: { services: true, subServices: true },
  });

  if (!program) return { categories: [] };

  const selectedServiceTypes = program.services
    .filter((s) => s.selected)
    .map((s) => s.serviceType);

  const subServiceMap = new Map(
    program.subServices.map((ss) => [`${ss.serviceType}:${ss.subType}`, ss.selected])
  );

  const categories: Section12ReviewData["categories"] = [];
  for (const serviceType of selectedServiceTypes) {
    const subItems = SUB_SERVICE_TYPES[serviceType];
    if (!subItems) continue;

    const serviceLabel = SERVICE_TYPES.find((st) => st.value === serviceType)?.label ?? serviceType;
    const items = subItems
      .filter((item) => subServiceMap.get(`${serviceType}:${item.value}`) === true)
      .map((item) => ({
        subType: item.value,
        label: item.label,
      }));

    categories.push({
      serviceType,
      label: serviceLabel,
      selectedItems: items.length,
      items,
    });
  }

  return { categories };
}
