import { useState } from 'react';
import { replyToMessage, formatTicket } from '../hooks/useContract.js';
import { t } from '../i18n/translations.js';

export default function OwnerReplyPanel({ message, signer, lang, onClose, onSuccess }) {
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      await replyToMessage(signer, message.ticketNumber, replyText.trim());
      onSuccess();
    } catch {
      setError(t(lang, 'errorTxFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <h3 className="modal-title">{t(lang, 'ownerPanelTitle')}</h3>
        <p className="modal-subtitle" style={{ marginBottom: '1rem' }}>
          {t(lang, 'replyBtn')} — Letter {formatTicket(message.ticketNumber)}
        </p>

        <blockquote style={{
          borderLeft: '3px solid var(--golden)',
          paddingLeft: '0.75rem',
          marginBottom: '1rem',
          color: 'var(--ink-muted)',
          fontStyle: 'italic',
          fontSize: '0.9rem',
        }}>
          &ldquo;{message.text}&rdquo;
        </blockquote>

        <form onSubmit={handleSubmit}>
          <textarea
            className="reply-modal-input"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={t(lang, 'replyPlaceholder')}
            maxLength={500}
            disabled={submitting}
            autoFocus
          />

          {error && (
            <div className="error-box" style={{ marginTop: '0.75rem' }}>
              <p>{error}</p>
            </div>
          )}

          <div className="reply-modal-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !replyText.trim()}
              style={{ flex: 1 }}
            >
              {submitting ? '...' : t(lang, 'replySendBtn')}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              {t(lang, 'replyCancelBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
