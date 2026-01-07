import { z } from "zod";
// Schema-only module: keep imports here minimal so `tsx` can import it during capability generation.
// Convention: export `<method>BodySchema` for write methods.
export const postBodySchema = z.object({
    name: z.string().min(1, "name is required"),
    description: z.string().optional(),
    visibility: z.enum(["public", "private"]).optional(),
    scope: z
        .union([z.object({ kind: z.literal("global") }), z.object({ kind: z.literal("pack"), pack: z.string() })])
        .optional(),
    pack: z.string().optional(),
    key: z.string().optional(),
    // NOTE: definition is an object; we keep it permissive here because the server normalizes it.
    definition: z.record(z.string(), z.any()).optional(),
    sourceKey: z.string().optional(),
});
// GET /api/dashboard-definitions query params.
// Note: query params arrive as strings; we keep them stringy for clarity for the AI.
export const getQuerySchema = z.object({
    pack: z.string().optional(),
    includeGlobal: z.enum(["true", "false"]).optional(),
});
