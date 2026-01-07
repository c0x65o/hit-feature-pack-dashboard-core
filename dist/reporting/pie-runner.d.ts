import { type PieReportBlockV0 } from './report-blocks';
export type PieSlice = {
    label: string;
    raw: unknown;
    value: number;
    color: string;
    drill?: {
        pointFilter: any;
        title: string;
        format: 'number' | 'usd';
    } | null;
};
export declare function runPieBlock(args: {
    block: PieReportBlockV0;
    timeRange: {
        start: string;
        end: string;
    } | null;
}): Promise<{
    slices: PieSlice[];
    otherLabel: string;
}>;
//# sourceMappingURL=pie-runner.d.ts.map