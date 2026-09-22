# Security model

## What Firebase can see

Firebase Authentication can see account identity information from the Google sign-in provider. Firestore can see document IDs, record counts, timestamps, versions and encrypted byte strings. It does not receive plaintext vault entries, the Master Password, the Recovery Key or the raw Vault Key.

## Key hierarchy

1. A random 32-byte Vault Key is generated when the vault is created.
2. The Master Password is processed with Argon2id (32 MiB, 3 iterations, parallelism 1) using a random master salt.
3. HKDF-SHA-256 derives the Master wrapping key.
4. AES-256-GCM wraps the Vault Key.
5. A separate random 32-byte Recovery Key is processed through HKDF with a separate recovery salt and wraps the same Vault Key independently.
6. Each vault entry is encrypted with AES-256-GCM under the Vault Key and entry-specific authenticated data.

Changing the Master Password only re-wraps the Vault Key. Entry ciphertext does not need to be re-encrypted.

## Firebase Authentication

Firebase Auth is an authorization boundary for Firestore, not the encryption key. Normal device use persists the Firebase account locally; reopening the app then asks only for the Master Password. On a new device or after signing out, Google authentication is required before the encrypted Firestore vault can be read.

## Firestore Rules

`firestore.rules` enforces `request.auth.uid == vault owner uid` and restricts document field shapes and payload sizes. The default fallback rule denies every other path.

## Quick Unlock

Where the browser supports WebAuthn PRF, Quick Unlock stores only a credential ID, random PRF salt and an AES-GCM-wrapped Vault Key in localStorage. The raw Vault Key is reconstructed only after successful user verification and is then kept in JavaScript memory while the vault is open.

## Auto-lock

The raw Vault Key is not intentionally persisted in localStorage, Firestore or GitHub. It lives in memory while the vault is open. Closing/reloading the app removes it. “Never” only disables the inactivity timer.

## Service icons

Known service icons are bundled locally. Uploaded icon images are resized in the browser and become part of the encrypted entry payload. The optional favicon fetch feature sends only the requested site domain to `a.favicon.im` after an explicit user action; the downloaded image is then converted to a data URL and stored inside the encrypted payload. Do not use the favicon button if that domain disclosure is undesirable.

## GitHub

GitHub Pages hosts public application code and image assets only. Never commit Firebase Admin credentials, service-account JSON, Recovery Keys, Master Passwords or exported plaintext vault data. Firebase Web configuration is client configuration and is expected to be present in the built frontend; Firestore Security Rules and Firebase Auth provide the authorization boundary.

## Limitations

This is a personal password manager, not an independently audited commercial password manager. Browser extensions, a compromised browser/device, malicious dependencies, XSS or a compromised authenticated Google account can weaken the security model. Keep dependencies pinned, keep Firestore rules restrictive, and test changes before migrating the only copy of a vault.
