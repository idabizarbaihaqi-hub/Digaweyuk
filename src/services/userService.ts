import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType, cleanFirestoreData } from '../firebase/errorHandler';
import { User, SubscriptionStatus, UserRole, CompanyProfile } from '../types';

export const USERS_COLLECTION = 'users';
export const COMPANIES_COLLECTION = 'companies';

export const SUPER_ADMIN_EMAIL = 'id.agnesyakartika@gmail.com';

/**
 * Validates if an email matches the only authorized Super Admin
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === SUPER_ADMIN_EMAIL;
}

/**
 * Fetch user document by UID from Firestore
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  try {
    const userSnapshot = await getDoc(userDocRef);

    if (!userSnapshot.exists()) {
      return null;
    }

    const data = userSnapshot.data();
    const userEmail = data.email || '';
    const isSuperAdmin = isSuperAdminEmail(userEmail);
    const role: UserRole = isSuperAdmin
      ? 'super_admin'
      : (data.role === 'company' ? 'company' : (data.role === 'admin' ? 'admin' : 'user'));

    return {
      uid,
      name: data.name || '',
      email: userEmail,
      photoURL: data.photoURL || '',
      subscriptionStatus: (data.subscriptionStatus as SubscriptionStatus) || 'FREE',
      role,
      companyId: data.companyId || (role === 'company' ? uid : undefined),
      balance: data.balance ?? 0,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${uid}`);
  }
}

/**
 * Create initial user document upon Firebase Auth registration
 * Default subscriptionStatus is STRICTLY "FREE"
 * Role can be "user" or "company", and "super_admin" ONLY for id.agnesyakartika@gmail.com
 */
export async function createUserProfile(
  uid: string,
  data: {
    name: string;
    email: string;
    photoURL?: string;
    role?: UserRole;
    companyName?: string;
  }
): Promise<User> {
  const now = new Date().toISOString();
  const isSuperAdmin = isSuperAdminEmail(data.email);
  const assignedRole: UserRole = isSuperAdmin
    ? 'super_admin'
    : data.role === 'company'
    ? 'company'
    : 'user';

  const newUser: User = {
    uid,
    name: data.name,
    email: data.email,
    photoURL: data.photoURL || '',
    subscriptionStatus: 'FREE',
    role: assignedRole,
    companyId: assignedRole === 'company' ? uid : undefined,
    balance: 0,
    createdAt: now,
    updatedAt: now,
  };

  const userDocRef = doc(db, USERS_COLLECTION, uid);
  try {
    await setDoc(userDocRef, cleanFirestoreData(newUser));

    // If company role, also create the initial companies/{uid} document
    if (assignedRole === 'company') {
      const companyDocRef = doc(db, COMPANIES_COLLECTION, uid);
      const companyName = data.companyName?.trim() || data.name;
      const initialCompany: CompanyProfile = {
        id: uid,
        name: companyName,
        logoUrl: '',
        description: '',
        industry: '',
        address: '',
        city: '',
        province: 'Jawa Barat',
        website: '',
        email: data.email,
        phone: '',
        whatsapp: '',
        foundedYear: '',
        employeeCount: '',
        verificationStatus: 'unverified',
        subscription: {
          plan: 'FREE',
          status: 'FREE',
          startAt: now,
          expiresAt: null,
          updatedAt: now,
        },
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(companyDocRef, cleanFirestoreData(initialCompany));
    }

    return newUser;
  } catch (error) {
    console.error('Error creating user profile in Firestore:', error);
    handleFirestoreError(error, OperationType.CREATE, `${USERS_COLLECTION}/${uid}`);
  }
}

/**
 * Update user profile details (e.g. name, photoURL)
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Omit<User, 'uid' | 'subscriptionStatus' | 'createdAt'>>
): Promise<void> {
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  try {
    await updateDoc(
      userDocRef,
      cleanFirestoreData({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${uid}`);
  }
}

/**
 * Real-time listener for user profile updates (e.g. subscriptionStatus changes)
 */
export function subscribeUserProfile(
  uid: string,
  callback: (user: User | null) => void
): () => void {
  const userDocRef = doc(db, USERS_COLLECTION, uid);

  return onSnapshot(
    userDocRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      const data = snapshot.data();
      const userEmail = data.email || '';
      const isSuperAdmin = isSuperAdminEmail(userEmail);
      const role: UserRole = isSuperAdmin
        ? 'super_admin'
        : (data.role === 'company' ? 'company' : (data.role === 'admin' ? 'admin' : 'user'));

      callback({
        uid,
        name: data.name || '',
        email: userEmail,
        photoURL: data.photoURL || '',
        subscriptionStatus: (data.subscriptionStatus as SubscriptionStatus) || 'FREE',
        role,
        companyId: data.companyId || (role === 'company' ? uid : undefined),
        balance: data.balance ?? 0,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    },
    (error) => {
      console.error('Error listening to user profile changes:', error);
      handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${uid}`);
    }
  );
}
