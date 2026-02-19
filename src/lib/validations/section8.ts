import { z } from "zod";

export const section8Schema = z.object({
  networkName: z.string().optional(),
  coordinationContactName: z.string().optional(),
  coordinationContactEmail: z.string().email().optional().or(z.literal("")),
  coordinationContactPhone: z.string().optional(),
  integrationAcknowledged: z.boolean().default(false),
});

export type Section8Data = z.infer<typeof section8Schema>;
