// API: /api/dashboard-definitions/[key]/shares
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { extractUserFromRequest } from '../auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
function isAdmin(roles) {
    return Array.isArray(roles) && roles.some((r) => String(r || '').toLowerCase() === 'admin');
}
async function loadDashboardByKey(db, key) {
    const res = await db.execute(sql `
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
    return (res.rows || [])[0] || null;
}
/**
 * GET: list shares (owner/admin only)
 */
export async function GET(request, { params }) {
    try {
        const user = extractUserFromRequest(request);
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const key = decodeURIComponent(params.key || '').trim();
        if (!key)
            return NextResponse.json({ error: 'Missing key' }, { status: 400 });
        const db = getDb();
        const dash = await loadDashboardByKey(db, key);
        if (!dash)
            return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
        const canManage = dash.ownerUserId === user.sub || isAdmin(user.roles);
        if (!canManage)
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        const res = await db.execute(sql `
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
        return NextResponse.json({ data: res.rows || [] });
    }
    catch (error) {
        console.error('Failed to list dashboard shares:', error);
        return NextResponse.json({ error: error?.message || 'Failed to list shares' }, { status: 500 });
    }
}
/**
 * POST: add share entry
 * Body: { principalType: 'user' | 'group' | 'role', principalId: string, permission?: 'view' | 'full' }
 */
export async function POST(request, { params }) {
    try {
        const user = extractUserFromRequest(request);
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const key = decodeURIComponent(params.key || '').trim();
        if (!key)
            return NextResponse.json({ error: 'Missing key' }, { status: 400 });
        const body = await request.json().catch(() => ({}));
        const principalType = String(body?.principalType || '').trim();
        const principalId = String(body?.principalId || '').trim();
        const permissionRaw = String(body?.permission || 'view').trim().toLowerCase();
        const permission = permissionRaw === 'full' ? 'full' : 'view';
        if (!principalType || !principalId) {
            return NextResponse.json({ error: 'principalType and principalId are required' }, { status: 400 });
        }
        if (!['user', 'group', 'role'].includes(principalType)) {
            return NextResponse.json({ error: 'principalType must be user, group, or role' }, { status: 400 });
        }
        if (!isAdmin(user.roles) && principalType !== 'user') {
            return NextResponse.json({ error: 'Only admins can share with groups or roles' }, { status: 403 });
        }
        const db = getDb();
        const dash = await loadDashboardByKey(db, key);
        if (!dash)
            return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
        const canManage = dash.ownerUserId === user.sub || isAdmin(user.roles);
        if (!canManage)
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        if (principalType === 'user' && principalId === user.sub) {
            return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 });
        }
        // Insert or update permission on conflict
        const res = await db.execute(sql `
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
        const row = (res.rows || [])[0];
        return NextResponse.json({ data: row });
    }
    catch (error) {
        console.error('Failed to add dashboard share:', error);
        return NextResponse.json({ error: error?.message || 'Failed to add share' }, { status: 500 });
    }
}
/**
 * DELETE: remove share entry
 * Query params: ?principalType=user&principalId=...
 */
export async function DELETE(request, { params }) {
    try {
        const user = extractUserFromRequest(request);
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const key = decodeURIComponent(params.key || '').trim();
        if (!key)
            return NextResponse.json({ error: 'Missing key' }, { status: 400 });
        const { searchParams } = new URL(request.url);
        const principalType = String(searchParams.get('principalType') || '').trim();
        const principalId = String(searchParams.get('principalId') || '').trim();
        if (!principalType || !principalId) {
            return NextResponse.json({ error: 'principalType and principalId are required' }, { status: 400 });
        }
        const db = getDb();
        const dash = await loadDashboardByKey(db, key);
        if (!dash)
            return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
        const canManage = dash.ownerUserId === user.sub || isAdmin(user.roles);
        if (!canManage)
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        const del = await db.execute(sql `
      delete from "dashboard_definition_shares" s
      where s.dashboard_id = ${dash.id}
        and s.principal_type = ${principalType}
        and s.principal_id = ${principalId}
      returning s.id
    `);
        if (!(del.rows || []).length)
            return NextResponse.json({ error: 'Share not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Failed to remove dashboard share:', error);
        return NextResponse.json({ error: error?.message || 'Failed to remove share' }, { status: 500 });
    }
}
