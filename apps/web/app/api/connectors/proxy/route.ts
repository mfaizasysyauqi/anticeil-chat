import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTNAMES = new Set([
  'api.notion.com',
  'api.github.com',
  'gmail.googleapis.com',
  'www.googleapis.com',
  'calendar.googleapis.com',
  'api.smithery.ai',
  'server.smithery.ai',
]);

export async function POST(req: NextRequest) {
  try {
    const { url, method = 'GET', headers = {}, body } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Malformed URL' }, { status: 400 });
    }

    if (!ALLOWED_HOSTNAMES.has(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: `Proxying to hostname "${parsedUrl.hostname}" is not allowed` },
        { status: 403 }
      );
    }

    const fetchHeaders: Record<string, string> = { ...headers };
    // Remove host header to let fetch set it properly
    delete fetchHeaders['host'];
    delete fetchHeaders['origin'];
    delete fetchHeaders['referer'];

    const fetchOptions: RequestInit = {
      method,
      headers: fetchHeaders,
    };

    if (body !== undefined && body !== null && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase())) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (!fetchHeaders['content-type'] && !fetchHeaders['Content-Type']) {
        fetchHeaders['Content-Type'] = 'application/json';
      }
    }

    const upstreamRes = await fetch(url, fetchOptions);
    const contentType = upstreamRes.headers.get('content-type') || 'application/json';
    const textData = await upstreamRes.text();

    return new NextResponse(textData, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy execution failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
