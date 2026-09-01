import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/scrape
 *
 * Server-side Firecrawl proxy using the Anticeil provider key.
 * Called only when the user has NOT configured their own BYOK Firecrawl key.
 * The key is server-side only (no NEXT_PUBLIC_ prefix) — never exposed to the browser.
 *
 * Body: { url: string }
 * Returns: { markdown: string } | { error: string }
 */
export async function POST(req: NextRequest) {
  const serverKey = process.env.FIRECRAWL_API_KEY;

  if (!serverKey) {
    return NextResponse.json({ error: 'Firecrawl not configured on server.' }, { status: 503 });
  }

  let url: string;
  try {
    const body = await req.json();
    url = body?.url;
    if (!url || !/^https?:\/\/.+/.test(url)) {
      return NextResponse.json({ error: 'Invalid or missing URL.' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverKey}`,
      },
      body: JSON.stringify({ url, formats: ['markdown'] }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Firecrawl error: ${res.status} ${text}` }, { status: res.status });
    }

    const data = await res.json();
    const markdown = data?.data?.markdown ?? '';
    return NextResponse.json({ markdown });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
