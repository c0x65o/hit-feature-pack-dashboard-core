// API: /api/dashboard-definitions/[key]/shares
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { requirePageAccess } from '../auth';
import { resolveDashboardCoreScopeMode } from '../lib/scope-mode';
import { requireDashboardCoreAction } from '../lib/require-action';
import { resolveUserOrgScope } from '@hit/feature-pack-auth-core/server/lib/acl-utils';
import { isLddIdInOrgScope, isUserInOrgScope, type LddPrincipalType } from '@hit/feature-pack-auth-core/server/lib/ldd-scoping';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ShareType = 'user' | 'group' | 'ldd';

function isLddPrincipalType(value: string): value is LddPrincipalType {
  return value === 'location' || value === 'division' || value === 'department';
}

function resolveShareType(principalType: string): ShareType | null {
  if (principalType === 'user') return 'user';
  if (principalType === 'group' || principalType === 'role') return 'group';
  if (isLddPrincipalType(principalType)) return 'ldd';
  return null;
}

async function enforceSharePermissions(args: {
  request: NextRequest;
  user: { sub: string };
  principalType: string;
  principalId: string;
}): Promise<Response | null> {
  const { request, user, principalType, principalId } = args;
  const shareType = resolveShareType(principalType);
  if (!shareType) {
    return NextResponse.json(
      { error: 'principalType must be user, group, role, location, division, or department' },
      { status: 400 }
    );
  }

  const shareActionKey =
    shareType === 'user'
      ? 'dashboard-core.dashboards.share.user'
      : shareType === 'group'
        ? 'dashboard-core.dashboards.share.group'
        : 'dashboard-core.dashboards.share.ldd';

  const shareDenied = await requireDashboardCoreAction(request, shareActionKey);
  if (shareDenied) return shareDenied;

  const shareOutsideKey = 'dashboard-core.dashboards.scope.share_outside';

  // Groups/roles have no LDD mapping, treat as outside.
  if (shareType === 'group') {
    const outsideDenied = await requireDashboardCoreAction(request, shareOutsideKey);
    if (outsideDenied) return outsideDenied;
    return null;
  }

  const orgScope = await resolveUserOrgScope({ request, user });

  if (shareType === 'user') {
    const inScope = await isUserInOrgScope({ userKey: principalId, orgScope });
    if (!inScope) {
      const outsideDenied = await requireDashboardCoreAction(request, shareOutsideKey);
      if (outsideDenied) return outsideDenied;
    }
    return null;
  }

  const inScope = isLddIdInOrgScope({
    orgScope,
    principalType: principalType as LddPrincipalType,
    principalId,
  });
  if (!inScope) {
    const outsideDenied = await requireDashboardCoreAction(request, shareOutsideKey);
    if (outsideDenied) return outsideDenied;
  }
  return null;
}

async function loadDashboardByKey(db: ReturnType<typeof getDb>, key: string) {
  const res = await db.execute(sql`
    select
      d.id,
      d.key,
      d.owner_user_id as "ownerUserId",
      d.is_system as "isSystem",
      d.visibility
    from "dashboard_definitions" d
    where d.key = ${key}
    limit 1
  `);
  return ((res as any).rows || [])[0] || null;
}

/**
 * GET: list shares (owner/admin only)
 */
export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const gate = await requirePageAccess(request, '/dashboards');
    if (gate instanceof NextResponse) return gate;
    const user = gate;

    const key = decodeURIComponent(params.key || '').trim();
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

    const db = getDb();
    const dash = await loadDashboardByKey(db, key);
    if (!dash) return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });

    // Resolve scope mode for write access (shares management requires write permission)
    const mode = await resolveDashboardCoreScopeMode(request, { entity: 'dashboards', verb: 'write' });

    // Apply scope-based access check (explicit branching on none/own/ldd/all)
    if (mode === 'none') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    } else if (mode === 'own') {
      if (dash.ownerUserId !== user.sub) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (mode === 'ldd') {
      // Dashboards don't have LDD fields, so ldd mode behaves the same as own
      if (dash.ownerUserId !== user.sub) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (mode === 'all') {
      // For 'all' mode, only owner can manage shares (shares are owner-only feature)
      if (dash.ownerUserId !== user.sub) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const res = await db.execute(sql`
      select
        s.id,
        s.principal_type as "principalType",
        s.principal_id as "principalId",
        coalesce(s.permission, 'view') as "permission",
        s.shared_by as "sharedBy",
        s.shared_by_name as "sharedByName",
        s.created_at as "createdAt"
      from "dashboard_definition_shares" s
      where s.dashboard_id = ${dash.id}
      order by s.created_at asc
    `);

    return NextResponse.json({ data: (res as any).rows || [] });
  } catch (error: any) {
    console.error('Failed to list dashboard shares:', error);
    return NextResponse.json({ error: error?.message || 'Failed to list shares' }, { status: 500 });
  }
}

/**
 * POST: add share entry
 * Body: { principalType: 'user' | 'group' | 'role' | 'location' | 'division' | 'department', principalId: string, permission?: 'view' | 'full' }
 */
export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const gate = await requirePageAccess(request, '/dashboards');
    if (gate instanceof NextResponse) return gate;
    const user = gate;

    const key = decodeURIComponent(params.key || '').trim();
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const principalType = String(body?.principalType || '').trim();
    const principalId = String(body?.principalId || '').trim();
    const permissionRaw = String(body?.permission || 'view').trim().toLowerCase();
    const permission = permissionRaw === 'full' ? 'full' : 'view';

    if (!principalType || !principalId) {
      return NextResponse.json({ error: 'principalType and principalId are required' }, { status: 400 });
    }
    if (!['user', 'group', 'role', 'location', 'division', 'department'].includes(principalType)) {
      return NextResponse.json({ error: 'principalType must be user, group, role, location, division, or department' }, { status: 400 });
    }

    const shareDenied = await enforceSharePermissions({ request, user, principalType, principalId });
    if (shareDenied) return shareDenied;

    const db = getDb();
    const dash = await loadDashboardByKey(db, key);
    if (!dash) return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });

    // Resolve scope mode for write access (shares management requires write permission)
    const mode = await resolveDashboardCoreScopeMode(request, { entity: 'dashboards', verb: 'write' });

    // Apply scope-based access check (explicit branching on none/own/ldd/all)
    if (mode === 'none') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    } else if (mode === 'own') {
      if (dash.ownerUserId !== user.sub) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (mode === 'ldd') {
      // Dashboards don't have LDD fields, so ldd mode behaves the same as own
      if (dash.ownerUserId !== user.sub) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (mode === 'all') {
      // For 'all' mode, only owner can manage shares (shares are owner-only feature)
      if (dash.ownerUserId !== user.sub) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    if (principalType === 'user' && principalId === user.sub) {
      return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 });
    }

    // Insert or update permission on conflict
    const res = await db.execute(sql`
      insert into "dashboard_definition_shares" (
        id,
        dashboard_id,
        principal_type,
        principal_id,
        permission,
        shared_by,
        shared_by_name,
        created_at
      ) values (
        gen_random_uuid(),
        ${dash.id},
        ${principalType},
        ${principalId},
        ${permission},
        ${user.sub},
        ${user.name || user.email || user.sub},
        now()
      )
      on conflict ("dashboard_id","principal_type","principal_id") do update set
        permission = ${permission},
        shared_by = ${user.sub},
        shared_by_name = ${user.name || user.email || user.sub}
      returning
        id,
        principal_type as "principalType",
        principal_id as "principalId",
        permission,
        shared_by as "sharedBy",
        shared_by_name as "sharedByName",
        created_at as "createdAt"
    `);

    const row = ((res as any).rows || [])[0];
    return NextResponse.json({ data: row });
  } catch (error: any) {
    console.error('Failed to add dashboard share:', error);
    return NextResponse.json({ error: error?.message || 'Failed to add share' }, { status: 500 });
  }
}

/**
 * DELETE: remove share entry
 * Query params: ?principalType=user&principalId=...
 */
export async function DELETE(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const gate = await requirePageAccess(request, '/dashboards');
    if (gate instanceof NextResponse) return gate;
    const user = gate;

    const key = decodeURIComponent(params.key || '').trim();
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const principalType = String(searchParams.get('principalType') || '').trim();
    const principalId = String(searchParams.get('principalId') || '').trim();
    if (!principalType || !principalId) {
      return NextResponse.json({ error: 'principalType and principalId are required' }, { status: 400 });
    }

    const db = getDb();
    const dash = await loadDashboardByKey(db, key);
    if (!dash) return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });

    // Resolve scope mode for write access (shares management requires write permission)
    const mode = await resolveDashboardCoreScopeMode(request, { entity: 'dashboards', verb: 'write' });

    // Apply scope-based access check (explicit branching on none/own/ldd/all)
    if (mode === 'none') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    } else if (mode === 'own') {
      if (dash.ownerUserId !== user.sub) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (mode === 'ldd') {
      // Dashboards don't have LDD fields, so ldd mode behaves the same as own
      if (dash.ownerUserId !== user.sub) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (mode === 'all') {
      // For 'all' mode, only owner can manage shares (shares are owner-only feature)
      if (dash.ownerUserId !== user.sub) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const del = await db.execute(sql`
      delete from "dashboard_definition_shares" s
      where s.dashboard_id = ${dash.id}
        and s.principal_type = ${principalType}
        and s.principal_id = ${principalId}
      returning s.id
    `);

    if (!((del as any).rows || []).length) return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to remove dashboard share:', error);
    return NextResponse.json({ error: error?.message || 'Failed to remove share' }, { status: 500 });
  }
}


