import { z } from "zod";
export declare const postBodySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    visibility: z.ZodOptional<z.ZodEnum<{
        public: "public";
        private: "private";
    }>>;
    scope: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
        kind: z.ZodLiteral<"global">;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"pack">;
        pack: z.ZodString;
    }, z.core.$strip>]>>;
    pack: z.ZodOptional<z.ZodString>;
    key: z.ZodOptional<z.ZodString>;
    definition: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    sourceKey: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const getQuerySchema: z.ZodObject<{
    pack: z.ZodOptional<z.ZodString>;
    includeGlobal: z.ZodOptional<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>;
}, z.core.$strip>;
//# sourceMappingURL=dashboard-definitions.schema.d.ts.map