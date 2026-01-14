import { checkActionPermission, requireActionPermission, } from '@hit/feature-pack-auth-core/server/lib/action-check';
export async function checkDashboardCoreAction(request, actionKey) {
    return checkActionPermission(request, actionKey, { logPrefix: 'Dashboard-Core' });
}
export async function requireDashboardCoreAction(request, actionKey) {
    return requireActionPermission(request, actionKey, { logPrefix: 'Dashboard-Core' });
}
