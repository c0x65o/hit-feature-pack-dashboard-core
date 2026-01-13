export function normalizePieBlock(input) {
    const title = typeof input.title === 'string' && input.title.trim() ? input.title.trim() : 'Pie';
    const format = input.format === 'usd' ? 'usd' : 'number';
    const time = input.time === 'all_time' ? 'all_time' : 'inherit';
    const groupByKey = typeof input.groupByKey === 'string' && input.groupByKey.trim() ? input.groupByKey.trim() : 'region';
    const labelKey = typeof input.labelKey === 'string' && String(input.labelKey).trim()
        ? String(input.labelKey).trim()
        : groupByKey;
    const rawKey = typeof input.rawKey === 'string' && String(input.rawKey).trim()
        ? String(input.rawKey).trim()
        : groupByKey;
    const topN = Math.max(1, Math.min(25, Number(input.topN || 5) || 5));
    const otherLabel = typeof input.otherLabel === 'string' && input.otherLabel.trim() ? input.otherLabel.trim() : 'Other';
    const q = (input.query && typeof input.query === 'object') ? input.query : {};
    const metricKey = typeof q.metricKey === 'string' ? q.metricKey.trim() : '';
    const query = {
        ...q,
        metricKey,
        bucket: 'none',
        agg: typeof q.agg === 'string' ? q.agg : 'sum',
        // ensure groupBy includes keys we need for grouping + labeling + raw ids
        groupBy: Array.from(new Set([...(Array.isArray(q.groupBy) ? q.groupBy : []), groupByKey, labelKey, rawKey].filter(Boolean))),
    };
    return { kind: 'pie_v0', title, format, time, query, groupByKey, labelKey, rawKey, topN, otherLabel };
}
