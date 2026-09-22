import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) globalThis.crypto = webcrypto;
if (!globalThis.btoa) globalThis.btoa = (value) => Buffer.from(value, 'binary').toString('base64');
if (!globalThis.atob) globalThis.atob = (value) => Buffer.from(value, 'base64').toString('binary');

const {
  decryptEntry,
  encryptEntry,
  randomBytes,
  unwrapVaultKey,
  wrapVaultKey
} = await import('../src/crypto/vaultCrypto.js');

const wrapping = randomBytes(32);
const vault = randomBytes(32);
const wrapped = await wrapVaultKey(wrapping, vault);
const unwrapped = await unwrapVaultKey(wrapping, wrapped.ciphertext, wrapped.iv);
if (Buffer.compare(Buffer.from(vault), Buffer.from(unwrapped)) !== 0) throw new Error('vault key round-trip failed');

const id = 'smoke-entry';
const payload = { title: 'Google', username: 'test@example.com', password: 'secret', url: 'https://google.com', notes: 'hello', icon: null, createdAt: 1, updatedAt: 2 };
const encrypted = await encryptEntry(vault, id, payload);
const decoded = await decryptEntry(vault, { id, ...encrypted });
if (decoded.password !== payload.password || decoded.title !== payload.title) throw new Error('entry round-trip failed');

console.log('crypto smoke: OK');
