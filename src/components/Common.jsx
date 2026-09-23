import React from 'react';

export function assetUrl(path) {
  return `${import.meta.env.BASE_URL}${String(path).replace(/^\//, '')}`;
}

export function BrandMark({ small = false }) {
  return <div className={small ? 'brand-mark brand-mark-small' : 'brand-mark'} aria-hidden="true"><img src={assetUrl('vault-icon-512.png')} alt="" /></div>;
}

export function CenterScreen({ children }) {
  return <div className="center-screen">{children}</div>;
}

export function Splash({ message = 'פותח את הכספת…' }) {
  return (
    <CenterScreen>
      <div className="splash-loader" aria-hidden="true">
        <div className="splash-loader-ring" />
        <BrandMark />
      </div>
      <h1 className="splash-title">Vault</h1>
      <p className="splash-message">{message}</p>
    </CenterScreen>
  );
}

export function Field({ label, hint, children }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header"><h2>{title}</h2>{onClose && <button className="icon-button" onClick={onClose} aria-label="סגור">×</button>}</header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

export function ErrorBanner({ message, onClose }) {
  if (!message) return null;
  return <div className="error-banner"><span>{message}</span>{onClose && <button onClick={onClose}>×</button>}</div>;
}

export function Toast({ message }) {
  if (!message) return null;
  return <div className="toast" role="status">{message}</div>;
}
