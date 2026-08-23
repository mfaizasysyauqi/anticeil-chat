import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BUCKETS = ['avatars', 'attachments', 'pdf_files', 'workspace'];

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Identify user
    const client = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user } } = await client.auth.getUser(token || '');
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service key if available for reliable size info
    const storageClient = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : client;

    let totalBytes = 0;
    const breakdown = { docs: 0, images: 0, audio: 0, other: 0 };
    let fileCount = 0;

    for (const bucket of BUCKETS) {
      try {
        const { data: files } = await storageClient.storage.from(bucket).list(userId, {
          limit: 1000,
        });

        if (!files) continue;

        for (const file of files) {
          const size = file.metadata?.size ?? 0;
          totalBytes += size;
          fileCount++;

          const name = file.name.toLowerCase();
          if (/\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|webm)$/.test(name)) {
            breakdown.images += size;
          } else if (/\.(mp3|wav|ogg|m4a|flac|aac)$/.test(name)) {
            breakdown.audio += size;
          } else if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|csv|txt|md)$/.test(name)) {
            breakdown.docs += size;
          } else {
            breakdown.other += size;
          }
        }
      } catch {
        // bucket doesn't exist or no access — skip
      }
    }

    return NextResponse.json({ totalBytes, breakdown, fileCount });
  } catch (error: any) {
    console.error('Storage usage API error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch storage usage' }, { status: 500 });
  }
}
