import React, { useMemo, useRef, useState } from 'react';
import { detectService } from '../services/catalog.js';
import { EMOJIS, ServiceIcon, fetchFaviconFromUrl, imageFileToIconData } from '../services/ServiceIcon.jsx';
import { Field, Modal } from './Common.jsx';

const EMPTY = { title: '', username: '', password: '', url: '', notes: '', icon: null };

export default function EntryEditor({ entry, busy, onClose, onSave, onGeneratePassword }) {
  const [draft, setDraft] = useState({ ...EMPTY, ...entry });
  const [iconOpen, setIconOpen] = useState(false);
  const [localError, setLocalError] = useState('');
  const [fetchingIcon, setFetchingIcon] = useState(false);
  const fileRef = useRef(null);
  const detected = useMemo(() => detectService(draft), [draft.title, draft.url]);

  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }));



  async function fetchSiteIcon() {
    setLocalError('');
    setFetchingIcon(true);
    try {
      const value = await fetchFaviconFromUrl(draft.url);
      set('icon', { kind: 'image', value });
      setIconOpen(false);
    } catch (error) {
      setLocalError(error.message || 'לא ניתן למשוך אייקון מהאתר');
    } finally {
      setFetchingIcon(false);
    }
  }

  async function uploadIcon(file) {
    if (!file) return;
    setLocalError('');
    try {
      const value = await imageFileToIconData(file);
      set('icon', { kind: 'image', value });
      setIconOpen(false);
    } catch (error) {
      setLocalError(error.message || 'לא ניתן לקרוא את האייקון');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <Modal title={draft.id ? 'עריכת סיסמה' : 'סיסמה חדשה'} onClose={busy ? undefined : onClose} wide>
      <form className="editor-form" onSubmit={(e) => { e.preventDefault(); onSave(draft); }}>
        <div className="icon-editor-row">
          <button type="button" className="icon-preview-button" onClick={() => setIconOpen((v) => !v)}><ServiceIcon entry={draft} size="xl" /><span>שנה אייקון</span></button>
          <div className="icon-detection-text">{detected ? `זוהה: ${detected.label}` : 'אייקון אוטומטי לפי שם/כתובת'}</div>
        </div>

        {iconOpen && (
          <div className="icon-picker">
            <button type="button" className="secondary compact" onClick={() => { set('icon', null); setIconOpen(false); }}>אוטומטי</button>
            <button type="button" className="secondary compact" onClick={() => fileRef.current?.click()}>העלה תמונה</button>
            <button type="button" className="secondary compact" disabled={fetchingIcon || !draft.url.trim()} onClick={fetchSiteIcon}>{fetchingIcon ? 'מושך…' : 'משוך מהאתר'}</button>
            <input ref={fileRef} className="hidden-file" type="file" accept="image/*" onChange={(e) => uploadIcon(e.target.files?.[0])} />
            <div className="favicon-privacy-note">משיכת אייקון שולחת רק את הדומיין ל־Favicon.im בלחיצה יזומה; התמונה נשמרת אחר כך בתוך הרשומה המוצפנת.</div>
            <div className="emoji-grid">
              {EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => { set('icon', { kind: 'emoji', value: emoji }); setIconOpen(false); }}>{emoji}</button>)}
            </div>
          </div>
        )}

        <Field label="שם השירות">
          <input value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="Google, PayPal, Moodle…" required autoFocus />
        </Field>
        <Field label="שם משתמש / אימייל">
          <div className="input-with-action"><input dir="auto" value={draft.username} onChange={(e) => set('username', e.target.value)} autoComplete="off" /><button type="button" onClick={() => navigator.clipboard?.writeText(draft.username || '')}>העתק</button></div>
        </Field>
        <Field label="סיסמה">
          <div className="input-with-action"><input dir="ltr" type="text" value={draft.password} onChange={(e) => set('password', e.target.value)} autoComplete="off" /><button type="button" onClick={() => set('password', onGeneratePassword())}>צור</button></div>
        </Field>
        <Field label="כתובת אתר">
          <input dir="ltr" inputMode="url" value={draft.url} onChange={(e) => set('url', e.target.value)} placeholder="https://example.com" autoComplete="off" />
        </Field>
        <Field label="הערות">
          <textarea rows={4} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
        {localError && <div className="form-error">{localError}</div>}
        <div className="modal-actions"><button type="button" className="secondary" onClick={onClose} disabled={busy}>ביטול</button><button className="primary" disabled={busy || !draft.title.trim()}>{busy ? 'שומר…' : 'שמור בכספת'}</button></div>
      </form>
    </Modal>
  );
}
