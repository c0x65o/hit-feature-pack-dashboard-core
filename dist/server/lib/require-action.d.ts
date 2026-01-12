import { NextRequest, NextResponse } from 'next/server';
type ActionCheckResult = {
    ok: boolean;
    source?: string;
};
export declare function checkDashboardCoreAction(request: NextRequest, actionKey: string): Promise<ActionCheckResult>;
export declare function requireDashboardCoreAction(request: NextRequest, actionKey: string): Promise<NextResponse | null>;
export {};
//# sourceMappingURL=require-action.d.ts.map