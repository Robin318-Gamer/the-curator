import { NextRequest } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/db/supabase';

export async function GET(_req: NextRequest) {
  try {
    const db = supabaseAdmin ?? supabase;

    // Get active sources count (news_sources table where is_active = true)
    const { data: sourcesData, error: sourcesError } = await db
      .from('news_sources')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    if (sourcesError) throw sourcesError;
    const activeSources = sourcesData?.length ?? 0;

    // Get pending newslist rows that are either:
    // 1. Status = 'pending' (never processed)
    // 2. Status = 'failed' AND attempt_count < 3 (eligible for retry)
    const { data: pendingData, error: pendingError } = await db
      .from('newslist')
      .select('id', { count: 'exact' })
      .or('status.eq.pending,and(status.eq.failed,attempt_count.lt.3)');

    if (pendingError) throw pendingError;
    const pendingRows = pendingData?.length ?? 0;

    // Get average automation seed time from automation_history
    // Average time between runs (in seconds)
    const { data: historyData, error: historyError } = await db
      .from('automation_history')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (historyError) throw historyError;

    let avgSeed = '–';
    if (historyData && historyData.length > 1) {
      const times: number[] = [];
      for (let i = 0; i < historyData.length - 1; i++) {
        const time1 = new Date(historyData[i].created_at).getTime();
        const time2 = new Date(historyData[i + 1].created_at).getTime();
        times.push(Math.abs(time1 - time2) / 1000); // Convert to seconds
      }
      const average = times.reduce((a, b) => a + b, 0) / times.length;
      avgSeed = average > 60 ? `${(average / 60).toFixed(1)}m` : `${average.toFixed(1)}s`;
    }

    return Response.json({
      avgSeed,
      activeSources,
      pendingRows,
    });
  } catch (error) {
    console.error('[Metrics] Error fetching dashboard metrics:', error);
    return Response.json(
      {
        error: 'Failed to fetch metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
