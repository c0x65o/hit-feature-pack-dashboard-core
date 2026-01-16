// API: /api/dashboard-definitions/[key]/shares
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { extractUserFromRequest, requirePageAccess } from '../auth';
import { resolveDashboardCoreScopeMode } from '../lib/scope-mode';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // Apply scope-based access check (explicit branching on none/own/ldd/any)
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
    } else if (mode === 'any') {
      // For 'any' mode, only owner can manage shares (shares are owner-only feature)
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

    // Keep non-user sharing admin-only (matches principal option fetchers and prevents 403 churn for regular users).
    const isProbablyAdmin = Array.isArray(user.roles) && user.roles.some((r: any) => String(r || '').toLowerCase() === 'admin');
    if (!isProbablyAdmin && principalType !== 'user') {
      return NextResponse.json({ error: 'Only admins can share with non-user principals (groups, roles, or LDD)' }, { status: 403 });
    }

    const db = getDb();
    const dash = await loadDashboardByKey(db, key);
    if (!dash) return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });

    // Resolve scope mode for write access (shares management requires write permission)
    const mode = await resolveDashboardCoreScopeMode(request, { entity: 'dashboards', verb: 'write' });

    // Apply scope-based access check (explicit branching on none/own/ldd/any)
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
    } else if (mode === 'any') {
      // For 'any' mode, only owner can manage shares (shares are owner-only feature)
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

    // Apply scope-based access check (explicit branching on none/own/ldd/any)
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
    } else if (mode === 'any') {
      // For 'any' mode, only owner can manage shares (shares are owner-only feature)
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


