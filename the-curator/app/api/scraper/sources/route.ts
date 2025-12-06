import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logException, extractErrorDetails } from '@/lib/services/exceptionLogger';

export async function GET() {
  try {
    const { data: sources, error } = await supabase
      .from('news_sources')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw error;
    }

    return NextResponse.json({ sources });
  } catch (error) {
    const errorDetails = extractErrorDetails(error);
    console.error('Error fetching sources:', error);

    // Log to exception table
    if (supabaseAdmin) {
      await logException(supabaseAdmin, {
        errorType: errorDetails.type,
        errorMessage: errorDetails.message,
        errorStack: errorDetails.stack,
        endpoint: '/api/scraper/sources',
        functionName: 'GET',
        operation: 'fetch_sources',
        requestMethod: 'GET',
        severity: 'error',
      }).catch((err) => console.error('Failed to log exception:', err));
    }

    return NextResponse.json(
      { error: 'Failed to fetch news sources' },
      { status: 500 }
    );
  }
}
