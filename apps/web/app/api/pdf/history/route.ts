import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const {
      data: { user },
    } = await supabase.auth.getUser(token ?? '');

    if (!user) {
      return NextResponse.json({ documents: [] });
    }

    const { data, error } = await supabase
      .from('pdf_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ documents: [] });
    }

    const documents = (data || []).map((row: any) => ({
      id: row.id,
      name: row.filename || row.name || 'document.pdf',
      toolType: row.tool_type || 'pdf',
      url: row.storage_url || row.url || '',
      r2Key: row.storage_key || row.r2_key || '',
      size: Number(row.file_size || row.size || 0),
      categoryId: row.category_id || null,
      isPinned: Boolean(row.is_pinned),
      createdAt: row.created_at,
    }));

    return NextResponse.json({ documents });
  } catch (err: any) {
    return NextResponse.json({ documents: [], error: err?.message });
  }
}
