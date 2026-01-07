import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare const runtime = "nodejs";
export declare function GET(request: NextRequest, { params }: {
    params: {
        key: string;
    };
}): Promise<NextResponse<{
    data: any;
}> | NextResponse<{
    error: any;
}>>;
/**
 * PUT /api/dashboard-definitions/[key]
 *
 * Update a user-owned dashboard definition.
 * Only the owner (or admin) can update. System dashboards cannot be updated (copy them instead).
 *
 * Body (all optional; at least one required):
 *  - name?: string
 *  - description?: string | null
 *  - visibility?: 'public' | 'private'
 *  - definition?: object
 */
export declare function PUT(request: NextRequest, { params }: {
    params: {
        key: string;
    };
}): Promise<NextResponse<{
    data: any;
}> | NextResponse<{
    error: any;
}>>;
//# sourceMappingURL=dashboard-definitions-key.d.ts.map