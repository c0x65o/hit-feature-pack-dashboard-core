function base64UrlDecode(input) {
    const s = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
    // atob exists in modern Node runtimes and in the browser runtime.
    return atob(s + pad);
}
/**
 * Extract user from JWT token in cookies or Authorization header
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
    if (!token)
        return null;
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
        return null;
    }
}
/**
 * Extract user ID from request (convenience function)
 */
export function getUserId(request) {
    const user = extractUserFromRequest(request);
    return user?.sub || null;
}
import { NextResponse } from 'next/server';
function getForwardedBearerFromRequest(request) {
    const rawTokenHeader = request.headers.get('x-hit-token-raw') || request.headers.get('X-HIT-Token-Raw');
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const cookieToken = request.cookies.get('hit_token')?.value || null;
    const bearer = rawTokenHeader && rawTokenHeader.trim()
        ? rawTokenHeader.trim().startsWith('Bearer ')
            ? rawTokenHeader.trim()
            : `Bearer ${rawTokenHeader.trim()}`
        : authHeader && authHeader.trim()
            ? authHeader
            : cookieToken
                ? `Bearer ${cookieToken}`
                : '';
    return bearer;
}
function getAuthProxyBaseUrlFromRequest(request) {
    // Server-side fetch() requires absolute URL.
    const origin = new URL(request.url).origin;
    // Auth is app-local (Next.js API dispatcher under /api/auth).
    return `${origin}/api/auth`;
}
function getFrontendBaseUrlFromRequest(request) {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    return host ? `${proto}://${host}` : new URL(request.url).origin;
}
function getAuthBaseUrl(request) {
    // No external auth base URL. Always use app-local auth API.
    return { baseUrl: getAuthProxyBaseUrlFromRequest(request).replace(/\/$/, ''), source: 'local' };
}
export async function requirePageAccess(request, pagePath) {
    const user = extractUserFromRequest(request);
    if (!user?.sub)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // Admins always have access to pages (defaultRolesAllow) and should not be blocked
    // by transient auth module/proxy outages.
    const isAdmin = (user.roles || [])
        .map((r) => String(r || '').trim().toLowerCase())
        .includes('admin');
    if (isAdmin)
        return user;
    const bearer = getForwardedBearerFromRequest(request);
    if (!bearer)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { baseUrl, source } = getAuthBaseUrl(request);
    const frontendBaseUrl = getFrontendBaseUrlFromRequest(request);
    try {
        // Prefer direct auth module URL when available (avoids "server calls itself via ingress" failures).
        // Still use the same endpoint so failures include diagnostic context.
        const res = await fetch(`${baseUrl}/permissions/pages/check${String(pagePath)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: bearer,
                ...(frontendBaseUrl ? { 'X-Frontend-Base-URL': frontendBaseUrl } : {}),
            },
            credentials: 'include',
        });
        const json = await res.json().catch(() => ({}));
        // Fail closed if auth proxy returns non-200 or unexpected shape.
        const allowed = Boolean(json?.has_permission ?? json?.hasPermission ?? false);
        if (!res.ok || !allowed) {
            // Keep response safe/minimal but include enough to debug in audit logs.
            const debug = typeof json === 'object' && json ? json : { raw: json };
            return NextResponse.json({
                error: 'Forbidden',
                code: 'page_access_denied',
                pagePath,
                authz: {
                    status: res.status,
                    authBaseSource: source,
                    ...debug,
                },
            }, { status: 403 });
        }
        return user;
    }
    catch (e) {
        return NextResponse.json({
            error: 'Auth service unavailable',
            code: 'auth_unavailable',
            pagePath,
            authz: {
                status: null,
                source: 'auth_proxy_exception',
                authBaseSource: source,
                authBaseUrl: baseUrl,
                message: e?.message ? String(e.message) : 'Auth check threw',
            },
        }, { status: 503 });
    }
}
