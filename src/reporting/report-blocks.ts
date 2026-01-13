export type TimeMode = 'inherit' | 'all_time';

export type MetricsQueryBody = {
  metricKey: string;
  start?: string;
  end?: string;
  bucket?: 'none' | 'hour' | 'day' | 'week' | 'month';
  agg?: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'last';
  entityKind?: string;
  entityId?: string;
  entityIds?: string[];
  dataSourceId?: string;
  sourceGranularity?: string;
  params?: Record<string, string | number | boolean | null>;
  dimensions?: Record<string, string | number | boolean | null>;
  groupBy?: string[];
  groupByEntityId?: boolean;
};

export type PieReportBlockV0 = {
  kind: 'pie_v0';
  title: string;
  format: 'number' | 'usd';
  time: TimeMode;

  // The aggregation query used to build the slices (bucket should be 'none')
  query: MetricsQueryBody;

  // How to interpret grouped rows
  groupByKey: string; // e.g. "stage_id" (used for grouping + drilldown filter key)
  labelKey: string; // e.g. "stage_name" (used for display label)
  rawKey: string; // e.g. "stage_id" (used for raw slice id)
  topN: number;
  otherLabel: string;
};

export type ReportBlockV0 = PieReportBlockV0;

export function normalizePieBlock(input: Partial<PieReportBlockV0>): PieReportBlockV0 {
  const title = typeof input.title === 'string' && input.title.trim() ? input.title.trim() : 'Pie';
  const format = input.format === 'usd' ? 'usd' : 'number';
  const time: TimeMode = input.time === 'all_time' ? 'all_time' : 'inherit';
  const groupByKey = typeof input.groupByKey === 'string' && input.groupByKey.trim() ? input.groupByKey.trim() : 'region';
  const labelKey = typeof (input as any).labelKey === 'string' && String((input as any).labelKey).trim()
    ? String((input as any).labelKey).trim()
    : groupByKey;
  const rawKey = typeof (input as any).rawKey === 'string' && String((input as any).rawKey).trim()
    ? String((input as any).rawKey).trim()
    : groupByKey;
  const topN = Math.max(1, Math.min(25, Number(input.topN || 5) || 5));
  const otherLabel = typeof input.otherLabel === 'string' && input.otherLabel.trim() ? input.otherLabel.trim() : 'Other';

  const q = (input.query && typeof input.query === 'object') ? input.query : ({} as any);
  const metricKey = typeof q.metricKey === 'string' ? q.metricKey.trim() : '';
  const query: MetricsQueryBody = {
    ...q,
    metricKey,
    bucket: 'none',
    agg: typeof q.agg === 'string' ? (q.agg as any) : 'sum',
    // ensure groupBy includes keys we need for grouping + labeling + raw ids
    groupBy: Array.from(
      new Set([...(Array.isArray(q.groupBy) ? q.groupBy : []), groupByKey, labelKey, rawKey].filter(Boolean))
    ),
  };

  return { kind: 'pie_v0', title, format, time, query, groupByKey, labelKey, rawKey, topN, otherLabel };
}

