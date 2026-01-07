export type ReportPrefillV0 = {
  kind: 'report_prefill_v0';
  title?: string;
  format?: 'number' | 'usd';
  pointFilter: any;
};

function base64UrlEncode(utf8: string): string {
  // Browser-safe base64url encoding.
  const b64 = btoa(utf8);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  // Pad to multiple of 4
  const padLen = (4 - (b64.length % 4)) % 4;
  const padded = b64 + '='.repeat(padLen);
  return atob(padded);
}

export function encodeReportPrefill(input: Omit<ReportPrefillV0, 'kind'> & { kind?: string }): string {
  const payload: ReportPrefillV0 = {
    kind: 'report_prefill_v0',
    title: typeof input.title === 'string' ? input.title : undefined,
    format: input.format === 'usd' || input.format === 'number' ? input.format : undefined,
    pointFilter: input.pointFilter ?? {},
  };
  const json = JSON.stringify(payload);
  return encodeURIComponent(base64UrlEncode(json));
}

export function decodeReportPrefill(raw: string): ReportPrefillV0 | null {
  try {
    const txt = decodeURIComponent(raw);
    const json = base64UrlDecode(txt);
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== 'object') return null;

    // Allow missing kind for early/internal links; treat it as v0 payload.
    const kind = typeof (obj as any).kind === 'string' ? String((obj as any).kind) : '';
    if (kind && kind !== 'report_prefill_v0') return null;

    const pointFilter = (obj as any).pointFilter;
    if (!pointFilter || typeof pointFilter !== 'object') return null;

    const title = typeof (obj as any).title === 'string' ? (obj as any).title : undefined;
    const format = (obj as any).format === 'usd' || (obj as any).format === 'number' ? (obj as any).format : undefined;

    return { kind: 'report_prefill_v0', title, format, pointFilter };
  } catch {
    return null;
  }
}

