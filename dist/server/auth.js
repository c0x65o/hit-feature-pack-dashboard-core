function base64UrlDecode(input) {
    const s = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
    // atob exists in modern Node runtimes and in the browser runtime.
    return atob(s + pad);
}
/**
 * Extract user from JWT token in cookies or Authorization header
 * Also checks x-user-id header (set by proxy/middleware in production)
 */
export function extractUserFromRequest(request) {
    // Check for token in cookie first
    let token = request.cookies.get('hit_token')?.value;
    // Fall back to Authorization header
    if (!token) {
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
    }
    // Always try to extract from JWT first (so we keep roles/groups/email when present)
    if (token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3)
                return null;
            const payload = JSON.parse(base64UrlDecode(parts[1]));
            // Check expiration
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                return null;
            }
            const groupIdsRaw = payload.groupIds ?? payload.group_ids ?? payload.group_ids_list ?? payload.groups ?? payload.group_ids_csv;
            const groups = Array.isArray(groupIdsRaw)
                ? groupIdsRaw.map((g) => String(g)).map((g) => g.trim()).filter(Boolean)
                : typeof groupIdsRaw === 'string'
                    ? groupIdsRaw
                        .split(',')
                        .map((g) => g.trim())
                        .filter(Boolean)
                    : [];
            const email = payload.email ||
                payload.preferred_username ||
                payload.upn ||
                payload.unique_name ||
                '';
            // Normalize roles (string | list | undefined)
            const rolesRaw = payload.roles ?? payload.role ?? [];
            const roles = Array.isArray(rolesRaw)
                ? rolesRaw.map((r) => String(r)).map((r) => r.trim()).filter(Boolean)
                : typeof rolesRaw === 'string'
                    ? [rolesRaw.trim()].filter(Boolean)
                    : [];
            return {
                sub: payload.sub || email || '',
                email: email || '',
                name: payload.name || email || '',
                roles,
                groups,
                featurePacks: (payload.featurePacks && typeof payload.featurePacks === 'object') ? payload.featurePacks : undefined,
            };
        }
        catch {
            // JWT parsing failed, fall through to x-user-* headers
        }
    }
    // Fall back to x-user-* headers (set by proxy in production)
    const xUserId = request.headers.get('x-user-id');
    if (xUserId) {
        const xUserEmail = request.headers.get('x-user-email') || '';
        const xUserName = request.headers.get('x-user-name') || xUserEmail || '';
        const xUserRoles = request.headers.get('x-user-roles');
        const roles = xUserRoles ? xUserRoles.split(',').map((r) => r.trim()).filter(Boolean) : [];
        const xUserGroupIds = request.headers.get('x-user-group-ids') || request.headers.get('x-user-groups');
        const groups = xUserGroupIds
            ? xUserGroupIds
                .split(',')
                .map((g) => g.trim())
                .filter(Boolean)
            : [];
        return { sub: xUserId, email: xUserEmail, name: xUserName, roles, groups };
    }
    return null;
}
/**
 * Extract user ID from request (convenience function)
 */
export function getUserId(request) {
    const user = extractUserFromRequest(request);
    return user?.sub || null;
}
