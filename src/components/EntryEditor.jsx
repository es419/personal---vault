import React, { useMemo, useRef, useState } from 'react';
import { detectService } from '../services/catalog.js';
import { EMOJIS, ServiceIcon, fetchFaviconFromUrl, imageFileToIconData } from '../services/ServiceIcon.jsx';
import { Field, Modal } from './Common.jsx';

const EMPTY_CARD = { cardNumber: '', cardholderName: '', expiry: '', cvv: '' };
const EMPTY = {
  entryType: 'login',
  title: '',
  username: '',
  password: '',
  url: '',
  notes: '',
  icon: null,
  bankNumber: '',
  branchNumber: '',
  accountNumber: '',
  accountHolder: '',
  iban: '',
  cards: []
};

function normalizeEntry(entry) {
  const legacyCard = entry?.cardNumber || entry?.cardholderName || entry?.expiry || entry?.cvv
    ? [{
        cardNumber: entry.cardNumber || '',
        cardholderName: entry.cardholderName || '',
        expiry: entry.expiry || '',
        cvv: entry.cvv || ''
      }]
    : [];

  return {
    ...EMPTY,
    ...entry,
    entryType: entry?.entryType === 'card' ? 'bank' : (entry?.entryType || 'login'),
    cards: Array.isArray(entry?.cards) ? entry.cards.map((card) => ({ ...EMPTY_CARD, ...card })) : legacyCard
  };
}

export default function EntryEditor({ entry, busy, onClose, onSave, onGeneratePassword }) {
  const [draft, setDraft] = useState(() => normalizeEntry(entry));
  const [iconOpen, setIconOpen] = useState(false);
  const [localError, setLocalError] = useState('');
  const [fetchingIcon, setFetchingIcon] = useState(false);
  const fileRef = useRef(null);
  const detected = useMemo(() => detectService(draft), [draft.title, draft.url]);

  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  function updateCard(index, key, value) {
    setDraft((current) => ({
      ...current,
      cards: current.cards.map((card, cardIndex) => cardIndex === index ? { ...card, [key]: value } : card)
    }));
  }

  function addCard() {
    setDraft((current) => ({ ...current, cards: [...current.cards, { ...EMPTY_CARD }] }));
  }

  function removeCard(index) {
    setDraft((current) => ({ ...current, cards: current.cards.filter((_, cardIndex) => cardIndex !== index) }));
  }

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
    <Modal title={draft.id ? 'עריכת רשומה' : 'רשומה חדשה'} onClose={busy ? undefined : onClose} wide>
      <form className="editor-form" onSubmit={(e) => { e.preventDefault(); onSave(draft); }}>
        <div className="entry-type-selector" role="tablist" aria-label="סוג הרשומה">
          <button type="button" className={draft.entryType === 'login' ? 'active' : ''} onClick={() => set('entryType', 'login')}>חשבון</button>
          <button type="button" className={draft.entryType === 'bank' ? 'active' : ''} onClick={() => set('entryType', 'bank')}>חשבון בנק</button>
        </div>

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

        <Field label={draft.entryType === 'bank' ? 'שם הבנק / החשבון' : 'שם השירות'}>
          <input value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder={draft.entryType === 'bank' ? 'מזרחי טפחות, לאומי…' : 'Google, PayPal, Moodle…'} required autoFocus />
        </Field>

        <Field label="שם משתמש / אימייל">
          <div className="input-with-action"><input dir="auto" value={draft.username} onChange={(e) => set('username', e.target.value)} autoComplete="off" /><button type="button" onClick={() => navigator.clipboard?.writeText(draft.username || '')}>העתק</button></div>
        </Field>

        <Field label="סיסמה">
          <div className="input-with-action"><input dir="ltr" type="text" value={draft.password} onChange={(e) => set('password', e.target.value)} autoComplete="off" /><button type="button" onClick={() => set('password', onGeneratePassword())}>צור</button></div>
        </Field>

        {draft.entryType === 'bank' && (
          <>
            <div className="sensitive-fields-block">
              <div className="sensitive-fields-title">פרטי חשבון בנק</div>
              <Field label="מספר בנק">
                <div className="input-with-action"><input dir="ltr" inputMode="numeric" value={draft.bankNumber} onChange={(e) => set('bankNumber', e.target.value)} autoComplete="off" /><button type="button" onClick={() => navigator.clipboard?.writeText(draft.bankNumber || '')}>העתק</button></div>
              </Field>
              <Field label="מספר סניף">
                <div className="input-with-action"><input dir="ltr" inputMode="numeric" value={draft.branchNumber} onChange={(e) => set('branchNumber', e.target.value)} autoComplete="off" /><button type="button" onClick={() => navigator.clipboard?.writeText(draft.branchNumber || '')}>העתק</button></div>
              </Field>
              <Field label="מספר חשבון">
                <div className="input-with-action"><input dir="ltr" inputMode="numeric" value={draft.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} autoComplete="off" /><button type="button" onClick={() => navigator.clipboard?.writeText(draft.accountNumber || '')}>העתק</button></div>
              </Field>
              <Field label="שם בעל החשבון">
                <input dir="auto" value={draft.accountHolder} onChange={(e) => set('accountHolder', e.target.value)} autoComplete="off" />
              </Field>
              <Field label="IBAN / מספר זה״ב">
                <div className="input-with-action"><input dir="ltr" value={draft.iban} onChange={(e) => set('iban', e.target.value)} autoComplete="off" /><button type="button" onClick={() => navigator.clipboard?.writeText(draft.iban || '')}>העתק</button></div>
              </Field>
            </div>

            <div className="sensitive-fields-block cards-block">
              <div className="cards-section-header">
                <div>
                  <div className="sensitive-fields-title">כרטיסי אשראי של החשבון</div>
                  <small>אפשר לשמור כמה כרטיסים ששייכים לאותו חשבון בנק.</small>
                </div>
                <button type="button" className="secondary compact" onClick={addCard}>+ הוסף כרטיס</button>
              </div>

              {draft.cards.length === 0 && <div className="empty-cards-note">עדיין לא הוספת כרטיס אשראי לחשבון.</div>}

              {draft.cards.map((card, index) => (
                <div className="bank-card-editor" key={index}>
                  <div className="bank-card-editor-head">
                    <strong>כרטיס {index + 1}</strong>
                    <button type="button" className="text-button danger-text compact-card-remove" onClick={() => removeCard(index)}>הסר</button>
                  </div>
                  <Field label="מספר כרטיס">
                    <div className="input-with-action"><input dir="ltr" inputMode="numeric" value={card.cardNumber} onChange={(e) => updateCard(index, 'cardNumber', e.target.value.replace(/[^0-9 ]/g, ''))} placeholder="1234 5678 9012 3456" autoComplete="off" /><button type="button" onClick={() => navigator.clipboard?.writeText(card.cardNumber || '')}>העתק</button></div>
                  </Field>
                  <Field label="שם בעל הכרטיס">
                    <input dir="auto" value={card.cardholderName} onChange={(e) => updateCard(index, 'cardholderName', e.target.value)} autoComplete="off" />
                  </Field>
                  <div className="field-pair">
                    <Field label="תוקף">
                      <input dir="ltr" inputMode="numeric" value={card.expiry} onChange={(e) => updateCard(index, 'expiry', e.target.value)} placeholder="MM/YY" autoComplete="off" />
                    </Field>
                    <Field label="CVV">
                      <input dir="ltr" inputMode="numeric" value={card.cvv} onChange={(e) => updateCard(index, 'cvv', e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} autoComplete="off" />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

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
