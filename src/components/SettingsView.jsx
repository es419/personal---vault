import React, { useMemo, useState } from 'react';
import { Field, Modal } from './Common.jsx';

export const AUTO_LOCK_OPTIONS = [
  { value: 5 * 60 * 1000, label: '5 דקות' },
  { value: 15 * 60 * 1000, label: '15 דקות' },
  { value: 30 * 60 * 1000, label: '30 דקות' },
  { value: 60 * 60 * 1000, label: 'שעה' },
  { value: 4 * 60 * 60 * 1000, label: '4 שעות' },
  { value: 12 * 60 * 60 * 1000, label: '12 שעות' },
  { value: 24 * 60 * 60 * 1000, label: 'יום' },
  { value: 0, label: 'אף פעם' }
];

export default function SettingsView({
  email,
  entryCount,
  quickEnabled,
  quickSupported,
  busy,
  theme,
  onThemeChange,
  autoLockMs,
  onAutoLockChange,
  onToggleQuick,
  onLock,
  onSignOut,
  onDeleteVault
}) {
  const autoLockLabel = AUTO_LOCK_OPTIONS.find((item) => item.value === autoLockMs)?.label || '5 דקות';

  return (
    <div className="settings-list">
      <section className="setting-section">
        <h3>חשבון</h3>
        <div className="setting-card split"><div><strong>{email}</strong><small>Firebase Authentication</small></div><button className="secondary compact" onClick={onSignOut}>החלף חשבון</button></div>
        <div className="setting-card split"><div><strong>{entryCount} רשומות</strong><small>התוכן נשמר ב־Firestore כשהוא מוצפן</small></div><span className="status-pill">מוצפן</span></div>
      </section>

      <section className="setting-section">
        <h3>אבטחה</h3>
        <div className="setting-card split"><div><strong>Quick Unlock</strong><small>{quickSupported ? 'Face ID / Windows Hello דרך Passkey PRF במכשיר הזה' : 'לא נתמך בדפדפן הזה'}</small></div><button className={quickEnabled ? 'danger-outline compact' : 'secondary compact'} disabled={busy || !quickSupported} onClick={onToggleQuick}>{quickEnabled ? 'כבה' : 'הפעל'}</button></div>
        <label className="setting-card split setting-select"><div><strong>נעילה אוטומטית</strong><small>ננעל אחרי חוסר פעילות. סגירת האפליקציה תמיד מוציאה את המפתח מהזיכרון.</small></div><select value={autoLockMs} onChange={(e) => onAutoLockChange(Number(e.target.value))}>{AUTO_LOCK_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <button className="setting-card action-row" onClick={onLock}><span><strong>נעל עכשיו</strong><small>מוציא את Vault Key מהזיכרון</small></span><b>›</b></button>
      </section>

      <section className="setting-section">
        <h3>מראה</h3>
        <div className="segmented">
          <button className={theme === 'system' ? 'active' : ''} onClick={() => onThemeChange('system')}>מערכת</button>
          <button className={theme === 'light' ? 'active' : ''} onClick={() => onThemeChange('light')}>בהיר</button>
          <button className={theme === 'dark' ? 'active' : ''} onClick={() => onThemeChange('dark')}>כהה</button>
        </div>
      </section>

      <section className="setting-section danger-zone">
        <h3>מחיקה</h3>
        <button className="setting-card action-row danger-text" onClick={onDeleteVault}><span><strong>מחק את הכספת והחשבון</strong><small>מוחק את כל ciphertext מ־Firestore ואת משתמש Firebase</small></span><b>›</b></button>
      </section>

      <div className="settings-footnote">נעילה אוטומטית: {autoLockLabel} · Master Password ו־Recovery Key אינם נשמרים ב־Firebase.</div>
    </div>
  );
}

export function ConfirmDeleteEntry({ entry, busy, onCancel, onConfirm }) {
  return (
    <Modal title="למחוק את הרשומה?" onClose={busy ? undefined : onCancel}>
      <p>הרשומה <strong>{entry?.title}</strong> תימחק מ־Firestore ותיעלם מכל המכשירים לאחר סנכרון.</p>
      <div className="modal-actions"><button className="secondary" onClick={onCancel} disabled={busy}>ביטול</button><button className="danger-button" onClick={onConfirm} disabled={busy}>{busy ? 'מוחק…' : 'מחק'}</button></div>
    </Modal>
  );
}

export function DeleteVaultDialog({ busy, error, onCancel, onDelete }) {
  const [master, setMaster] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const valid = useMemo(() => master.length > 0 && confirmation === 'DELETE', [master, confirmation]);

  return (
    <Modal title="מחיקת הכספת" onClose={busy ? undefined : onCancel}>
      <div className="warning-box danger-warning">הפעולה בלתי הפיכה. כל הרשומות המוצפנות והחשבון ב־Firebase יימחקו.</div>
      <Field label="Master Password"><input type="password" value={master} onChange={(e) => setMaster(e.target.value)} /></Field>
      <Field label="הקלד DELETE לאישור"><input dir="ltr" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></Field>
      {error && <div className="form-error">{error}</div>}
      <div className="modal-actions"><button className="secondary" onClick={onCancel} disabled={busy}>ביטול</button><button className="danger-button" disabled={busy || !valid} onClick={() => onDelete(master)}>{busy ? 'מוחק…' : 'מחק לצמיתות'}</button></div>
    </Modal>
  );
}
