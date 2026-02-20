import { z } from "zod";

export const sellerBillingSchema = z.object({
  w9FilePath: z.string().optional().nullable(),
  achAccountHolderName: z.string().optional(),
  achAccountType: z.enum(["checking", "savings"]).optional().nullable(),
  achRoutingNumber: z.string().optional(),
  achAccountNumber: z.string().optional(),
  bankDocFilePath: z.string().optional().nullable(),
});

export type SellerBillingData = z.infer<typeof sellerBillingSchema>;
