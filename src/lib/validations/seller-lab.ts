import { z } from "zod";

export const sellerLabSchema = z.object({
  networkType: z.enum(["quest", "labcorp", "other"]).optional().nullable(),
  otherNetworkName: z.string().optional(),
  coordinationContactName: z.string().optional(),
  coordinationContactEmail: z.string().email().optional().or(z.literal("")),
  coordinationContactPhone: z.string().optional(),
  integrationAcknowledged: z.boolean().default(false),
});

export type SellerLabData = z.infer<typeof sellerLabSchema>;
