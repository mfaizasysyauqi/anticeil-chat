import { NextRequest, NextResponse } from 'next/server';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { r2, R2_BUCKET } from '../../../../src/lib/r2';

function categorize(key: string): 'docs' | 'images' | 'audio' | 'other' {
  const name = key.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|webm)$/.test(name)) return 'images';
  if (/\.(mp3|wav|ogg|m4a|flac|aac)$/.test(name)) return 'audio';
  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|csv|txt|md)$/.test(name)) return 'docs';
  return 'other';
}

function calculateStringBytes(str: string | null | undefined): number {
  if (!str) return 0;
  return Buffer.byteLength(str, 'utf8');
}

function calculateJsonBytes(data: unknown): number {
  if (!data) return 0;
  try {
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
  } catch {
    return 0;
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    // Identify user via Supabase Auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : undefined
    );
    const { data: { user } } = await supabase.auth.getUser(token ?? '');
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;

    // ── 1. Calculate Supabase Database Usage for Current User ────────────────
    let dbBytes = 0;
    let dbFilesCount = 0;
    let dbDocBytes = 0;
    let dbImageBytes = 0;
    let dbOtherBytes = 0;

    const [
      pdfRes,
      imagineRes,
      foldersRes,
      promptsRes,
      connectorsRes,
      workflowsRes,
      runsRes,
      messagesRes,
    ] = await Promise.allSettled([
      supabase.from('pdf_documents').select('id, filename, file_size, extracted_text, summary').eq('user_id', userId),
      supabase.from('imagine_generations').select('id, prompt, negative_prompt, metadata').eq('user_id', userId),
      supabase.from('project_folders').select('id, name, session_ids').eq('user_id', userId),
      supabase.from('user_prompts').select('id, title, content').eq('user_id', userId),
      supabase.from('user_connectors').select('id, connector_id, config').eq('user_id', userId),
      supabase.from('automation_workflows').select('id, name, nodes, edges').eq('user_id', userId),
      supabase.from('automation_runs').select('id, logs, result').eq('user_id', userId),
      supabase.from('omnichannel_messages').select('id, content, media_url').eq('user_id', userId),
    ]);

    if (pdfRes.status === 'fulfilled' && Array.isArray(pdfRes.value.data)) {
      for (const doc of pdfRes.value.data) {
        const textBytes = calculateStringBytes(doc.extracted_text) + calculateStringBytes(doc.summary) + calculateStringBytes(doc.filename);
        const fileSize = Number(doc.file_size || 0);
        const totalDocSize = textBytes + (fileSize > 0 ? fileSize : 0);
        dbDocBytes += totalDocSize;
        dbBytes += totalDocSize;
        dbFilesCount++;
      }
    }

    if (imagineRes.status === 'fulfilled' && Array.isArray(imagineRes.value.data)) {
      for (const img of imagineRes.value.data) {
        const imgBytes = calculateStringBytes(img.prompt) + calculateStringBytes(img.negative_prompt) + calculateJsonBytes(img.metadata);
        dbImageBytes += imgBytes;
        dbBytes += imgBytes;
        dbFilesCount++;
      }
    }

    if (foldersRes.status === 'fulfilled' && Array.isArray(foldersRes.value.data)) {
      for (const f of foldersRes.value.data) {
        const rowBytes = calculateStringBytes(f.name) + calculateJsonBytes(f.session_ids);
        dbOtherBytes += rowBytes;
        dbBytes += rowBytes;
      }
    }

    if (promptsRes.status === 'fulfilled' && Array.isArray(promptsRes.value.data)) {
      for (const p of promptsRes.value.data) {
        const rowBytes = calculateStringBytes(p.title) + calculateStringBytes(p.content);
        dbOtherBytes += rowBytes;
        dbBytes += rowBytes;
      }
    }

    if (connectorsRes.status === 'fulfilled' && Array.isArray(connectorsRes.value.data)) {
      for (const c of connectorsRes.value.data) {
        const rowBytes = calculateStringBytes(c.connector_id) + calculateJsonBytes(c.config);
        dbOtherBytes += rowBytes;
        dbBytes += rowBytes;
      }
    }

    if (workflowsRes.status === 'fulfilled' && Array.isArray(workflowsRes.value.data)) {
      for (const w of workflowsRes.value.data) {
        const rowBytes = calculateStringBytes(w.name) + calculateJsonBytes(w.nodes) + calculateJsonBytes(w.edges);
        dbOtherBytes += rowBytes;
        dbBytes += rowBytes;
      }
    }

    if (runsRes.status === 'fulfilled' && Array.isArray(runsRes.value.data)) {
      for (const r of runsRes.value.data) {
        const rowBytes = calculateJsonBytes(r.logs) + calculateJsonBytes(r.result);
        dbOtherBytes += rowBytes;
        dbBytes += rowBytes;
      }
    }

    if (messagesRes.status === 'fulfilled' && Array.isArray(messagesRes.value.data)) {
      for (const m of messagesRes.value.data) {
        const rowBytes = calculateStringBytes(m.content) + calculateStringBytes(m.media_url);
        dbOtherBytes += rowBytes;
        dbBytes += rowBytes;
      }
    }

    // ── 2. Calculate Cloudflare R2 Usage for Current User ───────────────────
    let r2Bytes = 0;
    let r2FileCount = 0;
    const r2Breakdown = { docs: 0, images: 0, audio: 0, other: 0 };
    let isR2Available = true;

    try {
      if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
        let continuationToken: string | undefined;
        let retries = 2;

        while (retries > 0) {
          try {
            do {
              const res = await r2.send(
                new ListObjectsV2Command({
                  Bucket: R2_BUCKET,
                  Prefix: `${userId}/`,
                  ContinuationToken: continuationToken,
                  MaxKeys: 1000,
                })
              );

              for (const obj of res.Contents ?? []) {
                const size = obj.Size ?? 0;
                r2Bytes += size;
                r2FileCount++;
                const category = categorize(obj.Key ?? '');
                r2Breakdown[category] += size;
              }

              continuationToken = res.NextContinuationToken;
            } while (continuationToken);

            break; // Success
          } catch (r2InnerErr) {
            retries--;
            if (retries === 0) throw r2InnerErr;
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }
    } catch (r2Err: any) {
      console.warn('[R2] storage usage R2 fetch warning:', r2Err?.message || r2Err);
      isR2Available = false;
    }

    // ── 3. Combined Result ──────────────────────────────────────────────────
    const totalBytes = r2Bytes + dbBytes;
    const fileCount = r2FileCount + dbFilesCount;
    const breakdown = {
      docs: r2Breakdown.docs + dbDocBytes,
      images: r2Breakdown.images + dbImageBytes,
      audio: r2Breakdown.audio,
      database: dbOtherBytes,
      other: r2Breakdown.other,
    };
    const sources = {
      r2Bytes,
      databaseBytes: dbBytes,
      isR2Available,
    };

    return NextResponse.json({
      totalBytes,
      fileCount,
      breakdown,
      sources,
    });
  } catch (err: any) {
    console.warn('[Storage Usage] Fallback error:', err?.message || err);
    return NextResponse.json({
      totalBytes: 0,
      breakdown: { docs: 0, images: 0, audio: 0, database: 0, other: 0 },
      sources: { r2Bytes: 0, databaseBytes: 0, isR2Available: false },
      fileCount: 0,
      isUnavailable: true,
    });
  }
}
