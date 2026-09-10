import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  subscribeAuthState,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  formatAuthErrorMessage,
} from '../services/authService';
import { subscribeUserProfile } from '../services/userService';
import { User } from '../types';

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    // Listen to Firebase Auth state
    const unsubscribeAuth = subscribeAuthState(async (fbUser) => {
      setFirebaseUser(fbUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (fbUser) {
        try {
          // Subscribe to real-time changes in users/{uid} in Firestore
          unsubscribeProfile = subscribeUserProfile(fbUser.uid, (profile) => {
            setUserProfile(profile);
            setLoading(false);
          });
        } catch (err) {
          console.error('Error attaching user profile listener:', err);
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      await loginWithEmail(email, pass);
    } catch (err: any) {
      const msg = formatAuthErrorMessage(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    setAuthError(null);
    try {
      await registerWithEmail(name, email, pass);
    } catch (err: any) {
      const msg = formatAuthErrorMessage(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setAuthError(null);
    await logoutUser();
  };

  const isPremium = userProfile?.subscriptionStatus === 'PREMIUM';

  return {
    firebaseUser,
    userProfile,
    user: userProfile,
    isPremium,
    loading,
    authError,
    setAuthError,
    login,
    register,
    logout,
  };
}
