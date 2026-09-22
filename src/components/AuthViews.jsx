import React, { useMemo, useState } from 'react';
import { BrandMark, Field } from './Common.jsx';

function AuthCard({ title, subtitle, children }) {
  return (
    <div className="auth-shell">
      <section className="auth-card">
        <BrandMark />
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
        {children}
      </section>
    </div>
  );
}

export function FirebaseSetupScreen() {
  return (
    <AuthCard title="Vault" subtitle="הקוד מוכן, אבל Firebase עדיין לא מחובר לפרויקט הזה.">
      <div className="setup-box">
        <strong>צריך להגדיר 5 ערכים בלבד:</strong>
        <code>VITE_FIREBASE_API_KEY</code>
        <code>VITE_FIREBASE_AUTH_DOMAIN</code>
        <code>VITE_FIREBASE_PROJECT_ID</code>
        <code>VITE_FIREBASE_MESSAGING_SENDER_ID</code>
        <code>VITE_FIREBASE_APP_ID</code>
      </div>
      <p className="muted small-text">הערכים האלה הם Firebase Web config ציבורי, לא סוד שמפענח את הכספת.</p>
    </AuthCard>
  );
}

export function SignInScreen({ busy, error, onGoogle }) {
  return (
    <AuthCard title="Vault" subtitle="הכספת מוצפנת אצלך במכשיר לפני שהיא נשמרת בענן.">
      {error && <div className="form-error">{error}</div>}
      <button className="google-button" disabled={busy} onClick={onGoogle}>
        <span className="google-g">G</span>
        <span>{busy ? 'מתחבר…' : 'המשך עם Google'}</span>
      </button>
      <div className="security-note">Firebase מזהה את החשבון בלבד. ה־Master Password לא נשלח ל־Firebase.</div>
    </AuthCard>
  );
}

export function CreateVaultScreen({ email, busy, error, onCreate, onSignOut }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const localError = useMemo(() => {
    if (!password && !confirm) return '';
    if (password.length > 0 && password.length < 12) return 'Master Password צריך להכיל לפחות 12 תווים';
    if (confirm && password !== confirm) return 'הסיסמאות לא תואמות';
    return '';
  }, [password, confirm]);

  return (
    <AuthCard title="צור כספת" subtitle={email}>
      <form onSubmit={(e) => { e.preventDefault(); if (!localError && password) onCreate(password); }}>
        <Field label="Master Password" hint="נשאר רק אצלך ומשמש להצפנת מפתח הכספת.">
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Field label="אימות Master Password">
          <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </Field>
        {(localError || error) && <div className="form-error">{localError || error}</div>}
        <button className="primary" disabled={busy || Boolean(localError) || password.length < 12}>{busy ? 'מכין…' : 'המשך ל־Recovery Key'}</button>
      </form>
      <button className="text-button" onClick={onSignOut}>השתמש בחשבון Google אחר</button>
    </AuthCard>
  );
}

export function RecoveryConfirmScreen({ recoveryKey, busy, error, onCopy, onFinish, onCancel }) {
  const [confirmation, setConfirmation] = useState('');
  const expected = recoveryKey.replace(/-/g, '').slice(-6).toUpperCase();
  const valid = confirmation.replace(/[\s-]/g, '').toUpperCase() === expected;

  return (
    <AuthCard title="שמור את Recovery Key" subtitle="זה הגיבוי היחיד שמאפשר להחליף Master Password בלי לפענח את הכספת בשרת.">
      <div className="recovery-key-box" dir="ltr">{recoveryKey}</div>
      <button className="secondary" onClick={() => onCopy(recoveryKey)}>העתק Recovery Key</button>
      <div className="warning-box">שמור אותו במקום נפרד. אל תשמור אותו בתוך הכספת עצמה.</div>
      <Field label="כדי לוודא ששמרת — הקלד את 6 התווים האחרונים" hint="בלי מקפים. לדוגמה: ABC123">
        <input dir="ltr" inputMode="text" maxLength={6} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="6 תווים אחרונים" />
      </Field>
      {error && <div className="form-error">{error}</div>}
      <button className="primary" disabled={busy || !valid} onClick={onFinish}>{busy ? 'יוצר כספת…' : 'יצרתי גיבוי — צור כספת'}</button>
      <button className="text-button" disabled={busy} onClick={onCancel}>חזור</button>
    </AuthCard>
  );
}

export function UnlockScreen({ email, busy, error, quickEnabled, onUnlock, onQuickUnlock, onRecover, onSignOut }) {
  const [password, setPassword] = useState('');
  return (
    <AuthCard title="פתח את הכספת" subtitle={email}>
      {quickEnabled && <button className="quick-button" disabled={busy} onClick={onQuickUnlock}>◉ פתח עם Face ID / Windows Hello</button>}
      <form onSubmit={(e) => { e.preventDefault(); onUnlock(password); }}>
        <Field label="Master Password">
          <input type="password" autoComplete="current-password" autoFocus={!quickEnabled} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <div className="form-error">{error}</div>}
        <button className="primary" disabled={busy || !password}>{busy ? 'פותח…' : 'פתח כספת'}</button>
      </form>
      <button className="text-button" onClick={onRecover}>שכחתי Master Password</button>
      <button className="text-button subtle" onClick={onSignOut}>החלף חשבון</button>
    </AuthCard>
  );
}

export function RecoverScreen({ email, busy, error, onRecover, onBack }) {
  const [recoveryKey, setRecoveryKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const localError = password && password.length < 12
    ? 'Master Password החדש צריך להכיל לפחות 12 תווים'
    : (confirm && password !== confirm ? 'הסיסמאות לא תואמות' : '');

  return (
    <AuthCard title="שחזור כספת" subtitle={email}>
      <form onSubmit={(e) => { e.preventDefault(); if (!localError) onRecover(recoveryKey, password); }}>
        <Field label="Recovery Key">
          <textarea dir="ltr" rows={3} value={recoveryKey} onChange={(e) => setRecoveryKey(e.target.value)} required />
        </Field>
        <Field label="Master Password חדש">
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Field label="אימות Master Password חדש">
          <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </Field>
        {(localError || error) && <div className="form-error">{localError || error}</div>}
        <button className="primary" disabled={busy || !recoveryKey || password.length < 12 || Boolean(localError)}>{busy ? 'משחזר…' : 'שחזר והחלף Master Password'}</button>
      </form>
      <button className="text-button" onClick={onBack}>חזור לפתיחה</button>
    </AuthCard>
  );
}
