import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

const RESET_FUNCTION = 'reset_curator_schema';

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim();
  }

  const fallback = request.headers.get('x-reset-token');
  return fallback ? fallback.trim() : null;
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, message: 'Supabase service role client not configured' },
      { status: 500 }
    );
  }

  const configuredToken = process.env.DATABASE_RESET_TOKEN;
  if (!configuredToken) {
    return NextResponse.json(
      { success: false, message: 'DATABASE_RESET_TOKEN is not set on the server' },
      { status: 500 }
    );
  }

  const providedToken = extractToken(request);
  if (!providedToken || providedToken !== configuredToken) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: missing or invalid reset token' },
      { status: 401 }
    );
  }

  try {
    const startedAt = Date.now();
    const { error } = await supabaseAdmin.rpc(RESET_FUNCTION);

    if (error) {
      console.error('[ResetDatabase] Supabase RPC error:', error.message);
      return NextResponse.json(
        { success: false, message: 'Failed to reset database', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database reset completed successfully',
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[ResetDatabase] Unexpected error:', errorMessage);
    return NextResponse.json(
      { success: false, message: 'Unexpected error resetting database', error: errorMessage },
      { status: 500 }
    );
  }
}
