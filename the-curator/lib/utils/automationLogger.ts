import { promises as fs } from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'automation-history.log');

export interface AutomationLogEntry {
  runId: string;
  categorySlug: string;
  status: string;
  articlesProcessed: number;
  errors: Array<string>;
  startedAt: string;
  completedAt?: string;
  notes?: string | null;
}

export async function appendAutomationLog(entry: AutomationLogEntry): Promise<void> {
  try {
    // Attempt to write to file system (will work on local development)
    await fs.mkdir(LOG_DIR, { recursive: true });
    const timestamp = new Date().toISOString();
    const meta = [
      `runId=${entry.runId}`,
      `category=${entry.categorySlug}`,
      `status=${entry.status}`,
      `processed=${entry.articlesProcessed}`,
      `errors=${entry.errors.length}`,
      `started_at=${entry.startedAt}`,
    ];

    if (entry.completedAt) {
      meta.push(`completed_at=${entry.completedAt}`);
    }
    if (entry.notes) {
      meta.push(`notes=${entry.notes}`);
    }

    const line = `[${timestamp}] ${meta.join(' | ')} | errorSamples=${JSON.stringify(entry.errors.slice(0, 3))}`;
    await fs.appendFile(LOG_FILE, `${line}\n`);
  } catch (err) {
    // On serverless platforms like Vercel, filesystem is read-only
    // Gracefully handle and log to console instead
    console.warn('[AutomationLogger] Could not write to filesystem - likely on serverless platform:', err instanceof Error ? err.message : String(err));
    console.info('[AutomationLog]', {
      runId: entry.runId,
      category: entry.categorySlug,
      status: entry.status,
      processed: entry.articlesProcessed,
      errors: entry.errors.length,
      startedAt: entry.startedAt,
      completedAt: entry.completedAt,
    });
  }
}
