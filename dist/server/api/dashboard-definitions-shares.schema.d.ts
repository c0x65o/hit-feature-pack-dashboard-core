import { z } from "zod";
export declare const postBodySchema: z.ZodObject<{
    principalType: z.ZodEnum<{
        user: "user";
        group: "group";
        role: "role";
        location: "location";
        division: "division";
        department: "department";
    }>;
    principalId: z.ZodString;
    permission: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        view: "view";
        full: "full";
    }>>>;
}, z.core.$strip>;
//# sourceMappingURL=dashboard-definitions-shares.schema.d.ts.map