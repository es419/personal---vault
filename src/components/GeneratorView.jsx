import React, { useMemo, useState } from 'react';
import { generatePassword } from '../crypto/vaultCrypto.js';

export default function GeneratorView({ onCopy, onUse }) {
  const [length, setLength] = useState(20);
  const [opts, setOpts] = useState({ lower: true, upper: true, numbers: true, symbols: true });
  const [nonce, setNonce] = useState(0);
  const password = useMemo(() => {
    try { return generatePassword({ length, ...opts }); } catch { return ''; }
  }, [length, opts, nonce]);

  const toggle = (key) => setOpts((current) => ({ ...current, [key]: !current[key] }));

  return (
    <section className="generator-card">
      <div className="generated-password" dir="ltr">{password || 'בחר לפחות קבוצת תווים אחת'}</div>
      <div className="generator-actions"><button className="secondary" onClick={() => setNonce((n) => n + 1)}>צור מחדש</button><button className="secondary" disabled={!password} onClick={() => onCopy(password, 'הסיסמה הועתקה')}>העתק</button><button className="primary" disabled={!password} onClick={() => onUse(password)}>השתמש ברשומה חדשה</button></div>

      <div className="setting-card">
        <div className="range-row"><span>אורך</span><strong>{length}</strong></div>
        <input className="range" type="range" min="8" max="64" value={length} onChange={(e) => setLength(Number(e.target.value))} />
      </div>
      <div className="toggle-grid">
        <Toggle label="אותיות קטנות" checked={opts.lower} onChange={() => toggle('lower')} />
        <Toggle label="אותיות גדולות" checked={opts.upper} onChange={() => toggle('upper')} />
        <Toggle label="מספרים" checked={opts.numbers} onChange={() => toggle('numbers')} />
        <Toggle label="סימנים" checked={opts.symbols} onChange={() => toggle('symbols')} />
      </div>
    </section>
  );
}

function Toggle({ label, checked, onChange }) {
  return <label className="toggle-row"><span>{label}</span><input type="checkbox" checked={checked} onChange={onChange} /></label>;
}
