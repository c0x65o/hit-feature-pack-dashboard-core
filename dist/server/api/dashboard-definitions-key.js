// API: /api/dashboard-definitions/[key]
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { extractUserFromRequest } from '../auth';
import { resolveUserPrincipals } from '@/lib/acl-utils';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request, { params }) {
    try {
        const user = extractUserFromRequest(request);
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const key = decodeURIComponent(params.key || '').trim();
        if (!key)
            return NextResponse.json({ error: 'Missing key' }, { status: 400 });
        const db = getDb();
        const principals = await resolveUserPrincipals({ request, user });
        const userGroups = principals.groupIds || [];
        const userRoles = principals.roles || [];
        const groupList = userGroups.map((g) => sql `${g}`);
        const roleList = userRoles.map((r) => sql `${r}`);
        const sharedAccess = userGroups.length || userRoles.length
            ? sql `exists (
            select 1
            from "dashboard_definition_shares" s
            where s.dashboard_id = d.id
              and (
                (s.principal_type = 'user' and s.principal_id = ${user.sub})
                ${userGroups.length ? sql `or (s.principal_type = 'group' and s.principal_id in (${sql.join(groupList, sql `, `)}))` : sql ``}
                ${userRoles.length ? sql `or (s.principal_type = 'role' and s.principal_id in (${sql.join(roleList, sql `, `)}))` : sql ``}
              )
          )`
            : sql `exists (
            select 1
            from "dashboard_definition_shares" s
            where s.dashboard_id = d.id
              and (s.principal_type = 'user' and s.principal_id = ${user.sub})
          )`;
        const result = await db.execute(sql `
      select
        d.id,
        d.key,
        d.name,
        d.description,
        d.owner_user_id as "ownerUserId",
        d.is_system as "isSystem",
        d.visibility,
        d.scope,
        d.version,
        d.definition,
        d.updated_at as "updatedAt",
        (d.owner_user_id = ${user.sub}) as "isOwner",
        exists (
          select 1 from "dashboard_definition_shares" s
          where s.dashboard_id = d.id
            and (
              (s.principal_type = 'user' and s.principal_id = ${user.sub})
              ${userGroups.length ? sql `or (s.principal_type = 'group' and s.principal_id in (${sql.join(groupList, sql `, `)}))` : sql ``}
              ${userRoles.length ? sql `or (s.principal_type = 'role' and s.principal_id in (${sql.join(roleList, sql `, `)}))` : sql ``}
            )
        ) as "isShared",
        (
          d.owner_user_id = ${user.sub}
          or exists (
            select 1 from "dashboard_definition_shares" s
            where s.dashboard_id = d.id
              and s.permission = 'full'
              and (
                (s.principal_type = 'user' and s.principal_id = ${user.sub})
                ${userGroups.length ? sql `or (s.principal_type = 'group' and s.principal_id in (${sql.join(groupList, sql `, `)}))` : sql ``}
                ${userRoles.length ? sql `or (s.principal_type = 'role' and s.principal_id in (${sql.join(roleList, sql `, `)}))` : sql ``}
              )
          )
        ) as "canEdit"
      from "dashboard_definitions" d
      where d.key = ${key}
      limit 1
    `);
        const row = (result.rows || [])[0];
        if (!row)
            return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
        const canRead = row.visibility === 'public' || row.isOwner || row.isShared;
        if (!canRead)
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        return NextResponse.json({ data: row });
    }
    catch (error) {
        console.error('Failed to get dashboard definition:', error);
        return NextResponse.json({ error: error?.message || 'Failed to get dashboard' }, { status: 500 });
    }
}
function normalizeVisibility(v) {
    const s = String(v || '').toLowerCase().trim();
    return s === 'public' ? 'public' : 'private';
}
function normalizeDefinition(def) {
    let x = def;
    if (typeof x === 'string') {
        const raw = x.trim();
        if (raw) {
            try {
                x = JSON.parse(raw);
            }
            catch {
                // fall through
            }
        }
    }
    if (x == null)
        x = {};
    if (!x || typeof x !== 'object')
        throw new Error('definition must be an object');
    const widgets = Array.isArray(x.widgets) ? x.widgets : [];
    const layout = x.layout && typeof x.layout === 'object' ? x.layout : { grid: { cols: 12, rowHeight: 36, gap: 14 } };
    const time = x.time && typeof x.time === 'object' ? x.time : { mode: 'picker', default: 'last_30_days' };
    return { ...x, time, layout, widgets };
}
/**
 * PUT /api/dashboard-definitions/[key]
 *
 * Update a user-owned dashboard definition.
 * Only the owner (or admin) can update. System dashboards cannot be updated (copy them instead).
 *
 * Body (all optional; at least one required):
 *  - name?: string
 *  - description?: string | null
 *  - visibility?: 'public' | 'private'
 *  - definition?: object
 */
export async function PUT(request, { params }) {
    try {
        const user = extractUserFromRequest(request);
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const key = decodeURIComponent(params.key || '').trim();
        if (!key)
            return NextResponse.json({ error: 'Missing key' }, { status: 400 });
        const db = getDb();
        const body = await request.json().catch(() => ({}));
        const isAdmin = Array.isArray(user.roles) && user.roles.some((r) => String(r || '').toLowerCase() === 'admin');
        const principals = await resolveUserPrincipals({ request, user });
        const userGroups = principals.groupIds || [];
        const userRoles = principals.roles || [];
        const groupList = userGroups.map((g) => sql `${g}`);
        const roleList = userRoles.map((r) => sql `${r}`);
        const existingRes = await db.execute(sql `
      select
        d.id,
        d.key,
        d.owner_user_id as "ownerUserId",
        d.is_system as "isSystem",
        d.visibility,
        d.name,
        d.description,
        d.scope,
        d.version,
        d.definition,
        (d.owner_user_id = ${user.sub}) as "isOwner",
        exists (
          select 1 from "dashboard_definition_shares" s
          where s.dashboard_id = d.id
            and s.permission = 'full'
            and (
              (s.principal_type = 'user' and s.principal_id = ${user.sub})
              ${userGroups.length ? sql `or (s.principal_type = 'group' and s.principal_id in (${sql.join(groupList, sql `, `)}))` : sql ``}
              ${userRoles.length ? sql `or (s.principal_type = 'role' and s.principal_id in (${sql.join(roleList, sql `, `)}))` : sql ``}
            )
        ) as "hasFullShare"
      from "dashboard_definitions" d
      where d.key = ${key}
      limit 1
    `);
        const existing = (existingRes.rows || [])[0] || null;
        if (!existing)
            return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
        if (existing.isSystem)
            return NextResponse.json({ error: 'System dashboards cannot be updated. Copy it first.' }, { status: 403 });
        const canEdit = existing.isOwner || existing.hasFullShare || isAdmin;
        if (!canEdit)
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        const nextName = body?.name !== undefined ? String(body?.name || '').trim() : undefined;
        const nextDesc = body?.description !== undefined ? (body?.description === null ? null : String(body?.description || '')) : undefined;
        const nextVis = body?.visibility !== undefined ? normalizeVisibility(body?.visibility) : undefined;
        let nextDef = undefined;
        if (body?.definition !== undefined) {
            try {
                nextDef = normalizeDefinition(body?.definition);
            }
            catch (e) {
                const msg = String(e?.message || 'Invalid definition');
                if (msg.includes('definition must be an object')) {
                    return NextResponse.json({ error: msg }, { status: 400 });
                }
                throw e;
            }
        }
        if (nextName === '' && body?.name !== undefined)
            return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 });
        if (nextName === undefined && nextDesc === undefined && nextVis === undefined && nextDef === undefined) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }
        const updatedName = nextName ?? String(existing.name || '').trim();
        if (!updatedName)
            return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 });
        const updatedDesc = nextDesc !== undefined ? nextDesc : (existing.description ?? null);
        const updatedVis = nextVis ?? normalizeVisibility(existing.visibility);
        const updatedDef = nextDef ?? existing.definition;
        const defJson = normalizeDefinition(updatedDef);
        const now = new Date();
        const res = await db.execute(sql `
      update "dashboard_definitions"
      set
        name = ${updatedName},
        description = ${updatedDesc},
        visibility = ${updatedVis},
        definition = ${JSON.stringify(defJson)}::jsonb,
        version = version + 1,
        updated_at = ${now}
      where key = ${key}
      returning
        id,
        key,
        name,
        description,
        owner_user_id as "ownerUserId",
        is_system as "isSystem",
        visibility,
        scope,
        version,
        definition,
        updated_at as "updatedAt"
    `);
        const row = (res.rows || [])[0];
        return NextResponse.json({ data: row });
    }
    catch (error) {
        console.error('Failed to update dashboard definition:', error);
        return NextResponse.json({ error: error?.message || 'Failed to update dashboard' }, { status: 500 });
    }
}
