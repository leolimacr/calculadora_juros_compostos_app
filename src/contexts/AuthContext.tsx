import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { auth, firestore } from '../firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserMeta } from '../types';

interface AuthContextType {
  user: User | null;
  userMeta: UserMeta | null;
  userMetaLoading: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userMeta: null,
  userMetaLoading: true,
  isAuthenticated: false,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMetaLoading, setUserMetaLoading] = useState(true);
  const unsubscribeMetaRef = useRef<(() => void) | null>(null);
  const userMetaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUserMetaTimeout = () => {
    if (userMetaTimeoutRef.current) {
      clearTimeout(userMetaTimeoutRef.current);
      userMetaTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      clearUserMetaTimeout();
      
      if (currentUser) {
        // [FINOPS] Único listener para o perfil do usuário
        if (unsubscribeMetaRef.current) unsubscribeMetaRef.current();
        setUserMeta(null);
        setUserMetaLoading(true);
        
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        unsubscribeMetaRef.current = onSnapshot(userDocRef, (docSnap) => {
          clearUserMetaTimeout();
          if (docSnap.exists()) {
            setUserMeta({ uid: currentUser.uid, ...docSnap.data() } as UserMeta);
          } else {
            setUserMeta(null);
          }
          setUserMetaLoading(false);
        }, (error) => {
          console.error("Erro no listener de UserMeta:", error);
          clearUserMetaTimeout();
          setUserMeta(null);
          setUserMetaLoading(false);
        });

        userMetaTimeoutRef.current = setTimeout(() => {
          setUserMeta(null);
          setUserMetaLoading(false);
        }, 8000);
      } else {
        if (unsubscribeMetaRef.current) unsubscribeMetaRef.current();
        unsubscribeMetaRef.current = null;
        setUserMeta(null);
        setUserMetaLoading(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMetaRef.current) unsubscribeMetaRef.current();
      clearUserMetaTimeout();
    };
  }, []);

  const logout = async () => {
    try {
      if (unsubscribeMetaRef.current) unsubscribeMetaRef.current();
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const value = useMemo(() => ({
    user,
    userMeta,
    userMetaLoading,
    isAuthenticated: !!user,
    loading,
    logout
  }), [user, userMeta, userMetaLoading, loading, logout]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
