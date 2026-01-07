import { z } from "zod";

// Schema-only module for:
// - PUT /api/dashboard-definitions/[key]

export const putBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  visibility: z.enum(["public", "private"]).optional(),
  definition: z.any().optional(),
});
