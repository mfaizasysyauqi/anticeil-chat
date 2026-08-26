import { NextResponse } from 'next/server';
import { getAllGatewayModels } from '@/features/gateway/services/routerEngine';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET() {
  const models = getAllGatewayModels();
  const created = Math.floor(Date.now() / 1000);

  const openAiFormattedModels = models.map((m) => ({
    id: m.id,
    object: 'model',
    created,
    owned_by: m.provider,
    permission: [],
    root: m.id,
    parent: null,
    name: m.name,
    context_window: m.context_window,
  }));

  return NextResponse.json(
    {
      object: 'list',
      data: openAiFormattedModels,
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}
