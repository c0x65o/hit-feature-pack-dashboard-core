export type ReportPrefillV0 = {
    kind: 'report_prefill_v0';
    title?: string;
    format?: 'number' | 'usd';
    pointFilter: any;
};
export declare function encodeReportPrefill(input: Omit<ReportPrefillV0, 'kind'> & {
    kind?: string;
}): string;
export declare function decodeReportPrefill(raw: string): ReportPrefillV0 | null;
//# sourceMappingURL=report-prefill.d.ts.map