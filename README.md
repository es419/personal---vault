# Vault — Firebase + GitHub Pages

Clean rebuild of the personal encrypted Vault. This project was written for GitHub Pages + Firebase from the start; it does not depend on the old Cloudflare Worker/D1 application.

## Architecture

- **Frontend:** React + Vite on GitHub Pages.
- **Identity:** Firebase Authentication with Google Sign-In and local session persistence.
- **Database:** Cloud Firestore.
- **Encryption:** Argon2id -> HKDF -> AES-256-GCM in the browser.
- **Vault key:** random 256-bit key; the Master Password only wraps/unwraps it.
- **Recovery:** a separate random Recovery Key wraps the same Vault Key.
- **Quick Unlock:** WebAuthn PRF where supported.

Firebase receives encrypted vault material and encrypted entry payloads, but not the plaintext Master Password, Recovery Key, raw Vault Key, passwords, usernames, notes, or custom icons.

## Firebase project

This build is already configured for:

- Project ID: `personal-vault-103a3`
- Auth domain: `personal-vault-103a3.firebaseapp.com`
- GitHub Pages authorized domain: `es419.github.io`

Firebase Web config is client configuration and is intentionally present in the frontend source. Do **not** add service-account JSON, Admin SDK private keys, Master Passwords, Recovery Keys, or plaintext vault exports to GitHub.

## Required Firebase console setup

1. **Authentication -> Sign-in method -> Google**: enabled.
2. **Authentication -> Settings -> Authorized domains**: `es419.github.io` added.
3. **Firestore Database**: created.
4. **Firestore -> Rules**: paste the contents of `firestore.rules` and click **Publish**.

Do not create collections manually. The app creates `vaults/{uid}` and its encrypted `entries` subcollection when needed.

## GitHub Pages

Repository expected: `es419/vault`.

In GitHub:

`Settings -> Pages -> Build and deployment -> Source -> GitHub Actions`

The included workflow `.github/workflows/pages.yml` runs tests, builds the Vite app, and deploys `dist/` to Pages on every push to `main`.

The Vite base path is derived from `GITHUB_REPOSITORY`, so the app works under:

`https://es419.github.io/vault/`

## Push this rebuild

Replace the local repository contents with this project, keeping the `.git` directory, then run:

```bash
git add -A
git commit -m "Rebuild Vault for Firebase and GitHub Pages"
git push origin main
```

After the GitHub Action finishes, open:

`https://es419.github.io/vault/`

Test first on Wi-Fi and then on 5G before moving any important data.

## Local commands

```bash
npm install
npm run test
npm run build
npm run dev
```

## Firestore data model

```text
vaults/{firebaseUid}
  schemaVersion
  masterSalt
  wrappedVaultKey
  wrappedVaultIv
  recoverySalt
  recoveryWrappedVaultKey
  recoveryWrappedIv
  createdAt
  updatedAt

vaults/{firebaseUid}/entries/{entryId}
  ciphertext
  iv
  version
  updatedAt
```

Titles, usernames, passwords, URLs, notes and custom icons live inside the encrypted `ciphertext` payload.

## Features included

- Google identity session; normal reopening goes directly to Master Password when Firebase remains signed in.
- Master Password unlock.
- Recovery Key and Master Password replacement.
- Quick Unlock with WebAuthn PRF / Face ID / Windows Hello where supported.
- Add/edit/delete credentials.
- Copy username/password.
- Smart local search; passwords are not searched.
- Password generator.
- Local icons for many services including Haifa Moodle, Google and PayPal.
- Emoji/custom image icon and explicit favicon fetch.
- System/light/dark themes.
- Auto-lock: 5m, 15m, 30m, 1h, 4h, 12h, 1d, never.
- Delete vault/account.
- iPhone-first fixed app shell and safe-area bottom navigation.

## Old Cloudflare vault

Do **not** delete the old Cloudflare Worker or D1 yet. Keep it until this Firebase rebuild works correctly on both Wi-Fi and 5G and the old credentials have been migrated or recreated in the new vault.
