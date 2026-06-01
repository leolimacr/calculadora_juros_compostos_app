import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { auth, firestore } from '../firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserMeta } from '../types';

interface AuthContextType {
  user: User | null;
  userMeta: UserMeta | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userMeta: null,
  isAuthenticated: false,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubscribeMetaRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // [FINOPS] Único listener para o perfil do usuário
        if (unsubscribeMetaRef.current) unsubscribeMetaRef.current();
        
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        unsubscribeMetaRef.current = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserMeta({ uid: currentUser.uid, ...docSnap.data() } as UserMeta);
          } else {
            setUserMeta(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Erro no listener de UserMeta:", error);
          setLoading(false);
        });
      } else {
        if (unsubscribeMetaRef.current) unsubscribeMetaRef.current();
        unsubscribeMetaRef.current = null;
        setUserMeta(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMetaRef.current) unsubscribeMetaRef.current();
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

  const value = {
    user,
    userMeta,
    isAuthenticated: !!user,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};