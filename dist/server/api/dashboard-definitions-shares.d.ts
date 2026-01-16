import { NextRequest, NextResponse } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare const runtime = "nodejs";
/**
 * GET: list shares (owner/admin only)
 */
export declare function GET(request: NextRequest, { params }: {
    params: {
        key: string;
    };
}): Promise<NextResponse<unknown>>;
/**
 * POST: add share entry
 * Body: { principalType: 'user' | 'group' | 'role' | 'location' | 'division' | 'department', principalId: string, permission?: 'view' | 'full' }
 */
export declare function POST(request: NextRequest, { params }: {
    params: {
        key: string;
    };
}): Promise<NextResponse<unknown>>;
/**
 * DELETE: remove share entry
 * Query params: ?principalType=user&principalId=...
 */
export declare function DELETE(request: NextRequest, { params }: {
    params: {
        key: string;
    };
}): Promise<NextResponse<unknown>>;
//# sourceMappingURL=dashboard-definitions-shares.d.ts.map