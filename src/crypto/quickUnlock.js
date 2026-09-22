import { fromB64url, randomBytes, toB64url, unwrapVaultKey, wrapVaultKey, wipe } from './vaultCrypto.js';

const PREFIX = 'vault.quick-unlock.firebase.v1.';
const enc = new TextEncoder();
const PRF_INFO = enc.encode('vault/firebase/quick-unlock/v1');

function storageKey(uid) {
  return `${PREFIX}${uid}`;
}

function readRecord(uid) {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeRecord(uid, record) {
  localStorage.setItem(storageKey(uid), JSON.stringify(record));
}

export function hasQuickUnlock(uid) {
  const record = readRecord(uid);
  return Boolean(record?.credentialId && record?.prfSalt && record?.wrappedVaultKey && record?.wrappedVaultIv);
}

export function quickUnlockSupported() {
  return Boolean(window.PublicKeyCredential && navigator.credentials?.create && navigator.credentials?.get);
}

export function disableQuickUnlock(uid) {
  try { localStorage.removeItem(storageKey(uid)); } catch {}
}

async function prfToWrapKey(prfBytes, saltBytes) {
  const imported = await crypto.subtle.importKey('raw', prfBytes, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: saltBytes, info: PRF_INFO },
    imported,
    256
  );
  return new Uint8Array(bits);
}

function requirePrf(result) {
  const first = result?.getClientExtensionResults?.()?.prf?.results?.first;
  if (!first) throw new Error('המכשיר לא החזיר מפתח PRF ל־Quick Unlock');
  return new Uint8Array(first);
}

export async function enableQuickUnlock(vaultKey, uid, userLabel = 'Vault') {
  if (!quickUnlockSupported()) throw new Error('Quick Unlock אינו נתמך בדפדפן הזה');

  const prfSalt = randomBytes(32);
  const userId = randomBytes(32);
  const challenge = randomBytes(32);

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Vault' },
      user: { id: userId, name: `vault-${uid}`, displayName: userLabel },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 }
      ],
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required'
      },
      timeout: 60000,
      attestation: 'none',
      extensions: { prf: { eval: { first: prfSalt } } }
    }
  });

  if (!credential) throw new Error('Quick Unlock בוטל');
  const prf = requirePrf(credential);
  const wrapKey = await prfToWrapKey(prf, prfSalt);
  try {
    const wrapped = await wrapVaultKey(wrapKey, vaultKey);
    writeRecord(uid, {
      v: 1,
      credentialId: toB64url(new Uint8Array(credential.rawId)),
      prfSalt: toB64url(prfSalt),
      wrappedVaultKey: wrapped.ciphertext,
      wrappedVaultIv: wrapped.iv
    });
  } finally {
    wipe(prf);
    wipe(wrapKey);
    wipe(prfSalt);
    wipe(userId);
    wipe(challenge);
  }
}

export async function unlockWithQuickUnlock(uid) {
  const record = readRecord(uid);
  if (!record) throw new Error('Quick Unlock לא מוגדר במכשיר הזה');

  const challenge = randomBytes(32);
  const prfSalt = fromB64url(record.prfSalt);
  const credentialId = fromB64url(record.credentialId);

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ type: 'public-key', id: credentialId }],
        userVerification: 'required',
        timeout: 60000,
        extensions: { prf: { eval: { first: prfSalt } } }
      }
    });
    if (!assertion) throw new Error('Quick Unlock בוטל');
    const prf = requirePrf(assertion);
    const wrapKey = await prfToWrapKey(prf, prfSalt);
    try {
      return await unwrapVaultKey(
        wrapKey,
        record.wrappedVaultKey,
        record.wrappedVaultIv,
        'Quick Unlock נכשל. אפשר לפתוח עם Master Password.'
      );
    } finally {
      wipe(prf);
      wipe(wrapKey);
    }
  } finally {
    wipe(challenge);
    wipe(prfSalt);
    wipe(credentialId);
  }
}
