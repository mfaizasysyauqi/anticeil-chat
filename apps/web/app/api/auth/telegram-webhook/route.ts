import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const msg = update.message;

    if (!msg || !msg.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = msg.chat?.id;
    const text = msg.text.trim();

    if (text.startsWith('/start') && chatId && BOT_TOKEN) {
      // Send instant welcome & verification confirmation message
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🎉 *Selamat Datang di Anticeil!* 🚀\n\nNomor akun Anda telah *berhasil diverifikasi* secara instan.\n\nSilakan kembali ke browser Anda untuk melanjutkan proses pendaftaran. ✨`,
          parse_mode: 'Markdown',
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
