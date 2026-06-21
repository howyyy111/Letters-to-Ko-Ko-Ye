import { useState, useMemo } from 'react';
import { useMessages, useContractOwner, formatTicket } from '../hooks/useContract.js';
import LetterCard from './LetterCard.jsx';
import OwnerReplyPanel from './OwnerReplyPanel.jsx';
import { t } from '../i18n/translations.js';

const PAGE_SIZE = 10;
const TABS = ['all', 'replied'];

export default function Wall({ lang, connectedAddress, signer }) {
  const { messages, loading, error, refetch } = useMessages();
  const ownerAddress = useContractOwner();
  const [replyTarget, setReplyTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const isOwner =
    !!connectedAddress &&
    !!ownerAddress &&
    connectedAddress.toLowerCase() === ownerAddress.toLowerCase();

  const filtered = useMemo(() => {
    let result = [...messages].sort((a, b) => b.ticketNumber - a.ticketNumber);

    if (tab === 'replied') {
      result = result.filter((m) => m.hasReply);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.text.toLowerCase().includes(q) ||
          m.sender.toLowerCase().includes(q) ||
          String(m.ticketNumber).includes(q) ||
          formatTicket(m.ticketNumber).includes(q)
      );
    }

    return result;
  }, [messages, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleTabChange(newTab) {
    setTab(newTab);
    setPage(1);
  }

  function handleSearch(e) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleReplySuccess() {
    setReplyTarget(null);
    setToast(t(lang, 'replySuccess'));
    setTimeout(() => setToast(null), 3000);
    refetch();
  }

  const repliedCount = messages.filter((m) => m.hasReply).length;

  return (
    <section className="wall-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{t(lang, 'wallTitle')}</h2>
          {messages.length > 0 && (
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', marginTop: '0.3rem' }}>
              {messages.length} {messages.length === 1 ? 'letter' : 'letters'} written
            </p>
          )}
        </div>

        {isOwner && (
          <div className="owner-banner">
            ✨ {t(lang, 'ownerPanelTitle')} — You can reply to any letter below
          </div>
        )}

        {!loading && !error && messages.length > 0 && (
          <>
            <div className="wall-controls">
              <div className="wall-tabs">
                <button
                  className={`wall-tab ${tab === 'all' ? 'active' : ''}`}
                  onClick={() => handleTabChange('all')}
                >
                  All letters
                  <span className="tab-count">{messages.length}</span>
                </button>
                <button
                  className={`wall-tab ${tab === 'replied' ? 'active' : ''}`}
                  onClick={() => handleTabChange('replied')}
                >
                  Ko Ko Ye replied ✨
                  <span className="tab-count">{repliedCount}</span>
                </button>
              </div>

              <div className="wall-search">
                <span className="search-icon">🔍</span>
                <input
                  className="search-input"
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search letters..."
                  aria-label="Search letters"
                />
                {search && (
                  <button className="search-clear" onClick={() => { setSearch(''); setPage(1); }}>
                    ×
                  </button>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No letters found</h3>
                <p>Try a different search or tab.</p>
              </div>
            ) : (
              <>
                <div className="wall-grid">
                  {paginated.map((msg) => (
                    <LetterCard
                      key={msg.ticketNumber}
                      message={msg}
                      lang={lang}
                      isOwner={isOwner}
                      onReply={setReplyTarget}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      ← Prev
                    </button>

                    <div className="page-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .reduce((acc, p, idx, arr) => {
                          if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, idx) =>
                          p === '…' ? (
                            <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>
                          ) : (
                            <button
                              key={p}
                              className={`page-btn ${p === currentPage ? 'active' : ''}`}
                              onClick={() => setPage(p)}
                            >
                              {p}
                            </button>
                          )
                        )}
                    </div>

                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {loading && (
          <div className="loading-state">
            <div className="flame-loader">🕯️</div>
            <p className="loading-text">{t(lang, 'wallLoading')}</p>
          </div>
        )}

        {error && !loading && (
          <div className="error-box">
            <p>{t(lang, 'wallError')}</p>
            <button className="btn btn-ghost btn-sm" onClick={refetch}>
              {t(lang, 'errorRetry')}
            </button>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">✉️</div>
            <h3>{t(lang, 'wallEmpty')}</h3>
            <p>{t(lang, 'wallEmptySubtitle')}</p>
          </div>
        )}
      </div>

      {replyTarget && signer && (
        <OwnerReplyPanel
          message={replyTarget}
          signer={signer}
          lang={lang}
          onClose={() => setReplyTarget(null)}
          onSuccess={handleReplySuccess}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </section>
  );
}
