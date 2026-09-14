import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get('prompt') || 'cinematic motion picture';
  const width = searchParams.get('width') || '768';
  const height = searchParams.get('height') || '432';
  const model = searchParams.get('model') || 'flux';
  const seed = searchParams.get('seed') || String(Math.floor(Math.random() * 1000000));

  const cleanPrompt = prompt.trim();
  const encodedPrompt = encodeURIComponent(`${cleanPrompt}, cinematic film still, photorealistic masterpiece, 8k, ultra sharp`);

  const candidateUrls = [
    `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&nologo=true&seed=${seed}`,
    `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=turbo&nologo=true&seed=${seed}`,
    `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}`,
  ];

  for (const url of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        if (arrayBuffer.byteLength > 2000) {
          const contentType = res.headers.get('content-type') || 'image/jpeg';
          return new NextResponse(arrayBuffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      }
    } catch (err) {
      console.warn('[ProxyImage] Candidate fetch failed:', err);
    }
  }

  return new NextResponse(JSON.stringify({ error: 'Failed to generate image' }), {
    status: 502,
    headers: { 'Content-Type': 'application/json' },
  });
}
