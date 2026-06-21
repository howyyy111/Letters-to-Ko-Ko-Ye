import { formatTicket, shortenAddress, formatTimestamp, getCardAccentColor } from '../hooks/useContract.js';
import { t } from '../i18n/translations.js';

export default function LetterCard({ message, lang, onReply, isOwner }) {
  const accentColor = getCardAccentColor(message.sender);

  return (
    <article className="letter-card">
      <span style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        background: accentColor,
        borderRadius: '4px 0 0 4px',
      }} />

      <div className="card-top">
        <span className="ticket-badge">
          {t(lang, 'ticketLabel')} {formatTicket(message.ticketNumber)}
        </span>
        <div className="card-meta">
          <span className="wallet-addr">{shortenAddress(message.sender)}</span>
          <span className="card-time">{formatTimestamp(message.timestamp)}</span>
        </div>
      </div>

      <p className="card-message">&ldquo;{message.text}&rdquo;</p>

      {message.hasReply && (
        <div className="card-reply">
          <div className="reply-label">{t(lang, 'repliedBy')}</div>
          <p className="reply-text">{message.reply}</p>
        </div>
      )}

      {isOwner && !message.hasReply && (
        <div className="card-reply-btn-row">
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => onReply(message)}
            aria-label={`Reply to letter ${formatTicket(message.ticketNumber)}`}
          >
            {t(lang, 'replyBtn')}
          </button>
        </div>
      )}
    </article>
  );
}
