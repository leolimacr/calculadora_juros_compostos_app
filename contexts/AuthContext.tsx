import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  firestore 
} from '../firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{success: boolean; error?: string; code?: string}>;
  register: (email: string, password: string, displayName: string) => Promise<{success: boolean; error?: string}>;
  resetPassword: (email: string) => Promise<{success: boolean; error?: string; code?: string}>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => ({ success: false, error: 'Não inicializado' }),
  register: async () => ({ success: false, error: 'Não inicializado' }),
  resetPassword: async () => ({ success: false, error: 'Não inicializado' }),
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔥 AuthContext: Iniciando monitoramento de autenticação');
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('🔥 AuthContext: Estado alterado - usuário:', currentUser?.email || 'Nenhum');
      console.log('🔥 AuthContext: UID:', currentUser?.uid || 'Nenhum');
      
      if (currentUser) {
        // Verificar se o documento do usuário existe no Firestore
        try {
          const userDocRef = doc(firestore, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            console.log('🔥 AuthContext: Criando documento do usuário no Firestore');
            // Criar documento básico do usuário
            await setDoc(userDocRef, {
              email: currentUser.email,
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuário',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              subscription: {
                planId: 'free',
                status: 'active'
              }
            });
          }
        } catch (error) {
          console.error('🔥 AuthContext: Erro ao verificar/criar documento do usuário:', error);
        }
      }
      
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error('🔥 AuthContext: Erro no onAuthStateChanged:', error);
      setLoading(false);
    });

    return () => {
      console.log('🔥 AuthContext: Limpando listener de autenticação');
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔥 AuthContext.login: Tentando login para:', email);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('🔥 AuthContext.login: Sucesso! UID:', userCredential.user.uid);
      
      return { 
        success: true 
      };
    } catch (error: any) {
      console.error('🔥 AuthContext.login: Erro completo:', {
        code: error.code,
        message: error.message,
        name: error.name
      });
      
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      // Traduzir erros comuns
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'E-mail inválido. Verifique o formato.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta conta foi desativada.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado. Verifique o e-mail.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta. Tente novamente.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet.';
          break;
      }
      
      return { 
        success: false, 
        error: errorMessage,
        code: error.code
      };
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    console.log('🔥 AuthContext.register: Criando conta para:', email);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('🔥 AuthContext.register: Conta criada! UID:', userCredential.user.uid);
      
      // Criar documento do usuário no Firestore
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        email: email,
        displayName: displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subscription: {
          planId: 'free',
          status: 'active'
        }
      });
      
      return { 
        success: true 
      };
    } catch (error: any) {
      console.error('🔥 AuthContext.register: Erro:', error);
      
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este e-mail já está em uso.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'E-mail inválido.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operação não permitida.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
          break;
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const resetPassword = async (email: string) => {
    console.log('🔥 AuthContext.resetPassword: Enviando e-mail para:', email);
    
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('🔥 AuthContext.resetPassword: E-mail enviado com sucesso');
      
      return { 
        success: true 
      };
    } catch (error: any) {
      console.error('🔥 AuthContext.resetPassword: Erro:', error);
      
      let errorMessage = 'Erro ao enviar e-mail de recuperação.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Nenhuma conta encontrada com este e-mail.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'E-mail inválido.';
          break;
      }
      
      return { 
        success: false, 
        error: errorMessage,
        code: error.code
      };
    }
  };

  const logout = async () => {
    console.log('🔥 AuthContext.logout: Fazendo logout');
    
    try {
      await signOut(auth);
      console.log('🔥 AuthContext.logout: Logout realizado com sucesso');
    } catch (error) {
      console.error('🔥 AuthContext.logout: Erro:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    resetPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};