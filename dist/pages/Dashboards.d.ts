interface DashboardsProps {
    onNavigate?: (path: string) => void;
    /** Optional pack name (typically from route params) */
    pack?: string;
    /** Optional initial dashboard key to select */
    dashboardKey?: string;
    [key: string]: any;
}
export declare function Dashboards(props?: DashboardsProps): import("react/jsx-runtime").JSX.Element;
export default Dashboards;
//# sourceMappingURL=Dashboards.d.ts.map