
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile as updateProfileAuth, 
  sendEmailVerification as sendEmailVerificationAuth,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  applyActionCode,
  confirmPasswordReset
} from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { auth, database } from '../firebase';

// Tipagem estendida para compatibilidade com o resto do app
export interface AppUser {
  uid: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  photoURL: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Métodos Principais
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // Gestão de Senha e E-mail
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  changePassword: (currentPass: string, newPass: string) => Promise<boolean>;
  resendVerification: () => Promise<{ success: boolean; error?: string }>;
  reloadUser: () => Promise<void>;
  
  verifyEmail: (code: string) => Promise<'success' | 'invalid'>;
  completePasswordReset: (code: string, newPass: string) => Promise<boolean>;

  // Legado/Compatibilidade
  hasLocalUser: boolean; // Mantido para compatibilidade de UI
  updateProfile: (data: { name?: string }) => Promise<void>;
  resetAppData: (password?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Helper para mapeamento de erros do Firebase Auth
const mapAuthError = (code: string): string => {
  switch (code) {
    case 'auth/user-not-found': 
      return 'E-mail não encontrado. Verifique o endereço ou crie uma conta.';
    case 'auth/wrong-password': 
      return 'Senha incorreta. Tente novamente.';
    case 'auth/invalid-email': 
      return 'E-mail inválido. Verifique o formato do endereço.';
    case 'auth/email-already-in-use': 
      return 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.';
    case 'auth/too-many-requests': 
      return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/weak-password': 
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/network-request-failed': 
      return 'Erro de conexão. Verifique sua internet.';
    case 'auth/requires-recent-login': 
      return 'Para esta ação, faça login novamente.';
    case 'auth/invalid-action-code': 
      return 'Link inválido ou expirado.';
    default: 
      return 'Ocorreu um erro inesperado. Tente novamente.';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsLoading(false);
      
      if (user) {
        // Sync metadata to Realtime DB
        const userMetaRef = ref(database, `users/${user.uid}/meta`);
        update(userMetaRef, {
          email: user.email,
          emailVerified: user.emailVerified,
          lastLogin: Date.now()
        }).catch(err => console.error("Sync Error:", err));
      }
    });
    return () => unsubscribe();
  }, []);

  const user: AppUser | null = firebaseUser ? {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName,
    emailVerified: firebaseUser.emailVerified,
    photoURL: firebaseUser.photoURL
  } : null;

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return { success: true };
    } catch (error: any) {
      console.error("Login Error:", error.code);
      return { success: false, error: mapAuthError(error.code) };
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    try {
      // 1. Cria usuário
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      if (user) {
        // 2. Atualiza Nome
        await updateProfileAuth(user, { displayName: name });

        // 3. Envia e-mail de verificação
        await sendEmailVerificationAuth(user);

        // 4. Cria estrutura inicial no DB
        const userMetaRef = ref(database, `users/${user.uid}/meta`);
        await update(userMetaRef, {
          plan: 'free',
          launchLimit: 30,
          launchCount: 0,
          createdAt: Date.now()
        });

        // Força refresh local
        await user.reload();
        if (auth.currentUser) setFirebaseUser({ ...auth.currentUser });
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: mapAuthError(error.code) };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: mapAuthError(error.code), code: error.code };
    }
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) return false;
    
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);
      return true;
    } catch (error) {
      console.error("Change Password Error:", error);
      return false;
    }
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return { success: false, error: 'Usuário não logado.' };
    try {
      await sendEmailVerificationAuth(auth.currentUser);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: mapAuthError(error.code) };
    }
  };

  const verifyEmail = async (code: string): Promise<'success' | 'invalid'> => {
    try {
      await applyActionCode(auth, code);
      return 'success';
    } catch (error) {
      return 'invalid';
    }
  };

  const completePasswordReset = async (code: string, newPass: string): Promise<boolean> => {
    try {
      await confirmPasswordReset(auth, code, newPass);
      return true;
    } catch (error) {
      return false;
    }
  };

  const reloadUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setFirebaseUser({ ...auth.currentUser }); 
    }
  };

  const updateProfile = async (data: { name?: string }) => {
    if (auth.currentUser && data.name) {
      await updateProfileAuth(auth.currentUser, { displayName: data.name });
      await reloadUser();
    }
  };

  const resetAppData = async (password?: string): Promise<boolean> => {
    if (password && auth.currentUser && auth.currentUser.email) {
       try {
         const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
         await reauthenticateWithCredential(auth.currentUser, credential);
       } catch (e) {
         return false; 
       }
    }
    localStorage.clear();
    await logout();
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      hasLocalUser: !!user,
      login,
      register,
      logout,
      resetPassword,
      changePassword,
      resendVerification,
      reloadUser,
      updateProfile,
      resetAppData,
      verifyEmail,
      completePasswordReset
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
