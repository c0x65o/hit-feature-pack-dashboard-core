import type { ActionCheckResult } from '@hit/feature-pack-auth-core/server/lib/action-check';
export declare function checkDashboardCoreAction(request: Request, actionKey: string): Promise<ActionCheckResult>;
export declare function requireDashboardCoreAction(request: Request, actionKey: string): Promise<Response | null>;
//# sourceMappingURL=require-action.d.ts.map