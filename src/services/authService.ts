import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { createUserProfile, getUserProfile } from './userService';
import { User, UserRole } from '../types';

/**
 * Format Firebase Auth errors into clear Indonesian messages
 */
export function formatAuthErrorMessage(error: any): string {
  const code = error?.code || '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email sudah digunakan oleh akun lain.';
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
    case 'auth/user-not-found':
      return 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email atau kata sandi salah.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.';
    case 'auth/network-request-failed':
      return 'Koneksi ke server bermasalah. Periksa jaringan internet Anda.';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan.';
    default:
      return error?.message || 'Terjadi kesalahan pada sistem autentikasi.';
  }
}

/**
 * Register user with Email & Password and create initial Firestore document
 */
export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
  role: UserRole = 'user',
  companyName?: string
): Promise<User> {
  // 1. Create Firebase Auth account
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
  const uid = userCredential.user.uid;

  // 2. Create users/{uid} document in Firestore with default subscriptionStatus = "FREE"
  const userProfile = await createUserProfile(uid, {
    name: name.trim(),
    email: email.trim(),
    photoURL: '',
    role,
    companyName,
  });

  return userProfile;
}

/**
 * Login user with Email & Password
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ firebaseUser: FirebaseUser; profile: User | null }> {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
  const uid = userCredential.user.uid;

  // Fetch users/{uid} profile
  let profile = await getUserProfile(uid);

  // If user exists in Auth but doc doesn't exist yet, bootstrap it
  if (!profile) {
    profile = await createUserProfile(uid, {
      name: userCredential.user.displayName || email.split('@')[0],
      email: email.trim(),
      photoURL: userCredential.user.photoURL || '',
    });
  }

  return {
    firebaseUser: userCredential.user,
    profile,
  };
}

/**
 * Logout user from Firebase Authentication
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to Firebase Authentication state changes
 */
export function subscribeAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}
