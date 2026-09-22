import { argon2id } from 'hash-wasm';

function fromB64url(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

self.onmessage = async (event) => {
  try {
    const { password, salt } = event.data || {};
    if (typeof password !== 'string' || !salt) throw new Error('Invalid KDF input');
    const result = await argon2id({
      password,
      salt: fromB64url(salt),
      parallelism: 1,
      iterations: 3,
      memorySize: 32768,
      hashLength: 32,
      outputType: 'binary'
    });
    self.postMessage({ ok: true, key: result }, [result.buffer]);
  } catch (error) {
    self.postMessage({ ok: false, error: error?.message || 'KDF failed' });
  }
};
