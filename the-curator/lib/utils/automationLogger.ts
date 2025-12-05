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
}
