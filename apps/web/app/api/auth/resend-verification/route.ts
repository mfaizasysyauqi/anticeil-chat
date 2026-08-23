import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../src/shared/utils/supabase/client';

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
      return NextResponse.json({ success: false, error: 'Valid email address is required' }, { status: 400 });
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
          error: `Please wait ${remainingSeconds}s before requesting another verification email.`,
          remainingSeconds,
        },
        { status: 429 }
      );
    }

    // Call Supabase resend verification email
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });

    if (error) {
      console.warn('Supabase resend email warning:', error.message);
      // Even if Supabase warns or rate limits, update our local timer to protect the endpoint
    }

    rateLimitMap.set(normalizedEmail, now);

    return NextResponse.json({
      success: true,
      message: 'Verification email resent successfully',
      cooldownSeconds: 60,
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
