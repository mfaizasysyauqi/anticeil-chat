import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// GET /api/user/tier — Get active user tier
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ tier: 'free', isGuest: true });
    }

    const supabase = getSupabase(token);
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ tier: 'free', isGuest: true });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .maybeSingle();

    const userMetaTier = user.user_metadata?.tier;
    const tier = profile?.tier || userMetaTier || 'free';

    return NextResponse.json({
      tier: tier === 'pro' ? 'pro' : 'free',
      userId: user.id,
      email: user.email,
    });
  } catch (err: any) {
    return NextResponse.json({ tier: 'free', error: err?.message });
  }
}

// POST /api/user/tier — Update user tier ('free' | 'pro')
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase(token);
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const targetTier: 'free' | 'pro' = body.tier === 'pro' ? 'pro' : 'free';

    // Update in profiles table
    await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email,
        tier: targetTier,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // Also update Supabase auth metadata
    await supabase.auth.updateUser({
      data: { tier: targetTier },
    });

    return NextResponse.json({
      success: true,
      tier: targetTier,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update tier' },
      { status: 500 }
    );
  }
}
