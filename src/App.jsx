import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  deleteFirebaseUser,
  firebaseConfigured,
  observeAuth,
  reauthenticateGoogle,
  signInWithGoogle,
  signOutFirebase
} from './firebase/client.js';
import {
  SyncConflictError,
  createVaultProfile,
  deleteEncryptedEntry,
  deleteEntireVault,
  getVaultProfile,
  listEncryptedEntries,
  putEncryptedEntry,
  updateMasterWrapping
} from './firebase/vaultStore.js';
import {
  decryptEntry,
  deriveMasterWrapKey,
  deriveRecoveryWrapKey,
  encryptEntry,
  formatRecoveryKey,
  generatePassword,
  parseRecoveryKey,
  randomBytes,
  toB64url,
  unwrapVaultKey,
  wipe,
  wrapVaultKey
} from './crypto/vaultCrypto.js';
import {
  disableQuickUnlock,
  enableQuickUnlock,
  hasQuickUnlock,
  quickUnlockSupported,
  unlockWithQuickUnlock
} from './crypto/quickUnlock.js';
import { smartSearchEntries } from './services/smartSearch.js';
import { assetUrl, ErrorBanner, Splash, Toast } from './components/Common.jsx';
import {
  CreateVaultScreen,
  FirebaseSetupScreen,
  RecoverScreen,
  RecoveryConfirmScreen,
  SignInScreen,
  UnlockScreen
} from './components/AuthViews.jsx';
import VaultView from './components/VaultView.jsx';
import EntryEditor from './components/EntryEditor.jsx';
import GeneratorView from './components/GeneratorView.jsx';
import SettingsView, { AUTO_LOCK_OPTIONS, ConfirmDeleteEntry, DeleteVaultDialog } from './components/SettingsView.jsx';

const THEME_KEY = 'vault.firebase.theme.v1';
const AUTO_LOCK_KEY = 'vault.firebase.auto-lock.v1';
const DEFAULT_AUTO_LOCK = 5 * 60 * 1000;
const EMPTY_ENTRY = { entryType: 'login', title: '', username: '', password: '', url: '', notes: '', icon: null, bankNumber: '', branchNumber: '', accountNumber: '', accountHolder: '', iban: '', cardNumber: '', cardholderName: '', expiry: '', cvv: '' };

function hapticFeedback(pattern) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {}
}

function savedTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return ['system', 'light', 'dark'].includes(value) ? value : 'system';
  } catch { return 'system'; }
}

function savedAutoLock() {
  try {
    const raw = localStorage.getItem(AUTO_LOCK_KEY);
    if (raw === null) return DEFAULT_AUTO_LOCK;
    const value = Number(raw);
    return AUTO_LOCK_OPTIONS.some((item) => item.value === value) ? value : DEFAULT_AUTO_LOCK;
  } catch { return DEFAULT_AUTO_LOCK; }
}

export default function App() {
  const [phase, setPhase] = useState(firebaseConfigured ? 'boot' : 'firebase-setup');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vaultKey, setVaultKey] = useState(null);
  const [entries, setEntries] = useState([]);
  const [tab, setTab] = useState('vault');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [editor, setEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteVaultOpen, setDeleteVaultOpen] = useState(false);
  const [pendingCreate, setPendingCreate] = useState(null);
  const [quickEnabled, setQuickEnabled] = useState(false);
  const [theme, setTheme] = useState(savedTheme);
  const [autoLockMs, setAutoLockMs] = useState(savedAutoLock);
  const lockTimer = useRef(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0b1020' : '#edf2ff');
    };
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
    apply();
    if (theme !== 'system') return undefined;
    media.addEventListener?.('change', apply);
    return () => media.removeEventListener?.('change', apply);
  }, [theme]);

  useEffect(() => {
    if (!firebaseConfigured) return undefined;
    let generation = 0;
    const unsubscribe = observeAuth(async (nextUser) => {
      generation += 1;
      const mine = generation;
      setError('');
      clearSensitiveState();
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setPhase('signin');
        return;
      }
      setPhase('boot');
      try {
        const nextProfile = await getVaultProfile(nextUser.uid);
        if (mine !== generation) return;
        setProfile(nextProfile);
        setQuickEnabled(Boolean(nextProfile && hasQuickUnlock(nextUser.uid)));
        setPhase(nextProfile ? 'unlock' : 'create');
      } catch (e) {
        if (mine !== generation) return;
        setError(e.message || 'לא ניתן לטעון את פרטי הכספת');
        setPhase('signin');
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    try { localStorage.setItem(AUTO_LOCK_KEY, String(autoLockMs)); } catch {}
    clearTimeout(lockTimer.current);
    if (!vaultKey || autoLockMs === 0) return undefined;

    const reset = () => {
      clearTimeout(lockTimer.current);
      lockTimer.current = setTimeout(lockVault, autoLockMs);
    };
    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(lockTimer.current);
      events.forEach((eventName) => window.removeEventListener(eventName, reset));
    };
  }, [vaultKey, autoLockMs, user, profile]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  function clearSensitiveState() {
    setVaultKey((current) => { wipe(current); return null; });
    setEntries([]);
    setSearch('');
    setEditor(null);
    setDeleteTarget(null);
    setDeleteVaultOpen(false);
    setTab('vault');
  }

  function lockVault() {
    clearSensitiveState();
    setPhase(user && profile ? 'unlock' : (user ? 'create' : 'signin'));
  }

  async function loadVault(key, uid = user?.uid) {
    if (!uid) throw new Error('אין משתמש מחובר');
    const rows = await listEncryptedEntries(uid);
    const decrypted = [];
    for (const row of rows) {
      try {
        const payload = await decryptEntry(key, row);
        decrypted.push({ ...payload, id: row.id, version: row.version });
      } catch {
        decrypted.push({ id: row.id, version: row.version, title: '⚠️ רשומה שלא ניתן לפענח', username: '', password: '', url: '', notes: '', corrupted: true });
      }
    }
    decrypted.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
    setEntries(decrypted);
  }

  async function enterVault(key, nextProfile = profile) {
    setVaultKey(key);
    if (nextProfile) setProfile(nextProfile);
    await loadVault(key);
    setPhase('vault');
  }

  async function handleGoogleSignIn() {
    setBusy(true); setError('');
    try { await signInWithGoogle(); }
    catch (e) { setError(e.message || 'ההתחברות ל־Google נכשלה'); }
    finally { setBusy(false); }
  }

  async function handleSignOut() {
    setBusy(true); setError('');
    try {
      clearSensitiveState();
      await signOutFirebase();
    } catch (e) {
      setError(e.message || 'ההתנתקות נכשלה');
    } finally { setBusy(false); }
  }

  async function prepareCreate(masterPassword) {
    if (!user) return;
    setBusy(true); setError('');
    let masterWrapKey; let recoveryWrapKey; let vault; let recovery;
    try {
      if (masterPassword.length < 12) throw new Error('Master Password צריך להכיל לפחות 12 תווים');
      const masterSalt = randomBytes(16);
      const recoverySalt = randomBytes(16);
      vault = randomBytes(32);
      recovery = randomBytes(32);

      const masterSaltB64 = toB64url(masterSalt);
      const recoverySaltB64 = toB64url(recoverySalt);
      masterWrapKey = await deriveMasterWrapKey(masterPassword, masterSaltB64);
      recoveryWrapKey = await deriveRecoveryWrapKey(recovery, recoverySaltB64);
      const masterWrapped = await wrapVaultKey(masterWrapKey, vault);
      const recoveryWrapped = await wrapVaultKey(recoveryWrapKey, vault);

      setPendingCreate({
        vaultKey: vault,
        recoveryKey: formatRecoveryKey(recovery),
        profile: {
          schemaVersion: 1,
          masterSalt: masterSaltB64,
          wrappedVaultKey: masterWrapped.ciphertext,
          wrappedVaultIv: masterWrapped.iv,
          recoverySalt: recoverySaltB64,
          recoveryWrappedVaultKey: recoveryWrapped.ciphertext,
          recoveryWrappedIv: recoveryWrapped.iv
        }
      });
      vault = null;
      setPhase('recovery-confirm');
      wipe(masterSalt); wipe(recoverySalt);
    } catch (e) {
      setError(e.message || 'יצירת הכספת נכשלה');
    } finally {
      wipe(masterWrapKey); wipe(recoveryWrapKey); wipe(vault); wipe(recovery);
      setBusy(false);
    }
  }

  async function finishCreate() {
    if (!user || !pendingCreate) return;
    setBusy(true); setError('');
    try {
      await createVaultProfile(user.uid, pendingCreate.profile);
      const key = pendingCreate.vaultKey;
      const nextProfile = pendingCreate.profile;
      setPendingCreate(null);
      setQuickEnabled(false);
      await enterVault(key, nextProfile);
    } catch (e) {
      setError(e.message || 'יצירת הכספת נכשלה');
    } finally { setBusy(false); }
  }

  function cancelCreate() {
    wipe(pendingCreate?.vaultKey);
    setPendingCreate(null);
    setError('');
    setPhase('create');
  }

  async function unlockWithMaster(masterPassword) {
    if (!profile) return;
    setBusy(true); setError('');
    let wrapKey;
    try {
      wrapKey = await deriveMasterWrapKey(masterPassword, profile.masterSalt);
      const key = await unwrapVaultKey(wrapKey, profile.wrappedVaultKey, profile.wrappedVaultIv);
      await enterVault(key);
    } catch (e) {
      setError(e.message || 'לא ניתן לפתוח את הכספת');
    } finally {
      wipe(wrapKey);
      setBusy(false);
    }
  }

  async function unlockQuick() {
    if (!user) return;
    setBusy(true); setError('');
    try {
      const key = await unlockWithQuickUnlock(user.uid);
      await enterVault(key);
    } catch (e) {
      setError(e.message || 'Quick Unlock נכשל');
    } finally { setBusy(false); }
  }

  async function recoverVault(recoveryKeyText, newMasterPassword) {
    if (!user || !profile) return;
    setBusy(true); setError('');
    let recoveryBytes; let recoveryWrapKey; let masterWrapKey; let recoveredVault; let newSalt;
    try {
      recoveryBytes = parseRecoveryKey(recoveryKeyText);
      recoveryWrapKey = await deriveRecoveryWrapKey(recoveryBytes, profile.recoverySalt);
      recoveredVault = await unwrapVaultKey(
        recoveryWrapKey,
        profile.recoveryWrappedVaultKey,
        profile.recoveryWrappedIv,
        'Recovery Key שגוי או שנתוני השחזור פגומים'
      );

      newSalt = randomBytes(16);
      const newSaltB64 = toB64url(newSalt);
      masterWrapKey = await deriveMasterWrapKey(newMasterPassword, newSaltB64);
      const wrapped = await wrapVaultKey(masterWrapKey, recoveredVault);
      await updateMasterWrapping(user.uid, {
        masterSalt: newSaltB64,
        wrappedVaultKey: wrapped.ciphertext,
        wrappedVaultIv: wrapped.iv
      });
      const nextProfile = { ...profile, masterSalt: newSaltB64, wrappedVaultKey: wrapped.ciphertext, wrappedVaultIv: wrapped.iv };
      setProfile(nextProfile);
      const key = recoveredVault;
      recoveredVault = null;
      await enterVault(key, nextProfile);
      setToast('Master Password עודכן');
    } catch (e) {
      setError(e.message || 'השחזור נכשל');
    } finally {
      wipe(recoveryBytes); wipe(recoveryWrapKey); wipe(masterWrapKey); wipe(recoveredVault); wipe(newSalt);
      setBusy(false);
    }
  }

  async function refreshVault() {
    if (!vaultKey) return;
    setRefreshing(true); setError('');
    try { await loadVault(vaultKey); setToast('הכספת סונכרנה'); }
    catch (e) { setError(e.message || 'הסנכרון נכשל'); }
    finally { setRefreshing(false); }
  }

  async function saveEntry(draft) {
    if (!user || !vaultKey) return;
    setBusy(true); setError('');
    try {
      if (!draft.title?.trim()) throw new Error('צריך לתת שם לרשומה');
      const id = draft.id || crypto.randomUUID();
      const baseVersion = Number(draft.version || 0);
      const now = Date.now();
      const encrypted = await encryptEntry(vaultKey, id, {
        title: draft.title.trim(),
        username: draft.username || '',
        password: draft.password || '',
        url: draft.url || '',
        notes: draft.notes || '',
        icon: draft.icon || null,
        entryType: draft.entryType || 'login',
        bankNumber: draft.bankNumber || '',
        branchNumber: draft.branchNumber || '',
        accountNumber: draft.accountNumber || '',
        accountHolder: draft.accountHolder || '',
        iban: draft.iban || '',
        cardNumber: draft.cardNumber || '',
        cardholderName: draft.cardholderName || '',
        expiry: draft.expiry || '',
        cvv: draft.cvv || '',
        createdAt: draft.createdAt || now,
        updatedAt: now
      });
      await putEncryptedEntry(user.uid, id, encrypted, baseVersion);
      setEditor(null);
      await loadVault(vaultKey);
      setToast('נשמר בכספת');
    } catch (e) {
      if (e instanceof SyncConflictError || e?.code === 'sync-conflict') {
        await loadVault(vaultKey).catch(() => undefined);
        setError('הרשומה השתנתה במכשיר אחר. סנכרנתי מחדש — נסה שוב.');
      } else setError(e.message || 'שמירת הרשומה נכשלה');
    } finally { setBusy(false); }
  }

  async function deleteEntry(entry) {
    if (!user || !vaultKey) return;
    setBusy(true); setError('');
    try {
      await deleteEncryptedEntry(user.uid, entry.id, entry.version);
      setDeleteTarget(null);
      await loadVault(vaultKey);
      hapticFeedback([45, 35, 45]);
      setToast('הרשומה נמחקה');
    } catch (e) {
      if (e instanceof SyncConflictError || e?.code === 'sync-conflict') {
        await loadVault(vaultKey).catch(() => undefined);
        setError('הרשומה השתנתה במכשיר אחר. הכספת סונכרנה מחדש.');
      } else setError(e.message || 'המחיקה נכשלה');
    } finally { setBusy(false); }
  }

  async function copy(text, message = 'הועתק') {
    try {
      await navigator.clipboard.writeText(String(text || ''));
      hapticFeedback(24);
      setToast(message);
    } catch {
      setToast('לא הצלחתי להעתיק');
    }
  }

  async function toggleQuickUnlock() {
    if (!user || !vaultKey) return;
    setBusy(true); setError('');
    try {
      if (quickEnabled) {
        disableQuickUnlock(user.uid);
        setQuickEnabled(false);
        setToast('Quick Unlock בוטל במכשיר הזה');
      } else {
        await enableQuickUnlock(vaultKey, user.uid, user.email || 'Vault');
        setQuickEnabled(true);
        setToast('Quick Unlock הופעל במכשיר הזה');
      }
    } catch (e) {
      setError(e.message || 'לא ניתן לשנות Quick Unlock');
    } finally { setBusy(false); }
  }

  async function deleteVault(masterPassword) {
    if (!user || !profile) return;
    setBusy(true); setError('');
    let wrapKey; let verifiedKey;
    try {
      wrapKey = await deriveMasterWrapKey(masterPassword, profile.masterSalt);
      verifiedKey = await unwrapVaultKey(wrapKey, profile.wrappedVaultKey, profile.wrappedVaultIv);

      // Reauthenticate before touching any data so a popup failure cannot leave a half-deleted account.
      await reauthenticateGoogle();
      await deleteEntireVault(user.uid);
      disableQuickUnlock(user.uid);
      await deleteFirebaseUser();
      wipe(verifiedKey);
      verifiedKey = null;
      clearSensitiveState();
      setProfile(null);
      setUser(null);
      setPhase('signin');
    } catch (e) {
      setError(e.message || 'מחיקת הכספת נכשלה');
      throw e;
    } finally {
      wipe(wrapKey); wipe(verifiedKey);
      setBusy(false);
    }
  }

  const filteredEntries = useMemo(() => smartSearchEntries(entries, search), [entries, search]);

  if (phase === 'firebase-setup') return <FirebaseSetupScreen />;
  if (phase === 'boot') return <Splash />;
  if (phase === 'signin') return <SignInScreen busy={busy} error={error} onGoogle={handleGoogleSignIn} />;
  if (phase === 'create') return <CreateVaultScreen email={user?.email} busy={busy} error={error} onCreate={prepareCreate} onSignOut={handleSignOut} />;
  if (phase === 'recovery-confirm') return <RecoveryConfirmScreen recoveryKey={pendingCreate?.recoveryKey || ''} busy={busy} error={error} onCopy={copy} onFinish={finishCreate} onCancel={cancelCreate} />;
  if (phase === 'unlock') return <UnlockScreen email={user?.email} busy={busy} error={error} quickEnabled={quickEnabled} onUnlock={unlockWithMaster} onQuickUnlock={unlockQuick} onRecover={() => { setError(''); setPhase('recover'); }} onSignOut={handleSignOut} />;
  if (phase === 'recover') return <RecoverScreen email={user?.email} busy={busy} error={error} onRecover={recoverVault} onBack={() => { setError(''); setPhase('unlock'); }} />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div><div className="eyebrow">ZERO-KNOWLEDGE VAULT</div><h1>{tab === 'vault' ? 'הכספת שלי' : tab === 'generator' ? 'מחולל סיסמאות' : 'הגדרות'}</h1></div>
        <button className="icon-button header-vault-icon" onClick={lockVault} title="נעל כספת"><img src={assetUrl('vault-icon-192.png')} alt="" /></button>
      </header>

      <main className="content">
        <ErrorBanner message={error} onClose={() => setError('')} />
        {tab === 'vault' && <VaultView entries={filteredEntries} search={search} setSearch={setSearch} onAdd={() => setEditor({ ...EMPTY_ENTRY })} onEdit={(entry) => !entry.corrupted && setEditor({ ...entry })} onDelete={setDeleteTarget} onCopy={copy} onRefresh={refreshVault} refreshing={refreshing} />}
        {tab === 'generator' && <GeneratorView onCopy={copy} onUse={(password) => { setEditor({ ...EMPTY_ENTRY, password }); setTab('vault'); }} />}
        {tab === 'settings' && <SettingsView email={user?.email} entryCount={entries.length} quickEnabled={quickEnabled} quickSupported={quickUnlockSupported()} busy={busy} theme={theme} onThemeChange={setTheme} autoLockMs={autoLockMs} onAutoLockChange={setAutoLockMs} onToggleQuick={toggleQuickUnlock} onLock={lockVault} onSignOut={handleSignOut} onDeleteVault={() => { setError(''); setDeleteVaultOpen(true); }} />}
      </main>

      <nav className="bottom-nav" aria-label="ניווט">
        <button className={tab === 'vault' ? 'active' : ''} onClick={() => setTab('vault')}><span className="nav-vault-icon"><img src={assetUrl('vault-icon-192.png')} alt="" /></span><small>כספת</small></button>
        <button className={tab === 'generator' ? 'active' : ''} onClick={() => setTab('generator')}><span>✦</span><small>מחולל</small></button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}><span>⚙️</span><small>הגדרות</small></button>
      </nav>

      {editor && <EntryEditor entry={editor} busy={busy} onClose={() => setEditor(null)} onSave={saveEntry} onGeneratePassword={() => generatePassword()} />}
      {deleteTarget && <ConfirmDeleteEntry entry={deleteTarget} busy={busy} onCancel={() => setDeleteTarget(null)} onConfirm={() => deleteEntry(deleteTarget)} />}
      {deleteVaultOpen && <DeleteVaultDialog busy={busy} error={error} onCancel={() => { if (!busy) { setDeleteVaultOpen(false); setError(''); } }} onDelete={deleteVault} />}
      <Toast message={toast} />
    </div>
  );
}
