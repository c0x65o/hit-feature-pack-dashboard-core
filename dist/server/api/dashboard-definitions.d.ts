import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare const runtime = "nodejs";
export { postBodySchema } from './dashboard-definitions.schema';
/**
 * GET /api/dashboard-definitions?pack=projects&includeGlobal=true
 *
 * Returns dashboards visible to the user:
 * - public dashboards
 * - dashboards owned by the user
 * - dashboards shared with the user (user/group/role)
 *
 * Optional filtering:
 * - pack=<name>: include pack dashboards for that pack, plus globals if includeGlobal=true (default)
 */
export declare function GET(request: NextRequest): Promise<NextResponse<{
    data: any;
}> | NextResponse<{
    error: any;
}>>;
/**
 * POST /api/dashboard-definitions
 *
 * Create a user-owned dashboard definition.
 * Body:
 *  - name: string (required)
 *  - description?: string
 *  - visibility?: 'public' | 'private' (default: private)
 *  - scope?: { kind: 'global' } | { kind: 'pack', pack: string }
 *  - pack?: string (optional; used as scope fallback when scope is omitted)
 *  - key?: string (optional; otherwise generated)
 *  - definition?: object (required unless sourceKey provided)
 *  - sourceKey?: string (optional; copies an existing dashboard, then applies overrides)
 */
export declare function POST(request: NextRequest): Promise<NextResponse<{
    data: any;
}> | NextResponse<{
    error: any;
}>>;
//# sourceMappingURL=dashboard-definitions.d.ts.map