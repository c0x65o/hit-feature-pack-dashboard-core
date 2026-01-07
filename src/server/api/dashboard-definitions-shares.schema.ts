import { z } from "zod";

// Schema-only module for:
// - POST /api/dashboard-definitions/[key]/shares

export const postBodySchema = z.object({
  principalType: z.enum(["user", "group", "role"]),
  principalId: z.string().min(1),
  permission: z.enum(["view", "full"]).optional().default("view"),
});
