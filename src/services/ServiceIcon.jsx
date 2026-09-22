import React, { useEffect, useState } from 'react';
import { detectService, normalizeHost } from './catalog.js';

const EMOJIS = ['🔐','🎓','💳','🏦','🛒','🎮','🎬','🎵','✈️','🏠','💼','☁️','📧','🌐','⭐','🔑'];

const SPECIAL_SERVICE_ICONS = {
  'haifa-moodle': 'https://magazine.haifa.ac.il/images/color_logo_three_languages.png',
  mizrahi: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%D7%9C%D7%95%D7%92%D7%95%20%D7%A9%D7%9C%20%D7%91%D7%A0%D7%A7%20%D7%9E%D7%96%D7%A8%D7%97%D7%99-%D7%98%D7%A4%D7%97%D7%95%D7%AA.svg'
};
export { EMOJIS };

function assetUrl(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

export function resolvedIcon(entry) {
  const custom = entry?.icon;
  if (custom?.kind === 'image' && typeof custom.value === 'string' && custom.value.startsWith('data:image/')) {
    return { kind: 'image', value: custom.value, label: 'אייקון מותאם אישית' };
  }
  if (custom?.kind === 'emoji' && custom.value) {
    return { kind: 'emoji', value: custom.value, label: 'אייקון מותאם אישית' };
  }

  const service = detectService(entry);
  if (service) {
    const specialIcon = SPECIAL_SERVICE_ICONS[service.key];
    if (specialIcon) return { kind: 'image', value: specialIcon, label: service.label };
    const filename = service.key === 'haifa-moodle' ? 'haifa-moodle.svg' : `service-icons/${service.key}.svg`;
    return { kind: 'image', value: assetUrl(filename), label: service.label };
  }

  return {
    kind: 'fallback',
    value: String(entry?.title || '?').trim().charAt(0).toUpperCase() || '?',
    label: 'אייקון אוטומטי'
  };
}

export function ServiceIcon({ entry, size = 'md' }) {
  const icon = resolvedIcon(entry);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [icon.kind, icon.value]);

  const cls = `service-icon service-icon-${size}`;
  if (icon.kind === 'image' && !failed) {
    return <span className={cls} title={icon.label}><img src={icon.value} alt="" onError={() => setFailed(true)} /></span>;
  }
  return <span className={cls} title={icon.label}>{icon.kind === 'emoji' ? icon.value : (String(entry?.title || '?').trim().charAt(0).toUpperCase() || '?')}</span>;
}

async function normalizeImage(source) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('קובץ האייקון לא תקין'));
    img.src = source;
  });

  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('לא ניתן לעבד את האייקון');

  const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
  const width = Math.max(1, image.naturalWidth * scale);
  const height = Math.max(1, image.naturalHeight * scale);
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
  return canvas.toDataURL('image/webp', 0.9);
}

export async function imageFileToIconData(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('צריך לבחור קובץ תמונה');
  if (file.size > 5 * 1024 * 1024) throw new Error('האייקון גדול מדי — עד 5MB');
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('לא הצלחתי לקרוא את התמונה'));
    reader.readAsDataURL(file);
  });
  return normalizeImage(source);
}


export async function fetchFaviconFromUrl(rawUrl) {
  const host = normalizeHost(rawUrl);
  if (!host) throw new Error('צריך להזין כתובת אתר תקינה לפני משיכת אייקון');
  const endpoint = `https://a.favicon.im/${encodeURIComponent(host)}?larger=true&throw-error-on-404=true`;
  const response = await fetch(endpoint, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!response.ok) throw new Error('לא מצאתי אייקון מתאים לאתר הזה');
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error('השרת לא החזיר תמונת אייקון');
  if (blob.size > 1024 * 1024) throw new Error('האייקון שהתקבל גדול מדי');
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('לא הצלחתי לקרוא את האייקון'));
    reader.readAsDataURL(blob);
  });
  return normalizeImage(source);
}
