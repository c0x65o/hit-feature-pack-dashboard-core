import fs from 'node:fs';
import path from 'node:path';

type AnyRecord = Record<string, any>;

export type StaticDashboardDefinition = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  ownerUserId: string;
  isSystem: boolean;
  visibility: 'public' | 'private';
  scope: { kind: 'global' } | { kind: 'pack'; pack: string };
  version: number;
  definition: any;
  updatedAt: Date;
  packName: string | null;
};

function normalizeVisibility(v: unknown): 'public' | 'private' {
  const s = String(v || '').toLowerCase().trim();
  return s === 'public' ? 'public' : 'private';
}

function normalizeScope(input: any, fallbackPack?: string): { kind: 'global' } | { kind: 'pack'; pack: string } {
  if (input && typeof input === 'object') {
    const kind = String(input.kind || '').toLowerCase().trim();
    if (kind === 'global') return { kind: 'global' };
    if (kind === 'pack') {
      const pack = String(input.pack || fallbackPack || '').trim();
      if (pack) return { kind: 'pack', pack };
    }
  }
  if (fallbackPack) return { kind: 'pack', pack: fallbackPack };
  return { kind: 'global' };
}

function normalizeDefinition(def: any): any {
  let x: any = def;
  if (typeof x === 'string') {
    const raw = x.trim();
    if (raw) {
      try {
        x = JSON.parse(raw);
      } catch {
        // fall through
      }
    }
  }
  if (x == null) x = {};
  if (!x || typeof x !== 'object') throw new Error('definition must be an object');
  const widgets = Array.isArray(x.widgets) ? x.widgets : [];
  const layout = x.layout && typeof x.layout === 'object' ? x.layout : { grid: { cols: 12, rowHeight: 36, gap: 14 } };
  const time = x.time && typeof x.time === 'object' ? x.time : { mode: 'picker', default: 'last_30_days' };
  return { ...x, time, layout, widgets };
}

function loadRegistryTemplates(): AnyRecord[] {
  const registryPath = path.join(process.cwd(), '.hit', 'generated', 'dashboard-templates.json');
  if (!fs.existsSync(registryPath)) return [];
  try {
    const raw = fs.readFileSync(registryPath, 'utf8');
    const reg = JSON.parse(raw);
    return Array.isArray(reg?.templates) ? reg.templates : [];
  } catch {
    return [];
  }
}

function legacyFallbackTemplates(): AnyRecord[] {
  return [
    {
      templateKey: 'system.projects_kpi_catalog',
      packName: 'projects',
      title: 'All Project KPIs',
      description: 'KPI-only dashboard that shows every project-scoped metric (summed across projects).',
      version: 0,
      definition: {
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
      },
    },
  ];
}

function normalizeTemplate(raw: AnyRecord): StaticDashboardDefinition | null {
  if (!raw || typeof raw !== 'object') return null;

  const key = String(raw.templateKey || raw.key || '').trim();
  if (!key) return null;

  const packName = String(raw.packName || '').trim();
  const name = String(raw.title || raw.name || key).trim();
  if (!name) return null;

  const description =
    raw.description === undefined || raw.description === null ? null : String(raw.description);
  const version = Number.isFinite(Number(raw.version)) ? Number(raw.version) : 0;
  const visibility = normalizeVisibility(raw.visibility ?? 'public');
  const scope = normalizeScope(raw.scope, packName || undefined);
  let definition: any;
  try {
    definition = normalizeDefinition(raw.definition ?? {});
  } catch {
    return null;
  }
  const now = new Date();

  return {
    id: `static:${key}`,
    key,
    name,
    description,
    ownerUserId: 'system',
    isSystem: true,
    visibility,
    scope,
    version,
    definition,
    updatedAt: now,
    packName: scope.kind === 'pack' ? scope.pack : null,
  };
}

export function getStaticDashboards(): StaticDashboardDefinition[] {
  const templates = loadRegistryTemplates();
  const keys = new Set<string>();
  const out: StaticDashboardDefinition[] = [];

  for (const raw of templates) {
    const normalized = normalizeTemplate(raw as AnyRecord);
    if (!normalized) continue;
    if (keys.has(normalized.key)) continue;
    keys.add(normalized.key);
    out.push(normalized);
  }

  for (const raw of legacyFallbackTemplates()) {
    const normalized = normalizeTemplate(raw as AnyRecord);
    if (!normalized) continue;
    if (keys.has(normalized.key)) continue;
    keys.add(normalized.key);
    out.push(normalized);
  }

  return out;
}

export function getStaticDashboardsForPack(
  pack?: string | null,
  includeGlobal: boolean = true
): StaticDashboardDefinition[] {
  const p = String(pack || '').trim();
  const all = getStaticDashboards();
  if (!p) return all;

  return all.filter((d) => {
    if (d.scope?.kind === 'pack') return d.scope.pack === p;
    if (d.scope?.kind === 'global') return includeGlobal;
    return false;
  });
}

export function getStaticDashboardByKey(key: string): StaticDashboardDefinition | null {
  const k = String(key || '').trim();
  if (!k) return null;
  return getStaticDashboards().find((d) => d.key === k) || null;
}

export function isStaticDashboardKey(key: string): boolean {
  return Boolean(getStaticDashboardByKey(key));
}
