const enc = new TextEncoder();
const dec = new TextDecoder();
const MASTER_WRAP_INFO = enc.encode('vault/firebase/master-wrap/v1');
const RECOVERY_WRAP_INFO = enc.encode('vault/firebase/recovery-wrap/v1');
const WRAP_AAD = enc.encode('vault/firebase/vault-key-wrap/v1');

export function randomBytes(size) {
  const out = new Uint8Array(size);
  crypto.getRandomValues(out);
  return out;
}

export function toB64url(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function fromB64url(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export function formatRecoveryKey(bytes) {
  return toB64url(bytes).match(/.{1,4}/g)?.join('-') || '';
}

export function parseRecoveryKey(value) {
  const compact = String(value || '').trim().replace(/[\s-]/g, '');
  const bytes = fromB64url(compact);
  if (bytes.length !== 32) throw new Error('Recovery Key לא תקין');
  return bytes;
}

function deriveArgon2(password, saltB64) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./kdfWorker.js', import.meta.url), { type: 'module' });
    const cleanup = () => worker.terminate();
    worker.onmessage = (event) => {
      cleanup();
      if (event.data?.ok) resolve(new Uint8Array(event.data.key));
      else reject(new Error(event.data?.error || 'KDF failed'));
    };
    worker.onerror = (event) => {
      cleanup();
      reject(new Error(event.message || 'KDF worker failed'));
    };
    worker.postMessage({ password, salt: saltB64 });
  });
}

async function hkdf(raw, salt, info) {
  const key = await crypto.subtle.importKey('raw', raw, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, 256);
  return new Uint8Array(bits);
}

export async function deriveMasterWrapKey(password, masterSaltB64) {
  if (typeof password !== 'string' || password.length < 1) throw new Error('Master Password חסר');
  const material = await deriveArgon2(password, masterSaltB64);
  try {
    const salt = fromB64url(masterSaltB64);
    return await hkdf(material, salt, MASTER_WRAP_INFO);
  } finally {
    material.fill(0);
  }
}

export async function deriveRecoveryWrapKey(recoveryKeyBytes, recoverySaltB64) {
  const salt = fromB64url(recoverySaltB64);
  return hkdf(recoveryKeyBytes, salt, RECOVERY_WRAP_INFO);
}

async function importAes(raw, usage) {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, usage);
}

export async function wrapVaultKey(wrapKeyBytes, vaultKeyBytes) {
  const iv = randomBytes(12);
  const key = await importAes(wrapKeyBytes, ['encrypt']);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: WRAP_AAD, tagLength: 128 },
    key,
    vaultKeyBytes
  );
  return { ciphertext: toB64url(new Uint8Array(cipher)), iv: toB64url(iv) };
}

export async function unwrapVaultKey(wrapKeyBytes, ciphertextB64, ivB64, errorMessage = 'Master Password שגוי או שהכספת פגומה') {
  const key = await importAes(wrapKeyBytes, ['decrypt']);
  try {
    const plain = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: fromB64url(ivB64),
        additionalData: WRAP_AAD,
        tagLength: 128
      },
      key,
      fromB64url(ciphertextB64)
    );
    const out = new Uint8Array(plain);
    if (out.length !== 32) throw new Error('Invalid vault key');
    return out;
  } catch {
    throw new Error(errorMessage);
  }
}

export async function encryptEntry(vaultKeyBytes, id, payload) {
  const iv = randomBytes(12);
  const key = await importAes(vaultKeyBytes, ['encrypt']);
  const aad = enc.encode(`vault/firebase/entry:${id}:v1`);
  const plain = enc.encode(JSON.stringify({ v: 1, ...payload }));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 },
    key,
    plain
  );
  return { ciphertext: toB64url(new Uint8Array(cipher)), iv: toB64url(iv) };
}

export async function decryptEntry(vaultKeyBytes, row) {
  const key = await importAes(vaultKeyBytes, ['decrypt']);
  const aad = enc.encode(`vault/firebase/entry:${row.id}:v1`);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64url(row.iv), additionalData: aad, tagLength: 128 },
    key,
    fromB64url(row.ciphertext)
  );
  const decoded = JSON.parse(dec.decode(plain));
  if (decoded?.v !== 1) throw new Error('Unsupported entry format');
  return decoded;
}

export function generatePassword({ length = 20, lower = true, upper = true, numbers = true, symbols = true } = {}) {
  let alphabet = '';
  if (lower) alphabet += 'abcdefghijkmnopqrstuvwxyz';
  if (upper) alphabet += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  if (numbers) alphabet += '23456789';
  if (symbols) alphabet += '!@#$%^&*_-+=?';
  if (!alphabet) throw new Error('בחר לפחות קבוצת תווים אחת');

  const target = Math.max(8, Math.min(128, Number(length) || 20));
  const limit = Math.floor(256 / alphabet.length) * alphabet.length;
  let result = '';
  while (result.length < target) {
    const bytes = randomBytes(Math.max(32, target));
    for (const byte of bytes) {
      if (byte >= limit) continue;
      result += alphabet[byte % alphabet.length];
      if (result.length === target) break;
    }
  }
  return result;
}

export function wipe(bytes) {
  if (bytes instanceof Uint8Array) bytes.fill(0);
}
