/**
 * Dynamic Lucide icon resolver using wildcard import.
 *
 * Uses `import * as LucideIcons` to allow any icon to be resolved dynamically
 * by name from nav configs without needing an explicit allowlist.
 */
'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import * as LucideIcons from 'lucide-react';
function toPascalFromKebab(name) {
    return String(name || '')
        .trim()
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join('');
}
function normalizeKey(name) {
    const raw = String(name || '').trim();
    if (!raw)
        return '';
    const val = raw.includes(':') ? raw.split(':', 2)[1] : raw;
    if (!val)
        return '';
    return val.includes('-') || val.includes('_') || val.includes(' ') ? toPascalFromKebab(val) : val;
}
export function LucideIcon({ name, size, color, className, style, }) {
    const key = normalizeKey(name);
    if (!key) {
        throw new Error(`[hit-dashboard-shell] Lucide icon name is empty`);
    }
    // `lucide-react`'s module namespace includes exports that don't match our component shape
    // (e.g. the base `Icon` component). We only need runtime lookup by key, so cast via `unknown`.
    const Icon = LucideIcons[key];
    if (!Icon) {
        throw new Error(`[hit-dashboard-shell] Unknown Lucide icon "${name}" (normalized: "${key}"). ` +
            `Check the icon name in your nav config.`);
    }
    return _jsx(Icon, { size: size, color: color, className: className, style: style });
}
