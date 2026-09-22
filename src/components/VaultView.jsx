import React, { useState } from 'react';
import { ServiceIcon } from '../services/ServiceIcon.jsx';

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
  return (
    <article className={`entry-card ${entry.corrupted ? 'entry-corrupted' : ''}`}>
      <button className="entry-main" onClick={() => !entry.corrupted && onEdit(entry)} disabled={entry.corrupted}>
        <ServiceIcon entry={entry} size="lg" />
        <span className="entry-text">
          <strong>{entry.title || 'ללא שם'}</strong>
          <small dir="auto">{entry.username || entry.url || (entry.corrupted ? 'לא ניתן לפענח' : 'ללא שם משתמש')}</small>
        </span>
      </button>
      {!entry.corrupted && (
        <div className="entry-actions">
          {entry.password && <button className="mini-button" onClick={() => setShowPassword((v) => !v)} title={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}>{showPassword ? '🙈' : '👁'}</button>}
          {entry.username && <button className="mini-button" onClick={() => onCopy(entry.username, 'שם המשתמש הועתק')} title="העתק שם משתמש">👤</button>}
          {entry.password && <button className="mini-button" onClick={() => onCopy(entry.password, 'הסיסמה הועתקה')} title="העתק סיסמה">⧉</button>}
          <button className="mini-button danger-ghost" onClick={() => onDelete(entry)} title="מחק">⌫</button>
        </div>
      )}
      {showPassword && entry.password && <div className="revealed-password" dir="ltr">{entry.password}</div>}
    </article>
  );
}
