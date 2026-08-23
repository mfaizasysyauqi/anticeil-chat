import { NextRequest, NextResponse } from 'next/server';

// In-memory verification token store with 15-minute TTL (for production, persist to Redis / KV / DB)
interface TelegramSession {
  token: string;
  phone?: string;
  telegramUserId?: string;
  verified: boolean;
  createdAt: number;
}

const globalSessions = globalThis as unknown as {
  _telegramVerificationSessions?: Map<string, TelegramSession>;
};

if (!globalSessions._telegramVerificationSessions) {
  globalSessions._telegramVerificationSessions = new Map<string, TelegramSession>();
}

const sessions = globalSessions._telegramVerificationSessions;

// Clean up expired sessions (older than 15 minutes)
function cleanExpiredSessions() {
  const now = Date.now();
  for (const [key, session] of sessions.entries()) {
    if (now - session.createdAt > 15 * 60 * 1000) {
      sessions.delete(key);
    }
  }
}

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'AnticeilAuthBot';

export async function POST(req: NextRequest) {
  try {
    cleanExpiredSessions();
    const body = await req.json();
    const { action, token, phone, telegramUserId } = body;

    // 1. Create a new verification session token
    if (action === 'create-session') {
      const newToken = `tg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessions.set(newToken, {
        token: newToken,
        phone: phone || '',
        verified: false,
        createdAt: Date.now(),
      });

      const botUrl = `https://t.me/${BOT_USERNAME}?start=${newToken}`;
      const deepLink = `tg://resolve?domain=${BOT_USERNAME}&start=${newToken}`;

      return NextResponse.json({
        success: true,
        token: newToken,
        botUsername: BOT_USERNAME,
        botUrl,
        deepLink,
      });
    }

    // 2. Check verification status
    if (action === 'check-status') {
      if (!token || !sessions.has(token)) {
        return NextResponse.json({ success: false, verified: false, error: 'Session expired or not found' });
      }

      const session = sessions.get(token)!;
      return NextResponse.json({
        success: true,
        verified: session.verified,
        phone: session.phone,
      });
    }

    // 3. Confirm verification (Webhook / Telegram Bot callback or instant client handshake)
    if (action === 'confirm') {
      if (!token || !sessions.has(token)) {
        return NextResponse.json({ success: false, error: 'Invalid or expired session token' }, { status: 400 });
      }

      const session = sessions.get(token)!;
      session.verified = true;
      if (phone) session.phone = phone;
      if (telegramUserId) session.telegramUserId = telegramUserId;
      sessions.set(token, session);

      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Phone number verified via Telegram successfully',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Telegram verify API error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token || !sessions.has(token)) {
    return NextResponse.json({ success: false, verified: false });
  }

  const session = sessions.get(token)!;
  return NextResponse.json({
    success: true,
    verified: session.verified,
    phone: session.phone,
  });
}
