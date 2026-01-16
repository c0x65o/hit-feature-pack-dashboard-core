import { NextRequest } from 'next/server';

export interface User {
  sub: string;
  email: string;
  name?: string;
  roles?: string[];
  groups?: string[];
  // Optional feature pack config carried in JWT claims (app-controlled).
  featurePacks?: Record<string, any>;
}

function base64UrlDecode(input: string): string {
  const s = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  // atob exists in modern Node runtimes and in the browser runtime.
  return atob(s + pad);
}

/**
 * Extract user from JWT token in cookies or Authorization header
 * Also checks x-user-id header (set by proxy/middleware in production)
 */
export function extractUserFromRequest(request: NextRequest): User | null {
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
      if (parts.length !== 3) return null;

      const payload = JSON.parse(base64UrlDecode(parts[1]));

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return null;
      }

      const groupIdsRaw =
        payload.groupIds ?? payload.group_ids ?? payload.group_ids_list ?? payload.groups ?? payload.group_ids_csv;
      const groups = Array.isArray(groupIdsRaw)
        ? groupIdsRaw.map((g: unknown) => String(g)).map((g: string) => g.trim()).filter(Boolean)
        : typeof groupIdsRaw === 'string'
          ? groupIdsRaw
              .split(',')
              .map((g: string) => g.trim())
              .filter(Boolean)
          : [];

      const email =
        payload.email ||
        payload.preferred_username ||
        payload.upn ||
        payload.unique_name ||
        '';

      // Normalize roles (string | list | undefined)
      const rolesRaw = payload.roles ?? payload.role ?? [];
      const roles = Array.isArray(rolesRaw)
        ? rolesRaw.map((r: unknown) => String(r)).map((r: string) => r.trim()).filter(Boolean)
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
    } catch {
      // JWT parsing failed, fall through to x-user-* headers
    }
  }

  // Fall back to x-user-* headers (set by proxy in production)
  const xUserId = request.headers.get('x-user-id');
  if (xUserId) {
    const xUserEmail = request.headers.get('x-user-email') || '';
    const xUserName = request.headers.get('x-user-name') || xUserEmail || '';
    const xUserRoles = request.headers.get('x-user-roles');
    const roles = xUserRoles
      ? xUserRoles
          .split(',')
          .map((r: string) => r.trim())
          .filter(Boolean)
      : [];

    const xUserGroupIds = request.headers.get('x-user-group-ids') || request.headers.get('x-user-groups');
    const groups = xUserGroupIds
      ? xUserGroupIds
          .split(',')
          .map((g: string) => g.trim())
          .filter(Boolean)
      : [];

    return { sub: xUserId, email: xUserEmail, name: xUserName, roles, groups };
  }

  return null;
}

/**
 * Extract user ID from request (convenience function)
 */
export function getUserId(request: NextRequest): string | null {
  const user = extractUserFromRequest(request);
  return user?.sub || null;
}

import { NextResponse } from 'next/server';

function getForwardedBearerFromRequest(request: NextRequest): string {
  const rawTokenHeader = request.headers.get('x-hit-token-raw') || request.headers.get('X-HIT-Token-Raw');
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const cookieToken = request.cookies.get('hit_token')?.value || null;
  const bearer =
    rawTokenHeader && rawTokenHeader.trim()
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

function getAuthProxyBaseUrlFromRequest(request: NextRequest): string {
  // Server-side fetch() requires absolute URL.
  const origin = new URL(request.url).origin;
  // Auth is app-local (Next.js API dispatcher under /api/auth).
  return `${origin}/api/auth`;
}

function getFrontendBaseUrlFromRequest(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  return host ? `${proto}://${host}` : new URL(request.url).origin;
}

function getAuthBaseUrl(request: NextRequest): { baseUrl: string; source: string } {
  // No external auth base URL. Always use app-local auth API.
  return { baseUrl: getAuthProxyBaseUrlFromRequest(request).replace(/\/$/, ''), source: 'local' };
}

export async function requirePageAccess(request: NextRequest, pagePath: string): Promise<User | NextResponse> {
  const user = extractUserFromRequest(request);
  if (!user?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admins always have access to pages (defaultRolesAllow) and should not be blocked
  // by transient auth module/proxy outages.
  const isAdmin = (user.roles || [])
    .map((r: string) => String(r || '').trim().toLowerCase())
    .includes('admin');
  if (isAdmin) return user;

  const bearer = getForwardedBearerFromRequest(request);
  if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    const allowed = Boolean((json as any)?.has_permission ?? (json as any)?.hasPermission ?? false);
    if (!res.ok || !allowed) {
      // Keep response safe/minimal but include enough to debug in audit logs.
      const debug = typeof json === 'object' && json ? json : { raw: json };
      return NextResponse.json(
        {
          error: 'Forbidden',
          code: 'page_access_denied',
          pagePath,
          authz: {
            status: res.status,
            authBaseSource: source,
            ...(debug as any),
          },
        },
        { status: 403 }
      );
    }
    return user;
  } catch (e: any) {
    return NextResponse.json(
      {
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
      },
      { status: 503 }
    );
  }
}
