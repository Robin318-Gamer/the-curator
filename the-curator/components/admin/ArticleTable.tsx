"use client";

export type ArticleQueueEntry = {
  id: string;
  source_article_id?: string | null;
  url: string;
  status: string;
  attempt_count: number;
  created_at: string;
  last_processed_at?: string | null;
  meta?: Record<string, any> | null;
  source?: {
    name?: string | null;
    source_key?: string | null;
  };
  resolved_article_id?: string | null;
};

interface ArticleTableProps {
  entries: ArticleQueueEntry[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onProcessSingle: (id: string) => void;
  processingId: string | null;
  disabled?: boolean;
  onEdit?: (entry: ArticleQueueEntry) => void;
  onDelete?: (entry: ArticleQueueEntry) => void;
  deletingId?: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-slate-100 dark:bg-stone-700 text-slate-700 dark:text-stone-200",
  queued: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200",
  processing: "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200",
  extracted: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200",
  failed: "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200",
};

export default function ArticleTable({
  entries,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onProcessSingle,
  processingId,
  disabled = false,
  onEdit,
  onDelete,
  deletingId,
}: ArticleTableProps) {
  const allSelected = entries.length > 0 && entries.every(entry => selectedIds.has(entry.id));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-stone-900 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-stone-400 border-b dark:border-stone-700">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 dark:border-stone-600 text-slate-900 dark:text-stone-400 focus:ring-slate-500"
                  checked={allSelected}
                  onChange={event => onToggleAll(event.target.checked)}
                  aria-label="Select all rows"
                  disabled={entries.length === 0}
                />
              </th>
              <th className="whitespace-nowrap px-4 py-3">來源</th>
              <th className="px-4 py-3">文章 ID / URL</th>
              <th className="px-4 py-3">分類 / Title</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3">嘗試</th>
              <th className="px-4 py-3">最後更新</th>
              <th className="px-4 py-3 text-right">動作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-stone-700">
            {entries.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-stone-400">
                  目前沒有符合條件的紀錄。
                </td>
              </tr>
            )}
            {entries.map(entry => {
              const metaTitle = entry.meta?.title || "";
              const metaCategory = entry.meta?.category || entry.meta?.zone;
              const isSelected = selectedIds.has(entry.id);
              return (
                <tr key={entry.id} className="hover:bg-slate-50/60 dark:hover:bg-stone-700/40">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 dark:border-stone-600 text-slate-900 dark:text-stone-400 focus:ring-slate-500"
                      checked={isSelected}
                      onChange={() => onToggleRow(entry.id)}
                      aria-label={`Select article ${entry.source_article_id ?? entry.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-stone-400">
                    <div className="font-medium text-slate-900 dark:text-stone-200">
                      {entry.source?.name || "HK01"}
                    </div>
                    <div className="uppercase tracking-wide text-[10px] text-slate-400 dark:text-stone-500">
                      {entry.source?.source_key || "hk01"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs max-w-[220px] truncate">
                    <div className="font-mono text-sm text-slate-900 dark:text-stone-300">
                      {entry.source_article_id || "—"}
                    </div>
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 dark:text-stone-400 underline-offset-2 hover:text-slate-900 dark:hover:text-stone-200 hover:underline block truncate"
                      title={entry.url}
                    >
                      {entry.url.length > 48
                        ? entry.url.slice(0, 32) + '...' + entry.url.slice(-12)
                        : entry.url}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-stone-300">
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-stone-400">
                      {metaCategory || "未分類"}
                    </div>
                    <div className="font-medium text-slate-900 dark:text-stone-200">
                      {metaTitle || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        statusColors[entry.status] || "bg-slate-200 dark:bg-stone-700 text-slate-700 dark:text-stone-300"
                      }`}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-stone-400">{entry.attempt_count}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-stone-400">
                    <div>
                      建立：{new Date(entry.created_at).toLocaleString("zh-TW")}
                    </div>
                    <div>
                      最近：
                      {entry.last_processed_at
                        ? new Date(entry.last_processed_at).toLocaleString("zh-TW")
                        : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {entry.status === 'extracted' && entry.resolved_article_id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-300 dark:border-stone-600 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-stone-300 transition-colors hover:bg-slate-900 dark:hover:bg-stone-200 hover:text-white dark:hover:text-stone-900 disabled:opacity-50"
                          onClick={() => onEdit?.(entry)}
                          disabled={disabled}
                        >
                          編輯
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-rose-300 dark:border-rose-700 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-600 dark:hover:bg-rose-700 hover:text-white dark:hover:text-rose-100 disabled:opacity-50"
                          onClick={() => onDelete?.(entry)}
                          disabled={disabled || deletingId === entry.resolved_article_id}
                        >
                          {deletingId === entry.resolved_article_id ? '刪除中…' : '刪除'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 dark:border-stone-600 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-stone-300 transition-colors hover:bg-slate-900 dark:hover:bg-stone-200 hover:text-white dark:hover:text-stone-900 disabled:opacity-50"
                        onClick={() => onProcessSingle(entry.id)}
                        disabled={disabled || processingId === entry.id}
                      >
                        {processingId === entry.id ? '處理中…' : '立即匯入'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
