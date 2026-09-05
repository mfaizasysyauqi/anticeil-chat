import { NextRequest, NextResponse } from 'next/server';

// In-memory verification token store with 15-minute TTL
interface TelegramSession {
  token: string;
  phone?: string;
  telegramUserId?: string;
  verified: boolean;
  createdAt: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const globalSessions = globalThis as unknown as {
  _telegramVerificationSessions?: Map<string, TelegramSession>;
  _telegramRepliedUpdates?: Set<number>;
  _telegramIpRateLimits?: Map<string, RateLimitEntry>;
};

if (!globalSessions._telegramVerificationSessions) {
  globalSessions._telegramVerificationSessions = new Map<string, TelegramSession>();
}

if (!globalSessions._telegramRepliedUpdates) {
  globalSessions._telegramRepliedUpdates = new Set<number>();
}

if (!globalSessions._telegramIpRateLimits) {
  globalSessions._telegramIpRateLimits = new Map<string, RateLimitEntry>();
}

const sessions = globalSessions._telegramVerificationSessions;
const repliedUpdates = globalSessions._telegramRepliedUpdates;
const ipRateLimits = globalSessions._telegramIpRateLimits;

// Clean up expired sessions and rate limit entries
function cleanExpiredSessions() {
  const now = Date.now();
  for (const [key, session] of sessions.entries()) {
    if (now - session.createdAt > 15 * 60 * 1000) {
      sessions.delete(key);
    }
  }
  for (const [ip, entry] of ipRateLimits.entries()) {
    if (now > entry.resetAt) {
      ipRateLimits.delete(ip);
    }
  }
}

// Check IP rate limit (Max 5 session creations per IP per minute)
function checkIpRateLimit(ip: string, maxRequests = 5, windowMs = 60 * 1000): { allowed: boolean; remainingSeconds: number } {
  const now = Date.now();
  const entry = ipRateLimits.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remainingSeconds: 0 };
  }

  if (entry.count >= maxRequests) {
    const remainingSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remainingSeconds };
  }

  entry.count += 1;
  return { allowed: true, remainingSeconds: 0 };
}

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'AnticeilBot';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;

// Helper: send Telegram Bot message
async function sendTelegramReply(chatId: number | string, text: string) {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    console.warn('Failed to send Telegram reply:', err);
  }
}

// Helper: check Telegram getUpdates to automatically detect /start and reply
async function checkTelegramUpdates(targetToken?: string) {
  if (!BOT_TOKEN) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-10&limit=10`, {
      cache: 'no-store',
    });
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return false;

    let foundMatch = false;

    for (const update of data.result) {
      const updateId = update.update_id;
      const msg = update.message;
      if (!msg || !msg.text) continue;

      const text = msg.text.trim();
      const chatId = msg.chat?.id;

      // Handle /start or /start tg_xxxx
      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const incomingToken = parts[1]?.trim();

        // If specific token matches or if user sent /start while polling targetToken
        if (targetToken && (incomingToken === targetToken || !incomingToken)) {
          if (sessions.has(targetToken)) {
            const session = sessions.get(targetToken)!;
            session.verified = true;
            session.telegramUserId = String(chatId);
            sessions.set(targetToken, session);
            foundMatch = true;
          }
        }

        // Send reply to user if not already replied in this session
        if (chatId && !repliedUpdates.has(updateId)) {
          repliedUpdates.add(updateId);
          await sendTelegramReply(
            chatId,
            `🎉 *Selamat Datang di Anticeil!* 🚀\n\nNomor akun Anda telah *berhasil diverifikasi* secara instan.\n\nSilakan kembali ke browser Anda untuk menyelesaikan pembuatan akun. ✨`
          );
        }
      }
    }

    return foundMatch;
  } catch (err) {
    console.warn('Error checking Telegram getUpdates:', err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    cleanExpiredSessions();
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    const body = await req.json();
    const { action, token, phone, telegramUserId } = body;

    // 1. Create a new verification session token (Rate limited per IP)
    if (action === 'create-session') {
      const rateCheck = checkIpRateLimit(clientIp, 5, 60 * 1000);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Terlalu banyak permintaan verifikasi. Harap tunggu ${rateCheck.remainingSeconds} detik lagi.`,
            remainingSeconds: rateCheck.remainingSeconds,
          },
          { status: 429 }
        );
      }

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

      // Check Telegram getUpdates live
      await checkTelegramUpdates(token);

      const session = sessions.get(token)!;
      return NextResponse.json({
        success: true,
        verified: session.verified,
        phone: session.phone,
      });
    }

    // 3. Confirm verification
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

  // Check Telegram getUpdates live
  await checkTelegramUpdates(token);

  const session = sessions.get(token)!;
  return NextResponse.json({
    success: true,
    verified: session.verified,
    phone: session.phone,
  });
}
