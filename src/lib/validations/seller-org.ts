import { z } from "zod";

export const sellerOrgSchema = z.object({
  legalName: z.string().optional(),
  adminContactName: z.string().optional(),
  adminContactEmail: z.string().email().optional().or(z.literal("")),
  adminContactPhone: z.string().optional(),
  operationsContactName: z.string().optional(),
  operationsContactEmail: z.string().email().optional().or(z.literal("")),
  operationsContactPhone: z.string().optional(),
});

export type SellerOrgData = z.infer<typeof sellerOrgSchema>;
