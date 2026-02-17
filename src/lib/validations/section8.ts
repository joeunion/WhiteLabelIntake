import { z } from "zod";

export const section8Schema = z.object({
  networkName: z.string().optional(),
  orderDeliveryMethod: z.string().optional(),
  orderDeliveryEndpoint: z.string().optional(),
  resultsDeliveryMethod: z.enum(["fax", "pacs", "ehr_portal", "other"]).optional().nullable(),
  resultsDeliveryEndpoint: z.string().optional(),
  coordinationContactName: z.string().optional(),
  coordinationContactEmail: z.string().email().optional().or(z.literal("")),
  coordinationContactPhone: z.string().optional(),
});

export type Section8Data = z.infer<typeof section8Schema>;
