import { z } from "zod";

export const section9Schema = z.object({
  acknowledged: z.boolean().default(false),
  primaryEscalationName: z.string().optional(),
  primaryEscalationEmail: z.string().email().optional().or(z.literal("")),
  secondaryEscalationName: z.string().optional(),
  secondaryEscalationEmail: z.string().email().optional().or(z.literal("")),
});

export type Section9Data = z.infer<typeof section9Schema>;
