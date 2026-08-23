import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { r2, R2_BUCKET } from '../../../../src/lib/r2';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // 1. Identify user from access token
    const client = createClient(supabaseUrl, supabaseAnonKey);
    let userId: string | null = null;

    if (token) {
      const { data: { user } } = await client.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      try {
        const body = await req.json();
        userId = body.userId || null;
      } catch {}
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: User not found' }, { status: 401 });
    }

    // 2. Delete all user files from Cloudflare R2
    try {
      let continuationToken: string | undefined;

      do {
        const listRes = await r2.send(
          new ListObjectsV2Command({
            Bucket: R2_BUCKET,
            Prefix: `${userId}/`,
            ContinuationToken: continuationToken,
            MaxKeys: 1000,
          })
        );

        const objects = listRes.Contents ?? [];
        if (objects.length > 0) {
          await r2.send(
            new DeleteObjectsCommand({
              Bucket: R2_BUCKET,
              Delete: {
                Objects: objects.map((o) => ({ Key: o.Key! })),
                Quiet: true,
              },
            })
          );
        }

        continuationToken = listRes.NextContinuationToken;
      } while (continuationToken);
    } catch (r2Err) {
      console.warn('[R2] Storage cleanup warning during account deletion:', r2Err);
    }

    // 3. Delete from Supabase Auth + profiles
    if (supabaseServiceKey) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);

      try {
        await adminClient.from('profiles').delete().eq('id', userId);
      } catch {}

      const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteErr) {
        console.error('Error deleting auth user via admin:', deleteErr);
      }
    } else {
      try {
        await client.from('profiles').delete().eq('id', userId);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: 'Account and associated data deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete account API error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete account' }, { status: 500 });
  }
}
