import React, { useEffect, useRef, useState } from 'react';
import { ServiceIcon } from '../services/ServiceIcon.jsx';
import { Modal } from './Common.jsx';

const LONG_PRESS_MS = 600;
const LONG_PRESS_MOVE_CANCEL_PX = 10;
const DOUBLE_TAP_MS = 240;

export default function VaultView({ entries, search, setSearch, onAdd, onEdit, onDelete, onCopy, onRefresh, refreshing }) {
  return (
    <div className="vault-view">
      <div className="vault-toolbar">
        <label className="search-box">
          <span>⌕</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש חכם בכספת…" autoComplete="off" />
          {search && <button onClick={() => setSearch('')} aria-label="נקה חיפוש">×</button>}
        </label>
        <button className="icon-button refresh-button" onClick={onRefresh} disabled={refreshing} title="סנכרן">{refreshing ? '…' : '↻'}</button>
      </div>

      <div className="vault-summary"><span>{entries.length} רשומות</span><span className="cloud-status">☁︎ מוצפן ומסונכרן</span></div>

      <div className="entry-list">
        {entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔐</div>
            <h3>{search ? 'לא נמצאו תוצאות' : 'הכספת עדיין ריקה'}</h3>
            <p>{search ? 'נסה שם שירות, כתובת, שם משתמש או מילה מההערות.' : 'הוסף את החשבון הראשון שלך.'}</p>
            {!search && <button className="primary compact" onClick={onAdd}>הוסף סיסמה</button>}
          </div>
        ) : entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} onCopy={onCopy} />
        ))}
      </div>

      <button className="fab" onClick={onAdd} aria-label="הוסף רשומה">+</button>
    </div>
  );
}

function EntryCard({ entry, onEdit, onDelete, onCopy }) {
  const [showPassword, setShowPassword] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [copiedPulse, setCopiedPulse] = useState(false);
  const longPressTimerRef = useRef(null);
  const pressStartRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const singleTapTimerRef = useRef(null);
  const copiedPulseTimerRef = useRef(null);


  useEffect(() => () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    if (copiedPulseTimerRef.current) clearTimeout(copiedPulseTimerRef.current);
  }, []);

  function clearPendingSingleTap() {
    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }
  }

  function pulseCopied() {
    if (copiedPulseTimerRef.current) clearTimeout(copiedPulseTimerRef.current);
    setCopiedPulse(true);
    copiedPulseTimerRef.current = setTimeout(() => {
      copiedPulseTimerRef.current = null;
      setCopiedPulse(false);
    }, 360);
  }

  function clearLongPress() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pressStartRef.current = null;
    setPressing(false);
  }

  function handlePointerDown(event) {
    if (entry.corrupted || event.target.closest('.mini-button')) return;

    longPressTriggeredRef.current = false;
    pressStartRef.current = { x: event.clientX, y: event.clientY };
    setPressing(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);

    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      longPressTriggeredRef.current = true;
      pressStartRef.current = null;
      setPressing(false);
      clearPendingSingleTap();
      onDelete(entry);
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(event) {
    if (!pressStartRef.current) return;
    const dx = event.clientX - pressStartRef.current.x;
    const dy = event.clientY - pressStartRef.current.y;
    if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_CANCEL_PX) clearLongPress();
  }

  function handlePointerEnd(event) {
    try { event.currentTarget.releasePointerCapture?.(event.pointerId); } catch {}
    clearLongPress();
  }

  function handleMainClick() {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    if (entry.corrupted) return;

    if (!entry.password) {
      onEdit(entry);
      return;
    }

    if (singleTapTimerRef.current) {
      clearPendingSingleTap();
      onCopy(entry.password, 'הסיסמה הועתקה');
      pulseCopied();
      return;
    }

    singleTapTimerRef.current = setTimeout(() => {
      singleTapTimerRef.current = null;
      onEdit(entry);
    }, DOUBLE_TAP_MS);
  }

  return (
    <>
      <div
        className={`entry-card-shell ${pressing ? 'is-pressing' : ''} ${copiedPulse ? 'is-copied' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onContextMenu={(event) => event.preventDefault()}
      >
        <article className={`entry-card ${entry.corrupted ? 'entry-corrupted' : ''}`}>
          {!entry.corrupted && (
            <div className="entry-actions-rail" aria-label="פעולות מהירות">
              {entry.password && (
                <button className="mini-button" onClick={() => setShowPassword(true)} title="הצג סיסמה" aria-label="הצג סיסמה">
                  <ActionIcon name="eye" />
                </button>
              )}
              {entry.password && (
                <button className="mini-button" onClick={() => onCopy(entry.password, 'הסיסמה הועתקה')} title="העתק סיסמה" aria-label="העתק סיסמה">
                  <ActionIcon name="copy" />
                </button>
              )}
              {entry.username && (
                <button className="mini-button" onClick={() => onCopy(entry.username, 'שם המשתמש הועתק')} title="העתק שם משתמש" aria-label="העתק שם משתמש">
                  <ActionIcon name="user" />
                </button>
              )}
            </div>
          )}

          <button className="entry-main" onClick={handleMainClick} disabled={entry.corrupted}>
            <ServiceIcon entry={entry} size="lg" />
            <span className="entry-text">
              <strong>{entry.title || 'ללא שם'}</strong>
              <small dir="auto">{entry.username || entry.url || (entry.corrupted ? 'לא ניתן לפענח' : 'ללא שם משתמש')}</small>
            </span>
          </button>
        </article>
      </div>

      {showPassword && entry.password && (
        <PasswordPreviewModal entry={entry} onCopy={onCopy} onClose={() => setShowPassword(false)} />
      )}
    </>
  );
}

function PasswordPreviewModal({ entry, onCopy, onClose }) {
  return (
    <Modal title="תצוגת סיסמה" onClose={onClose}>
      <div className="password-modal-body">
        <div className="password-modal-header">
          <ServiceIcon entry={entry} size="md" />
          <div className="password-modal-meta">
            <strong>{entry.title || 'ללא שם'}</strong>
            <small dir="auto">{entry.username || entry.url || 'רשומה שמורה'}</small>
          </div>
        </div>

        <div className="password-preview-box" dir="ltr">{entry.password}</div>

        <div className="password-modal-actions">
          <button className="primary" onClick={() => onCopy(entry.password, 'הסיסמה הועתקה')}>העתק סיסמה</button>
          <button className="secondary" onClick={onClose}>סגור</button>
        </div>
      </div>
    </Modal>
  );
}

function ActionIcon({ name }) {
  const common = {
    width: 21,
    height: 21,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.85,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true
  };

  if (name === 'eye') {
    return (
      <svg {...common}>
        <path d="M2.7 12s3.2-5.5 9.3-5.5S21.3 12 21.3 12 18.1 17.5 12 17.5 2.7 12 2.7 12Z" />
        <circle cx="12" cy="12" r="2.4" />
      </svg>
    );
  }

  if (name === 'copy') {
    return (
      <svg {...common}>
        <rect x="8" y="8" width="10" height="10" rx="2" />
        <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6" />
    </svg>
  );
}
