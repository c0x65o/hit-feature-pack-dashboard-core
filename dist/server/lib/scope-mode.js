import { checkDashboardCoreAction } from './require-action';
/**
 * Resolve effective scope mode using a tree:
 * - entity override: dashboard-core.{entity}.{verb}.scope.{mode}
 * - dashboard-core default: dashboard-core.{verb}.scope.{mode}
 * - fallback: own
 *
 * Precedence if multiple are granted: most restrictive wins.
 */
export async function resolveDashboardCoreScopeMode(request, args) {
    const { entity, verb } = args;
    const entityPrefix = entity ? `dashboard-core.${entity}.${verb}.scope` : `dashboard-core.${verb}.scope`;
    const globalPrefix = `dashboard-core.${verb}.scope`;
    // Most restrictive wins (first match returned).
    const modes = ['none', 'own', 'ldd', 'any'];
    for (const m of modes) {
        const res = await checkDashboardCoreAction(request, `${entityPrefix}.${m}`);
        if (res.ok)
            return m;
    }
    for (const m of modes) {
        const res = await checkDashboardCoreAction(request, `${globalPrefix}.${m}`);
        if (res.ok)
            return m;
    }
    return 'own';
}
