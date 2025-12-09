"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

const quickActions = [
  {
    title: 'Bulk save HK01',
    description: 'Seed fresh article links from HK01 scheduler category.',
    href: '/api/automation/bulk-save/hk01',
    variant: 'glow-cyan',
  },
  {
    title: 'Bulk save MingPao',
    description: 'Seed fresh article links from MingPao scheduler category.',
    href: '/api/automation/bulk-save/mingpao',
    variant: 'glow-blue',
  },
  {
    title: 'Scrape next article',
    description: 'Process pending articles from newslist queue (supports all sources).',
    href: '/api/admin/newslist/process',
    variant: 'glow-amber',
  },
  {
    title: 'Inspect automation history',
    description: 'Query automation_history for recent run metadata.',
    href: '/admin/event-log',
    variant: 'glow-lavender',
  },
];

const adminTools = [
  { label: 'Article list scraper', href: '/admin/article-list-scraper' },
  { label: 'Live scraper URL tester', href: '/admin/scraper-url-test' },
  { label: 'Scraper debug panel', href: '/admin/scraper-test' },
  { label: 'Database status view', href: '/admin/database' },
];

export default function AdminLanding() {

  const [status, setStatus] = useState<Record<string, { state: 'idle' | 'loading' | 'success' | 'error'; message?: string }>>({});
  const [automation, setAutomation] = useState<{ [key: string]: boolean }>({
    'Bulk save HK01': true,
    'Bulk save MingPao': true,
    'Scrape next article': true,
  });
  const [metrics, setMetrics] = useState<{ avgSeed?: string; activeSources?: number; pendingRows?: number }>({});


  const handleAction = useCallback(async (action: typeof quickActions[number]) => {
    setStatus((prev) => ({
      ...prev,
      [action.title]: { state: 'loading' },
    }));
    try {
      const response = await fetch(action.href, { method: 'POST' });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      setStatus((prev) => ({
        ...prev,
        [action.title]: { state: 'success', message: 'Request accepted' },
      }));
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        [action.title]: { state: 'error', message: error instanceof Error ? error.message : 'Unknown' },
      }));
    }
  }, []);

  // Fetch dashboard metrics on load and periodically
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/admin/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };
    
    fetchMetrics();
    const intervalId = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(intervalId);
  }, []);

  // Automation for Bulk save HK01
  useEffect(() => {
    const bulkSaveAction = quickActions.find((action) => action.title === 'Bulk save HK01');
    if (!bulkSaveAction || !automation['Bulk save HK01']) return;
    let isRunning = false;
    const runBulkSave = async () => {
      if (isRunning) return;
      isRunning = true;
      try {
        await handleAction(bulkSaveAction);
      } finally {
        isRunning = false;
      }
    };
    const intervalId = setInterval(runBulkSave, 60_000);
    return () => clearInterval(intervalId);
  }, [automation['Bulk save HK01'], handleAction]);

  // Automation for Scrape next article
  useEffect(() => {
    const scrapeAction = quickActions.find((action) => action.title === 'Scrape next article');
    if (!scrapeAction || !automation['Scrape next article']) return;
    let isRunning = false;
    const runScrape = async () => {
      if (isRunning) return;
      isRunning = true;
      try {
        await handleAction(scrapeAction);
      } finally {
        isRunning = false;
      }
    };
    const intervalId = setInterval(runScrape, 60_000);
    return () => clearInterval(intervalId);
  }, [automation['Scrape next article'], handleAction]);

  return (
    <main className="admin-root">
      <section className="hero">
        <p className="tagline">The Curator Control Room</p>
        <h1>
          Automation at scale that still feels <span>tactile</span>
        </h1>
        <p className="lead">
          Run schedulers, gate scrapers, and surface the tables that power analytics in one
          deliberate cockpit. Everything on this page links directly to the helpers you rely on.
        </p>
        <div className="hero-cta">
          <Link className="primary" href="/admin/article-list-scraper">
            Open article list scraper
          </Link>
          <span className="flash">Live data · Service role only</span>
        </div>
        <div className="hero-metrics">
          <div>
            <strong>{metrics.avgSeed ?? '–'}</strong>
            <span>avg automation seed</span>
          </div>
          <div>
            <strong>{metrics.activeSources ?? '–'}</strong>
            <span>active sources</span>
          </div>
          <div>
            <strong>{metrics.pendingRows ?? '–'}</strong>
            <span>pending newslist rows</span>
          </div>
        </div>
      </section>

      <section className="quick">
        {quickActions.map((action) => (
          <div key={action.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleAction(action)}
              className={`quick-card ${action.variant}`}
              disabled={status[action.title]?.state === 'loading'}
            >
              <div>
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
              <span>
                {status[action.title]?.state === 'loading'
                  ? 'Loading…'
                  : status[action.title]?.state === 'error'
                  ? `Error: ${status[action.title]?.message}`
                  : 'POST'}
              </span>
            </button>
            {(action.title === 'Bulk save HK01' || action.title === 'Scrape next article') && (
              <label style={{ marginLeft: '0.5rem', fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={automation[action.title]}
                  onChange={e => setAutomation(a => ({ ...a, [action.title]: e.target.checked }))}
                  style={{ accentColor: action.title === 'Bulk save HK01' ? '#91f3ff' : '#ffbb33' }}
                />
                Automation
              </label>
            )}
          </div>
        ))}
      </section>

      <section className="tools">
        <header>
          <div>
            <p className="eyebrow">Tools</p>
            <h2>Launch the admin utilities</h2>
          </div>
        </header>
        <div className="tools-grid">
          {adminTools.map((tool) => (
            <Link key={tool.label} href={tool.href} className="tool-card">
              <p>{tool.label}</p>
              <span>→</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="status">
        <div className="status-card">
          <h3>Automation history snapshot</h3>
          <p>
            Run ID <strong>f2a31b5d</strong> • HK01 bulk save → articles inserted • scraper metadata
            updated at 11:42
          </p>
        </div>
        <div className="status-card">
          <h3>Security reminder</h3>
          <p>
            RLS policies guard automation_history and scraper tables. Only authenticated service-role
            clients can mutate these records; public reads are purposely shallow.
          </p>
        </div>
      </section>

      <style jsx>{`
        .admin-root {
          min-height: 100vh;
          background: linear-gradient(120deg, #23272f 0%, #2c2f38 100%);
          color: #f2f2f2;
          padding: 3rem clamp(1.25rem, 2vw, 3rem) 4rem;
          font-family: var(--font-inter);
        }

        @media (prefers-color-scheme: light) {
          .admin-root {
            background: linear-gradient(120deg, #f8fafc 0%, #f0f4f8 100%);
            color: #1e293b;
          }
        }

        .hero {
          max-width: 960px;
          margin: 0 auto 2.5rem;
          text-align: left;
        }

        .tagline {
          text-transform: uppercase;
          letter-spacing: 0.4em;
          color: #b0b0b0;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        h1 {
          font-size: clamp(2.5rem, 4vw, 4rem);
          margin-bottom: 1rem;
          line-height: 1.1;
          color: #e6e6e6;
        }

        h1 span {
          color: #4fd1c5;
          text-shadow: 0 0 10px rgba(79, 209, 197, 0.6);
        }

        .lead {
          max-width: 720px;
          color: #d0d0d0;
          margin-bottom: 1.75rem;
          font-size: 1.1rem;
        }

        .hero-cta {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .hero-cta .primary,
        .quick-card,
        .tool-card {
          border-radius: 999px;
          padding: 0.65rem 1.8rem;
          font-weight: 600;
          border: 1px solid #444;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .hero-cta .primary {
          background: linear-gradient(120deg, #4fd1c5, #2b6cb0);
          box-shadow: 0 10px 25px rgba(79, 209, 197, 0.3);
          color: #fff;
        }

        .hero-cta .primary:hover {
          transform: translateY(-2px);
        }

        .flash {
          font-size: 0.85rem;
          color: #b0b0b0;
          border-radius: 999px;
          padding: 0.5rem 1rem;
          border: 1px solid #444;
        }

        .hero-metrics {
          display: flex;
          gap: 2rem;
          font-size: 0.95rem;
        }

        .hero-metrics strong {
          display: block;
          font-size: 1.8rem;
          color: #91f3ff;
        }

        .quick {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.2rem;
          margin-bottom: 2.5rem;
        }

        .quick-card {
          background: #23272f;
          border-radius: 18px;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          min-height: 150px;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border: 1px solid #444;
          cursor: pointer;
        }

        .quick-card:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .quick-card span {
          font-size: 0.85rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #b0b0b0;
        }

        .quick-card h3 {
          font-size: 1.2rem;
          color: #f2f2f2;
        }

        .quick-card p {
          color: #d0d0d0;
          font-size: 1rem;
        }

        .glow-cyan::after,
        .glow-amber::after,
        .glow-lavender::after {
          content: '';
          position: absolute;
          inset: 0;
          filter: blur(18px);
          opacity: 0.3;
          z-index: -1;
        }

        .glow-cyan::after {
          background: radial-gradient(circle, rgba(79, 209, 197, 0.4), transparent 70%);
        }

        .glow-amber::after {
          background: radial-gradient(circle, rgba(255, 187, 51, 0.3), transparent 70%);
        }

        .glow-lavender::after {
          background: radial-gradient(circle, rgba(203, 213, 255, 0.3), transparent 70%);
        }

        .tools {
          margin-bottom: 2.5rem;
          max-width: 960px;
        }

        .tools header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.4em;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .tool-card {
          background: #23272f;
          border: 1px solid #444;
          padding: 1.25rem;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1rem;
          transition: transform 0.2s ease;
        }

        .tool-card:hover {
          transform: translateY(-4px);
          background: #2c2f38;
        }

        .status {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1rem;
        }

        .status-card {
          background: #23272f;
          border-radius: 16px;
          padding: 1.3rem;
          border: 1px solid #444;
          box-shadow: 0 20px 35px rgba(0, 0, 0, 0.35);
        }

        .status-card h3 {
          margin-bottom: 0.5rem;
          color: #f2f2f2;
        }

        .status-card p {
          color: #d0d0d0;
        }

        @media (max-width: 640px) {
          .hero-metrics {
            flex-direction: column;
            gap: 0.5rem;
          }

          .hero-cta {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}