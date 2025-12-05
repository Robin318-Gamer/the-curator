"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ArticleTable, { ArticleQueueEntry } from "@/components/admin/ArticleTable";

const STATUS_OPTIONS = [
  { value: "pending", label: "待處理 Pending" },
  { value: "queued", label: "排程中 Queued" },
  { value: "processing", label: "處理中 Processing" },
  { value: "failed", label: "失敗 Failed" },
  { value: "extracted", label: "已匯入 Extracted" },
  { value: "all", label: "全部 All" },
];

const DEFAULT_LIMIT = 200;

type ProcessSummary = {
  success: boolean;
  processed: number;
  imported: number;
  existing: number;
  failed: number;
  results: Array<{
    id: string;
    status: string;
    message: string;
    sourceArticleId?: string | null;
    articleId?: string;
  }>;
};

export default function AdminArticlesPage() {
  const [entries, setEntries] = useState<ArticleQueueEntry[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [summary, setSummary] = useState<ProcessSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pageAlert, setPageAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editing, setEditing] = useState<{ entryId: string; articleId: string } | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    tags: '',
    images: [] as Array<{ id: string; image_url: string; caption?: string | null }> 
  });
  const [imagesToDelete, setImagesToDelete] = useState<Set<string>>(new Set());
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const selectedCount = selectedIds.size;

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPageAlert(null);
    try {
      const params = new URLSearchParams({ limit: String(DEFAULT_LIMIT) });
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      }
      if (categoryFilter) {
        params.set("category", categoryFilter);
      }
      const response = await fetch(`/api/admin/newslist?${params.toString()}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "無法載入清單");
      }
      setEntries(data.data || []);
      setSelectedIds(prev => {
        const next = new Set<string>();
        for (const id of prev) {
          if (data.data?.some((entry: ArticleQueueEntry) => entry.id === id)) {
            next.add(id);
          }
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "無法載入清單");
    } finally {
      setLoading(false);
    }
  }, [searchValue, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const toggleRowSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllSelection = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(entries.map(entry => entry.id)));
  };

  const runProcessing = useCallback(
    async (payload: { ids?: string[]; processAllPending?: boolean }) => {
      setIsProcessingBatch(true);
      setSummary(null);
      setError(null);
      try {
        const response = await fetch("/api/admin/newslist/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, limit: DEFAULT_LIMIT }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || data.message || "匯入失敗");
        }
        setSummary(data);
        setSelectedIds(new Set());
        await fetchEntries();
      } catch (err) {
        setError(err instanceof Error ? err.message : "匯入失敗");
      } finally {
        setIsProcessingBatch(false);
        setProcessingId(null);
      }
    },
    [fetchEntries]
  );

  const handleProcessSelected = () => {
    if (selectedIds.size === 0) {
      setError("請先勾選至少一筆資料");
      return;
    }
    runProcessing({ ids: Array.from(selectedIds) });
  };

  const handleProcessAllPending = () => {
    runProcessing({ processAllPending: true });
  };

  const handleProcessSingle = async (id: string) => {
    setProcessingId(id);
    await runProcessing({ ids: [id] });
  };

  const canProcessAll = useMemo(() => entries.some(entry => entry.status === "pending"), [entries]);

  const categoryOptions = useMemo(() => {
    const options = new Set<string>();
    entries.forEach(entry => {
      const candidate = entry.meta?.category || entry.meta?.zone;
      if (candidate) {
        options.add(candidate.toString());
      }
    });
    return Array.from(options);
  }, [entries]);

  const handleDeleteEntry = useCallback(async (entry: ArticleQueueEntry) => {
    if (!entry.resolved_article_id) {
      return;
    }
    setDeletingId(entry.resolved_article_id);
    setPageAlert(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/articles/${entry.resolved_article_id}?newslistId=${entry.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "刪除失敗");
      }
      setPageAlert({ type: "success", message: "文章已從資料庫刪除。" });
      await fetchEntries();
    } catch (err) {
      setPageAlert({ type: "error", message: err instanceof Error ? err.message : "刪除失敗" });
    } finally {
      setDeletingId(null);
    }
  }, [fetchEntries]);

  const handleEditEntry = useCallback(async (entry: ArticleQueueEntry) => {
    if (!entry.resolved_article_id) {
      return;
    }
    setIsEditLoading(true);
    setEditError(null);
    try {
      const response = await fetch(`/api/admin/articles/${entry.resolved_article_id}`);
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "無法載入文章");
      }
      const article = payload.data;
      const flattenedContent = (article.content ?? [])
        .map((block: any) => block.text)
        .filter(Boolean)
        .join("\n\n");
      setEditForm({
        title: article.title ?? "",
        tags: article.tags ?? "",
        content: flattenedContent,
        images: article.article_images ?? [],
      });
      setImagesToDelete(new Set());
      setEditing({ entryId: entry.id, articleId: entry.resolved_article_id });
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "無法載入文章");
    } finally {
      setIsEditLoading(false);
    }
  }, [fetchEntries]);

  const handleEditSubmit = useCallback(async () => {
    if (!editing) {
      return;
    }
    setIsEditSubmitting(true);
    setEditError(null);
    try {
      const response = await fetch(`/api/admin/articles/${editing.articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          content: editForm.content,
          tags: editForm.tags,
          removeImageIds: Array.from(imagesToDelete),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "更新失敗");
      }
      setPageAlert({ type: "success", message: "文章已更新。" });
      setEditing(null);
      await fetchEntries();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setIsEditSubmitting(false);
    }
  }, [editForm, editing, fetchEntries, imagesToDelete]);

  const toggleImageDeletion = useCallback((id: string) => {
    setImagesToDelete(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditing(null);
    setEditError(null);
  }, []);


  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Workflow</p>
            <h1 className="text-2xl font-semibold text-slate-900">文章導入佇列</h1>
            <p className="text-sm text-slate-500">
              這裡會顯示從 <span className="font-semibold">/admin/article-list-scraper</span> 匯入的所有待處理 URL，
              你可以在這裡批次或單筆觸發抓取＋寫入資料庫。
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white disabled:opacity-40"
              onClick={fetchEntries}
              disabled={loading}
            >
              {loading ? "重新整理中…" : "重新整理"}
            </button>
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-40"
              onClick={handleProcessAllPending}
              disabled={isProcessingBatch || loading || !canProcessAll}
            >
              {isProcessingBatch ? "批次執行中…" : "一鍵處理所有 Pending"}
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              依狀態篩選
            </label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              分類
            </label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              value={categoryFilter}
              onChange={event => setCategoryFilter(event.target.value)}
            >
              <option value="">全部分類</option>
              {categoryOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              文章 ID 或 URL 搜尋
            </label>
            <div className="mt-1 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="例如 60300123 或 https://www.hk01.com/..."
                value={searchInput}
                onChange={event => setSearchInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter") {
                    setSearchValue(searchInput);
                  }
                }}
              />
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
                onClick={() => setSearchValue(searchInput)}
              >
                搜尋
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span>當前顯示：{entries.length} 筆</span>
          <span className="text-slate-400">|</span>
          <span>已勾選：{selectedCount} 筆</span>
          {selectedCount > 0 && (
            <button
              type="button"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-900 hover:text-white"
              onClick={() => setSelectedIds(new Set())}
            >
              清除選取
            </button>
          )}
          <span className="text-slate-400">|</span>
          <button
            type="button"
            className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-40"
            onClick={handleProcessSelected}
            disabled={selectedCount === 0 || isProcessingBatch}
          >
            匯入所選 {selectedCount > 0 ? `(${selectedCount})` : ""}
          </button>
        </div>
        {pageAlert && (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              pageAlert.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            {pageAlert.message}
          </div>
        )}
      </section>

      {summary && (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">最新批次結果</p>
          <div className="mt-2 flex flex-wrap gap-4 text-base">
            <span>Processed: {summary.processed}</span>
            <span>Imported: {summary.imported}</span>
            <span>Existing: {summary.existing}</span>
            <span className={summary.failed > 0 ? "text-rose-600" : ""}>Failed: {summary.failed}</span>
          </div>
          {summary.results?.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-emerald-800">
              {summary.results.slice(0, 5).map(result => (
                <li key={`${result.id}-${result.status}`}>
                  [{result.status.toUpperCase()}] {result.sourceArticleId || result.id} – {result.message}
                </li>
              ))}
              {summary.results.length > 5 && (
                <li className="text-emerald-600">
                  ... 其餘 {summary.results.length - 5} 筆已折疊，請透過 API 回應 JSON 檢視完整紀錄
                </li>
              )}
            </ul>
          )}
        </section>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <ArticleTable
        entries={entries}
        selectedIds={selectedIds}
        onToggleRow={toggleRowSelection}
        onToggleAll={toggleAllSelection}
        onProcessSingle={handleProcessSingle}
        processingId={processingId}
        disabled={isProcessingBatch || loading}
        onEdit={handleEditEntry}
        onDelete={handleDeleteEntry}
        deletingId={deletingId}
      />
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4 py-6">
          <div className="w-full max-w-4xl space-y-6 overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">編輯文章</p>
                <h2 className="text-xl font-semibold text-slate-900">編輯已匯入文章</h2>
                <p className="text-xs text-slate-500">
                  文章 ID：{editing.articleId} / 佇列紀錄：{editing.entryId}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                onClick={closeEditModal}
                disabled={isEditSubmitting || isEditLoading}
              >
                關閉
              </button>
            </div>
            <div className="grid gap-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-6 shadow-inner lg:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <label className="block space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  標題
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none"
                    value={editForm.title}
                    onChange={event => setEditForm(prev => ({ ...prev, title: event.target.value }))}
                  />
                </label>
                <p className="text-xs text-slate-400">保持 10-80 字，避免過長導致列表截斷。</p>
                <label className="block space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  標籤（逗號分隔）
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none"
                    value={editForm.tags}
                    onChange={event => setEditForm(prev => ({ ...prev, tags: event.target.value }))}
                  />
                </label>
                <p className="text-xs text-slate-400">例如：突發, 交通, 人物，可單一或多個。</p>
              </div>
              <div className="space-y-3">
                <label className="block space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  內容（純文字）
                  <textarea
                    className="min-h-[220px] w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 shadow-inner transition focus:border-slate-900 focus:outline-none"
                    value={editForm.content}
                    onChange={event => setEditForm(prev => ({ ...prev, content: event.target.value }))}
                  />
                </label>
                <p className="text-xs text-slate-400">
                  每個段落請以空白行隔開；系統會自動轉為段落區塊。
                </p>
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                <span>圖片移除</span>
                <span className="text-[0.6rem] tracking-[0.5em] text-slate-400">勾選並儲存即可清除</span>
              </div>
              {editForm.images.length === 0 ? (
                <p className="text-xs text-slate-500">此文章目前沒有附加圖片。</p>
              ) : (
                <div className="grid max-h-72 gap-3 overflow-y-auto">
                  {editForm.images.map(image => {
                    const isMarked = imagesToDelete.has(image.id);
                    return (
                      <label
                        key={image.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-2 text-sm transition ${
                          isMarked ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isMarked}
                          onChange={() => toggleImageDeletion(image.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600"
                        />
                        <div className="flex flex-1 flex-row gap-3">
                          <div className="relative h-12 w-20 overflow-hidden rounded-xl bg-slate-100">
                            {image.image_url ? (
                              <img
                                src={image.image_url}
                                alt={image.caption || "文章圖片"}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[0.65rem] text-slate-400">
                                No preview
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1 text-xs">
                            <p className="font-semibold text-slate-900">{image.caption || "未命名圖片"}</p>
                            <p className="truncate text-slate-400">{image.image_url}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            {editError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {editError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-900"
                onClick={closeEditModal}
                disabled={isEditSubmitting || isEditLoading}
              >
                取消
              </button>
              <button
                type="button"
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-40"
                onClick={handleEditSubmit}
                disabled={isEditLoading || isEditSubmitting}
              >
                {isEditSubmitting ? "儲存中…" : "儲存變更"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
