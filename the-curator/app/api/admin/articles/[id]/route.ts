import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

const formatErrorResponse = (status: number, message: string) => {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
};

type ContentBlock = { type: 'heading' | 'paragraph'; text: string };

function parsePlainTextToBlocks(raw?: string): ContentBlock[] {
  if (!raw) return [];
  const normalized = raw.replace(/\r/g, '');
  const parts = normalized
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const blocks: ContentBlock[] = [];

  for (const part of parts) {
    if (part.startsWith('### ')) {
      const headingText = part.slice(4).trim();
      if (headingText) {
        blocks.push({ type: 'heading', text: headingText });
      }
    } else {
      blocks.push({ type: 'paragraph', text: part });
    }
  }

  return blocks;
}

async function fetchArticle(id: string) {
  const db = supabaseAdmin;
  if (!db) {
    throw new Error('Supabase service role key is missing');
  }

  const { data, error } = await db
    .from('articles')
    .select('*, article_images(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const notFound = new Error('Article not found');
    (notFound as any).code = 'NOT_FOUND';
    throw notFound;
  }

  return data;
}

export async function GET(_: NextRequest, { params }: { params: { id?: string } }) {
  const db = supabaseAdmin;
  if (!db) {
    return formatErrorResponse(500, 'Supabase service role key is missing');
  }

  const id = params.id;
  if (!id) {
    return formatErrorResponse(400, 'Missing article ID');
  }

  try {
    const article = await fetchArticle(id);
    return NextResponse.json({ success: true, data: article });
  } catch (error: unknown) {
    if ((error as any)?.code === 'PGRST116' || (error as any)?.code === 'NOT_FOUND') {
      return formatErrorResponse(404, 'Article not found');
    }
    const message = error instanceof Error ? error.message : '無法取得文章';
    return formatErrorResponse(500, message);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id?: string } }) {
  const db = supabaseAdmin;
  if (!db) {
    return formatErrorResponse(500, 'Supabase service role key is missing');
  }

  const id = params.id;
  if (!id) {
    return formatErrorResponse(400, 'Missing article ID');
  }

  let payload: {
    title?: string;
    content?: string;
    tags?: string;
    removeImageIds?: string[];
  };

  try {
    payload = await request.json();
  } catch {
    return formatErrorResponse(400, 'Invalid JSON payload');
  }

  const updates: Record<string, unknown> = {};
  const now = new Date().toISOString();

  if (typeof payload.title === 'string') {
    updates.title = payload.title.trim();
  }

  if (typeof payload.tags === 'string') {
    updates.tags = payload.tags;
  }

  if (typeof payload.content === 'string') {
    updates.content = parsePlainTextToBlocks(payload.content);
    updates.last_updated_at = now;
  }

  if (Object.keys(updates).length > 0 && !updates.last_updated_at) {
    updates.last_updated_at = now;
  }

  try {
    if (Object.keys(updates).length > 0) {
      const { error } = await db.from('articles').update(updates).eq('id', id);
      if (error) {
        if (error.code === 'PGRST116') {
          return formatErrorResponse(404, 'Article not found');
        }
        return formatErrorResponse(500, error.message);
      }
    }

    if (Array.isArray(payload.removeImageIds) && payload.removeImageIds.length > 0) {
      await db.from('article_images').delete().in('id', payload.removeImageIds);
    }

    const article = await fetchArticle(id);
    return NextResponse.json({ success: true, data: article });
  } catch (error: unknown) {
    if ((error as any)?.code === 'PGRST116' || (error as any)?.code === 'NOT_FOUND') {
      return formatErrorResponse(404, 'Article not found');
    }
    const message = error instanceof Error ? error.message : '更新失敗';
    return formatErrorResponse(500, message);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id?: string } }) {
  const db = supabaseAdmin;
  if (!db) {
    return formatErrorResponse(500, 'Supabase service role key is missing');
  }

  const id = params.id;
  if (!id) {
    return formatErrorResponse(400, 'Missing article ID');
  }

  try {
    await fetchArticle(id);

    const { error } = await db.from('articles').delete().eq('id', id);
    if (error) {
      if (error.code === 'PGRST116') {
        return formatErrorResponse(404, 'Article not found');
      }
      return formatErrorResponse(500, error.message);
    }

    const newslistId = request.nextUrl.searchParams.get('newslistId');
    if (newslistId) {
      await db
        .from('newslist')
        .update({
          status: 'pending',
          resolved_article_id: null,
          error_log: null,
          last_processed_at: new Date().toISOString(),
        })
        .eq('id', newslistId);
    }

    return NextResponse.json({ success: true, message: 'Article deleted' });
  } catch (error: unknown) {
    if ((error as any)?.code === 'PGRST116' || (error as any)?.code === 'NOT_FOUND') {
      return formatErrorResponse(404, 'Article not found');
    }
    const message = error instanceof Error ? error.message : '刪除失敗';
    return formatErrorResponse(500, message);
  }
}
