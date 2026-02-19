import { z } from "zod";

export const section7Schema = z.object({
  networkType: z.enum(["quest", "labcorp", "other"]).optional().nullable(),
  otherNetworkName: z.string().optional(),
  coordinationContactName: z.string().optional(),
  coordinationContactEmail: z.string().email().optional().or(z.literal("")),
  coordinationContactPhone: z.string().optional(),
  integrationAcknowledged: z.boolean().default(false),
});

export type Section7Data = z.infer<typeof section7Schema>;
