import { z } from "zod";
export declare const putBodySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    visibility: z.ZodOptional<z.ZodEnum<{
        public: "public";
        private: "private";
    }>>;
    definition: z.ZodOptional<z.ZodAny>;
}, z.core.$strip>;
//# sourceMappingURL=dashboard-definitions-key.schema.d.ts.map