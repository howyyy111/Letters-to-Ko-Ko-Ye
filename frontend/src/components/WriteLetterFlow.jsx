import { useState, useEffect } from 'react';
import { usePrivy, useWallets, useLogin } from '@privy-io/react-auth';
import { writeMessage, parseTicketFromReceipt, formatTicket } from '../hooks/useContract.js';
import { t } from '../i18n/translations.js';

const STEPS = { LOGIN: 0, PREPARING: 1, WRITE: 2, SUCCESS: 3 };
const MAX_CHARS = 280;

export default function WriteLetterFlow({ lang, onClose, onSuccess }) {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const { wallets } = useWallets();

  const { login } = useLogin({
    onComplete: () => setStep(STEPS.PREPARING),
    onError: () => onClose(),
  });

  // Skip login step if already authenticated
  const [step, setStep] = useState(authenticated ? STEPS.PREPARING : STEPS.LOGIN);
  const [letterText, setLetterText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [prepError, setPrepError] = useState(null);
  const [ticketNumber, setTicketNumber] = useState(null);

  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');


  useEffect(() => {
    if (step !== STEPS.PREPARING || !embeddedWallet) return;

    let cancelled = false;

    async function prepare() {
      setPrepError(null);
      try {
        const token = await getAccessToken();
        const res = await fetch('/api/drip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ walletAddress: embeddedWallet.address }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Preparation failed');
        }

        if (!cancelled) setStep(STEPS.WRITE);
      } catch (err) {
        if (!cancelled) setPrepError(err.message || t(lang, 'errorGeneral'));
      }
    }

    prepare();
    return () => { cancelled = true; };
  }, [step, embeddedWallet, getAccessToken, lang]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!letterText.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const provider = await embeddedWallet.getEthersProvider();
      const signer = await provider.getSigner();
      const receipt = await writeMessage(signer, letterText.trim());

      setTicketNumber(parseTicketFromReceipt(receipt));
      setStep(STEPS.SUCCESS);
      onSuccess?.();
    } catch (err) {
      const rejected = err.code === 4001 || err.code === 'ACTION_REJECTED';
      setError(rejected ? 'Transaction was cancelled.' : t(lang, 'errorTxFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  const charsLeft = MAX_CHARS - letterText.length;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Write your letter">
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <div className="step-indicator" aria-hidden="true">
          {Object.values(STEPS).map((s) => (
            <div key={s} className={`step-dot ${step === s ? 'active' : step > s ? 'done' : ''}`} />
          ))}
        </div>

        {step === STEPS.LOGIN && (
          <div>
            <h2 className="modal-title">{t(lang, 'loginTitle')}</h2>
            <p className="modal-subtitle">{t(lang, 'loginSubtitle')}</p>

            <div style={{
              background: 'linear-gradient(135deg, rgba(212,160,23,0.08), rgba(245,200,66,0.12))',
              border: '1px solid rgba(212,160,23,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '1.5rem' }}>✉️</span>
              <p style={{ fontSize: '0.875rem', color: 'var(--brown)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                {t(lang, 'loginWelcome')}
              </p>
            </div>

            <button className="btn btn-primary btn-full btn-lg" onClick={login} disabled={!ready}>
              {t(lang, 'loginTitle')}
            </button>
          </div>
        )}

        {step === STEPS.PREPARING && (
          <div className="preparing-step">
            {prepError ? (
              <>
                <h2 className="modal-title" style={{ color: '#8B2A1A' }}>
                  {t(lang, 'errorGeneral')}
                </h2>
                <div className="error-box">
                  <p>{prepError}</p>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setPrepError(null); setStep(STEPS.PREPARING); }}
                  >
                    {t(lang, 'errorRetry')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="preparing-animation">✍️</div>
                <h2 className="modal-title">{t(lang, 'preparingTitle')}</h2>
                <p className="modal-subtitle">{t(lang, 'preparingSubtitle')}</p>
              </>
            )}
          </div>
        )}

        {step === STEPS.WRITE && (
          <div>
            <h2 className="modal-title">{t(lang, 'writeTitle')}</h2>
            <p className="modal-subtitle">{t(lang, 'writeSubtitle')}</p>

            <form onSubmit={handleSubmit}>
              <textarea
                className="textarea-paper"
                value={letterText}
                onChange={(e) => setLetterText(e.target.value.slice(0, MAX_CHARS))}
                placeholder={t(lang, 'writePlaceholder')}
                disabled={submitting}
                autoFocus
                aria-label={t(lang, 'writePlaceholder')}
              />

              <div className={`char-counter ${charsLeft < 30 ? 'warning' : ''}`}>
                {charsLeft} {t(lang, 'writeCharCount')}
              </div>

              <div className="write-warning">⚠️ {t(lang, 'writeWarning')}</div>

              {error && (
                <div className="error-box" style={{ marginTop: '0.75rem' }}>
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                style={{ marginTop: '1.25rem' }}
                disabled={submitting || !letterText.trim()}
              >
                {submitting ? '✍️ Signing...' : t(lang, 'writeSubmitBtn')}
              </button>
            </form>
          </div>
        )}

        {step === STEPS.SUCCESS && (
          <div className="success-step">
            <div className="success-icon">🕯️</div>
            <h2 className="modal-title">{t(lang, 'successTitle')}</h2>
            <p className="modal-subtitle">{t(lang, 'successSubtitle')}</p>

            {ticketNumber && (
              <>
                <p style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', marginTop: '0.75rem' }}>
                  {t(lang, 'successTicketLabel')}
                </p>
                <div className="success-ticket">{formatTicket(ticketNumber)}</div>
              </>
            )}

            <div className="success-card-preview">
              <p className="success-message-text">&ldquo;{letterText}&rdquo;</p>
            </div>

            <div className="success-actions">
              <button className="btn btn-primary btn-full" onClick={onClose}>
                {t(lang, 'successViewWall')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
