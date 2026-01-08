'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useUi } from '@hit/ui-kit';
import { AclPicker } from '@hit/ui-kit';
import { useThemeTokens } from '@hit/ui-kit';
import { LucideIcon, type LucideIconComponent } from '../utils/lucide-dynamic';
import { encodeReportPrefill } from '../utils/report-prefill';
import { normalizePieBlock } from '../reporting/report-blocks';
import { runPieBlock } from '../reporting/pie-runner';

// Inline SVG brand icons - no external dependency needed
// These are simple SVG paths from Simple Icons (MIT licensed)
const createBrandIcon = (path: string, viewBox = '0 0 24 24') => {
  const Icon = ({ size = 24, className }: { size?: number | string; className?: string }) => (
    <svg width={size} height={size} viewBox={viewBox} fill="currentColor" className={className}>
      <path d={path} />
    </svg>
  );
  Icon.displayName = 'BrandIcon';
  return Icon;
};

const BrandIcons: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  discord: createBrandIcon('M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z'),
  steam: createBrandIcon('M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z'),
  tiktok: createBrandIcon('M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'),
  facebook: createBrandIcon('M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'),
  instagram: createBrandIcon('M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z'),
  youtube: createBrandIcon('M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'),
  twitch: createBrandIcon('M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z'),
  reddit: createBrandIcon('M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z'),
  linkedin: createBrandIcon('M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'),
  spotify: createBrandIcon('M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z'),
  x: createBrandIcon('M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'),
  twitter: createBrandIcon('M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'),
};

type IconComp = React.ComponentType<{ size?: number | string; style?: React.CSSProperties; color?: string; className?: string }>;

function lucideComp(name: string): LucideIconComponent {
  return (props) => <LucideIcon name={name} {...props} />;
}

function toPascal(s: string) {
  return String(s || '')
    .replace(/[_\-\s]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

function resolvePlatformIcon(name?: string): IconComp | null {
  if (!name) return null;
  const raw = String(name || '').trim();
  if (!raw) return null;

  // Supported formats:
  // - "si:discord" (SimpleIcons via react-icons/si)
  // - "brand:discord" (alias to SimpleIcons)
  // - "lucide:Users" (force lucide)
  // - "Discord" (lucide default behavior)
  const [nsMaybe, valMaybe] = raw.includes(':') ? raw.split(':', 2) : [null, raw];
  const ns = (nsMaybe || '').toLowerCase();
  const val = String(valMaybe || '').trim();
  if (!val) return null;

  const tryLucide = (n: string) => lucideComp(n) as unknown as IconComp | null;

  const trySimple = (key: string) => {
    // Use static allowlist instead of dynamic lookup into entire library
    const normalized = key.toLowerCase();
    return BrandIcons[normalized] as IconComp | null || null;
  };

  if (ns === 'lucide') return tryLucide(val);
  if (ns === 'si' || ns === 'simpleicons') return trySimple(val);
  if (ns === 'brand' || ns === 'platform') {
    const alias = val.toLowerCase();
    const m: Record<string, string> = {
      discord: 'discord',
      steam: 'steam',
      tiktok: 'tiktok',
      facebook: 'facebook',
      instagram: 'instagram',
      youtube: 'youtube',
      twitch: 'twitch',
      reddit: 'reddit',
      linkedin: 'linkedin',
      spotify: 'spotify',
      x: 'x',
      twitter: 'x',
    };
    return trySimple(m[alias] || alias);
  }

  // Default behavior: keep existing lucide names working,
  // but also allow passing "si:..." if you want guaranteed brand icons.
  return tryLucide(val) || trySimple(val);
}

type DashboardListItem = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  scope: any;
  /** Convenience: extracted from scope when kind=pack */
  pack?: string | null;
  visibility: string;
  isSystem: boolean;
  ownerUserId: string;
  shareCount: number;
  isOwner: boolean;
  isShared: boolean;
  canEdit: boolean;
};

type DashboardDefinition = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  scope: any;
  visibility: string;
  isSystem: boolean;
  ownerUserId: string;
  version: number;
  definition: any;
  isOwner: boolean;
  isShared: boolean;
  canEdit: boolean;
};

type MetricCatalogItem = {
  key: string;
  label: string;
  unit: string;
  icon?: string;
  icon_color?: string;
  category?: string;
  rollup_strategy?: string;
  time_kind?: 'timeseries' | 'realtime' | 'none';
  owner?: { kind: 'feature_pack' | 'app' | 'user'; id: string };
  entity_kinds?: string[];
  pointsCount?: number;
};

type ShareRow = {
  id: string;
  principalType: 'user' | 'group' | 'role';
  principalId: string;
  permission: 'view' | 'full';
  sharedBy: string;
  sharedByName: string | null;
  createdAt: string;
};

type TimePreset =
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'month_to_date'
  | 'year_to_date'
  | 'custom';

function selectValue(v: any): string {
  return typeof v === 'string' ? v : String(v?.target?.value ?? '');
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfYear(d: Date) {
  const x = new Date(d);
  x.setMonth(0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toRangeFromPreset(preset: TimePreset) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start: Date;
  if (preset === 'last_7_days') start = addDays(now, -7);
  else if (preset === 'last_30_days') start = addDays(now, -30);
  else if (preset === 'last_90_days') start = addDays(now, -90);
  else if (preset === 'month_to_date') start = startOfMonth(now);
  else if (preset === 'year_to_date') start = startOfYear(now);
  else start = addDays(now, -30);
  start.setHours(0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

function getByPath(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = String(path || '').split('.').filter(Boolean);
  let cur: any = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else return undefined;
  }
  return cur;
}

function applyTemplate(tpl: string, row: any): string {
  const raw = String(tpl || '');
  if (!raw) return '';
  return raw.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_m, path) => {
    const v = getByPath(row, String(path || '').trim());
    return encodeURIComponent(v == null ? '' : String(v));
  });
}

function formatNumber(v: number, style: 'number' | 'usd' | 'percent' = 'number') {
  if (!Number.isFinite(v)) return '—';
  if (style === 'usd') {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
  }
  if (style === 'percent') return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(v);
}

function palette(idx: number) {
  const colors = ['#6366f1', '#22c55e', '#06b6d4', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#3b82f6'];
  return colors[idx % colors.length];
}

function pickEntityKindForMetric(item?: MetricCatalogItem | null): string | undefined {
  const kinds = Array.isArray(item?.entity_kinds) ? item!.entity_kinds!.filter((k) => typeof k === 'string' && k) : [];
  if (kinds.length === 0) return undefined;
  // Prefer project when a metric supports multiple scoping kinds.
  if (kinds.includes('project')) return 'project';
  return kinds[0];
}

function Donut({
  slices,
  format,
  onSliceClick,
}: {
  slices: Array<{ label: string; value: number; color: string; raw?: unknown }>;
  format: 'number' | 'usd';
  onSliceClick?: (slice: { label: string; value: number; color: string; raw?: unknown }) => void;
}) {
  const { colors, radius, shadows } = useThemeTokens();
  const total = slices.reduce((a, s) => a + (Number.isFinite(s.value) ? s.value : 0), 0);
  
  // Show empty state if no data
  if (total === 0 || slices.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240, color: colors.text.muted }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14 }}>No data available</div>
        </div>
      </div>
    );
  }
  const cx = 120;
  const cy = 120;
  const rOuter = 100;
  const rInner = 62;

  // SVG arc commands can't render a true 360° arc (start=end is treated as "no arc").
  // If a slice is effectively 100% (common when there is only one non-zero item),
  // draw it as two 180° arcs so it renders as a full circle.
  const TAU = Math.PI * 2;
  const EPS = 1e-6;

  let startAngle = -Math.PI / 2;
  const paths: Array<{ label: string; value: number; color: string; raw?: unknown; d: string }> = [];
  for (const s of slices) {
    const rawVal = Number.isFinite(s.value) ? s.value : 0;
    const frac = Math.max(0, Math.min(1, rawVal / total));
    if (frac <= EPS) continue;

    const sweep = frac * TAU;

    // Full circle (or extremely close)
    if (sweep >= TAU - EPS) {
      const a1 = startAngle;
      const a2 = startAngle + Math.PI;
      const a3 = startAngle + TAU;

      const x1 = cx + rOuter * Math.cos(a1);
      const y1 = cy + rOuter * Math.sin(a1);
      const x2 = cx + rOuter * Math.cos(a2);
      const y2 = cy + rOuter * Math.sin(a2);
      const x3 = cx + rOuter * Math.cos(a3);
      const y3 = cy + rOuter * Math.sin(a3);

      const xi3 = cx + rInner * Math.cos(a3);
      const yi3 = cy + rInner * Math.sin(a3);
      const xi2 = cx + rInner * Math.cos(a2);
      const yi2 = cy + rInner * Math.sin(a2);
      const xi1 = cx + rInner * Math.cos(a1);
      const yi1 = cy + rInner * Math.sin(a1);

      const d = [
        `M ${x1} ${y1}`,
        // Outer ring: two 180° arcs, clockwise
        `A ${rOuter} ${rOuter} 0 0 1 ${x2} ${y2}`,
        `A ${rOuter} ${rOuter} 0 0 1 ${x3} ${y3}`,
        `L ${xi3} ${yi3}`,
        // Inner ring: two 180° arcs, counter-clockwise
        `A ${rInner} ${rInner} 0 0 0 ${xi2} ${yi2}`,
        `A ${rInner} ${rInner} 0 0 0 ${xi1} ${yi1}`,
        'Z',
      ].join(' ');

      paths.push({ ...s, d });
      startAngle = a3;
      continue;
    }

    const endAngle = startAngle + sweep;
    const large = endAngle - startAngle > Math.PI ? 1 : 0;

    const x1 = cx + rOuter * Math.cos(startAngle);
    const y1 = cy + rOuter * Math.sin(startAngle);
    const x2 = cx + rOuter * Math.cos(endAngle);
    const y2 = cy + rOuter * Math.sin(endAngle);

    const x3 = cx + rInner * Math.cos(endAngle);
    const y3 = cy + rInner * Math.sin(endAngle);
    const x4 = cx + rInner * Math.cos(startAngle);
    const y4 = cy + rInner * Math.sin(startAngle);

    const d = [
      `M ${x1} ${y1}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');

    paths.push({ ...s, d });
    startAngle = endAngle;
  }

  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = React.useState<null | { label: string; value: number; color: string; pct: number }>(null);
  const [mouse, setMouse] = React.useState<{ x: number; y: number } | null>(null);

  const onMove = (e: React.MouseEvent) => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setMouse({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <div className="donut-wrap" ref={wrapRef} onMouseMove={onMove} style={{ position: 'relative' }}>
      <svg viewBox="0 0 240 240" className="donut">
        {paths.map((p) => {
          const isHot = hovered?.label === p.label;
          const pct = (Number.isFinite(p.value) ? p.value : 0) / total * 100;
          return (
            <path
              key={p.label}
              d={p.d}
              fill={p.color}
              fillOpacity={isHot ? 1 : 0.92}
              stroke={isHot ? colors.border.strong : 'transparent'}
              strokeWidth={isHot ? 2 : 0}
              style={{
                cursor: onSliceClick ? 'pointer' : 'default',
                filter: isHot ? 'drop-shadow(0 10px 18px rgba(0,0,0,0.16))' : 'none',
              }}
              onMouseEnter={() => setHovered({ label: p.label, value: p.value, color: p.color, pct })}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSliceClick?.(p)}
            />
          );
        })}
        <text x="120" y="118" textAnchor="middle" fontSize="12" fill="currentColor" fillOpacity={0.55}>
          Total
        </text>
        <text x="120" y="146" textAnchor="middle" fontSize="20" fontWeight="800" fill="currentColor">
          {formatNumber(total, format)}
        </text>
      </svg>
      <div className="donut-legend">
        {slices.map((s) => {
          const isHot = hovered?.label === s.label;
          const pct = (Number.isFinite(s.value) ? s.value : 0) / total * 100;
          return (
            <div
              key={s.label}
              className="legend-row"
              style={{
                padding: '6px 8px',
                borderRadius: radius.md,
                background: isHot ? colors.bg.muted : 'transparent',
                cursor: onSliceClick ? 'pointer' : 'default',
              }}
              onMouseEnter={() => setHovered({ label: s.label, value: s.value, color: s.color, pct })}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSliceClick?.(s)}
            >
              <span className="legend-dot" style={{ backgroundColor: s.color }} />
              <span className="legend-label">{s.label}</span>
              <span className="legend-value">{formatNumber(s.value, format)}</span>
            </div>
          );
        })}
      </div>

      {hovered && mouse ? (
        <div
          style={{
            position: 'absolute',
            left: Math.max(14, Math.min(mouse.x, 520)),
            top: Math.max(14, mouse.y - 8),
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            background: colors.bg.surface,
            color: colors.text.primary,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: radius.lg,
            boxShadow: shadows.lg,
            padding: '10px 12px',
            minWidth: 220,
            zIndex: 2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: hovered.color, display: 'inline-block' }} />
            <div
              style={{
                fontSize: 12,
                color: colors.text.secondary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {hovered.label}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{formatNumber(Number(hovered.value || 0), format)}</div>
            <div style={{ fontSize: 12, color: colors.text.secondary, fontVariantNumeric: 'tabular-nums' }}>
              {Number.isFinite(hovered.pct) ? hovered.pct.toFixed(1) : '0.0'}%
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type Bucket = 'hour' | 'day' | 'week' | 'month';
type Agg = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'last';

type TimelineEvent = {
  id: string;
  title: string;
  typeColor?: string | null;
  occurredAt: string;
  endAt?: string | null;
  projectName?: string | null;
};

type PointFilter = {
  metricKey: string;
  start?: string;
  end?: string;
  entityKind?: string;
  entityId?: string;
  entityIds?: string[];
  dataSourceId?: string;
  sourceGranularity?: string;
  dimensions?: Record<string, string | number | boolean | null>;
};

type DrillDescriptor =
  | { kind: 'pointFilter'; pointFilter: PointFilter; title: string; format: 'number' | 'usd' }
  | { kind: 'aggregateRow'; baseQuery: any; rowContext: any; title: string; format: 'number' | 'usd' };

function dayKey(d: string | Date): string {
  if (typeof d === 'string') {
    // e.g. "2025-12-17T00:00:00Z" or "2025-12-17"
    return d.slice(0, 10);
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function MultiLineChart({
  title,
  format,
  series,
  bucket,
  bucketControl,
  timelineOverlay,
  timelineEvents,
  onDrill,
  onDrillMenu,
}: {
  title: string;
  format: 'number' | 'usd';
  series: Array<{
    id: string;
    label: string;
    color: string;
    points: Array<{ t: number; v: number; bucketIso?: string }>;
    drill?: { baseQuery: any; rowContextBase?: any; titlePrefix?: string } | null;
    drillMenu?: { titlePrefix?: string; options: Array<{ label: string; baseQuery: any; rowContextBase?: any }> } | null;
  }>;
  bucket: Bucket;
  bucketControl?: React.ReactNode;
  timelineOverlay?: boolean;
  timelineEvents?: TimelineEvent[];
  onDrill?: (d: DrillDescriptor) => void;
  onDrillMenu?: (args: { title: string; format: 'number' | 'usd'; options: Array<{ label: string; d: DrillDescriptor }> }) => void;
}) {
  const { colors, radius, shadows } = useThemeTokens();
  const wPx = 900;
  const hPx = 240;
  const paddingX = 44;
  const paddingY = 34;

  const all = series.flatMap((s) => s.points.map((p) => p.v));
  const min = all.length ? Math.min(...all) : 0;
  const max = all.length ? Math.max(...all) : 1;
  const range = max - min || 1;

  const buckets = series[0]?.points?.map((p) => p.t) || [];
  const minT = buckets.length ? Math.min(...buckets) : 0;
  const maxT = buckets.length ? Math.max(...buckets) : 1;
  const timeSpan = maxT - minT || 1;

  // When timeline overlay is enabled, we use a time-scaled x-axis (real timestamps),
  // otherwise we keep the existing even-spacing by index.
  const useTimeAxis = Boolean(timelineOverlay);

  const toXByIdx = (idx: number) =>
    buckets.length <= 1 ? paddingX : paddingX + (idx / (buckets.length - 1)) * (wPx - paddingX * 2);
  const toXByTime = (t: number) => paddingX + ((t - minT) / timeSpan) * (wPx - paddingX * 2);
  const toX = (idx: number) => (useTimeAxis ? toXByTime(buckets[idx] ?? minT) : toXByIdx(idx));
  const toY = (v: number) => hPx - paddingY - ((v - min) / range) * (hPx - paddingY * 2);

  const yLabels = [
    { y: toY(max), label: formatNumber(max, format) },
    { y: toY((max + min) / 2), label: formatNumber((max + min) / 2, format) },
    { y: toY(min), label: formatNumber(min, format) },
  ];

  const formatBucketLabel = (t: number) => {
    const d = new Date(t);
    if (bucket === 'month') return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    if (bucket === 'week') return `Wk of ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    if (bucket === 'hour') return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric' });
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  const xLabels: Array<{ x: number; label: string }> = [];
  if (buckets.length >= 2) {
    xLabels.push({ x: useTimeAxis ? toXByTime(buckets[0]) : toX(0), label: formatBucketLabel(buckets[0]) });
    if (buckets.length > 2) {
      const mid = Math.floor(buckets.length / 2);
      xLabels.push({ x: useTimeAxis ? toXByTime(buckets[mid]) : toX(mid), label: formatBucketLabel(buckets[mid]) });
    }
    xLabels.push({
      x: useTimeAxis ? toXByTime(buckets[buckets.length - 1]) : toX(buckets.length - 1),
      label: formatBucketLabel(buckets[buckets.length - 1]),
    });
  }

  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);

  const handleMove = (evt: React.MouseEvent) => {
    if (!wrapRef.current || buckets.length === 0) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    // Choose nearest bucket by pixel distance.
    const xPositions = buckets.map((t, idx) => {
      const xp = useTimeAxis ? toXByTime(t) : toXByIdx(idx);
      return (xp / wPx) * rect.width;
    });
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < xPositions.length; i++) {
      const d = Math.abs(x - xPositions[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    setHoverIdx(bestIdx);
  };

  const handleLeave = () => setHoverIdx(null);

  const tooltip = hoverIdx !== null && buckets[hoverIdx]
    ? {
        t: buckets[hoverIdx],
        x: toX(hoverIdx),
        items: series.map((s) => ({
          id: s.id,
          label: s.label,
          color: s.color,
          v: s.points[hoverIdx]?.v ?? 0,
          bucketIso: s.points[hoverIdx]?.bucketIso,
          drill: s.drill,
          drillMenu: s.drillMenu,
        })),
        events:
          timelineOverlay && Array.isArray(timelineEvents)
            ? timelineEvents.filter((e) => {
                const dk = dayKey(new Date(buckets[hoverIdx]));
                const start = dayKey(e.occurredAt);
                const end = e.endAt ? dayKey(e.endAt) : null;
                if (end) return dk >= start && dk <= end;
                return dk === start;
              })
            : [],
      }
    : null;

  return (
    <div className="card" ref={wrapRef} onMouseMove={handleMove} onMouseLeave={handleLeave} style={{ position: 'relative' }}>
      <div className="card-head">
        <div className="card-title">{title}</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {bucketControl}
          <div className="card-subtle">{series.length} series</div>
        </div>
      </div>
      <div className="card-body">
        <svg viewBox={`0 0 ${wPx} ${hPx}`} preserveAspectRatio="none" className="chart-svg">
          {yLabels.map((yl, i) => (
            <line key={i} x1={paddingX} y1={yl.y} x2={wPx - paddingX} y2={yl.y} stroke="currentColor" strokeOpacity={0.10} strokeDasharray="4 4" />
          ))}
          {/* Timeline overlays (behind lines) */}
          {timelineOverlay && Array.isArray(timelineEvents) && timelineEvents.length > 0 ? (
            <>
              {timelineEvents
                .map((e) => {
                  const startTs = new Date(e.occurredAt).getTime();
                  if (!Number.isFinite(startTs)) return null;
                  const endTs = e.endAt ? new Date(e.endAt).getTime() : null;
                  const color = e.typeColor || '#6b7280';

                  // Only render if intersects visible range
                  const intersects = endTs
                    ? !(endTs < minT || startTs > maxT)
                    : startTs >= minT && startTs <= maxT;
                  if (!intersects) return null;

                  const x1 = toXByTime(Math.max(minT, startTs));

                  if (endTs && endTs > startTs) {
                    const x2 = toXByTime(Math.min(maxT, endTs));
                    const w = Math.max(0, x2 - x1);
                    return (
                      <g key={`area_${e.id}`}>
                        <rect x={x1} y={paddingY} width={w} height={hPx - paddingY * 2} fill={color} fillOpacity={0.08} />
                        <rect
                          x={x1}
                          y={paddingY}
                          width={w}
                          height={hPx - paddingY * 2}
                          fill="none"
                          stroke={color}
                          strokeOpacity={0.35}
                          strokeWidth={1.5}
                          strokeDasharray="4 2"
                        />
                      </g>
                    );
                  }

                  return (
                    <line
                      key={`line_${e.id}`}
                      x1={x1}
                      y1={paddingY}
                      x2={x1}
                      y2={hPx - paddingY}
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      strokeOpacity={0.6}
                    />
                  );
                })
                .filter(Boolean)}
            </>
          ) : null}
          {series.map((s) => {
            const pts = s.points;
            const line = pts
              .map((p, idx) => `${(useTimeAxis ? toXByTime(p.t) : toXByIdx(idx)).toFixed(1)},${toY(p.v).toFixed(1)}`)
              .join(' ');
            return (
              <polyline key={s.label} fill="none" stroke={s.color} strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round" points={line} />
            );
          })}
          {tooltip ? (
            <line x1={tooltip.x} y1={paddingY} x2={tooltip.x} y2={hPx - paddingY} stroke="currentColor" strokeOpacity={0.18} />
          ) : null}
          {yLabels.map((yl, i) => (
            <text key={i} x={paddingX - 8} y={yl.y + 4} textAnchor="end" fontSize="11" fill="currentColor" fillOpacity={0.55}>
              {yl.label}
            </text>
          ))}
          {xLabels.map((xl, i) => (
            <text key={i} x={xl.x} y={hPx - 8} textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity={0.55}>
              {xl.label}
            </text>
          ))}
        </svg>
        {tooltip ? (
          <div
            style={{
              position: 'absolute',
              top: 58,
              left: `${Math.max(12, Math.min(tooltip.x / wPx * 100, 88))}%`,
              transform: 'translateX(-50%)',
              pointerEvents: 'auto',
              color: colors.text.primary,
              background: colors.bg.surface,
              border: `1px solid ${colors.border.subtle}`,
              borderRadius: radius.lg,
              padding: '10px 12px',
              minWidth: 220,
              boxShadow: shadows.lg,
            }}
          >
            <div style={{ fontSize: 12, marginBottom: 8, color: colors.text.secondary }}>
              {formatBucketLabel(tooltip.t)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tooltip.items.map((it) => {
                const canDrill = Boolean(onDrill && it.drill);
                const canMenu = Boolean(onDrillMenu && it.drillMenu);
                return (
                  <div
                    key={it.id}
                    role={canDrill || canMenu ? 'button' : undefined}
                    tabIndex={canDrill || canMenu ? 0 : undefined}
                    onClick={() => {
                      const bucketIso = it.bucketIso || new Date(tooltip.t).toISOString();
                      if (onDrill && it.drill) {
                        onDrill({
                          kind: 'aggregateRow',
                          baseQuery: it.drill.baseQuery,
                          rowContext: { ...(it.drill.rowContextBase || {}), bucket: bucketIso },
                          title: `${it.drill.titlePrefix || title} • ${it.label}`,
                          format,
                        });
                        return;
                      }
                      if (onDrillMenu && it.drillMenu) {
                        onDrillMenu({
                          title: `${it.drillMenu.titlePrefix || title} • ${it.label}`,
                          format,
                          options: it.drillMenu.options.map((o) => ({
                            label: o.label,
                            d: {
                              kind: 'aggregateRow',
                              baseQuery: o.baseQuery,
                              rowContext: { ...(o.rowContextBase || {}), bucket: bucketIso },
                              title: `${it.drillMenu?.titlePrefix || title} • ${it.label} • ${o.label}`,
                              format,
                            },
                          })),
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (!canDrill && !canMenu) return;
                      if (e.key !== 'Enter' && e.key !== ' ') return;
                      e.preventDefault();
                      const bucketIso = it.bucketIso || new Date(tooltip.t).toISOString();
                      if (canDrill && onDrill && it.drill) {
                        onDrill({
                          kind: 'aggregateRow',
                          baseQuery: it.drill.baseQuery,
                          rowContext: { ...(it.drill.rowContextBase || {}), bucket: bucketIso },
                          title: `${it.drill.titlePrefix || title} • ${it.label}`,
                          format,
                        });
                        return;
                      }
                      if (canMenu && onDrillMenu && it.drillMenu) {
                        onDrillMenu({
                          title: `${it.drillMenu.titlePrefix || title} • ${it.label}`,
                          format,
                          options: it.drillMenu.options.map((o) => ({
                            label: o.label,
                            d: {
                              kind: 'aggregateRow',
                              baseQuery: o.baseQuery,
                              rowContext: { ...(o.rowContextBase || {}), bucket: bucketIso },
                              title: `${it.drillMenu?.titlePrefix || title} • ${it.label} • ${o.label}`,
                              format,
                            },
                          })),
                        });
                      }
                    }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '10px 1fr auto',
                      gap: 10,
                      alignItems: 'center',
                      borderRadius: radius.md,
                      padding: '4px 6px',
                      cursor: (canDrill || canMenu) ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                    title={canDrill ? 'Click to drill down' : canMenu ? 'Click to choose drilldown' : undefined}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: it.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: colors.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {it.label}
                    </span>
                    <span style={{ fontSize: 12, color: colors.text.secondary, fontVariantNumeric: 'tabular-nums' }}>
                      {formatNumber(Number(it.v || 0), format)}
                    </span>
                  </div>
                );
              })}
            </div>
            {timelineOverlay && tooltip.events && tooltip.events.length > 0 ? (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${colors.border.subtle}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.text.secondary, marginBottom: 6 }}>Timeline</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tooltip.events.slice(0, 6).map((e: any) => (
                    <div key={e.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: e.typeColor || '#6b7280', display: 'inline-block' }} />
                      <span style={{ fontSize: 12, color: colors.text.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {String(e.title || 'Event')}
                        {e.projectName ? <span style={{ opacity: 0.7 }}> ({String(e.projectName)})</span> : null}
                      </span>
                    </div>
                  ))}
                  {tooltip.events.length > 6 ? (
                    <div style={{ fontSize: 11, color: colors.text.secondary }}>+{tooltip.events.length - 6} more…</div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="legend">
          {series.map((s) => (
            <div key={s.label} className="legend-pill">
              <span className="legend-dot" style={{ backgroundColor: s.color }} />
              <span className="legend-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface DashboardsProps {
  onNavigate?: (path: string) => void;
  /** Optional pack name - if provided, overrides URL query param */
  pack?: string;
  /** Optional initial dashboard key to select */
  dashboardKey?: string;
  [key: string]: any; // Allow other props to be passed but ignore them
}

const LS_LAST_DASHBOARD_KEY = 'hit.dashboard.lastSelectedKey';
const LS_LAST_DASHBOARD_PACK = 'hit.dashboard.lastSelectedPack';
const LS_LAST_DASHBOARD_KEY_BY_PACK_PREFIX = 'hit.dashboard.lastSelectedKeyByPack:';

function getStoredHitToken(): string | null {
  // The HIT web shell stores the user JWT as:
  // - localStorage['hit_token'] (common)
  // - cookie 'hit_token' (sometimes; not guaranteed in all deployments)
  if (typeof document !== 'undefined') {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'hit_token' && value) return decodeURIComponent(value);
      }
    } catch {
      // ignore
    }
  }
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem('hit_token');
    } catch {
      // ignore
    }
  }
  return null;
}

function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit) {
  const token = getStoredHitToken();
  const headers = new Headers(init?.headers || undefined);
  if (token && !headers.get('authorization') && !headers.get('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  // Always include credentials so cookie-based auth still works.
  return fetch(input, { ...init, headers, credentials: 'include' });
}

export function Dashboards(props: DashboardsProps = {}) {
  const { pack: packProp, dashboardKey: dashboardKeyProp, onNavigate } = props as any;
  const { Page, Card, Button, Dropdown, Select, Input, Modal, Spinner, Badge } = useUi();
  const { colors, radius } = useThemeTokens();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() || '';

  const navigate = React.useCallback(
    (href: string) => {
      if (!href) return;
      if (onNavigate) {
        onNavigate(href);
        return;
      }
      // Avoid hard reloads for internal navigation; only allow external schemes.
      const h = String(href);
      const isExternal =
        h.startsWith('http://') ||
        h.startsWith('https://') ||
        h.startsWith('mailto:') ||
        h.startsWith('tel:');
      if (isExternal && typeof window !== 'undefined') window.open(h, '_blank', 'noopener,noreferrer');
    },
    [onNavigate]
  );

  const [list, setList] = React.useState<DashboardListItem[]>([]);
  const [selectedKey, setSelectedKey] = React.useState<string>('');
  const [definition, setDefinition] = React.useState<DashboardDefinition | null>(null);
  const [loadingList, setLoadingList] = React.useState(false);
  const [loadingDash, setLoadingDash] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [catalogByKey, setCatalogByKey] = React.useState<Record<string, MetricCatalogItem>>({});

  const [preset, setPreset] = React.useState<TimePreset>('last_30_days');
  const [customStart, setCustomStart] = React.useState<string>(() => todayISODate());
  const [customEnd, setCustomEnd] = React.useState<string>(() => todayISODate());

  const [shareOpen, setShareOpen] = React.useState(false);
  const [shares, setShares] = React.useState<ShareRow[]>([]);
  const [sharesLoading, setSharesLoading] = React.useState(false);
  const [sharesError, setSharesError] = React.useState<string | null>(null);

  const [kpiValues, setKpiValues] = React.useState<Record<string, { loading: boolean; value?: number; prev?: number }>>({});
  const [kpiCatalogTotals, setKpiCatalogTotals] = React.useState<
    Record<string, { loading: boolean; totalsByMetricKey?: Record<string, number> }>
  >({});
  const [pieSlices, setPieSlices] = React.useState<Record<string, { loading: boolean; slices?: any[]; otherLabel?: string }>>({});
  const [apiPieSlices, setApiPieSlices] = React.useState<
    Record<string, { loading: boolean; slices?: any[]; otherLabel?: string; error?: string }>
  >({});
  const [apiTables, setApiTables] = React.useState<Record<string, { loading: boolean; rows?: any[]; total?: number }>>({});
  const [lineSeries, setLineSeries] = React.useState<
    Record<
      string,
      {
        loading: boolean;
        series?: Array<{
          id: string;
          label: string;
          color: string;
          points: Array<{ t: number; v: number; bucketIso?: string }>;
          drill?: { baseQuery: any; rowContextBase?: any; titlePrefix?: string } | null;
          drillMenu?: { titlePrefix?: string; options: Array<{ label: string; baseQuery: any; rowContextBase?: any }> } | null;
        }>;
      }
    >
  >({});
  const [lineBucketByWidgetKey, setLineBucketByWidgetKey] = React.useState<Record<string, Bucket>>({});
  const [projectNames, setProjectNames] = React.useState<Record<string, string>>({});
  const [timelineEvents, setTimelineEvents] = React.useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = React.useState(false);

  // Pie drilldown (slice -> underlying points)
  const [drillOpen, setDrillOpen] = React.useState(false);
  const [drillLoading, setDrillLoading] = React.useState(false);
  const [drillError, setDrillError] = React.useState<string | null>(null);
  const [drillTitle, setDrillTitle] = React.useState<string>('Drilldown');
  const [drillReportTz, setDrillReportTz] = React.useState<string>('UTC');
  const [drillFormat, setDrillFormat] = React.useState<'number' | 'usd'>('number');
  const [drillPoints, setDrillPoints] = React.useState<any[]>([]);
  const [drillPagination, setDrillPagination] = React.useState<{ page: number; pageSize: number; total: number }>({
    page: 1,
    pageSize: 50,
    total: 0,
  });
  const [drillLastFilter, setDrillLastFilter] = React.useState<any | null>(null);

  // Drilldown menu (used when a rendered value is composed of multiple metrics).
  const [drillMenuOpen, setDrillMenuOpen] = React.useState(false);
  const [drillMenuTitle, setDrillMenuTitle] = React.useState<string>('Drilldown');
  const [drillMenuFormat, setDrillMenuFormat] = React.useState<'number' | 'usd'>('number');
  const [drillMenuOptions, setDrillMenuOptions] = React.useState<Array<{ label: string; d: DrillDescriptor }>>([]);

  const runDrilldown = React.useCallback(async (args: { pointFilter: any; title: string; format: 'number' | 'usd'; page?: number }) => {
    const page = typeof args.page === 'number' ? args.page : 1;
    setDrillOpen(true);
    setDrillTitle(args.title || 'Drilldown');
    setDrillFormat(args.format);
    setDrillError(null);
    setDrillLoading(true);
    setDrillLastFilter(args.pointFilter);
    try {
      const res = await fetchWithAuth('/api/metrics/drilldown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointFilter: args.pointFilter, page, pageSize: 50, includeContributors: false }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `metrics/drilldown ${res.status}`);
      setDrillPoints(Array.isArray(json?.points) ? json.points : []);
      const p = json?.pagination;
      setDrillPagination({
        page: typeof p?.page === 'number' ? p.page : page,
        pageSize: typeof p?.pageSize === 'number' ? p.pageSize : 50,
        total: typeof p?.total === 'number' ? p.total : 0,
      });
      const tz = String(json?.meta?.reportTimezone || 'UTC');
      setDrillReportTz(tz || 'UTC');
    } catch (e) {
      setDrillError(e instanceof Error ? e.message : String(e));
      setDrillPoints([]);
      setDrillPagination({ page, pageSize: 50, total: 0 });
    } finally {
      setDrillLoading(false);
    }
  }, []);

  const runDrillDescriptor = React.useCallback(async (d: DrillDescriptor) => {
    if (d.kind === 'pointFilter') {
      await runDrilldown({ pointFilter: d.pointFilter, title: d.title, format: d.format, page: 1 });
      return;
    }

    // aggregateRow: let the server derive the exact filter (bucket narrowing, entityId/groupBy dims).
    setDrillOpen(true);
    setDrillTitle(d.title || 'Drilldown');
    setDrillFormat(d.format);
    setDrillError(null);
    setDrillLoading(true);
    setDrillLastFilter(null);
    try {
      const res = await fetchWithAuth('/api/metrics/drilldown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseQuery: d.baseQuery, rowContext: d.rowContext, page: 1, pageSize: 50, includeContributors: false }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `metrics/drilldown ${res.status}`);
      setDrillPoints(Array.isArray(json?.points) ? json.points : []);
      const p = json?.pagination;
      setDrillPagination({
        page: typeof p?.page === 'number' ? p.page : 1,
        pageSize: typeof p?.pageSize === 'number' ? p.pageSize : 50,
        total: typeof p?.total === 'number' ? p.total : 0,
      });
      const tz = String(json?.meta?.reportTimezone || 'UTC');
      setDrillReportTz(tz || 'UTC');

      const resolved = (json as any)?.meta?.resolvedPointFilter;
      if (resolved && typeof resolved === 'object') setDrillLastFilter(resolved);
    } catch (e) {
      setDrillError(e instanceof Error ? e.message : String(e));
      setDrillPoints([]);
      setDrillPagination({ page: 1, pageSize: 50, total: 0 });
      setDrillLastFilter(null);
    } finally {
      setDrillLoading(false);
    }
  }, [runDrilldown]);

  const openDrillMenu = React.useCallback((args: { title: string; format: 'number' | 'usd'; options: Array<{ label: string; d: DrillDescriptor }> }) => {
    setDrillMenuTitle(args.title || 'Drilldown');
    setDrillMenuFormat(args.format);
    setDrillMenuOptions(Array.isArray(args.options) ? args.options : []);
    setDrillMenuOpen(true);
  }, []);


  // Use prop if provided, otherwise fall back to URL query param.
  const pack = React.useMemo(() => {
    if (packProp) return packProp.trim();
    return (searchParams?.get('pack') || '').trim();
  }, [packProp, searchParams]);
  const defaultPacks = React.useMemo(() => ['crm', 'projects', 'marketing'], []);
  const isDefaultPackMode = !pack;
  const urlKey = React.useMemo(() => (searchParams?.get('key') || '').trim(), [searchParamsString]);

  const didApplyUrlKeyRef = React.useRef(false);

  const range = React.useMemo(() => {
    if (preset === 'custom') {
      const start = new Date(`${customStart}T00:00:00.000Z`);
      const end = new Date(`${customEnd}T23:59:59.999Z`);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    return toRangeFromPreset(preset);
  }, [preset, customStart, customEnd]);

  const loadCatalog = React.useCallback(async () => {
    try {
      const map = await fetchCatalogMap();
      if (Object.keys(map).length) setCatalogByKey(map);
    } catch {
      // ignore
    }
  }, []);

  function buildCatalogMap(items: any[]): Record<string, MetricCatalogItem> {
    const map: Record<string, MetricCatalogItem> = {};
    for (const it of items as any[]) {
      const key = typeof it?.key === 'string' ? it.key : '';
      if (!key) continue;
      map[key] = {
        key,
        label: typeof it?.label === 'string' ? it.label : key,
        unit: typeof it?.unit === 'string' ? it.unit : 'count',
        icon: typeof it?.icon === 'string' ? it.icon : undefined,
        icon_color: typeof it?.icon_color === 'string' ? it.icon_color : undefined,
        category: typeof it?.category === 'string' ? it.category : undefined,
        rollup_strategy: typeof it?.rollup_strategy === 'string' ? it.rollup_strategy : undefined,
        time_kind:
          it?.time_kind === 'realtime' || it?.time_kind === 'none' || it?.time_kind === 'timeseries'
            ? it.time_kind
            : undefined,
        owner:
          it?.owner &&
          typeof it.owner === 'object' &&
          typeof it.owner.kind === 'string' &&
          typeof it.owner.id === 'string'
            ? (it.owner as any)
            : undefined,
        entity_kinds: Array.isArray(it?.entity_kinds)
          ? ((it.entity_kinds as any[]).filter((x) => typeof x === 'string') as string[])
          : undefined,
        pointsCount: typeof it?.pointsCount === 'number' ? it.pointsCount : undefined,
      };
    }
    return map;
  }

  async function fetchCatalogMap(): Promise<Record<string, MetricCatalogItem>> {
    const res = await fetchWithAuth('/api/metrics/catalog');
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return {};
    const items = Array.isArray(json.items) ? json.items : Array.isArray(json.data) ? json.data : [];
    return buildCatalogMap(items as any[]);
  }

  function pMapLimit<T, R>(items: T[], limit: number, fn: (item: T, idx: number) => Promise<R>): Promise<R[]> {
    const lim = Math.max(1, Math.min(25, Number(limit || 0) || 8));
    let i = 0;
    const out: R[] = new Array(items.length);
    const workers = new Array(Math.min(lim, items.length)).fill(0).map(async () => {
      while (true) {
        const idx = i++;
        if (idx >= items.length) break;
        out[idx] = await fn(items[idx], idx);
      }
    });
    return Promise.all(workers).then(() => out);
  }

  function fallbackIconForMetric(cat?: string) {
    const c = String(cat || '').toLowerCase();
    if (c.includes('revenue') || c.includes('sales')) return 'DollarSign';
    if (c.includes('marketing') || c.includes('followers') || c.includes('wishlist')) return 'Megaphone';
    if (c.includes('user') || c.includes('customer')) return 'Users';
    if (c.includes('project') || c.includes('game')) return 'Gamepad2';
    return 'BarChart3';
  }

  const loadList = React.useCallback(async () => {
    try {
      setLoadingList(true);
      setError(null);
      // Default UX: show business pack dashboards (CRM/Projects/Marketing) instead of global.
      // When explicitly pack-scoped, show only that pack (no global) for MVP.
      const normalizeItems = (items: any[]): DashboardListItem[] => {
        const xs = Array.isArray(items) ? items : [];
        return xs.map((d: any) => {
          const scope = d?.scope;
          const packFromScope =
            scope && typeof scope === 'object' && String(scope.kind || '') === 'pack'
              ? String(scope.pack || '').trim() || null
              : null;
          return { ...(d as any), pack: packFromScope } as DashboardListItem;
        });
      };

      let items: DashboardListItem[] = [];
      if (pack) {
        const u = `/api/dashboard-definitions?pack=${encodeURIComponent(pack)}&includeGlobal=false`;
        const res = await fetchWithAuth(u);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`);
        items = normalizeItems(Array.isArray(json.data) ? json.data : []);
      } else {
        // Fetch dashboards for the default packs in parallel.
        const results = await Promise.allSettled(
          defaultPacks.map(async (p) => {
            const u = `/api/dashboard-definitions?pack=${encodeURIComponent(p)}&includeGlobal=false`;
            const res = await fetchWithAuth(u);
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`);
            const xs = normalizeItems(Array.isArray(json.data) ? json.data : []);
            // Ensure pack is set even if scope parsing fails.
            return xs.map((d) => ({ ...d, pack: d.pack || p }));
          })
        );

        const errs: string[] = [];
        const ok: DashboardListItem[][] = [];
        results.forEach((r, idx) => {
          if (r.status === 'fulfilled') ok.push(r.value);
          else errs.push(`${defaultPacks[idx]}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
        });

        items = ok.flat();
        if (errs.length) {
          setError(`Some packs failed to load dashboards: ${errs.join(' | ')}`);
        }
        // Stable sort: pack then dashboard name.
        items.sort((a, b) => (String(a.pack || '').localeCompare(String(b.pack || ''))) || a.name.localeCompare(b.name));
      }

      setList(items);

      // Priority: 1. dashboardKeyProp, 2. URL key param, 3. localStorage
      const fromProp = (dashboardKeyProp || '').trim();
      const validFromProp = fromProp && items.some((item) => item.key === fromProp) ? fromProp : '';
      
      const fromUrl = (typeof window !== 'undefined') ? (new URLSearchParams(window.location.search).get('key') || '').trim() : '';
      // Only use the key from URL if it exists in the current pack's dashboard list
      const validFromUrl = fromUrl && items.some((item) => item.key === fromUrl) ? fromUrl : '';

      // If prop/URL doesn't specify a valid key, restore last selection from localStorage.
      let fromStorage = '';
      if (!validFromProp && !validFromUrl && typeof window !== 'undefined') {
        try {
          if (pack) {
            fromStorage = (window.localStorage.getItem(`${LS_LAST_DASHBOARD_KEY_BY_PACK_PREFIX}${pack}`) || '').trim();
          } else {
            fromStorage = (window.localStorage.getItem(LS_LAST_DASHBOARD_KEY) || '').trim();
          }
        } catch {
          // ignore
        }
      }
      const validFromStorage = fromStorage && items.some((item) => item.key === fromStorage) ? fromStorage : '';

      const pick = validFromProp || validFromUrl || validFromStorage || items[0]?.key || '';
      // Always set the key when loading a new list (pack may have changed)
      setSelectedKey(pick);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingList(false);
    }
  }, [pack, defaultPacks, dashboardKeyProp]);

  const loadDefinition = React.useCallback(async (key: string) => {
    if (!key) return;
    try {
      setLoadingDash(true);
      setError(null);
      const res = await fetchWithAuth(`/api/dashboard-definitions/${encodeURIComponent(key)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`);
      setDefinition(json.data as DashboardDefinition);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingDash(false);
    }
  }, []);

  // Load catalog once on mount
  React.useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Re-load dashboard list whenever pack changes (URL navigation)
  React.useEffect(() => {
    loadList();
  }, [pack, loadList]);

  // If user navigated with back/forward to a specific ?key=..., honor it.
  React.useEffect(() => {
    if (!urlKey) return;
    if (!list.length) return;
    if (urlKey === selectedKey) return;
    if (!list.some((d) => d.key === urlKey)) return;
    // Apply URL key only once per mount (deep-link entry). After that, dashboard switching is state-driven.
    if (didApplyUrlKeyRef.current) return;
    didApplyUrlKeyRef.current = true;
    setSelectedKey(urlKey);
  }, [urlKey, list, selectedKey]);

  // Persist last-selected dashboard (global + per-pack) so returning users land where they left off.
  React.useEffect(() => {
    if (!selectedKey) return;
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(LS_LAST_DASHBOARD_KEY, selectedKey);
      const item = list.find((d) => d.key === selectedKey);
      const p = String(item?.pack || pack || '').trim();
      if (p) {
        window.localStorage.setItem(`${LS_LAST_DASHBOARD_KEY_BY_PACK_PREFIX}${p}`, selectedKey);
        window.localStorage.setItem(LS_LAST_DASHBOARD_PACK, p);
      }
    } catch {
      // ignore
    }
  }, [selectedKey, list, pack]);

  React.useEffect(() => {
    if (!selectedKey) return;
    // IMPORTANT: do NOT rewrite the URL.
    // `key` is an optional deep-link param; forcing it into the URL causes remount/flash in some app-router setups.
    loadDefinition(selectedKey);
  }, [selectedKey, loadDefinition]);


  const resolveProjectNames = React.useCallback(async (ids: string[]) => {
    const missing = ids.filter((id) => id && !projectNames[id]);
    if (!missing.length) return;
    const next: Record<string, string> = {};
    await Promise.all(
      missing.slice(0, 25).map(async (id) => {
        try {
          const res = await fetch(`/api/projects/${encodeURIComponent(id)}`);
          const json = await res.json().catch(() => ({}));
          if (!res.ok) return;
          const name = typeof json?.data?.name === 'string' ? json.data.name : id;
          next[id] = name;
        } catch {
          // ignore
        }
      })
    );
    if (Object.keys(next).length) setProjectNames((p) => ({ ...p, ...next }));
  }, [projectNames]);

  // Return a mapping of id -> name (also updates state cache). Used to avoid render races.
  const fetchProjectNames = React.useCallback(async (ids: string[]) => {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    const missing = unique.filter((id) => !projectNames[id]);
    const out: Record<string, string> = {};
    if (missing.length === 0) return out;
    await Promise.all(
      missing.slice(0, 25).map(async (id) => {
        try {
          const res = await fetch(`/api/projects/${encodeURIComponent(id)}`);
          const json = await res.json().catch(() => ({}));
          if (!res.ok) return;
          const name = typeof json?.data?.name === 'string' ? json.data.name : id;
          out[id] = name;
        } catch {
          // ignore
        }
      })
    );
    if (Object.keys(out).length) setProjectNames((p) => ({ ...p, ...out }));
    return out;
  }, [projectNames]);

  const effectiveTime = React.useCallback((widget: any) => {
    const mode = widget?.time || 'inherit';
    if (mode === 'all_time') return null;
    return range;
  }, [range]);

  const queryMetrics = React.useCallback(async () => {
    if (!definition?.definition) return;
    const def = definition.definition;
    const widgets = Array.isArray(def.widgets) ? def.widgets : [];

    // KPI Catalog (auto-generated KPI tiles from metrics catalog)
    const kpiCatalogs = widgets.filter((w: any) => w?.kind === 'kpi_catalog');
    if (kpiCatalogs.length) {
      setKpiCatalogTotals((prev) => {
        const next = { ...prev };
        for (const w of kpiCatalogs) next[w.key] = { loading: true, totalsByMetricKey: prev[w.key]?.totalsByMetricKey || {} };
        return next;
      });
      await Promise.all(
        kpiCatalogs.map(async (w: any) => {
          try {
            // Fetch a local snapshot of the catalog so we can compute immediately (avoid setState timing).
            const catalogMap = Object.keys(catalogByKey || {}).length ? catalogByKey : await fetchCatalogMap();
            if (!Object.keys(catalogByKey || {}).length && Object.keys(catalogMap).length) setCatalogByKey(catalogMap);
            const pres = w?.presentation || {};
            const rawEntityKind = typeof pres?.entityKind === 'string' ? pres.entityKind.trim() : '';
            const isAutoEntityKind = rawEntityKind === '' || rawEntityKind.toLowerCase() === 'auto';
            const entityKind = !isAutoEntityKind ? rawEntityKind : '';
            const onlyWithPoints = pres?.onlyWithPoints === true;
            const ownerKind = typeof pres?.owner?.kind === 'string' ? pres.owner.kind.trim().toLowerCase() : '';
            const ownerId = typeof pres?.owner?.id === 'string' ? pres.owner.id.trim() : '';
            const hasOwnerFilter = Boolean(ownerKind && ownerId);
            // Support filtering by entity kinds (metrics that support these entity kinds)
            const filterEntityKinds: string[] = Array.isArray(pres?.filterEntityKinds)
              ? (pres.filterEntityKinds as any[]).map((x) => String(x || '').trim().toLowerCase()).filter(Boolean)
              : [];
            const hasEntityKindsFilter = filterEntityKinds.length > 0;
            // Support filtering by category
            const filterCategories: string[] = Array.isArray(pres?.filterCategories)
              ? (pres.filterCategories as any[]).map((x) => String(x || '').trim().toLowerCase()).filter(Boolean)
              : [];
            const hasCategories = filterCategories.length > 0;

            const items = Object.values(catalogMap || {});
            const filtered = items
              .filter((it) => {
                // Filter by owner (e.g., only feature pack metrics)
                if (hasOwnerFilter) {
                  const ik = typeof (it as any)?.owner?.kind === 'string' ? String((it as any).owner.kind).trim().toLowerCase() : '';
                  const iid = typeof (it as any)?.owner?.id === 'string' ? String((it as any).owner.id).trim() : '';
                  if (ik !== ownerKind || iid !== ownerId) return false;
                }
                // Filter by entity kinds (metrics that support any of these entity kinds)
                if (hasEntityKindsFilter) {
                  const metricEntityKinds = Array.isArray(it.entity_kinds)
                    ? (it.entity_kinds as any[]).map((x) => String(x || '').trim().toLowerCase())
                    : [];
                  const hasMatch = filterEntityKinds.some((ek) => metricEntityKinds.includes(ek));
                  if (!hasMatch) return false;
                }
                // Filter by category
                if (hasCategories) {
                  const cat = typeof it.category === 'string' ? it.category.trim().toLowerCase() : '';
                  if (!filterCategories.includes(cat)) return false;
                }
                // If entityKind is explicitly set (not auto), filter metrics that support it
                if (!isAutoEntityKind) {
                  const kinds = Array.isArray(it.entity_kinds) ? it.entity_kinds : [];
                  // If the metric declares supported entity kinds, respect it.
                  // If it doesn't, we cannot safely assume it works for the chosen entityKind.
                  if (kinds.length === 0) return false;
                  if (!kinds.includes(entityKind)) return false;
                }
                if (onlyWithPoints && Number(it.pointsCount || 0) <= 0) return false;
                return true;
              })
              .sort((a, b) => String(a.label || a.key).localeCompare(String(b.label || b.key)));

            const t = effectiveTime(w);
            const totalsByMetricKey: Record<string, number> = {};

            const queries = filtered
              .map((it) => {
                const mk = String(it.key || '').trim();
                if (!mk) return null;
                const roll = String(it.rollup_strategy || '').toLowerCase();
                const timeKind = String(it.time_kind || '').toLowerCase();
                const agg: Agg = roll === 'last' || timeKind === 'realtime' || timeKind === 'none' ? 'last' : 'sum';
                const ek = isAutoEntityKind ? pickEntityKindForMetric(it) : entityKind;
                // If we can't infer entityKind, omit it and let the backend aggregate across all kinds.
                const body: any = { metricKey: mk, bucket: 'none', agg, groupByEntityId: true };
                if (ek) body.entityKind = ek;
                if (t) Object.assign(body, t);
                return body;
              })
              .filter(Boolean) as any[];

            const CHUNK = 50;
            for (let i = 0; i < queries.length; i += CHUNK) {
              const chunk = queries.slice(i, i + CHUNK);
              const res = await fetchWithAuth('/api/metrics/query-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queries: chunk }),
              });
              const json = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(json?.error || `metrics/query-batch ${res.status}`);
              const results = Array.isArray(json?.results) ? json.results : [];
              for (let j = 0; j < chunk.length; j++) {
                const q = chunk[j];
                const mk = String(q.metricKey || '').trim();
                const r = results[j];
                const rows = Array.isArray(r?.data) ? r.data : [];
                const sum = rows.reduce((acc: number, rr: any) => acc + Number(rr.value ?? 0), 0);
                totalsByMetricKey[mk] = Number.isFinite(sum) ? sum : 0;
              }
            }

            setKpiCatalogTotals((p) => ({ ...p, [w.key]: { loading: false, totalsByMetricKey } }));
          } catch {
            setKpiCatalogTotals((p) => ({ ...p, [w.key]: { loading: false, totalsByMetricKey: {} } }));
          }
        })
      );
    }

    // KPIs
    const kpis = widgets.filter((w: any) => w?.kind === 'kpi');
    setKpiValues((prev) => {
      const next = { ...prev };
      for (const w of kpis) next[w.key] = { loading: true };
      return next;
    });
    await Promise.all(
      kpis.map(async (w: any) => {
        try {
          // Optional non-metrics value source (e.g., project count from Projects API).
          const valueSource = w?.presentation?.valueSource;
          const metricKey = String(w?.query?.metricKey || '');
          const isProjectCount = metricKey === 'fp.projects.project_count';
          if (valueSource?.kind === 'api_count' || isProjectCount) {
            const endpoint = typeof valueSource?.endpoint === 'string' ? valueSource.endpoint : '/api/projects';
            const totalField = typeof valueSource?.totalField === 'string' ? valueSource.totalField : 'pagination.total';
            const sep = endpoint.includes('?') ? '&' : '?';
            const res = await fetch(`${endpoint}${sep}page=1&pageSize=1`);
            const json = await res.json().catch(() => ({}));
            const total = Array.isArray(json)
              ? json.length
              : Number(getByPath(json, totalField) ?? 0);
            setKpiValues((p) => ({ ...p, [w.key]: { loading: false, value: Number.isFinite(total) ? total : 0 } }));
            return;
          }

          // Generic non-metrics value source (extract a single numeric field from an endpoint).
          if (valueSource?.kind === 'api_value') {
            const endpoint = typeof valueSource?.endpoint === 'string' ? valueSource.endpoint : '';
            const valueField = typeof valueSource?.valueField === 'string' ? valueSource.valueField : '';
            if (!endpoint || !valueField) {
              setKpiValues((p) => ({ ...p, [w.key]: { loading: false, value: 0 } }));
              return;
            }
            const res = await fetchWithAuth(endpoint);
            const json = await res.json().catch(() => ({}));
            const raw = getByPath(json, valueField);
            const v = Number(raw ?? 0);
            setKpiValues((p) => ({ ...p, [w.key]: { loading: false, value: Number.isFinite(v) ? v : 0 } }));
            return;
          }

          // Sum the latest value per entity (useful for totals like wishlist_cumulative_total across projects).
          if (valueSource?.kind === 'metrics_sum_last_per_entity' && typeof valueSource.metricKey === 'string') {
            const t = effectiveTime(w); // usually null for all_time
            const body: any = {
              metricKey: String(valueSource.metricKey),
              bucket: 'none',
              agg: 'last',
              entityKind: typeof valueSource.entityKind === 'string' ? valueSource.entityKind : (w?.query?.entityKind || undefined),
              groupByEntityId: true,
            };
            if (t) Object.assign(body, t);
            const res = await fetchWithAuth('/api/metrics/query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error || `metrics/query ${res.status}`);
            const rows = Array.isArray(json.data) ? json.data : [];
            const sum = rows.reduce((acc: number, r: any) => acc + Number(r.value ?? 0), 0);
            setKpiValues((p) => ({ ...p, [w.key]: { loading: false, value: Number.isFinite(sum) ? sum : 0 } }));
            return;
          }

          // Generic aggregation per entity, then summed across entities.
          // Example: wishlist_net_change sum across all projects (all_time).
          if (valueSource?.kind === 'metrics_sum_agg_per_entity' && typeof valueSource.metricKey === 'string') {
            const t = effectiveTime(w);
            const agg = typeof valueSource.agg === 'string' ? valueSource.agg : 'sum';
            const body: any = {
              metricKey: String(valueSource.metricKey),
              bucket: 'none',
              agg,
              entityKind: typeof valueSource.entityKind === 'string' ? valueSource.entityKind : (w?.query?.entityKind || undefined),
              groupByEntityId: true,
            };
            if (t) Object.assign(body, t);
            const res = await fetchWithAuth('/api/metrics/query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error || `metrics/query ${res.status}`);
            const rows = Array.isArray(json.data) ? json.data : [];
            const sum = rows.reduce((acc: number, r: any) => acc + Number(r.value ?? 0), 0);
            setKpiValues((p) => ({ ...p, [w.key]: { loading: false, value: Number.isFinite(sum) ? sum : 0 } }));
            return;
          }

          // Sum of latest-per-entity across multiple metric keys (blended totals, e.g. followers across platforms).
          if (valueSource?.kind === 'metrics_sum_last_per_entity_multi' && Array.isArray(valueSource.metricKeys)) {
            const t = effectiveTime(w); // usually null for all_time
            const entityKind = typeof valueSource.entityKind === 'string' ? valueSource.entityKind : (w?.query?.entityKind || undefined);
            const keys = (valueSource.metricKeys as any[]).map((x) => String(x || '').trim()).filter(Boolean);
            let sumAll = 0;
            for (const mk of keys) {
              const body: any = { metricKey: mk, bucket: 'none', agg: 'last', entityKind, groupByEntityId: true };
              if (t) Object.assign(body, t);
              const res = await fetchWithAuth('/api/metrics/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
              const json = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(json?.error || `metrics/query ${res.status}`);
              const rows = Array.isArray(json.data) ? json.data : [];
              sumAll += rows.reduce((acc: number, r: any) => acc + Number(r.value ?? 0), 0);
            }
            setKpiValues((p) => ({ ...p, [w.key]: { loading: false, value: Number.isFinite(sumAll) ? sumAll : 0 } }));
            return;
          }

          const t = effectiveTime(w);
          const body = { ...(w.query || {}) };
          if (t) Object.assign(body, t);
          const res = await fetchWithAuth('/api/metrics/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json?.error || `metrics/query ${res.status}`);
          const rows = Array.isArray(json.data) ? json.data : [];
          const v = Number(rows[0]?.value ?? 0);

          let prev = undefined as number | undefined;
          if (t && w?.presentation?.compare === 'previous_period') {
            const start = new Date(t.start);
            const end = new Date(t.end);
            const dur = end.getTime() - start.getTime();
            const prevEnd = new Date(start.getTime() - 1);
            const prevStart = new Date(prevEnd.getTime() - dur);
            const prevBody = { ...(w.query || {}), start: prevStart.toISOString(), end: prevEnd.toISOString() };
            const r2 = await fetchWithAuth('/api/metrics/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prevBody) });
            const j2 = await r2.json().catch(() => ({}));
            const rr = Array.isArray(j2.data) ? j2.data : [];
            prev = Number(rr[0]?.value ?? 0);
          }

          setKpiValues((p) => ({ ...p, [w.key]: { loading: false, value: Number.isFinite(v) ? v : 0, prev } }));
        } catch (err) {
          console.warn(`[Dashboard] KPI "${w.key}" failed:`, err);
          setKpiValues((p) => ({ ...p, [w.key]: { loading: false, value: 0, error: String(err) } }));
        }
      })
    );

    // Pie
    const pies = widgets.filter((w: any) => w?.kind === 'pie');
    setPieSlices((prev) => {
      const next = { ...prev };
      for (const w of pies) next[w.key] = { loading: true, slices: prev[w.key]?.slices || [] };
      return next;
    });
    await Promise.all(
      pies.map(async (w: any) => {
        try {
          const block = normalizePieBlock({
            title: String(w.title || 'Pie'),
            format: (w?.presentation?.format === 'usd') ? 'usd' : 'number',
            time: w?.time === 'all_time' ? 'all_time' : 'inherit',
            query: { ...(w.query || {}) },
            groupByKey: String(w?.presentation?.groupByKey || 'region'),
            topN: Number(w?.presentation?.topN || 5),
            otherLabel: String(w?.presentation?.otherLabel || 'Other'),
          });
          const out = await runPieBlock({ block, timeRange: effectiveTime(w) });
          setPieSlices((p) => ({ ...p, [w.key]: { loading: false, slices: out.slices, otherLabel: out.otherLabel } }));
        } catch {
          setPieSlices((p) => ({ ...p, [w.key]: { loading: false, slices: [], otherLabel: String(w?.presentation?.otherLabel || 'Other') } }));
        }
      })
    );

    // API Pie (non-metrics grouped pies, e.g. CRM pipeline stage breakdown)
    const apiPies = widgets.filter((w: any) => w?.kind === 'api_pie');
    if (apiPies.length) {
      setApiPieSlices((prev) => {
        const next = { ...prev };
        for (const w of apiPies) next[w.key] = { loading: true, slices: prev[w.key]?.slices || [] };
        return next;
      });
      await Promise.all(
        apiPies.map(async (w: any) => {
          try {
            const pres = w?.presentation || {};
            const endpoint = String(pres.endpoint || '').trim();
            if (!endpoint) throw new Error('Missing api_pie.presentation.endpoint');
            const res = await fetchWithAuth(endpoint);
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error || `api_pie fetch ${res.status}`);

            const itemsField = String(pres.itemsField || 'items');
            const labelField = String(pres.labelField || 'label');
            const valueField = String(pres.valueField || 'value');
            const rawField = String(pres.rawField || labelField);
            const hrefTemplate = typeof pres.hrefTemplate === 'string' ? pres.hrefTemplate : '';

            const topN = Math.max(1, Math.min(25, Number(pres.topN || 8) || 8));
            const otherLabel = String(pres.otherLabel || 'Other');

            const items = getByPath(json, itemsField);
            const arr = Array.isArray(items) ? items : [];
            const normalized = arr
              .map((it: any) => ({
                label: String(getByPath(it, labelField) ?? 'Unknown'),
                raw: getByPath(it, rawField),
                value: Number(getByPath(it, valueField) ?? 0),
                href: hrefTemplate ? applyTemplate(hrefTemplate, it) : '',
              }))
              .map((r: any) => ({ ...r, value: Number.isFinite(r.value) ? r.value : 0 }))
              .sort((a: any, b: any) => b.value - a.value);

            const top = normalized.slice(0, topN);
            const otherSum = normalized.slice(topN).reduce((acc: number, r: any) => acc + (Number.isFinite(r.value) ? r.value : 0), 0);
            const slices = [
              ...top.map((r: any, idx: number) => ({ ...r, color: palette(idx) })),
              ...(otherSum > 0 ? [{ label: otherLabel, raw: '__other__', value: otherSum, color: '#94a3b8', href: '' }] : []),
            ];

            setApiPieSlices((p) => ({ ...p, [w.key]: { loading: false, slices, otherLabel, error: undefined } }));
          } catch (e: any) {
            setApiPieSlices((p) => ({
              ...p,
              [w.key]: {
                loading: false,
                slices: [],
                otherLabel: String(w?.presentation?.otherLabel || 'Other'),
                error: String(e?.message || 'Failed to load'),
              },
            }));
          }
        })
      );
    }

    // API Table (non-metrics tabular blocks, e.g. stalled opportunities)
    const apiTableWidgets = widgets.filter((w: any) => w?.kind === 'api_table');
    if (apiTableWidgets.length) {
      setApiTables((prev) => {
        const next = { ...prev };
        for (const w of apiTableWidgets) next[w.key] = { loading: true, rows: prev[w.key]?.rows || [], total: prev[w.key]?.total };
        return next;
      });
      await Promise.all(
        apiTableWidgets.map(async (w: any) => {
          try {
            const pres = w?.presentation || {};
            const endpoint = String(pres.endpoint || '').trim();
            if (!endpoint) throw new Error('Missing api_table.presentation.endpoint');
            const res = await fetchWithAuth(endpoint);
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error || `api_table fetch ${res.status}`);

            const itemsField = String(pres.itemsField || 'items');
            const totalField = typeof pres.totalField === 'string' ? pres.totalField : '';
            const rows = Array.isArray(getByPath(json, itemsField)) ? (getByPath(json, itemsField) as any[]) : [];
            const total = totalField ? Number(getByPath(json, totalField) ?? 0) : undefined;
            setApiTables((p) => ({ ...p, [w.key]: { loading: false, rows, total: (total != null && Number.isFinite(total)) ? total : undefined } }));
          } catch {
            setApiTables((p) => ({ ...p, [w.key]: { loading: false, rows: [], total: undefined } }));
          }
        })
      );
    }

    // Line (multi series)
    const lines = widgets.filter((w: any) => w?.kind === 'line');
    setLineSeries((prev) => {
      const next = { ...prev };
      for (const w of lines) next[w.key] = { loading: true };
      return next;
    });

    await Promise.all(
      lines.map(async (w: any) => {
        try {
          const t = effectiveTime(w);
          if (!t) throw new Error('Line widgets require time range');
          const bucketOverride: Bucket | undefined = lineBucketByWidgetKey[w.key];

          // Explicit series: [{ key, query }]
          if (Array.isArray(w.series) && w.series.length > 0) {
            const out: Array<{ id: string; label: string; color: string; points: Array<{ t: number; v: number; bucketIso?: string }>; drill?: { baseQuery: any; rowContextBase?: any; titlePrefix?: string } | null }> = [];
            for (let i = 0; i < w.series.length; i++) {
              const s = w.series[i];
              const body = { ...(s.query || {}), start: t.start, end: t.end };
              const res = await fetchWithAuth('/api/metrics/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
              const json = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(json?.error || `metrics/query ${res.status}`);
              const rows = Array.isArray(json.data) ? json.data : [];
              const pts = rows
                .map((r: any) => ({ t: r.bucket ? new Date(r.bucket).getTime() : NaN, v: Number(r.value ?? 0), bucketIso: typeof r.bucket === 'string' ? r.bucket : undefined }))
                .filter((p: any) => Number.isFinite(p.t))
                .sort((a: any, b: any) => a.t - b.t);
              out.push({
                id: `explicit_${w.key}_${i}`,
                label: String(s.key || `Series ${i + 1}`),
                color: palette(i),
                points: pts,
                drill: { baseQuery: body, rowContextBase: {}, titlePrefix: String(w.title || 'Line') },
              });
            }
            setLineSeries((p) => ({ ...p, [w.key]: { loading: false, series: out } }));
            return;
          }

          // Computed top-N entities
          if (w.seriesSpec?.mode === 'top_n_entities') {
            const spec = w.seriesSpec;
            const metricKey = String(spec.metricKey || '');
            const entityKind = String(spec.entityKind || 'project');
            const bucket = String(bucketOverride || spec.bucket || 'day');
            const agg = String(spec.agg || 'sum');
            const topN = Number(spec.topN || 5);
            const includeOther = spec.includeOther !== false;
            const otherLabel = String(spec.otherLabel || 'Other');
            const cumulative = Boolean(spec.cumulative);

            // totals for ranking
            const totalsRes = await fetchWithAuth('/api/metrics/query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ metricKey, bucket: 'none', agg, entityKind, groupByEntityId: true, start: t.start, end: t.end }),
            });
            const totalsJson = await totalsRes.json().catch(() => ({}));
            const totalsRows = Array.isArray(totalsJson.data) ? totalsJson.data : [];
            const ranked = totalsRows
              .map((r: any) => ({ entityId: String(r.entityId || ''), value: Number(r.value ?? 0) }))
              .filter((r: any) => r.entityId)
              .sort((a: any, b: any) => b.value - a.value);
            const topIds = ranked.slice(0, topN).map((r: any) => r.entityId);

            const fetchedNames = spec.labelSource?.source === 'projects' ? await fetchProjectNames(topIds) : {};

            // series for top ids
            const seriesRes = await fetchWithAuth('/api/metrics/query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ metricKey, bucket, agg, entityKind, groupByEntityId: true, entityIds: topIds, start: t.start, end: t.end }),
            });
            const seriesJson = await seriesRes.json().catch(() => ({}));
            const seriesRows = Array.isArray(seriesJson.data) ? seriesJson.data : [];

            // total series (for other)
            const totalRes = await fetchWithAuth('/api/metrics/query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ metricKey, bucket, agg, entityKind, start: t.start, end: t.end }),
            });
            const totalJson = await totalRes.json().catch(() => ({}));
            const totalRows = Array.isArray(totalJson.data) ? totalJson.data : [];
            const buckets: number[] = totalRows
              .map((r: any) => (r.bucket ? new Date(r.bucket).getTime() : NaN))
              .filter((x: any) => Number.isFinite(x))
              .sort((a: any, b: any) => a - b);

            const totalByT = new Map<number, number>();
            const bucketIsoByT = new Map<number, string>();
            for (const r of totalRows) {
              const tt = r.bucket ? new Date(r.bucket).getTime() : NaN;
              if (!Number.isFinite(tt)) continue;
              totalByT.set(tt, Number(r.value ?? 0));
              if (typeof r.bucket === 'string') bucketIsoByT.set(tt, r.bucket);
            }

            const byEntity = new Map<string, Map<number, number>>();
            for (const r of seriesRows) {
              const id = String(r.entityId || '');
              const tt = r.bucket ? new Date(r.bucket).getTime() : NaN;
              if (!id || !Number.isFinite(tt)) continue;
              if (!byEntity.has(id)) byEntity.set(id, new Map());
              byEntity.get(id)!.set(tt, Number(r.value ?? 0));
            }

            const baseQuery = { metricKey, bucket, agg, entityKind, groupByEntityId: true, entityIds: topIds, start: t.start, end: t.end };
            const out: Array<{ id: string; label: string; color: string; points: Array<{ t: number; v: number; bucketIso?: string }>; drill?: { baseQuery: any; rowContextBase?: any; titlePrefix?: string } | null }> = [];
            topIds.forEach((id: string, idx: number) => {
              const m = byEntity.get(id) || new Map();
              const label = spec.labelSource?.source === 'projects' ? (fetchedNames[id] || projectNames[id] || id) : id;
              out.push({
                id: `ent_${w.key}_${id}`,
                label,
                color: palette(idx),
                points: buckets.map((tt: number) => ({ t: tt, v: Number(m.get(tt) ?? 0), bucketIso: bucketIsoByT.get(tt) })),
                drill: { baseQuery, rowContextBase: { entityId: id }, titlePrefix: String(w.title || 'Line') },
              });
            });

            if (includeOther) {
              // "Other" = all entities except topIds. We approximate by enumerating entityIds beyond topN when feasible.
              const otherIds = ranked.slice(topN).map((r: any) => r.entityId).filter(Boolean);
              const otherIdsLimited = otherIds.slice(0, 1000);
              const otherBaseQuery = otherIdsLimited.length
                ? { metricKey, bucket, agg, entityKind, groupByEntityId: true, entityIds: otherIdsLimited, start: t.start, end: t.end }
                : null;
              out.push({
                id: `other_${w.key}`,
                label: otherLabel,
                color: '#94a3b8',
                points: buckets.map((tt: number) => {
                  const total = Number(totalByT.get(tt) ?? 0);
                  const sumTop = topIds.reduce((acc: number, id: string) => acc + Number(byEntity.get(id)?.get(tt) ?? 0), 0);
                  return { t: tt, v: Math.max(0, total - sumTop), bucketIso: bucketIsoByT.get(tt) };
                }),
                drill: otherBaseQuery ? { baseQuery: otherBaseQuery, rowContextBase: {}, titlePrefix: String(w.title || 'Line') } : null,
              });
            }

            if (cumulative) {
              for (const s of out) {
                let acc = 0;
                s.points = s.points.map((p) => {
                  acc += p.v;
                  return { ...p, v: acc };
                });
              }
            }

            setLineSeries((p) => ({ ...p, [w.key]: { loading: false, series: out } }));
            return;
          }

          // Computed top-N entities from blended metrics (e.g. followers = sum of last across platforms)
          if (w.seriesSpec?.mode === 'top_n_entities_multi_metrics') {
            const spec = w.seriesSpec;
            const entityKind = String(spec.entityKind || 'project');
            const metricKeys = Array.isArray(spec.metricKeys) ? spec.metricKeys.map((x: any) => String(x || '').trim()).filter(Boolean) : [];
            const bucket = String(bucketOverride || spec.bucket || 'day');
            const agg = String(spec.agg || 'last');
            const topN = Number(spec.topN || 5);
            const includeOther = spec.includeOther !== false;
            const otherLabel = String(spec.otherLabel || 'Other');
            const cumulative = Boolean(spec.cumulative);

            // 1) totals by entityId across all metric keys for ranking
            const totalsByEntity = new Map<string, number>();
            for (const mk of metricKeys) {
              const totalsRes = await fetchWithAuth('/api/metrics/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metricKey: mk, bucket: 'none', agg, entityKind, groupByEntityId: true, start: t.start, end: t.end }),
              });
              const totalsJson = await totalsRes.json().catch(() => ({}));
              const totalsRows = Array.isArray(totalsJson.data) ? totalsJson.data : [];
              for (const r of totalsRows) {
                const id = String(r.entityId || '');
                if (!id) continue;
                totalsByEntity.set(id, (totalsByEntity.get(id) || 0) + Number(r.value ?? 0));
              }
            }

            const ranked = Array.from(totalsByEntity.entries())
              .map(([entityId, value]) => ({ entityId, value }))
              .sort((a, b) => b.value - a.value);
            const topIds = ranked.slice(0, topN).map((r) => r.entityId);

            const fetchedNames = spec.labelSource?.source === 'projects' ? await fetchProjectNames(topIds) : {};

            // 2) per-bucket series for top IDs: sum across metric keys
            const byEntity = new Map<string, Map<number, number>>();
            const bucketsSet = new Set<number>();
            const bucketIsoByT = new Map<number, string>();

            for (const mk of metricKeys) {
              const seriesRes = await fetchWithAuth('/api/metrics/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metricKey: mk, bucket, agg, entityKind, groupByEntityId: true, entityIds: topIds, start: t.start, end: t.end }),
              });
              const seriesJson = await seriesRes.json().catch(() => ({}));
              const seriesRows = Array.isArray(seriesJson.data) ? seriesJson.data : [];
              for (const r of seriesRows) {
                const id = String(r.entityId || '');
                const tt = r.bucket ? new Date(r.bucket).getTime() : NaN;
                if (!id || !Number.isFinite(tt)) continue;
                bucketsSet.add(tt);
                if (typeof r.bucket === 'string' && !bucketIsoByT.has(tt)) bucketIsoByT.set(tt, r.bucket);
                if (!byEntity.has(id)) byEntity.set(id, new Map());
                byEntity.get(id)!.set(tt, (byEntity.get(id)!.get(tt) || 0) + Number(r.value ?? 0));
              }
            }

            const buckets = Array.from(bucketsSet.values()).sort((a, b) => a - b);

            // 3) optional "Other" = all entities minus top, computed via groupByEntityId across all entities
            let otherSeries: Array<{ t: number; v: number }> | null = null;
            if (includeOther) {
              // compute blended total per bucket across all entities
              const totalByBucket = new Map<number, number>();
              for (const mk of metricKeys) {
                const res = await fetchWithAuth('/api/metrics/query', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ metricKey: mk, bucket, agg, entityKind, groupByEntityId: true, start: t.start, end: t.end }),
                });
                const json = await res.json().catch(() => ({}));
                const rows = Array.isArray(json.data) ? json.data : [];
                for (const r of rows) {
                  const tt = r.bucket ? new Date(r.bucket).getTime() : NaN;
                  if (!Number.isFinite(tt)) continue;
                  totalByBucket.set(tt, (totalByBucket.get(tt) || 0) + Number(r.value ?? 0));
                  if (typeof r.bucket === 'string' && !bucketIsoByT.has(tt)) bucketIsoByT.set(tt, r.bucket);
                }
              }
              otherSeries = buckets.map((tt) => {
                const total = Number(totalByBucket.get(tt) ?? 0);
                const sumTop = topIds.reduce((acc, id) => acc + Number(byEntity.get(id)?.get(tt) ?? 0), 0);
                return { t: tt, v: Math.max(0, total - sumTop) };
              });
            }

            const otherIds = ranked.slice(topN).map((r) => r.entityId).filter(Boolean);
            const otherIdsLimited = otherIds.slice(0, 1000);

            const out: Array<{
              id: string;
              label: string;
              color: string;
              points: Array<{ t: number; v: number; bucketIso?: string }>;
              drillMenu?: { titlePrefix?: string; options: Array<{ label: string; baseQuery: any; rowContextBase?: any }> } | null;
              drill?: { baseQuery: any; rowContextBase?: any; titlePrefix?: string } | null;
            }> = [];
            topIds.forEach((id: string, idx: number) => {
              const m = byEntity.get(id) || new Map();
              const label = spec.labelSource?.source === 'projects' ? (fetchedNames[id] || projectNames[id] || id) : id;
              out.push({
                id: `blend_${w.key}_${id}`,
                label,
                color: palette(idx),
                points: buckets.map((tt) => ({ t: tt, v: Number(m.get(tt) ?? 0), bucketIso: bucketIsoByT.get(tt) })),
                drillMenu: {
                  titlePrefix: String(w.title || 'Line'),
                  options: metricKeys.map((mk: string) => ({
                    label: mk,
                    baseQuery: { metricKey: mk, bucket, agg, entityKind, groupByEntityId: true, entityIds: topIds, start: t.start, end: t.end },
                    rowContextBase: { entityId: id },
                  })),
                },
              });
            });
            if (includeOther && otherSeries) {
              out.push({
                id: `blend_other_${w.key}`,
                label: otherLabel,
                color: '#94a3b8',
                points: otherSeries.map((p) => ({ ...p, bucketIso: bucketIsoByT.get(p.t) })),
                drillMenu: {
                  titlePrefix: String(w.title || 'Line'),
                  options: metricKeys.map((mk: string) => ({
                    label: mk,
                    baseQuery: otherIdsLimited.length
                      ? { metricKey: mk, bucket, agg, entityKind, groupByEntityId: true, entityIds: otherIdsLimited, start: t.start, end: t.end }
                      : { metricKey: mk, bucket, agg, entityKind, groupByEntityId: true, start: t.start, end: t.end },
                    rowContextBase: {},
                  })),
                },
              });
            }

            if (cumulative) {
              for (const s of out) {
                let acc = 0;
                s.points = s.points.map((p) => {
                  acc += p.v;
                  return { ...p, v: acc };
                });
              }
            }

            setLineSeries((p) => ({ ...p, [w.key]: { loading: false, series: out } }));
            return;
          }

          throw new Error('Unsupported line widget config');
        } catch {
          setLineSeries((p) => ({ ...p, [w.key]: { loading: false, series: [] } }));
        }
      })
    );

    // Timeline overlays (best-effort)
    const needsTimeline = lines.some((w: any) => Boolean(w?.presentation?.timelineOverlay));
    if (needsTimeline) {
      try {
        setTimelineLoading(true);
        const u = `/api/projects/activity/all?from=${encodeURIComponent(range.start)}&to=${encodeURIComponent(range.end)}`;
        const res = await fetch(u);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`);
        const items = Array.isArray(json?.data) ? json.data : [];
        setTimelineEvents(items as any);
      } catch {
        setTimelineEvents([]);
      } finally {
        setTimelineLoading(false);
      }
    } else {
      setTimelineEvents([]);
    }
  }, [definition?.key, effectiveTime, range.start, range.end, resolveProjectNames, projectNames, lineBucketByWidgetKey]);

  React.useEffect(() => {
    if (!definition) return;
    queryMetrics();
  }, [definition?.key, preset, customStart, customEnd]);

  const openShares = async () => {
    if (!definition) return;
    setShareOpen(true);
    setSharesError(null);
    setSharesLoading(true);
    try {
      const res = await fetchWithAuth(`/api/dashboard-definitions/${encodeURIComponent(definition.key)}/shares`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`);
      setShares(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setSharesError(e instanceof Error ? e.message : String(e));
    } finally {
      setSharesLoading(false);
    }
  };

  const widgetList = Array.isArray(definition?.definition?.widgets) ? definition!.definition.widgets : [];

  return (
    <Page title="Dashboards">
      <style>{`
        .wrap {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .topbar { display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
        .controls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        /* UI kit Input/Select include a default margin-bottom for form layouts; remove it in the topbar controls row */
        .controls > * { margin-bottom: 0 !important; }
        .subtitle { font-size: 12px; opacity: 0.75; margin-top: -6px; }
        .grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 12px; }
        .span-12 { grid-column: span 12; }
        .span-6 { grid-column: span 6; }
        .span-4 { grid-column: span 4; }
        .span-3 { grid-column: span 3; }
        @media (max-width: 1100px) { .span-6 { grid-column: span 12; } .span-3 { grid-column: span 6; } }
        @media (max-width: 700px) { .span-3 { grid-column: span 12; } .span-4 { grid-column: span 12; } }
        .kpi { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
        .kpi-title { font-size: 12px; opacity: 0.75; }
        .kpi-val { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
        .kpi-delta { font-size: 12px; opacity: 0.8; display: flex; gap: 6px; align-items: center; }
        .kpi-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .kpi-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(148,163,184,0.25);
          background: rgba(148,163,184,0.12);
          flex-shrink: 0;
        }
        .kpi-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          line-height: 16px;
          min-height: 16px;
          color: var(--hit-muted-foreground);
          text-decoration: none;
          margin-top: 4px;
        }
        .kpi-action:hover { color: var(--hit-foreground); text-decoration: underline; }
        .kpi-action.kpi-action--placeholder {
          visibility: hidden;
          pointer-events: none;
        }
        .kpi-catalog-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 1100px) { .kpi-catalog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 700px) { .kpi-catalog-grid { grid-template-columns: repeat(1, minmax(0, 1fr)); } }
        .kpi-mini { padding: 12px; display: flex; flex-direction: column; gap: 8px; border-radius: 12px; }
        .kpi-mini-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .kpi-mini-title { font-size: 12px; opacity: 0.82; line-height: 1.2; }
        .kpi-mini-val { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
        .kpi-mini-badges { display: flex; gap: 6px; flex-wrap: wrap; }
        .donut-wrap { display: grid; grid-template-columns: 260px 1fr; gap: 14px; align-items: center; }
        @media (max-width: 900px) { .donut-wrap { grid-template-columns: 1fr; } }
        .donut { width: 100%; height: 240px; }
        .donut-legend { display: flex; flex-direction: column; gap: 10px; }
        .legend-row { display: grid; grid-template-columns: 10px 1fr auto; gap: 10px; align-items: center; }
        .legend-dot { width: 10px; height: 10px; border-radius: 999px; }
        .legend-label { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .legend-value { font-size: 13px; opacity: 0.85; }
        .chart-svg { width: 100%; height: 240px; }
        .legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .legend-pill { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 999px; border: 1px solid rgba(148,163,184,0.14); background: rgba(148,163,184,0.08); font-size: 12px; }
      `}</style>

      <div className="wrap">
        {!loadingList && list.length === 0 ? (
          <div className="span-12">
            <Card
              title="No dashboards yet"
              description={
                pack
                  ? `No dashboards exist for pack "${pack}" yet.`
                  : `No dashboards exist yet for default packs (${defaultPacks.join(', ')}).`
              }
            >
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, color: colors.text.muted }}>
                  Create dashboard is coming soon. In the meantime, press <strong>Ctrl+K</strong> (or <strong>⌘K</strong>) to open the AI assistant and tell it what you want your dashboard to look like.
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Button
                    onClick={() => {
                      // There is no dashboard builder UI yet; guide users into the AI overlay.
                      try {
                        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    Ask AI to create a dashboard
                  </Button>
                  <Button variant="secondary" onClick={loadList}>
                    Refresh
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        <div className="topbar">
          <div style={{ minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <strong>{definition?.name || 'Dashboard'}</strong>
              {pack ? (
                <Badge variant="info">pack: {pack}</Badge>
              ) : (
                <Badge variant="info">packs: {defaultPacks.join(', ')}</Badge>
              )}
              {/* Ownership/sharing badge */}
              {definition?.isOwner ? (
                <Badge variant="success">yours</Badge>
              ) : definition?.isShared ? (
                <Badge variant="warning">shared</Badge>
              ) : definition?.visibility === 'public' ? (
                <Badge variant="default">public</Badge>
              ) : null}
            </div>
          </div>

          <div className="controls">
            {list.length > 0 ? (
              <Dropdown
                align="right"
                trigger={<Button variant="secondary">Switch</Button>}
                items={list.map((d) => {
                  const suffix = d.isOwner ? ' (yours)' : d.isShared ? ' (shared)' : d.visibility === 'public' ? ' (public)' : '';
                  const current = d.key === selectedKey ? ' ✓' : '';
                  const packPrefix = isDefaultPackMode ? `[${String(d.pack || 'pack').toUpperCase()}] ` : '';
                  return {
                    label: `${packPrefix}${d.name}${suffix}${current}`,
                    disabled: d.key === selectedKey,
                    onClick: () => setSelectedKey(d.key),
                  };
                })}
              />
            ) : null}


            <Select
              value={preset}
              onChange={(v: any) => setPreset(selectValue(v) as TimePreset)}
              options={[
                { value: 'last_7_days', label: 'Last 7 days' },
                { value: 'last_30_days', label: 'Last 30 days' },
                { value: 'last_90_days', label: 'Last 90 days' },
                { value: 'month_to_date', label: 'Month to date' },
                { value: 'year_to_date', label: 'Year to date' },
                { value: 'custom', label: 'Custom' },
              ]}
            />

            {preset === 'custom' ? (
              <>
                <Input type="date" value={customStart} onChange={(e: any) => setCustomStart(e.target.value)} />
                <Input type="date" value={customEnd} onChange={(e: any) => setCustomEnd(e.target.value)} />
              </>
            ) : null}

            <Button onClick={() => queryMetrics()} disabled={loadingDash}>
              Refresh
            </Button>
            {/* Only show Share button if user can edit (owner or full share permission) */}
            {definition && definition.canEdit ? (
              <Button variant="secondary" onClick={openShares}>
                Share
              </Button>
            ) : null}
          </div>
        </div>
        <div className="subtitle">{definition?.description || '—'}</div>

        {error ? <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div> : null}

        <div className="grid">
          {loadingDash && !definition ? (
            <div className="span-12">
              <Card><div style={{ padding: 18 }}><Spinner /></div></Card>
            </div>
          ) : null}

          {loadingDash && definition ? (
            <div className="span-12" style={{ opacity: 0.9 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 2px' }}>
                <Spinner />
                <span style={{ fontSize: 13, color: colors.text.muted }}>Loading dashboard…</span>
              </div>
            </div>
          ) : null}

          {definition ? (
            widgetList.map((w: any) => {
              const grid = w.grid || {};
              const span = typeof grid.w === 'number' ? grid.w : (w.kind === 'kpi' ? 3 : (w.kind === 'pie' || w.kind === 'api_pie') ? 6 : 12);
              const spanClass = span === 12 ? 'span-12' : span === 6 ? 'span-6' : span === 4 ? 'span-4' : 'span-3';

              const metricKey = String(w?.query?.metricKey || w?.series?.[0]?.query?.metricKey || w?.seriesSpec?.metricKey || '');
              const cat = metricKey ? catalogByKey[metricKey] : undefined;
              const fmt = (w?.presentation?.format === 'usd' || cat?.unit === 'usd') ? 'usd' : 'number';

              if (w.kind === 'kpi_catalog') {
                const st = kpiCatalogTotals[w.key];
                const pres = w?.presentation || {};
                const rawEntityKind = typeof pres?.entityKind === 'string' ? pres.entityKind.trim() : '';
                const isAutoEntityKind = rawEntityKind === '' || rawEntityKind.toLowerCase() === 'auto';
                const entityKind = !isAutoEntityKind ? rawEntityKind : '';
                const onlyWithPoints = pres?.onlyWithPoints === true;
                const ownerKind = typeof pres?.owner?.kind === 'string' ? pres.owner.kind.trim().toLowerCase() : '';
                const ownerId = typeof pres?.owner?.id === 'string' ? pres.owner.id.trim() : '';
                const hasOwnerFilter = Boolean(ownerKind && ownerId);
                // Support filtering by entity kinds (metrics that support these entity kinds)
                const filterEntityKinds: string[] = Array.isArray(pres?.filterEntityKinds)
                  ? (pres.filterEntityKinds as any[]).map((x) => String(x || '').trim().toLowerCase()).filter(Boolean)
                  : [];
                const hasEntityKindsFilter = filterEntityKinds.length > 0;
                // Support filtering by category
                const filterCategories: string[] = Array.isArray(pres?.filterCategories)
                  ? (pres.filterCategories as any[]).map((x) => String(x || '').trim().toLowerCase()).filter(Boolean)
                  : [];
                const hasCategories = filterCategories.length > 0;

                const items = Object.values(catalogByKey || {});
                const filtered = items
                  .filter((it) => {
                    // Filter by owner (e.g., only feature pack metrics)
                    if (hasOwnerFilter) {
                      const ik = typeof (it as any)?.owner?.kind === 'string' ? String((it as any).owner.kind).trim().toLowerCase() : '';
                      const iid = typeof (it as any)?.owner?.id === 'string' ? String((it as any).owner.id).trim() : '';
                      if (ik !== ownerKind || iid !== ownerId) return false;
                    }
                    // Filter by entity kinds (metrics that support any of these entity kinds)
                    if (hasEntityKindsFilter) {
                      const metricEntityKinds = Array.isArray(it.entity_kinds)
                        ? (it.entity_kinds as any[]).map((x) => String(x || '').trim().toLowerCase())
                        : [];
                      const hasMatch = filterEntityKinds.some((ek) => metricEntityKinds.includes(ek));
                      if (!hasMatch) return false;
                    }
                    // Filter by category
                    if (hasCategories) {
                      const cat = typeof it.category === 'string' ? it.category.trim().toLowerCase() : '';
                      if (!filterCategories.includes(cat)) return false;
                    }
                    // If entityKind is explicitly set (not auto), filter metrics that support it
                    if (!isAutoEntityKind) {
                      const kinds = Array.isArray(it.entity_kinds) ? it.entity_kinds : [];
                      // If the metric declares supported entity kinds, respect it.
                      // If it doesn't, we cannot safely assume it works for the chosen entityKind.
                      if (kinds.length === 0) return false;
                      if (!kinds.includes(entityKind)) return false;
                    }
                    if (onlyWithPoints && Number(it.pointsCount || 0) <= 0) return false;
                    return true;
                  })
                  .sort((a, b) => String(a.label || a.key).localeCompare(String(b.label || b.key)));

                return (
                  <div key={w.key} className="span-12">
                    <Card title={w.title || 'KPIs'}>
                      <div style={{ padding: 14 }}>
                        {st?.loading ? (
                          <Spinner />
                        ) : (
                          <div className="kpi-catalog-grid">
                            {filtered.map((it) => {
                              const mk = it.key;
                              const val = Number(st?.totalsByMetricKey?.[mk] ?? 0);
                              const format = (it.unit === 'usd') ? 'usd' : 'number';
                              const iconName = String(it.icon || fallbackIconForMetric(it.category) || '');
                              const Icon = resolvePlatformIcon(iconName);
                              const iconColor = String(it.icon_color || colors.accent.default);
                              const t = effectiveTime(w);
                              const ek = isAutoEntityKind ? pickEntityKindForMetric(it) : entityKind;
                              const pf: any = { metricKey: mk };
                              if (ek) pf.entityKind = ek;
                              if (t) { pf.start = t.start; pf.end = t.end; }
                              return (
                                <div
                                  key={mk}
                                  className="kpi-mini"
                                  style={{
                                    border: `1px solid ${colors.border.subtle}`,
                                    background: colors.bg.surface,
                                    cursor: 'pointer',
                                  }}
                                  title="Click to drill down"
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    runDrillDescriptor({
                                      kind: 'pointFilter',
                                      pointFilter: pf,
                                      title: `${String(w.title || 'KPIs')} • ${String(it.label || mk)}`,
                                      format: format as any,
                                    });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key !== 'Enter' && e.key !== ' ') return;
                                    e.preventDefault();
                                    runDrillDescriptor({
                                      kind: 'pointFilter',
                                      pointFilter: pf,
                                      title: `${String(w.title || 'KPIs')} • ${String(it.label || mk)}`,
                                      format: format as any,
                                    });
                                  }}
                                >
                                  <div className="kpi-mini-top">
                                    <div style={{ minWidth: 0 }}>
                                      <div className="kpi-mini-title" title={mk}>{it.label || mk}</div>
                                      <div className="kpi-mini-val">{formatNumber(val, format as any)}</div>
                                    </div>
                                    {Icon ? (
                                      <div
                                        className="kpi-icon"
                                        style={{
                                          width: 34,
                                          height: 34,
                                          borderRadius: radius.lg,
                                          border: `1px solid ${colors.border.subtle}`,
                                          background: colors.bg.muted,
                                          color: iconColor,
                                        }}
                                      >
                                        <Icon size={18} style={{ color: iconColor }} />
                                      </div>
                                    ) : null}
                                  </div>
                                  <div className="kpi-mini-badges">
                                    {it.category ? <Badge>{it.category}</Badge> : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                );
              }

              if (w.kind === 'kpi') {
                const st = kpiValues[w.key];
                const val = Number(st?.value ?? 0);
                const prev = typeof st?.prev === 'number' ? st.prev : null;
                let pct = 0;
                if (prev !== null && prev > 0) pct = ((val - prev) / prev) * 100;

                const iconName = String(w?.presentation?.icon || cat?.icon || '');
                const Icon = resolvePlatformIcon(iconName);
                const iconColor = String(w?.presentation?.iconColor || cat?.icon_color || colors.accent.default);
                const action = w?.presentation?.action;
                const t = effectiveTime(w);
                const valueSource = w?.presentation?.valueSource;

                const buildPointFilter = (): PointFilter | null => {
                  // 1) valueSource-driven metric KPIs
                  if (valueSource?.kind === 'metrics_sum_last_per_entity' && typeof valueSource.metricKey === 'string') {
                    const pf: PointFilter = { metricKey: String(valueSource.metricKey).trim() };
                    const ek = typeof valueSource.entityKind === 'string' ? valueSource.entityKind.trim() : (typeof w?.query?.entityKind === 'string' ? w.query.entityKind.trim() : '');
                    if (ek) pf.entityKind = ek;
                    if (t) { pf.start = t.start; pf.end = t.end; }
                    return pf;
                  }
                  if (valueSource?.kind === 'metrics_sum_agg_per_entity' && typeof valueSource.metricKey === 'string') {
                    const pf: PointFilter = { metricKey: String(valueSource.metricKey).trim() };
                    const ek = typeof valueSource.entityKind === 'string' ? valueSource.entityKind.trim() : (typeof w?.query?.entityKind === 'string' ? w.query.entityKind.trim() : '');
                    if (ek) pf.entityKind = ek;
                    if (t) { pf.start = t.start; pf.end = t.end; }
                    return pf;
                  }
                  // 2) direct metric query KPIs
                  const q = w?.query;
                  const mk = typeof q?.metricKey === 'string' ? q.metricKey.trim() : '';
                  if (!mk) return null;
                  const pf: PointFilter = { metricKey: mk };
                  if (typeof q.entityKind === 'string' && q.entityKind.trim()) pf.entityKind = q.entityKind.trim();
                  if (typeof q.entityId === 'string' && q.entityId.trim()) pf.entityId = q.entityId.trim();
                  if (Array.isArray(q.entityIds)) {
                    const ids = (q.entityIds as any[]).map((x) => String(x || '').trim()).filter(Boolean);
                    if (ids.length) pf.entityIds = ids;
                  }
                  if (typeof q.dataSourceId === 'string' && q.dataSourceId.trim()) pf.dataSourceId = q.dataSourceId.trim();
                  if (typeof q.sourceGranularity === 'string' && q.sourceGranularity.trim()) pf.sourceGranularity = q.sourceGranularity.trim();
                  if (q.dimensions && typeof q.dimensions === 'object') pf.dimensions = q.dimensions as any;
                  if (t) { pf.start = t.start; pf.end = t.end; }
                  return pf;
                };

                const drillPointFilter = buildPointFilter();
                const drillMenu =
                  valueSource?.kind === 'metrics_sum_last_per_entity_multi' && Array.isArray(valueSource.metricKeys)
                    ? (valueSource.metricKeys as any[]).map((x) => String(x || '').trim()).filter(Boolean)
                    : [];
                const canDrill = Boolean(drillPointFilter) || drillMenu.length > 0;

                return (
                  <div key={w.key} className={spanClass}>
                    <Card>
                      <div
                        className="kpi"
                        style={{ cursor: canDrill ? 'pointer' : undefined }}
                        title={canDrill ? 'Click to drill down' : undefined}
                        role={canDrill ? 'button' : undefined}
                        tabIndex={canDrill ? 0 : undefined}
                        onClick={() => {
                          if (drillMenu.length > 0) {
                            openDrillMenu({
                              title: `${String(w.title || cat?.label || metricKey || 'KPI')}`,
                              format: fmt as any,
                              options: drillMenu.map((mk) => {
                                const pf: PointFilter = { metricKey: mk };
                                const ek = typeof valueSource.entityKind === 'string' ? valueSource.entityKind.trim() : (typeof w?.query?.entityKind === 'string' ? w.query.entityKind.trim() : '');
                                if (ek) pf.entityKind = ek;
                                if (t) { pf.start = t.start; pf.end = t.end; }
                                return {
                                  label: mk,
                                  d: { kind: 'pointFilter', pointFilter: pf, title: `${String(w.title || 'KPI')} • ${mk}`, format: fmt as any },
                                };
                              }),
                            });
                            return;
                          }
                          if (drillPointFilter) {
                            runDrillDescriptor({
                              kind: 'pointFilter',
                              pointFilter: drillPointFilter,
                              title: `${String(w.title || cat?.label || metricKey || 'KPI')}`,
                              format: fmt as any,
                            });
                            return;
                          }
                        if (action?.href) {
                          const href = String(action.href);
                          navigate(href);
                        }
                        }}
                        onKeyDown={(e) => {
                          if (!canDrill) return;
                          if (e.key !== 'Enter' && e.key !== ' ') return;
                          e.preventDefault();
                          // Mirror click behavior
                          if (drillMenu.length > 0) {
                            openDrillMenu({
                              title: `${String(w.title || cat?.label || metricKey || 'KPI')}`,
                              format: fmt as any,
                              options: drillMenu.map((mk) => {
                                const pf: PointFilter = { metricKey: mk };
                                const ek = typeof valueSource.entityKind === 'string' ? valueSource.entityKind.trim() : (typeof w?.query?.entityKind === 'string' ? w.query.entityKind.trim() : '');
                                if (ek) pf.entityKind = ek;
                                if (t) { pf.start = t.start; pf.end = t.end; }
                                return {
                                  label: mk,
                                  d: { kind: 'pointFilter', pointFilter: pf, title: `${String(w.title || 'KPI')} • ${mk}`, format: fmt as any },
                                };
                              }),
                            });
                            return;
                          }
                          if (drillPointFilter) {
                            runDrillDescriptor({
                              kind: 'pointFilter',
                              pointFilter: drillPointFilter,
                              title: `${String(w.title || cat?.label || metricKey || 'KPI')}`,
                              format: fmt as any,
                            });
                          }
                        }}
                      >
                        <div className="kpi-head">
                          <div>
                            <div className="kpi-title">{w.title || cat?.label || metricKey}</div>
                            <div className="kpi-val">{st?.loading ? '—' : formatNumber(val, fmt as any)}</div>
                          </div>
                          {Icon ? (
                            <div
                              className="kpi-icon"
                              style={{
                                borderRadius: radius.lg,
                                border: `1px solid ${colors.border.subtle}`,
                                background: colors.bg.muted,
                                color: iconColor,
                              }}
                            >
                              <Icon size={22} style={{ color: iconColor }} />
                            </div>
                          ) : null}
                        </div>
                        {prev !== null ? (
                          <div className="kpi-delta">
                            <span style={{ color: pct >= 0 ? '#22c55e' : '#ef4444' }}>{formatNumber(pct, 'percent')}</span>
                            <span style={{ opacity: 0.7 }}>vs previous period</span>
                          </div>
                        ) : null}
                        {action?.href && action?.label ? (
                          <a
                            className="kpi-action"
                            href={String(action.href)}
                            onClick={(e: any) => {
                              // Prevent KPI card drilldown click handler from also firing.
                              e.stopPropagation?.();
                            }}
                          >
                            {String(action.label)}
                          </a>
                        ) : (
                          <span className="kpi-action kpi-action--placeholder" aria-hidden="true">
                            &nbsp;
                          </span>
                        )}
                      </div>
                    </Card>
                  </div>
                );
              }

              if (w.kind === 'pie') {
                const st = pieSlices[w.key];
                const slices = Array.isArray(st?.slices) ? st?.slices : [];
                const otherLabel = String(st?.otherLabel || w?.presentation?.otherLabel || 'Other');

                const onSliceClick = async (slice: any) => {
                  const drill = slice?.drill;
                  if (!drill || !drill.pointFilter) return;
                  await runDrilldown({ pointFilter: drill.pointFilter, title: drill.title, format: drill.format, page: 1 });
                };

                return (
                  <div key={w.key} className={spanClass}>
                    <Card title={w.title || 'Pie'}>
                      <div style={{ padding: 14 }}>
                        {!st || st?.loading ? <Spinner /> : <Donut slices={slices as any} format={fmt as any} onSliceClick={onSliceClick} />}
                        {st && !st?.loading && slices.some((s: any) => s?.raw === '__other__') ? (
                          <div style={{ marginTop: 10, fontSize: 12, color: colors.text.muted }}>
                            Tip: "{otherLabel}" is an aggregate bucket; drilldown is available on named slices only (for now).
                          </div>
                        ) : null}
                      </div>
                    </Card>
                  </div>
                );
              }

              if (w.kind === 'api_pie') {
                const st = apiPieSlices[w.key];
                const slices = Array.isArray(st?.slices) ? st?.slices : [];
                const otherLabel = String(st?.otherLabel || w?.presentation?.otherLabel || 'Other');
                const format = (w?.presentation?.format === 'usd') ? 'usd' : 'number';
                const error = typeof st?.error === 'string' ? st.error : '';

                const onSliceClick = async (slice: any) => {
                  const href = typeof slice?.href === 'string' ? slice.href : '';
                  if (!href) return;
                  navigate(href);
                };

                return (
                  <div key={w.key} className={spanClass}>
                    <Card title={w.title || 'Pie'}>
                      <div style={{ padding: 14 }}>
                        {!st || st?.loading ? <Spinner /> : (
                          error ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
                              <div style={{ fontSize: 13, color: colors.text.muted, textAlign: 'center', maxWidth: 520 }}>
                                <div style={{ fontWeight: 600, color: colors.text.primary, marginBottom: 6 }}>Could not load chart</div>
                                <div>{error}</div>
                                <div style={{ marginTop: 8, fontSize: 12 }}>
                                  Tip: open <code>/api/crm/reports/pipeline-health</code> in a new tab to see the raw response.
                                </div>
                              </div>
                            </div>
                          ) : (
                            <Donut slices={slices as any} format={format as any} onSliceClick={onSliceClick} />
                          )
                        )}
                        {st && !st?.loading && slices.some((s: any) => s?.raw === '__other__') ? (
                          <div style={{ marginTop: 10, fontSize: 12, color: colors.text.muted }}>
                            Tip: "{otherLabel}" is an aggregate bucket; click named slices to open filtered lists.
                          </div>
                        ) : null}
                      </div>
                    </Card>
                  </div>
                );
              }

              if (w.kind === 'api_table') {
                const st = apiTables[w.key];
                const rows = Array.isArray(st?.rows) ? st?.rows : [];
                const pres = w?.presentation || {};
                const cols = Array.isArray(pres.columns) ? pres.columns : [];
                const rowHrefTemplate = typeof pres.rowHrefTemplate === 'string' ? pres.rowHrefTemplate : '';

                const renderCell = (row: any, col: any) => {
                  const field = String(col?.field || '').trim();
                  const label = String(col?.label || field || '');
                  const fmt = String(col?.format || '').toLowerCase();
                  const raw = field ? getByPath(row, field) : undefined;
                  if (fmt === 'usd') return formatNumber(Number(raw ?? 0), 'usd');
                  if (fmt === 'number') return formatNumber(Number(raw ?? 0), 'number');
                  if (fmt === 'datetime' || fmt === 'date') {
                    if (!raw) return '—';
                    const d = new Date(String(raw));
                    if (!Number.isFinite(d.getTime())) return String(raw);
                    return fmt === 'date' ? d.toLocaleDateString() : d.toLocaleString();
                  }
                  return raw == null ? '—' : String(raw);
                };

                return (
                  <div key={w.key} className={spanClass}>
                    <Card title={w.title || 'Table'}>
                      <div style={{ padding: 14 }}>
                        {st?.loading ? <Spinner /> : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ fontSize: 12, color: colors.text.muted }}>
                                {typeof st?.total === 'number' ? `${st.total.toLocaleString()} total` : `${rows.length.toLocaleString()} rows`}
                              </div>
                              {rowHrefTemplate ? <Badge variant="info">click row to open</Badge> : null}
                            </div>
                            <div style={{ overflowX: 'auto', border: `1px solid ${colors.border.subtle}`, borderRadius: 10 }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                  <tr style={{ textAlign: 'left', background: colors.bg.muted }}>
                                    {cols.map((c: any, idx: number) => (
                                      <th key={idx} style={{ padding: '8px 10px' }}>{String(c?.label || c?.field || '')}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((r: any, idx: number) => {
                                    const href = rowHrefTemplate ? applyTemplate(rowHrefTemplate, r) : '';
                                    return (
                                      <tr
                                        key={String(r?.id || idx)}
                                        style={{ borderTop: `1px solid ${colors.border.subtle}`, cursor: href ? 'pointer' : 'default' }}
                                        onClick={() => {
                                          if (!href) return;
                                          navigate(href);
                                        }}
                                      >
                                        {cols.map((c: any, j: number) => (
                                          <td key={j} style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                                            {j === 0 && href ? <a href={href} style={{ color: colors.accent.default, textDecoration: 'none' }}>{renderCell(r, c)}</a> : renderCell(r, c)}
                                          </td>
                                        ))}
                                      </tr>
                                    );
                                  })}
                                  {rows.length === 0 ? (
                                    <tr>
                                      <td colSpan={Math.max(1, cols.length)} style={{ padding: '10px', color: colors.text.muted }}>
                                        No rows
                                      </td>
                                    </tr>
                                  ) : null}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                  </div>
                );
              }

              if (w.kind === 'line') {
                const st = lineSeries[w.key];
                const series = st?.series || [];
                const currentBucket: Bucket = (lineBucketByWidgetKey[w.key] || w?.seriesSpec?.bucket || 'day') as Bucket;
                const overlayEnabled = Boolean(w?.presentation?.timelineOverlay);
                const bucketControl = (
                  <Select
                    value={currentBucket}
                    onChange={(v: any) => setLineBucketByWidgetKey((p) => ({ ...p, [w.key]: selectValue(v) as Bucket }))}
                    options={[
                      { value: 'day', label: 'Daily' },
                      { value: 'week', label: 'Weekly' },
                      { value: 'month', label: 'Monthly' },
                    ]}
                  />
                );
                return (
                  <div key={w.key} className={spanClass}>
                    {st?.loading ? (
                      <Card title={w.title || 'Line'}>
                        <div style={{ padding: 18 }}><Spinner /></div>
                      </Card>
                    ) : (
                      <MultiLineChart
                        title={w.title || 'Line'}
                        format={fmt as any}
                        series={series}
                        bucket={currentBucket}
                        bucketControl={bucketControl}
                        timelineOverlay={overlayEnabled}
                        timelineEvents={overlayEnabled ? timelineEvents : []}
                        onDrill={(d) => runDrillDescriptor(d)}
                        onDrillMenu={(args) => openDrillMenu(args)}
                      />
                    )}
                  </div>
                );
              }

              return (
                <div key={w.key} className={spanClass}>
                  <Card title={w.title || w.kind}>
                    <div style={{ padding: 14, opacity: 0.75, fontSize: 12 }}>
                      Unsupported widget kind: {String(w.kind)}
                    </div>
                  </Card>
                </div>
              );
            })
          ) : null}
        </div>

        <Modal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          title="Share dashboard"
          description={definition ? `ACL for ${definition.name}` : ''}
        >
          <div style={{ padding: 12 }}>
            {sharesError ? <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{sharesError}</div> : null}
            {sharesLoading ? <Spinner /> : (
              <AclPicker
                config={{
                  mode: 'granular',
                  principals: { users: true, groups: true, roles: true },
                  granularPermissions: [{ key: 'READ', label: 'Read' }],
                }}
                disabled={!definition}
                loading={sharesLoading}
                error={sharesError}
                entries={shares.map((s) => ({
                  id: s.id,
                  principalType: s.principalType,
                  principalId: s.principalId,
                  permissions: ['READ'],
                }))}
                onAdd={async (entry: any) => {
                  if (!definition) return;
                  const res = await fetchWithAuth(`/api/dashboard-definitions/${encodeURIComponent(definition.key)}/shares`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ principalType: entry.principalType, principalId: entry.principalId }),
                  });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`);
                  setShares((prev) => [...prev, json.data]);
                }}
                onRemove={async (entry: any) => {
                  if (!definition) return;
                  const qs = `principalType=${encodeURIComponent(entry.principalType)}&principalId=${encodeURIComponent(entry.principalId)}`;
                  const res = await fetchWithAuth(`/api/dashboard-definitions/${encodeURIComponent(definition.key)}/shares?${qs}`, { method: 'DELETE' });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`);
                  setShares((prev) => prev.filter((s) => !(s.principalType === entry.principalType && s.principalId === entry.principalId)));
                }}
                onUpdate={async () => { /* no-op (READ-only) */ }}
              />
            )}
          </div>
        </Modal>

        <Modal
          open={drillMenuOpen}
          onClose={() => setDrillMenuOpen(false)}
          title={drillMenuTitle}
          description="This value is composed of multiple metrics. Choose what to drill into."
        >
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {drillMenuOptions.length === 0 ? (
              <div style={{ fontSize: 13, opacity: 0.75 }}>No drilldown options available.</div>
            ) : (
              drillMenuOptions.map((opt, idx) => (
                <Button
                  key={`${opt.label}_${idx}`}
                  variant="secondary"
                  onClick={async () => {
                    setDrillMenuOpen(false);
                    await runDrillDescriptor(opt.d);
                  }}
                >
                  Drill into: {opt.label}
                </Button>
              ))
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setDrillMenuOpen(false)}>
                Close
              </Button>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Tip: if you want “one-click drilldown” for blended metrics, we can model the blend as a first-class derived metric later.
            </div>
          </div>
        </Modal>

        <Modal
          open={drillOpen}
          onClose={() => setDrillOpen(false)}
          title={drillTitle}
          description={`Underlying points (report tz: ${drillReportTz})`}
        >
          <div style={{ padding: 12 }}>
            {drillError ? <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{drillError}</div> : null}
            {drillLoading ? <Spinner /> : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: colors.text.muted }}>
                    {drillPagination.total.toLocaleString()} points
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      variant="secondary"
                      disabled={!drillLastFilter}
                      onClick={() => {
                        if (!drillLastFilter) return;
                        const prefill = encodeReportPrefill({ title: drillTitle, format: drillFormat, pointFilter: drillLastFilter });
                        const href = `/reports/builder?prefill=${prefill}`;
                        navigate(href);
                      }}
                    >
                      Open in Report Writer
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={drillLoading || drillPagination.page <= 1 || !drillLastFilter}
                      onClick={() => drillLastFilter && runDrilldown({ pointFilter: drillLastFilter, title: drillTitle, format: drillFormat, page: drillPagination.page - 1 })}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={drillLoading || !drillLastFilter || (drillPagination.page * drillPagination.pageSize) >= drillPagination.total}
                      onClick={() => drillLastFilter && runDrilldown({ pointFilter: drillLastFilter, title: drillTitle, format: drillFormat, page: drillPagination.page + 1 })}
                    >
                      Next
                    </Button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', border: `1px solid ${colors.border.subtle}`, borderRadius: 10 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', background: colors.bg.muted }}>
                        <th style={{ padding: '8px 10px' }}>Date</th>
                        <th style={{ padding: '8px 10px' }}>Value</th>
                        <th style={{ padding: '8px 10px' }}>Entity</th>
                        <th style={{ padding: '8px 10px' }}>Data Source</th>
                        <th style={{ padding: '8px 10px' }}>Dimensions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drillPoints.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: 12, color: colors.text.muted }}>No points found.</td>
                        </tr>
                      ) : drillPoints.map((p: any) => (
                        <tr key={String(p.id)} style={{ borderTop: `1px solid ${colors.border.subtle}` }}>
                          <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{String(p.date || '')}</td>
                          <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{formatNumber(Number(p.value ?? 0), drillFormat as any)}</td>
                          <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                            <span style={{ color: colors.text.muted }}>{String(p.entityKind || '')}</span>
                            <span>:</span>
                            <span style={{ marginLeft: 6 }}>{String(p.entityId || '')}</span>
                          </td>
                          <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{String(p.dataSourceId || '')}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <code style={{ fontSize: 11 }}>{JSON.stringify(p.dimensions || {})}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </Page>
  );
}

export default Dashboards;


