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
 * Also checks x-user-id header (set by proxy/middleware in production)
 */
export declare function extractUserFromRequest(request: NextRequest): User | null;
/**
 * Extract user ID from request (convenience function)
 */
export declare function getUserId(request: NextRequest): string | null;
//# sourceMappingURL=auth.d.ts.map