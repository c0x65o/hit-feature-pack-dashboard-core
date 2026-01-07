// API: /api/dashboard-definitions
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { extractUserFromRequest } from '../auth';
import crypto from 'node:crypto';
import { resolveUserPrincipals } from '@/lib/acl-utils';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Re-export schema(s) from a schema-only module so capability generation can import them safely.
export { postBodySchema } from './dashboard-definitions.schema';
/**
 * GET /api/dashboard-definitions?pack=projects&includeGlobal=true
 *
 * Returns dashboards visible to the user:
 * - public dashboards
 * - dashboards owned by the user
 * - dashboards shared with the user (user/group/role)
 *
 * Optional filtering:
 * - pack=<name>: include pack dashboards for that pack, plus globals if includeGlobal=true (default)
 */
export async function GET(request) {
    try {
        const user = extractUserFromRequest(request);
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const pack = (searchParams.get('pack') || '').trim();
        const includeGlobal = (searchParams.get('includeGlobal') || 'true').toLowerCase() !== 'false';
        // Ensure pack dashboards exist out-of-the-box.
        // Some environments skip app seeds; this makes dashboards reliably available.
        await ensureDefaultPackDashboards(db, pack);
        const principals = await resolveUserPrincipals({ request, user });
        const userGroups = principals.groupIds || [];
        const userRoles = principals.roles || [];
        const scopeFilter = pack
            ? sql `(
            (d."scope"->>'kind' = 'pack' AND d."scope"->>'pack' = ${pack})
            OR (${includeGlobal} AND d."scope"->>'kind' = 'global')
          )`
            : sql `true`;
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
        const rows = await db.execute(sql `
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
        d.updated_at as "updatedAt",
        (select count(*)::int from "dashboard_definition_shares" s where s.dashboard_id = d.id) as "shareCount",
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
      where
        ${scopeFilter}
        and (
          d.visibility = 'public'
          or d.owner_user_id = ${user.sub}
          or ${sharedAccess}
        )
      order by
        case when d.scope->>'kind' = 'global' then 0 else 1 end,
        d.name asc
    `);
        return NextResponse.json({ data: rows.rows || [] });
    }
    catch (error) {
        console.error('Failed to list dashboard definitions:', error);
        return NextResponse.json({ error: error?.message || 'Failed to list dashboards' }, { status: 500 });
    }
}
async function ensureDefaultPackDashboards(db, pack) {
    const p = String(pack || '').trim();
    if (!p)
        return;
    // Only seed for the packs we want as default business dashboards.
    if (p !== 'crm' && p !== 'projects')
        return;
    const now = new Date();
    if (p === 'projects') {
        const key = 'system.projects_kpi_catalog';
        const scope = { kind: 'pack', pack: 'projects' };
        const definition = {
            time: { mode: 'picker', default: 'last_30_days' },
            layout: { grid: { cols: 12, rowHeight: 36, gap: 14 } },
            widgets: [
                {
                    key: 'kpi_catalog.project_metrics',
                    kind: 'kpi_catalog',
                    title: 'All Metrics (Auto-scoped totals)',
                    grid: { x: 0, y: 0, w: 12, h: 8 },
                    time: 'inherit',
                    presentation: {
                        entityKind: 'auto',
                        owner: { kind: 'feature_pack', id: 'projects' },
                        onlyWithPoints: false,
                    },
                },
            ],
        };
        await db.execute(sql `
      insert into "dashboard_definitions" (
        id,
        key,
        owner_user_id,
        is_system,
        name,
        description,
        visibility,
        scope,
        version,
        definition,
        created_at,
        updated_at
      ) values (
        gen_random_uuid(),
        ${key},
        'system',
        true,
        'All Project KPIs',
        'KPI-only dashboard that shows every project-scoped metric (with icons) summed across all projects.',
        'public',
        ${JSON.stringify(scope)}::jsonb,
        0,
        ${JSON.stringify(definition)}::jsonb,
        ${now},
        ${now}
      )
      on conflict (key) do update set
        name = excluded.name,
        description = excluded.description,
        visibility = excluded.visibility,
        scope = excluded.scope,
        version = excluded.version,
        definition = excluded.definition,
        updated_at = excluded.updated_at
    `);
    }
    if (p === 'crm') {
        const key = 'system.crm_overview';
        const scope = { kind: 'pack', pack: 'crm' };
        const definition = {
            time: { mode: 'picker', default: 'last_30_days' },
            layout: { grid: { cols: 12, rowHeight: 36, gap: 14 } },
            widgets: [
                {
                    key: 'kpi.crm.prospects',
                    kind: 'kpi',
                    title: 'Prospects',
                    grid: { x: 0, y: 0, w: 3, h: 2 },
                    time: 'all_time',
                    presentation: {
                        icon: 'Building',
                        iconColor: '#2563eb',
                        valueSource: { kind: 'api_count', endpoint: '/api/crm/prospects', totalField: 'pagination.total' },
                        action: { label: 'View All', href: '/crm/prospects' },
                    },
                },
                {
                    key: 'kpi.crm.contacts',
                    kind: 'kpi',
                    title: 'Contacts',
                    grid: { x: 3, y: 0, w: 3, h: 2 },
                    time: 'all_time',
                    presentation: {
                        icon: 'User',
                        iconColor: '#16a34a',
                        valueSource: { kind: 'api_count', endpoint: '/api/crm/contacts', totalField: 'pagination.total' },
                        action: { label: 'View All', href: '/crm/contacts' },
                    },
                },
                {
                    key: 'kpi.crm.opportunities',
                    kind: 'kpi',
                    title: 'Opportunities',
                    grid: { x: 6, y: 0, w: 3, h: 2 },
                    time: 'all_time',
                    presentation: {
                        icon: 'TrendingUp',
                        iconColor: '#a855f7',
                        valueSource: { kind: 'api_count', endpoint: '/api/crm/opportunities', totalField: 'pagination.total' },
                        action: { label: 'View All', href: '/crm/opportunities' },
                    },
                },
                {
                    key: 'kpi.crm.pipeline_total',
                    kind: 'kpi',
                    title: 'Pipeline Value',
                    grid: { x: 9, y: 0, w: 3, h: 2 },
                    time: 'all_time',
                    presentation: {
                        format: 'usd',
                        icon: 'DollarSign',
                        iconColor: '#f59e0b',
                        valueSource: { kind: 'api_value', endpoint: '/api/crm/metrics', valueField: 'pipeline.totalValue' },
                    },
                },
                // Drillable pies (non-metrics grouped pies backed by API endpoints).
                {
                    key: 'pie.crm.pipeline_by_stage_count',
                    kind: 'api_pie',
                    title: 'Pipeline by Stage (Count)',
                    grid: { x: 0, y: 2, w: 6, h: 6 },
                    time: 'all_time',
                    presentation: {
                        format: 'number',
                        endpoint: '/api/crm/reports/pipeline-health',
                        itemsField: 'stages',
                        labelField: 'stageName',
                        rawField: 'stageId',
                        valueField: 'opportunityCount',
                        topN: 10,
                        otherLabel: 'Other',
                        hrefTemplate: '/crm/opportunities?pipelineStage={{stageId}}',
                    },
                },
                {
                    key: 'pie.crm.pipeline_by_stage_value',
                    kind: 'api_pie',
                    title: 'Pipeline by Stage ($)',
                    grid: { x: 6, y: 2, w: 6, h: 6 },
                    time: 'all_time',
                    presentation: {
                        format: 'usd',
                        endpoint: '/api/crm/reports/pipeline-health',
                        itemsField: 'stages',
                        labelField: 'stageName',
                        rawField: 'stageId',
                        valueField: 'totalValue',
                        topN: 10,
                        otherLabel: 'Other',
                        hrefTemplate: '/crm/opportunities?pipelineStage={{stageId}}',
                    },
                },
                {
                    key: 'pie.crm.likelihood_count',
                    kind: 'api_pie',
                    title: 'Opportunities by Likelihood (Count)',
                    grid: { x: 0, y: 8, w: 6, h: 6 },
                    time: 'all_time',
                    presentation: {
                        format: 'number',
                        endpoint: '/api/crm/reports/likelihood-distribution',
                        itemsField: 'likelihoods',
                        labelField: 'likelihoodName',
                        rawField: 'likelihoodTypeId',
                        valueField: 'opportunityCount',
                        topN: 10,
                        otherLabel: 'Other',
                        hrefTemplate: '/crm/opportunities-by-likelihood?likelihoodTypeId={{likelihoodTypeId}}',
                    },
                },
                {
                    key: 'pie.crm.likelihood_value',
                    kind: 'api_pie',
                    title: 'Opportunities by Likelihood ($)',
                    grid: { x: 6, y: 8, w: 6, h: 6 },
                    time: 'all_time',
                    presentation: {
                        format: 'usd',
                        endpoint: '/api/crm/reports/likelihood-distribution',
                        itemsField: 'likelihoods',
                        labelField: 'likelihoodName',
                        rawField: 'likelihoodTypeId',
                        valueField: 'totalValue',
                        topN: 10,
                        otherLabel: 'Other',
                        hrefTemplate: '/crm/opportunities-by-likelihood?likelihoodTypeId={{likelihoodTypeId}}',
                    },
                },
            ],
        };
        await db.execute(sql `
      insert into "dashboard_definitions" (
        id,
        key,
        owner_user_id,
        is_system,
        name,
        description,
        visibility,
        scope,
        version,
        definition,
        created_at,
        updated_at
      ) values (
        gen_random_uuid(),
        ${key},
        'system',
        true,
        'CRM Overview',
        'Quick CRM snapshot (counts + pipeline totals).',
        'public',
        ${JSON.stringify(scope)}::jsonb,
        0,
        ${JSON.stringify(definition)}::jsonb,
        ${now},
        ${now}
      )
      on conflict (key) do update set
        name = excluded.name,
        description = excluded.description,
        visibility = excluded.visibility,
        scope = excluded.scope,
        version = excluded.version,
        definition = excluded.definition,
        updated_at = excluded.updated_at
    `);
    }
}
function slugify(s) {
    const x = String(s || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
    return x || 'dashboard';
}
function normalizeVisibility(v) {
    const s = String(v || '').toLowerCase().trim();
    return s === 'public' ? 'public' : 'private';
}
function normalizeScope(input, fallbackPack) {
    if (input && typeof input === 'object') {
        const kind = String(input.kind || '').toLowerCase().trim();
        if (kind === 'global')
            return { kind: 'global' };
        if (kind === 'pack') {
            const pack = String(input.pack || fallbackPack || '').trim();
            if (pack)
                return { kind: 'pack', pack };
        }
    }
    if (fallbackPack)
        return { kind: 'pack', pack: fallbackPack };
    return { kind: 'global' };
}
function normalizeDefinition(def) {
    // Keep validation lightweight but strict enough to avoid broken dashboards.
    // The AI/tooling may send `definition` as a JSON string or omit it entirely on create.
    // We coerce that into a minimal valid definition to avoid 500s for otherwise valid requests.
    let x = def;
    if (typeof x === 'string') {
        const raw = x.trim();
        if (raw) {
            try {
                x = JSON.parse(raw);
            }
            catch {
                // fall through to validation error below
            }
        }
    }
    if (x == null) {
        // Minimal empty dashboard definition; caller can update widgets/layout later.
        x = {};
    }
    if (!x || typeof x !== 'object')
        throw new Error('definition must be an object');
    const widgets = Array.isArray(x.widgets) ? x.widgets : [];
    const layout = x.layout && typeof x.layout === 'object' ? x.layout : { grid: { cols: 12, rowHeight: 36, gap: 14 } };
    const time = x.time && typeof x.time === 'object' ? x.time : { mode: 'picker', default: 'last_30_days' };
    return { ...x, time, layout, widgets };
}
/**
 * POST /api/dashboard-definitions
 *
 * Create a user-owned dashboard definition.
 * Body:
 *  - name: string (required)
 *  - description?: string
 *  - visibility?: 'public' | 'private' (default: private)
 *  - scope?: { kind: 'global' } | { kind: 'pack', pack: string }
 *  - pack?: string (optional; used as scope fallback when scope is omitted)
 *  - key?: string (optional; otherwise generated)
 *  - definition?: object (required unless sourceKey provided)
 *  - sourceKey?: string (optional; copies an existing dashboard, then applies overrides)
 */
export async function POST(request) {
    try {
        const user = extractUserFromRequest(request);
        if (!user)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const db = getDb();
        const body = await request.json().catch(() => ({}));
        const sourceKey = String(body?.sourceKey || '').trim();
        let source = null;
        if (sourceKey) {
            const res = await db.execute(sql `
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
          d.definition
        from "dashboard_definitions" d
        where d.key = ${sourceKey}
        limit 1
      `);
            source = (res.rows || [])[0] || null;
            if (!source)
                return NextResponse.json({ error: 'sourceKey not found' }, { status: 404 });
            // If source is private, only owner can copy (or admin).
            const isAdmin = Array.isArray(user.roles) && user.roles.some((r) => String(r || '').toLowerCase() === 'admin');
            const canRead = source.visibility === 'public' || source.ownerUserId === user.sub || isAdmin;
            if (!canRead)
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        const packFallback = String(body?.pack || '').trim() || (source?.scope?.kind === 'pack' ? String(source.scope.pack || '').trim() : '');
        const name = String(body?.name || source?.name || '').trim();
        if (!name)
            return NextResponse.json({ error: 'name is required' }, { status: 400 });
        const description = body?.description !== undefined ? String(body?.description || '') : (source?.description ?? null);
        const visibility = normalizeVisibility(body?.visibility ?? source?.visibility);
        const scope = normalizeScope(body?.scope ?? source?.scope, packFallback || undefined);
        const defIn = body?.definition ?? source?.definition;
        let definition;
        try {
            definition = normalizeDefinition(defIn);
        }
        catch (e) {
            const msg = String(e?.message || 'Invalid definition');
            if (msg.includes('definition must be an object')) {
                return NextResponse.json({ error: msg }, { status: 400 });
            }
            throw e;
        }
        const providedKey = String(body?.key || '').trim();
        const keyBase = providedKey || `user.${slugify(String(user.sub || 'user'))}.${slugify(name)}`;
        const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
        const key = providedKey || `${keyBase}.${rand}`;
        const now = new Date();
        const res = await db.execute(sql `
      insert into "dashboard_definitions" (
        id,
        key,
        owner_user_id,
        is_system,
        name,
        description,
        visibility,
        scope,
        version,
        definition,
        created_at,
        updated_at
      ) values (
        gen_random_uuid(),
        ${key},
        ${user.sub},
        false,
        ${name},
        ${description},
        ${visibility},
        ${JSON.stringify(scope)}::jsonb,
        0,
        ${JSON.stringify(definition)}::jsonb,
        ${now},
        ${now}
      )
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
        return NextResponse.json({ data: row }, { status: 201 });
    }
    catch (error) {
        // key uniqueness collisions should be rare; surface a useful message anyway.
        const msg = error?.message || 'Failed to create dashboard';
        console.error('Failed to create dashboard definition:', error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
