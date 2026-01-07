import { normalizePieBlock, type PieReportBlockV0 } from './report-blocks';

export type PieSlice = {
  label: string;
  raw: unknown;
  value: number;
  color: string;
  // Drilldown descriptor: a pointFilter compatible with /api/metrics/drilldown
  drill?: { pointFilter: any; title: string; format: 'number' | 'usd' } | null;
};

function palette(idx: number) {
  const colors = ['#6366f1', '#22c55e', '#06b6d4', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#3b82f6'];
  return colors[idx % colors.length];
}

export async function runPieBlock(args: {
  block: PieReportBlockV0;
  timeRange: { start: string; end: string } | null; // inherit time range
}): Promise<{ slices: PieSlice[]; otherLabel: string }> {
  const block = normalizePieBlock(args.block);
  const t = block.time === 'all_time' ? null : args.timeRange;

  const body: any = { ...(block.query || {}) };
  body.bucket = 'none';
  body.agg = body.agg || 'sum';
  if (t) {
    body.start = t.start;
    body.end = t.end;
  } else {
    delete body.start;
    delete body.end;
  }

  const res = await fetch('/api/metrics/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `metrics/query ${res.status}`);

  const rows = Array.isArray(json.data) ? json.data : [];
  const groupByKey = block.groupByKey;
  const normalized = rows
    .map((r: any) => ({
      label: String(r && (groupByKey in r) ? (r[groupByKey] ?? 'Unknown') : 'Unknown'),
      raw: r && (groupByKey in r) ? (r[groupByKey] ?? null) : null,
      value: Number(r?.value ?? 0),
    }))
    .sort((a: any, b: any) => b.value - a.value);

  const top = normalized.slice(0, block.topN);
  const otherSum = normalized.slice(block.topN).reduce((acc: number, r: any) => acc + (Number.isFinite(r.value) ? r.value : 0), 0);

  const basePointFilter: any = {
    metricKey: String(block.query.metricKey || '').trim(),
  };
  if (block.query.entityKind) basePointFilter.entityKind = block.query.entityKind;
  if (block.query.entityId) basePointFilter.entityId = block.query.entityId;
  if (Array.isArray(block.query.entityIds) && block.query.entityIds.length) basePointFilter.entityIds = block.query.entityIds;
  if (block.query.dataSourceId) basePointFilter.dataSourceId = block.query.dataSourceId;
  if (block.query.sourceGranularity) basePointFilter.sourceGranularity = block.query.sourceGranularity;
  if (block.query.dimensions && typeof block.query.dimensions === 'object') basePointFilter.dimensions = { ...(block.query.dimensions as any) };
  if (t) {
    basePointFilter.start = t.start;
    basePointFilter.end = t.end;
  }

  const slices: PieSlice[] = top.map((r: any, idx: number) => {
    const dims = (basePointFilter.dimensions && typeof basePointFilter.dimensions === 'object') ? { ...(basePointFilter.dimensions as any) } : {};
    dims[groupByKey] = r.raw ?? null;
    const pointFilter = { ...basePointFilter, dimensions: dims };
    return {
      label: r.label,
      raw: r.raw,
      value: Number.isFinite(r.value) ? r.value : 0,
      color: palette(idx),
      drill: {
        pointFilter,
        title: `${block.title} • ${r.label}`,
        format: block.format,
      },
    };
  });

  if (otherSum > 0) {
    slices.push({
      label: block.otherLabel,
      raw: '__other__',
      value: otherSum,
      color: '#94a3b8',
      drill: null, // requires NOT IN filter (future)
    });
  }

  return { slices, otherLabel: block.otherLabel };
}

