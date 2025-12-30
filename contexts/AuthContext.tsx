
import React, { createContext, useContext, useState, useEffect } from 'react';
import { hashPassword, validatePassword, generateSalt } from '../utils/authSecurity';
import { database } from '../firebase';
import { ref, update } from 'firebase/database';

interface User {
  email: string;
  name?: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasLocalUser: boolean; 
  isLoading: boolean;
  login: (email: string, pin: string) => Promise<boolean>;
  register: (email: string, pin: string, name?: string) => Promise<boolean | string>;
  logout: () => void;
  changePassword: (currentPin: string, newPin: string) => Promise<boolean>;
  
  // Novos métodos de fluxo
  requestPasswordReset: (email: string) => Promise<boolean | string>;
  completePasswordReset: (token: string, newPin: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<'success' | 'invalid'>;
  resendVerificationEmail: () => Promise<boolean | string>;
  
  resetAppData: (pin: string) => Promise<boolean>;
  updateProfile: (data: { name?: string }) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Configuração de Persistência
const SESSION_KEY = 'finpro_session';
const AUTH_USER_KEY = 'finpro_auth_user';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasLocalUser, setHasLocalUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar estado inicial
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    const sessionData = localStorage.getItem(SESSION_KEY);

    if (storedUser) {
      setHasLocalUser(true);
      
      if (sessionData) {
        try {
          const { expiry } = JSON.parse(sessionData);
          const now = new Date().getTime();

          if (now < expiry) {
            const parsedUser = JSON.parse(storedUser);
            setUser({ 
              email: parsedUser.email, 
              name: parsedUser.name,
              emailVerified: !!parsedUser.emailVerified 
            });
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        } catch (e) {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    }
    setIsLoading(false);
  }, []);

  const startSession = () => {
    const expiry = new Date().getTime() + SESSION_DURATION;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ expiry }));
  };

  // Helper para gerar token simples
  const generateToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const register = async (email: string, pin: string, name?: string) => {
    try {
      const salt = generateSalt();
      const hash = await hashPassword(pin, salt);
      const verifyToken = generateToken();
      
      const userPayload = { 
        email, 
        hash, 
        salt, 
        name,
        emailVerified: false,
        verificationToken: verifyToken,
        createdAt: Date.now()
      };
      
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userPayload));
      localStorage.setItem('finpro_has_used_manager', 'true');
      
      setUser({ email, name, emailVerified: false });
      setIsAuthenticated(true);
      setHasLocalUser(true);
      startSession();
      
      // Retorna o token para que o componente de UI possa chamar o sendEmail
      // (Em um app real, isso seria server-side, mas aqui passamos para o UI ou chamamos direto)
      return verifyToken as any; 
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const login = async (email: string, pin: string) => {
    const storedData = localStorage.getItem(AUTH_USER_KEY);
    if (!storedData) return false;

    try {
      const { email: storedEmail, hash, salt, name, emailVerified } = JSON.parse(storedData);

      if (email.toLowerCase() === storedEmail.toLowerCase() && await validatePassword(pin, hash, salt)) {
        setUser({ email, name, emailVerified: !!emailVerified });
        setIsAuthenticated(true);
        startSession();
        return true;
      }
    } catch (e) {
      console.error("Erro no login", e);
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const updateProfile = (data: { name?: string }) => {
    const storedData = localStorage.getItem(AUTH_USER_KEY);
    if (!storedData) return;

    try {
      const userData = JSON.parse(storedData);
      const updatedUser = { ...userData, ...data };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (e) {
      console.error(e);
    }
  };

  const changePassword = async (currentPin: string, newPin: string): Promise<boolean> => {
    const storedData = localStorage.getItem(AUTH_USER_KEY);
    if (!storedData) return false;

    try {
      const userData = JSON.parse(storedData);
      const isValid = await validatePassword(currentPin, userData.hash, userData.salt);
      if (!isValid) return false;

      const newSalt = generateSalt();
      const newHash = await hashPassword(newPin, newSalt);

      const updatedUser = { ...userData, hash: newHash, salt: newSalt };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      return true;
    } catch (e) {
      return false;
    }
  };

  // --- NOVOS MÉTODOS DE FLUXO ---

  const requestPasswordReset = async (email: string): Promise<boolean | string> => {
    const storedData = localStorage.getItem(AUTH_USER_KEY);
    if (!storedData) return true; // Segurança: sempre retorna true para não vazar e-mails

    try {
      const userData = JSON.parse(storedData);
      if (email.toLowerCase() === userData.email.toLowerCase()) {
        const resetToken = generateToken();
        const updatedUser = { 
          ...userData, 
          resetToken, 
          resetTokenExpires: Date.now() + 3600000 // 1 hora
        };
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
        
        // Em um backend real, isso seria interno. Aqui retornamos para simular o envio.
        // Hack: Usando throw para passar o token para o mock de e-mail na UI (apenas p/ simulação local)
        // Na prática, AuthContext chamaria sendEmail internamente se tivesse acesso.
        // Vamos assumir que AuthContext chama a função de email utilitária se importada, 
        // mas para manter limpo, vamos salvar o token e deixar o componente chamar sendConfirmationEmail
        return resetToken as any;
      }
    } catch (e) { console.error(e); }
    return true;
  };

  const completePasswordReset = async (token: string, newPin: string): Promise<boolean> => {
    const storedData = localStorage.getItem(AUTH_USER_KEY);
    if (!storedData) return false;

    try {
      const userData = JSON.parse(storedData);
      
      // Valida token e expiração
      if (userData.resetToken === token && userData.resetTokenExpires > Date.now()) {
        const newSalt = generateSalt();
        const newHash = await hashPassword(newPin, newSalt);

        const updatedUser = { 
          ...userData, 
          hash: newHash, 
          salt: newSalt,
          resetToken: null,
          resetTokenExpires: null
        };
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  const verifyEmail = async (token: string): Promise<'success' | 'invalid'> => {
    const storedData = localStorage.getItem(AUTH_USER_KEY);
    if (!storedData) return 'invalid';

    try {
      const userData = JSON.parse(storedData);
      
      // Verifica token
      if (userData.verificationToken === token) {
        const updatedUser = { 
          ...userData, 
          emailVerified: true, 
          verificationToken: null 
        };
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
        
        // Atualiza estado local se logado
        if (user) setUser({ ...user, emailVerified: true });

        // Tenta atualizar no Firebase Realtime Database também (para persistência cloud futura)
        // Usamos userId local sanitizado
        const localUserId = userData.email.replace(/[.#$[\]]/g, '_');
        update(ref(database, `users/${localUserId}/meta`), {
          emailVerified: true,
          updatedAt: Date.now()
        }).catch(() => console.log('Sync offline ou não configurado'));

        return 'success';
      }
    } catch (e) { console.error(e); }
    return 'invalid';
  };

  const resendVerificationEmail = async (): Promise<boolean | string> => {
    if (!user) return false;
    const storedData = localStorage.getItem(AUTH_USER_KEY);
    if (!storedData) return false;

    const userData = JSON.parse(storedData);
    // Gera novo token se não tiver
    const verifyToken = userData.verificationToken || generateToken();
    
    if (verifyToken !== userData.verificationToken) {
       const updatedUser = { ...userData, verificationToken: verifyToken };
       localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
    }
    
    // Retorna token para envio
    return verifyToken as any;
  };

  const resetAppData = async (pin: string): Promise<boolean> => {
    const storedData = localStorage.getItem(AUTH_USER_KEY);
    if (!storedData) return false;

    try {
      const userData = JSON.parse(storedData);
      const isValid = await validatePassword(pin, userData.hash, userData.salt);
      
      if (isValid) {
        localStorage.clear();
        logout();
        setHasLocalUser(false);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      hasLocalUser, 
      isLoading, 
      login, 
      register, 
      logout,
      changePassword,
      requestPasswordReset,
      completePasswordReset,
      verifyEmail,
      resendVerificationEmail,
      resetAppData,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
