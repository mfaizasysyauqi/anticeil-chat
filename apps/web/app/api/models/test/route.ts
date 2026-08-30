import { NextRequest, NextResponse } from 'next/server';
import { testProviderConnection, LLMProviderId } from '@anticeil/core';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { providerId, apiKey, baseUrl } = await req.json();
    if (!providerId) {
      return NextResponse.json({ success: false, message: 'Missing providerId' }, { status: 400 });
    }

    const result = await testProviderConnection(
      providerId as LLMProviderId,
      apiKey || '',
      baseUrl
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error(`[API /api/models/test] Error testing connection:`, err);
    return NextResponse.json({
      success: false,
      message: err?.message || 'Connection test failed',
    });
  }
}
