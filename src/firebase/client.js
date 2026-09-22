import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithPopup,
  setPersistence,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Web configuration is intentionally client-side/public.
// Access to vault data is enforced by Firebase Authentication + Firestore Rules;
// this configuration cannot decrypt vault contents.
const firebaseConfig = {
  apiKey: 'AIzaSyBnN3CyfGdFMN-5SE_l5XVRu4xhyWLU0kY',
  authDomain: 'personal-vault-103a3.firebaseapp.com',
  projectId: 'personal-vault-103a3',
  storageBucket: 'personal-vault-103a3.firebasestorage.app',
  messagingSenderId: '952002025605',
  appId: '1:952002025605:web:44d4f5c516c76094fab1ec'
};

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const persistenceReady = setPersistence(auth, browserLocalPersistence).catch(() => undefined);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, auth, db };

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  await persistenceReady;
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutFirebase() {
  await signOut(auth);
}

export async function reauthenticateGoogle() {
  if (!auth.currentUser) throw new Error('אין משתמש מחובר');
  const providerId = auth.currentUser.providerData?.[0]?.providerId;
  if (providerId && providerId !== 'google.com') throw new Error('החשבון אינו מחובר דרך Google');
  await reauthenticateWithPopup(auth.currentUser, googleProvider);
}

export async function deleteFirebaseUser() {
  if (!auth.currentUser) return;
  try {
    await deleteUser(auth.currentUser);
  } catch (error) {
    if (error?.code === 'auth/requires-recent-login') {
      await reauthenticateGoogle();
      await deleteUser(auth.currentUser);
      return;
    }
    throw error;
  }
}
