import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // If userId not found from token, try reading request body
    if (!userId) {
      try {
        const body = await req.json();
        userId = body.userId || null;
      } catch {}
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: User not found' }, { status: 401 });
    }

    // 2. Cascade delete files from Supabase Storage buckets if service key exists
    if (supabaseServiceKey) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      
      try {
        // Delete user files in common buckets
        const buckets = ['avatars', 'attachments', 'pdf_files', 'workspace'];
        for (const b of buckets) {
          const { data: files } = await adminClient.storage.from(b).list(userId);
          if (files && files.length > 0) {
            await adminClient.storage.from(b).remove(files.map((f) => `${userId}/${f.name}`));
          }
        }
      } catch (storageErr) {
        console.warn('Storage cleanup warning during account deletion:', storageErr);
      }

      // Delete from public profiles table
      try {
        await adminClient.from('profiles').delete().eq('id', userId);
      } catch {}

      // Delete from auth.users (permanently deletes account from Supabase Auth)
      const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteErr) {
        console.error('Error deleting auth user via admin:', deleteErr);
      }
    } else {
      // Without service key, delete profile data via user client
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
