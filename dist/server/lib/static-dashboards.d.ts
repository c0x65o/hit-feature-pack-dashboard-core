export type StaticDashboardDefinition = {
    id: string;
    key: string;
    name: string;
    description: string | null;
    ownerUserId: string;
    isSystem: boolean;
    visibility: 'public' | 'private';
    scope: {
        kind: 'global';
    } | {
        kind: 'pack';
        pack: string;
    };
    version: number;
    definition: any;
    updatedAt: Date;
    packName: string | null;
};
export declare function getStaticDashboards(): StaticDashboardDefinition[];
export declare function getStaticDashboardsForPack(pack?: string | null, includeGlobal?: boolean): StaticDashboardDefinition[];
export declare function getStaticDashboardByKey(key: string): StaticDashboardDefinition | null;
export declare function isStaticDashboardKey(key: string): boolean;
//# sourceMappingURL=static-dashboards.d.ts.map