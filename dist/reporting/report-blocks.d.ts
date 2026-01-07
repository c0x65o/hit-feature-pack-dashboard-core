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
    query: MetricsQueryBody;
    groupByKey: string;
    topN: number;
    otherLabel: string;
};
export type ReportBlockV0 = PieReportBlockV0;
export declare function normalizePieBlock(input: Partial<PieReportBlockV0>): PieReportBlockV0;
//# sourceMappingURL=report-blocks.d.ts.map