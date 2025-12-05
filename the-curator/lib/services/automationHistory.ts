import { supabaseAdmin } from '@/lib/db/supabase';
import type { AutomationHistoryEntry, AutomationHistoryStatus } from '@/lib/types/database';

const HISTORY_TABLE = 'automation_history';

interface CreateAutomationHistoryPayload {
  runId: string;
  categorySlug: string;
  sourceId?: string | null;
  status?: AutomationHistoryStatus;
  notes?: string;
  startedAt?: string;
}

interface UpdateAutomationHistoryPayload {
  status?: AutomationHistoryStatus;
  completedAt?: string;
  articlesProcessed?: number;
  errors?: Array<string>;
  notes?: string;
}

function getAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('Service role client is required to write automation history.');
  }
  return supabaseAdmin;
}

export async function createAutomationHistory(
  payload: CreateAutomationHistoryPayload
): Promise<AutomationHistoryEntry> {
  const client = getAdminClient();
  const { data, error } = await client
    .from(HISTORY_TABLE)
    .insert({
      run_id: payload.runId,
      category_slug: payload.categorySlug,
      source_id: payload.sourceId,
      status: payload.status ?? 'running',
      notes: payload.notes,
      started_at: payload.startedAt ?? new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as AutomationHistoryEntry;
}

export async function updateAutomationHistory(
  runId: string,
  payload: UpdateAutomationHistoryPayload
): Promise<AutomationHistoryEntry | null> {
  const client = getAdminClient();
  const { data, error } = await client
    .from(HISTORY_TABLE)
    .update({
      status: payload.status,
      completed_at: payload.completedAt,
      articles_processed: payload.articlesProcessed,
      errors: payload.errors ?? [],
      notes: payload.notes,
    })
    .eq('run_id', runId)
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return (data as AutomationHistoryEntry) ?? null;
}
