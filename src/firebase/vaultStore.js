import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './client.js';

export class SyncConflictError extends Error {
  constructor(message = 'התנגשות סנכרון') {
    super(message);
    this.name = 'SyncConflictError';
    this.code = 'sync-conflict';
  }
}

function requireDb() {
  if (!db) throw new Error('Firebase עדיין לא מוגדר');
  return db;
}

function vaultRef(uid) {
  return doc(requireDb(), 'vaults', uid);
}

function entriesRef(uid) {
  return collection(requireDb(), 'vaults', uid, 'entries');
}

function entryRef(uid, id) {
  return doc(requireDb(), 'vaults', uid, 'entries', id);
}

export async function getVaultProfile(uid) {
  const snap = await getDoc(vaultRef(uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createVaultProfile(uid, profile) {
  await runTransaction(requireDb(), async (tx) => {
    const ref = vaultRef(uid);
    const existing = await tx.get(ref);
    if (existing.exists()) throw new Error('כבר קיימת כספת לחשבון הזה');
    tx.set(ref, {
      schemaVersion: 1,
      masterSalt: profile.masterSalt,
      wrappedVaultKey: profile.wrappedVaultKey,
      wrappedVaultIv: profile.wrappedVaultIv,
      recoverySalt: profile.recoverySalt,
      recoveryWrappedVaultKey: profile.recoveryWrappedVaultKey,
      recoveryWrappedIv: profile.recoveryWrappedIv,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });
}

export async function updateMasterWrapping(uid, patch) {
  await runTransaction(requireDb(), async (tx) => {
    const ref = vaultRef(uid);
    const current = await tx.get(ref);
    if (!current.exists()) throw new Error('הכספת לא קיימת');
    tx.update(ref, {
      masterSalt: patch.masterSalt,
      wrappedVaultKey: patch.wrappedVaultKey,
      wrappedVaultIv: patch.wrappedVaultIv,
      updatedAt: serverTimestamp()
    });
  });
}

export async function listEncryptedEntries(uid) {
  const snap = await getDocs(entriesRef(uid));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function putEncryptedEntry(uid, id, encrypted, baseVersion) {
  return runTransaction(requireDb(), async (tx) => {
    const ref = entryRef(uid, id);
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      if (baseVersion !== 0) throw new SyncConflictError();
      tx.set(ref, {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        version: 1,
        updatedAt: serverTimestamp()
      });
      return 1;
    }

    const current = snap.data();
    if (current.version !== baseVersion) throw new SyncConflictError();
    const nextVersion = current.version + 1;
    tx.update(ref, {
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      version: nextVersion,
      updatedAt: serverTimestamp()
    });
    return nextVersion;
  });
}

export async function deleteEncryptedEntry(uid, id, baseVersion) {
  await runTransaction(requireDb(), async (tx) => {
    const ref = entryRef(uid, id);
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    if (snap.data().version !== baseVersion) throw new SyncConflictError();
    tx.delete(ref);
  });
}

export async function deleteEntireVault(uid) {
  const entries = await getDocs(entriesRef(uid));
  const refs = entries.docs.map((item) => item.ref);
  for (let index = 0; index < refs.length; index += 400) {
    const batch = writeBatch(requireDb());
    refs.slice(index, index + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
  await deleteDoc(vaultRef(uid));
}
