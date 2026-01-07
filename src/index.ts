/**
 * @hit/feature-pack-dashboard-core
 *
 * Owns the dashboards runtime + dashboard definition storage/APIs.
 */

export const routes = [];
export const nav = [];

// Pages
export type { Dashboards as DashboardsPage } from './pages/Dashboards';

// Report prefill helpers (used by dashboards drilldowns + report builder)
export { encodeReportPrefill, decodeReportPrefill } from './utils/report-prefill';
export type { ReportPrefillV0 } from './utils/report-prefill';

