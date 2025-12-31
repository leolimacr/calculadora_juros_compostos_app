
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  updatePassword as updateFirebasePassword,
  User as FirebaseUser,
  AuthError,
  applyActionCode,
  confirmPasswordReset,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth, database } from '../firebase';
import { ref, update } from 'firebase/database';

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
// Tratamento detalhado de códigos de erro para feedback do usuário
const mapAuthError = (code: string): string => {
  // Lista de códigos tratados:
  // auth/user-not-found
  // auth/wrong-password
  // auth/invalid-email
  // auth/email-already-in-use
  // auth/too-many-requests
  // auth/invalid-credential
  // auth/weak-password
  // auth/network-request-failed
  
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
      return 'E-mail ou senha incorretos.'; // Proteção contra enumeração
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsLoading(false);
      
      // Sincroniza meta-dados básicos no Realtime Database se logado
      if (user) {
        const userRef = ref(database, `users/${user.uid}/meta`);
        update(userRef, {
          email: user.email,
          emailVerified: user.emailVerified,
          lastLogin: Date.now()
        }).catch(err => console.error("Sync Error:", err));
      }
    });
    return () => unsubscribe();
  }, []);

  // Adaptador do objeto de usuário para a aplicação
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
    } catch (error) {
      const err = error as AuthError;
      console.error("Login Error:", err.code);
      return { success: false, error: mapAuthError(err.code) };
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    try {
      // 1. Cria usuário
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      // 2. Atualiza Nome
      await updateFirebaseProfile(user, { displayName: name });

      // 3. Envia e-mail de verificação
      await sendEmailVerification(user);

      // 4. Cria estrutura inicial no DB (opcional, mas bom para garantir)
      const userRef = ref(database, `users/${user.uid}/meta`);
      await update(userRef, {
        plan: 'free',
        launchLimit: 30,
        launchCount: 0,
        createdAt: Date.now()
      });

      // Força refresh local para pegar o displayName
      await user.reload();
      setFirebaseUser(auth.currentUser); // Trigger re-render com nome

      return { success: true };
    } catch (error) {
      const err = error as AuthError;
      return { success: false, error: mapAuthError(err.code) };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      const err = error as AuthError;
      // Retornamos o código cru também para tratamento específico na UI
      return { success: false, error: mapAuthError(err.code), code: err.code };
    }
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!auth.currentUser || !auth.currentUser.email) return false;
    
    try {
      // Re-autenticar antes de trocar senha (segurança)
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPass);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      await updateFirebasePassword(auth.currentUser, newPass);
      return true;
    } catch (error) {
      console.error("Change Password Error:", error);
      return false;
    }
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return { success: false, error: 'Usuário não logado.' };
    try {
      await sendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (error) {
      const err = error as AuthError;
      return { success: false, error: mapAuthError(err.code) };
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
      setFirebaseUser({ ...auth.currentUser }); // Força atualização do estado
    }
  };

  const updateProfile = async (data: { name?: string }) => {
    if (auth.currentUser && data.name) {
      await updateFirebaseProfile(auth.currentUser, { displayName: data.name });
      await reloadUser();
    }
  };

  const resetAppData = async (password?: string): Promise<boolean> => {
    // Se a senha for fornecida, validamos via re-auth
    if (password && auth.currentUser && auth.currentUser.email) {
       try {
         const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
         await reauthenticateWithCredential(auth.currentUser, credential);
       } catch (e) {
         return false; // Senha incorreta
       }
    }
    
    // Basicamente um logout + limpeza local
    localStorage.clear();
    await logout();
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      hasLocalUser: !!user, // Compatibilidade
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
