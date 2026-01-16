import { NextRequest } from 'next/server';
export interface User {
    sub: string;
    email: string;
    name?: string;
    roles?: string[];
    groups?: string[];
    featurePacks?: Record<string, any>;
}
/**
 * Extract user from JWT token in cookies or Authorization header
 */
export declare function extractUserFromRequest(request: NextRequest): User | null;
/**
 * Extract user ID from request (convenience function)
 */
export declare function getUserId(request: NextRequest): string | null;
import { NextResponse } from 'next/server';
export declare function requirePageAccess(request: NextRequest, pagePath: string): Promise<User | NextResponse>;
//# sourceMappingURL=auth.d.ts.map