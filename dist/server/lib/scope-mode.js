import { resolveScopeMode } from '@hit/feature-pack-auth-core/server/lib/scope-mode';
/**
 * Resolve effective scope mode using a tree:
 * - entity override: dashboard-core.{entity}.{verb}.scope.{mode}
 * - dashboard-core default: dashboard-core.{verb}.scope.{mode}
 * - fallback: own (implicit)
 */
export async function resolveDashboardCoreScopeMode(request, args) {
    const resolved = await resolveScopeMode(request, {
        pack: 'dashboard-core',
        verb: args.verb,
        entity: args.entity,
        supportedModes: ['all', 'own', 'none'],
        logPrefix: 'Dashboard-Core',
    });
    if (resolved === 'all')
        return 'all';
    if (resolved === 'ldd_any' ||
        resolved === 'ldd_all' ||
        resolved === 'location' ||
        resolved === 'department' ||
        resolved === 'division') {
        return 'ldd';
    }
    return resolved === 'own' ? 'own' : 'none';
}
