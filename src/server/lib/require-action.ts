import type { ActionCheckResult } from '@hit/feature-pack-auth-core/server/lib/action-check';
import {
  checkActionPermission,
  requireActionPermission,
} from '@hit/feature-pack-auth-core/server/lib/action-check';

export async function checkDashboardCoreAction(
  request: Request,
  actionKey: string
): Promise<ActionCheckResult> {
  return checkActionPermission(
    request as Parameters<typeof checkActionPermission>[0],
    actionKey,
    { logPrefix: 'Dashboard-Core' }
  );
}

export async function requireDashboardCoreAction(
  request: Request,
  actionKey: string
): Promise<Response | null> {
  return requireActionPermission(
    request as Parameters<typeof requireActionPermission>[0],
    actionKey,
    { logPrefix: 'Dashboard-Core' }
  );
}
