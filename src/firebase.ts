import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyBDBy63zXIwCvMcDgqBaCN0_ubssavhUUM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'family-command-center-805c3.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'family-command-center-805c3',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'family-command-center-805c3.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '863010609161',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:863010609161:web:69010df2b9f43fd2b400d8',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Unable to keep Summer Strong sign-in persisted', error)
})
export const db = getFirestore(app)
export type FirebaseUser = User

export function watchAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function signInToSummerStrong(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function createSummerStrongAccount(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function signOutOfSummerStrong() {
  return signOut(auth)
}

export async function loadSummerStrongData(userId: string) {
  const snapshot = await getDoc(doc(db, 'users', userId))
  return snapshot.exists() ? snapshot.data().summerStrong ?? null : null
}

export async function saveSummerStrongData(userId: string, data: unknown) {
  await setDoc(
    doc(db, 'users', userId),
    {
      summerStrong: data,
      summerStrongUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
