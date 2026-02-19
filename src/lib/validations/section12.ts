import { z } from "zod";

export const section12Schema = z.object({
  confirmed: z.boolean(),
});

export type Section12Data = z.infer<typeof section12Schema>;
