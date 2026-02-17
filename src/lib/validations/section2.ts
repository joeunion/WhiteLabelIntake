import { z } from "zod";

export const section2Schema = z.object({
  defaultServicesConfirmed: z.boolean(),
});

export type Section2Data = z.infer<typeof section2Schema>;
