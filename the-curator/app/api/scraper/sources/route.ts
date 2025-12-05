import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function GET() {
  try {
    const { data: sources, error } = await supabase
      .from('news_sources')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) {
      throw error;
    }

    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Error fetching sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news sources' },
      { status: 500 }
    );
  }
}
