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
  groupByKey: string; // e.g. "region"
  topN: number;
  otherLabel: string;
};

export type ReportBlockV0 = PieReportBlockV0;

export function normalizePieBlock(input: Partial<PieReportBlockV0>): PieReportBlockV0 {
  const title = typeof input.title === 'string' && input.title.trim() ? input.title.trim() : 'Pie';
  const format = input.format === 'usd' ? 'usd' : 'number';
  const time: TimeMode = input.time === 'all_time' ? 'all_time' : 'inherit';
  const groupByKey = typeof input.groupByKey === 'string' && input.groupByKey.trim() ? input.groupByKey.trim() : 'region';
  const topN = Math.max(1, Math.min(25, Number(input.topN || 5) || 5));
  const otherLabel = typeof input.otherLabel === 'string' && input.otherLabel.trim() ? input.otherLabel.trim() : 'Other';

  const q = (input.query && typeof input.query === 'object') ? input.query : ({} as any);
  const metricKey = typeof q.metricKey === 'string' ? q.metricKey.trim() : '';
  const query: MetricsQueryBody = {
    ...q,
    metricKey,
    bucket: 'none',
    agg: typeof q.agg === 'string' ? (q.agg as any) : 'sum',
    // ensure groupBy includes groupByKey
    groupBy: Array.from(new Set([...(Array.isArray(q.groupBy) ? q.groupBy : []), groupByKey].filter(Boolean))),
  };

  return { kind: 'pie_v0', title, format, time, query, groupByKey, topN, otherLabel };
}

