import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ images: [], videos: [], audios: [] });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ images: [], videos: [], audios: [] });
    }

    const { data, error } = await supabase
      .from('imagine_generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data)) {
      return NextResponse.json({ images: [], videos: [], audios: [] });
    }

    const images: any[] = [];
    const videos: any[] = [];
    const audios: any[] = [];

    for (const item of data) {
      const meta = (item.metadata as any) || {};
      const type = meta.type || 'image';
      const formattedItem = {
        id: item.id || String(Date.now()),
        prompt: item.prompt || meta.prompt || '',
        url: meta.url || '',
        createdAt: item.created_at
          ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Just now',
      };

      if (type === 'image') {
        images.push({
          ...formattedItem,
          style: meta.style || 'Photorealistic',
          ratio: meta.ratio || '16:9',
          model: meta.model || 'FLUX.1',
        });
      } else if (type === 'video') {
        videos.push({
          ...formattedItem,
          model: meta.model || 'Luma Ray 2',
          ratio: meta.ratio || '16:9',
          duration: meta.duration || '0:06',
        });
      } else if (type === 'audio') {
        audios.push({
          ...formattedItem,
          title: meta.title || item.prompt?.slice(0, 40) || 'Audio',
          model: meta.model || 'Neural Voice',
          voice: meta.voice || 'Gadis',
          category: meta.category || 'speech',
          durationSec: meta.durationSec || 6,
        });
      }
    }

    return NextResponse.json({ images, videos, audios });
  } catch (err: any) {
    return NextResponse.json(
      { images: [], videos: [], audios: [], error: err?.message },
      { status: 500 }
    );
  }
}
