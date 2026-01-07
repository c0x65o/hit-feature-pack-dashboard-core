function base64UrlEncode(utf8) {
    // Browser-safe base64url encoding.
    const b64 = btoa(utf8);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function base64UrlDecode(b64url) {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    // Pad to multiple of 4
    const padLen = (4 - (b64.length % 4)) % 4;
    const padded = b64 + '='.repeat(padLen);
    return atob(padded);
}
export function encodeReportPrefill(input) {
    const payload = {
        kind: 'report_prefill_v0',
        title: typeof input.title === 'string' ? input.title : undefined,
        format: input.format === 'usd' || input.format === 'number' ? input.format : undefined,
        pointFilter: input.pointFilter ?? {},
    };
    const json = JSON.stringify(payload);
    return encodeURIComponent(base64UrlEncode(json));
}
export function decodeReportPrefill(raw) {
    try {
        const txt = decodeURIComponent(raw);
        const json = base64UrlDecode(txt);
        const obj = JSON.parse(json);
        if (!obj || typeof obj !== 'object')
            return null;
        // Allow missing kind for early/internal links; treat it as v0 payload.
        const kind = typeof obj.kind === 'string' ? String(obj.kind) : '';
        if (kind && kind !== 'report_prefill_v0')
            return null;
        const pointFilter = obj.pointFilter;
        if (!pointFilter || typeof pointFilter !== 'object')
            return null;
        const title = typeof obj.title === 'string' ? obj.title : undefined;
        const format = obj.format === 'usd' || obj.format === 'number' ? obj.format : undefined;
        return { kind: 'report_prefill_v0', title, format, pointFilter };
    }
    catch {
        return null;
    }
}
