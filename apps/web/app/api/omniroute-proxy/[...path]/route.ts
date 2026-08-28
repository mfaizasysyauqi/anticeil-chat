import { NextRequest, NextResponse } from 'next/server';

const OMNIROUTE_ORIGIN = 'http://127.0.0.1:20128';
const PROXY_PREFIX = '/api/omniroute-proxy';

export async function GET(req: NextRequest, props: { params?: Promise<{ path?: string[] }> }) { return handleProxy(req, props); }
export async function POST(req: NextRequest, props: { params?: Promise<{ path?: string[] }> }) { return handleProxy(req, props); }
export async function PUT(req: NextRequest, props: { params?: Promise<{ path?: string[] }> }) { return handleProxy(req, props); }
export async function DELETE(req: NextRequest, props: { params?: Promise<{ path?: string[] }> }) { return handleProxy(req, props); }
export async function PATCH(req: NextRequest, props: { params?: Promise<{ path?: string[] }> }) { return handleProxy(req, props); }
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*' } }); }

function rewriteText(raw: string): string {
  let s = raw;
  // href/src attributes (HTML)
  s = s.replace(/(href|src)="(\/[^"]+)"/g, (_m, attr, u) => {
    if (u.startsWith(PROXY_PREFIX)) return _m;
    return `${attr}="${PROXY_PREFIX}${u}"`;
  });
  // Double-quoted absolute paths in RSC payloads and inline scripts
  s = s.replace(/"(\/(?:_next|dashboard|api|favicon|icon|manifest|apple-touch-icon)[^"]*?)"/g, (_m, u) => {
    if (u.startsWith(PROXY_PREFIX)) return _m;
    return `"${PROXY_PREFIX}${u}"`;
  });
  // Single-quoted absolute paths
  s = s.replace(/'(\/(?:_next|dashboard|api|favicon|icon|manifest|apple-touch-icon)[^']*?)'/g, (_m, u) => {
    if (u.startsWith(PROXY_PREFIX)) return _m;
    return `'${PROXY_PREFIX}${u}'`;
  });
  return s;
}

const STRIP_HEADERS = new Set([
  'x-frame-options', 'content-security-policy', 'content-security-policy-report-only',
  'content-encoding', 'content-length', 'link', 'transfer-encoding',
]);

async function handleProxy(req: NextRequest, props?: { params?: Promise<{ path?: string[] }> }) {
  try {
    let segs: string[] = [];
    if (props?.params) {
      const p = await props.params;
      if (p && Array.isArray(p.path)) segs = p.path;
    }
    const targetPath = segs.join('/');
    const search = req.nextUrl.search || '';
    const targetUrl = OMNIROUTE_ORIGIN + '/' + targetPath + search;

    const fh: Record<string, string> = {};
    req.headers.forEach((v, k) => {
      const l = k.toLowerCase();
      if (l !== 'host' && l !== 'connection' && l !== 'accept-encoding') fh[k] = v;
    });
    const body = ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : await req.arrayBuffer();
    const res = await fetch(targetUrl, { method: req.method, headers: fh, body, redirect: 'manual' });

    const ct = res.headers.get('content-type') || '';
    const lowerCt = ct.toLowerCase();
    const nh = new Headers();
    res.headers.forEach((v, k) => { if (!STRIP_HEADERS.has(k.toLowerCase())) nh.set(k, v); });
    nh.set('Access-Control-Allow-Origin', '*');

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location');
      if (loc) {
        let prox = loc;
        if (loc.startsWith('http://127.0.0.1:20128') || loc.startsWith('http://localhost:20128'))
          prox = loc.replace(/^http:\/\/(?:127\.0\.0\.1|localhost):20128/, PROXY_PREFIX);
        else if (loc.startsWith('/') && !loc.startsWith(PROXY_PREFIX))
          prox = PROXY_PREFIX + loc;
        nh.set('location', prox);
      }
      return new NextResponse(null, { status: res.status, headers: nh });
    }

    // Rewrite all text-based content: HTML, RSC payloads, JS
    const needsRewrite = lowerCt.includes('text/html')
      || lowerCt.includes('text/x-component')
      || lowerCt.includes('javascript')
      || lowerCt.includes('text/plain');

    if (needsRewrite) {
      const rawText = await res.text();
      const rewritten = rewriteText(rawText);
      nh.set('content-type', ct || 'text/plain; charset=utf-8');
      return new NextResponse(rewritten, { status: res.status, headers: nh });
    }

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, { status: res.status, headers: nh });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.stack || err.message : String(err);
    return new NextResponse(
      `<html><body style="background:#0b0f17;color:#fff;padding:24px;"><h2>Proxy Error</h2><pre>${msg}</pre></body></html>`,
      { status: 502, headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  }
}
