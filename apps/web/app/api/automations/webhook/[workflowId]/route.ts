import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params;
  let body: any = {};

  try {
    body = await req.json();
  } catch {
    body = { note: 'Empty body' };
  }

  return NextResponse.json({
    success: true,
    message: `Inbound Webhook diterima untuk Alur Otomatisasi: ${workflowId}`,
    workflowId,
    receivedAt: new Date().toISOString(),
    triggerType: 'webhook',
    sourceIp: req.headers.get('x-forwarded-for') || 'edge-client',
    receivedPayload: body,
  });
}
