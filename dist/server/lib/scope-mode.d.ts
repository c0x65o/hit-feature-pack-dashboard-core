import type { NextRequest } from 'next/server';
export type ScopeMode = 'none' | 'own' | 'ldd' | 'all';
export type ScopeVerb = 'read' | 'write' | 'delete';
export type ScopeEntity = 'dashboards';
/**
 * Resolve effective scope mode using a tree:
 * - entity override: dashboard-core.{entity}.{verb}.scope.{mode}
 * - dashboard-core default: dashboard-core.{verb}.scope.{mode}
 * - fallback: own (implicit)
 */
export declare function resolveDashboardCoreScopeMode(request: NextRequest, args: {
    entity?: ScopeEntity;
    verb: ScopeVerb;
}): Promise<ScopeMode>;
//# sourceMappingURL=scope-mode.d.ts.map