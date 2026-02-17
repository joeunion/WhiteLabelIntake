import { z } from "zod";

export const providerSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  providerType: z.enum(["physician", "np", "pa", "other"]).optional().nullable(),
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),
  npi: z.string().optional(),
  deaNumber: z.string().optional(),
});

export const section6Schema = z.object({
  providers: z.array(providerSchema),
});

export type ProviderData = z.infer<typeof providerSchema>;
export type Section6Data = z.infer<typeof section6Schema>;
