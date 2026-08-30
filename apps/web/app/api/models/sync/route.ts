import { NextRequest, NextResponse } from 'next/server';
import { fetchProviderModels, LLMProviderId } from '@anticeil/core';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { providerId, apiKey, baseUrl } = await req.json();
    if (!providerId) {
      return NextResponse.json({ error: 'Missing providerId', models: [] }, { status: 400 });
    }

    const models = await fetchProviderModels(
      providerId as LLMProviderId,
      apiKey || '',
      baseUrl
    );

    return NextResponse.json({
      success: true,
      models,
      count: models.length,
    });
  } catch (err: any) {
    console.error(`[API /api/models/sync] Error fetching models:`, err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to sync models',
      models: [],
    });
  }
}
