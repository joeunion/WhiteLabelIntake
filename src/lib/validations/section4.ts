import { z } from "zod";

export const section4Schema = z.object({
  // Payout account
  w9FilePath: z.string().optional().nullable(),
  achRoutingNumber: z.string().optional(),
  achAccountNumber: z.string().optional(),
  achAccountType: z.enum(["checking", "savings"]).optional().nullable(),
  achAccountHolderName: z.string().optional(),
  bankDocFilePath: z.string().optional().nullable(),
  // Payment account (autocollect)
  paymentAchAccountHolderName: z.string().optional(),
  paymentAchAccountType: z.enum(["checking", "savings"]).optional().nullable(),
  paymentAchRoutingNumber: z.string().optional(),
  paymentAchAccountNumber: z.string().optional(),
});

export type Section4Data = z.infer<typeof section4Schema>;
