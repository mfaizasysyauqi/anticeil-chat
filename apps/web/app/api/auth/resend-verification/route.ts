import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Rate limiting in-memory map: email -> lastSentTimestamp
const globalRateLimit = globalThis as unknown as {
  _emailResendRateLimit?: Map<string, number>;
};

if (!globalRateLimit._emailResendRateLimit) {
  globalRateLimit._emailResendRateLimit = new Map<string, number>();
}

const rateLimitMap = globalRateLimit._emailResendRateLimit;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Alamat email tidak valid' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const lastSent = rateLimitMap.get(normalizedEmail);
    const now = Date.now();

    // Enforce 60-second cooldown on the server side
    if (lastSent && now - lastSent < 60 * 1000) {
      const remainingSeconds = Math.ceil((60 * 1000 - (now - lastSent)) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Mohon tunggu ${remainingSeconds} detik sebelum meminta email verifikasi lagi.`,
          remainingSeconds,
        },
        { status: 429 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://orshttowaxmjegclecag.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_b0VAst9djH6nA3YB0uH0gA_hvNLQK58';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.warn('Supabase resend email error:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    rateLimitMap.set(normalizedEmail, now);

    return NextResponse.json({
      success: true,
      message: 'Email verifikasi berhasil dikirim ulang.',
      cooldownSeconds: 60,
    });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Gagal mengirim ulang email' }, { status: 500 });
  }
}
