"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

type NewslistEntry = {
  id: string;
  source_article_id?: string | null;
  url: string;
  status: string;
  attempt_count: number;
  last_processed_at?: string | null;
  created_at: string;
  updated_at: string;
  error_log?: string | null;
  resolved_article_id?: string | null;
  meta?: Record<string, any> | null;
  source?: {
    name?: string | null;
    source_key?: string | null;
  };
};

const PAGE_SIZE = 20;
const statusLabels: Record<string, string> = {
  pending: '待處理 Pending',
  queued: '排程中 Queued',
  processing: '處理中 Processing',
  extracted: '完成 Extracted',
  failed: '失敗 Failed',
};

const statusBg: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  queued: 'bg-blue-100 text-blue-800',
  processing: 'bg-amber-100 text-amber-800',
  extracted: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
};

export default function DatabaseAdminPage() {
  const [entries, setEntries] = useState<NewslistEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [resetToken, setResetToken] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const totalPages = useMemo(() => {
    if (!total) return 1;
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  }, [total]);

  const fetchEntries = useCallback(
    async (pageToLoad: number, filter: string, search: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(pageToLoad),
          limit: String(PAGE_SIZE),
        });

        if (filter !== 'all') {
          params.set('status', filter);
        }

        if (search) {
          params.set('search', search);
        }

        const response = await fetch(`/api/admin/newslist?${params.toString()}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || data.message || 'Failed to load newslist');
        }

        setEntries(data.data || []);
        setTotal(data.total || 0);
        setPage(pageToLoad);
        setLastUpdated(new Date().toISOString());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load newslist';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchEntries(1, statusFilter, searchValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEntries]);

  const handleReset = async () => {
    if (!resetToken) {
      setResetStatus('error');
      setResetMessage('請先輸入重置安全令牌 (DATABASE_RESET_TOKEN)。');
      return;
    }

    setResetStatus('running');
    setResetMessage(null);

    try {
      const response = await fetch('/api/admin/reset-database', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resetToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to reset database');
      }

      setResetStatus('success');
      setResetMessage(`資料庫重置完成，用時 ${data.durationMs ?? 0}ms。請重新導入必要資料。`);
      await fetchEntries(1, statusFilter, searchValue);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset database';
      setResetStatus('error');
      setResetMessage(message);
    }
  };

  const statusOptions = Object.keys(statusLabels);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <section className="bg-white border rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">資料庫管理工具</h1>
            <p className="text-sm text-gray-600 mt-1">
              重置資料庫會刪除所有文章、圖片與來源設定，並重新建立最新架構。請在確定已備份後再執行。
            </p>
          </div>
          <button
            onClick={() => fetchEntries(page, statusFilter, searchValue)}
            className="px-3 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? '重新整理中…' : '重新整理列表'}
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,1fr]">
          <div className="border rounded-lg p-4 bg-red-50 border-red-100">
            <h2 className="text-lg font-semibold text-red-800 flex items-center gap-2">
              ⚠️ 危險操作：重置整個資料庫
            </h2>
            <p className="text-sm text-red-700 mt-2">
              此操作不可逆。所有資料會立即清空並重新建立基礎 schema。請務必備份，並在非尖峰時段執行。
            </p>
            <div className="mt-4">
              <label className="text-sm font-medium text-red-900">安全令牌 (DATABASE_RESET_TOKEN)</label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="請貼上安全令牌"
                value={resetToken}
                onChange={event => setResetToken(event.target.value)}
              />
            </div>
            <button
              onClick={handleReset}
              className="mt-4 w-full rounded-lg bg-red-600 text-white py-2 font-semibold shadow hover:bg-red-700 disabled:opacity-60"
              disabled={resetStatus === 'running'}
            >
              {resetStatus === 'running' ? '重置執行中…' : '⚠️ 立即清空並重置資料庫'}
            </button>
            {resetMessage && (
              <p
                className={`mt-3 text-sm ${resetStatus === 'success' ? 'text-green-700' : 'text-red-700'}`}
              >
                {resetMessage}
              </p>
            )}
          </div>

          <div className="border rounded-lg p-4 bg-gray-50 border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">追蹤說明</h2>
            <ul className="mt-2 text-sm text-gray-700 list-disc list-inside space-y-1">
              <li>新聞清單 (newslist) 會記錄所有在文章列表抓到的 URL。</li>
              <li>每次執行抓取或導入時，狀態會自動更新。</li>
              <li>可以利用下方列表追蹤處理失敗的網址，再次提交或手動排查。</li>
              <li>若需要人工標記已處理，可直接在 Supabase console 內更新狀態。</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white border rounded-xl shadow-sm p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Newslist 工作佇列</h2>
            <p className="text-sm text-gray-500">顯示最近偵測到的網址與處理狀態。</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">狀態</label>
              <select
                className="mt-1 w-full md:w-40 border rounded-lg px-3 py-2"
                value={statusFilter}
                onChange={event => {
                  const value = event.target.value;
                  setStatusFilter(value);
                  fetchEntries(1, value, searchValue);
                }}
              >
                <option value="all">全部狀態</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {statusLabels[status] || status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">搜尋 (文章ID 或 URL)</label>
              <div className="mt-1 flex">
                <input
                  className="flex-1 border rounded-l-lg px-3 py-2"
                  placeholder="60300123 或 https://..."
                  value={searchValue}
                  onChange={event => setSearchValue(event.target.value)}
                />
                <button
                  className="px-3 py-2 border border-l-0 rounded-r-lg bg-gray-900 text-white"
                  onClick={() => fetchEntries(1, statusFilter, searchValue)}
                >
                  搜尋
                </button>
              </div>
            </div>
          </div>
        </div>

        {lastUpdated && (
          <p className="text-xs text-gray-500 mt-2">
            最後更新時間：{new Date(lastUpdated).toLocaleString('zh-TW')}
          </p>
        )}

        <div className="mt-4 overflow-hidden border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3">來源</th>
                <th className="px-4 py-3">文章ID / URL</th>
                <th className="px-4 py-3">狀態</th>
                <th className="px-4 py-3">嘗試次數</th>
                <th className="px-4 py-3">最後處理</th>
                <th className="px-4 py-3">錯誤/備註</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    目前沒有任何紀錄。
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    載入中…
                  </td>
                </tr>
              )}

              {!loading &&
                entries.map(entry => (
                  <tr key={entry.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {entry.source?.name || '未知來源'}
                      </div>
                      <div className="text-xs text-gray-500">{entry.source?.source_key}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-gray-900">
                        {entry.source_article_id || '—'}
                      </div>
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 text-xs break-all hover:underline"
                      >
                        {entry.url}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          statusBg[entry.status] || 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {statusLabels[entry.status] || entry.status}
                      </span>
                      {entry.resolved_article_id && (
                        <div className="text-[10px] text-gray-500 mt-1">
                          Article UUID: {entry.resolved_article_id}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{entry.attempt_count}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-900">
                        {entry.last_processed_at
                          ? new Date(entry.last_processed_at).toLocaleString('zh-TW')
                          : '—'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        建立：{new Date(entry.created_at).toLocaleString('zh-TW')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-red-600 whitespace-pre-wrap">
                      {entry.error_log || entry.meta?.note || '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-600">
            共 {total} 筆，頁 {page} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 border rounded-lg disabled:opacity-50"
              onClick={() => fetchEntries(page - 1, statusFilter, searchValue)}
              disabled={page <= 1 || loading}
            >
              上一頁
            </button>
            <button
              className="px-3 py-2 border rounded-lg disabled:opacity-50"
              onClick={() => fetchEntries(page + 1, statusFilter, searchValue)}
              disabled={page >= totalPages || loading}
            >
              下一頁
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
