
import React, { createContext, useContext, useState, useEffect } from 'react';
import { hashPassword, validatePassword, generateSalt } from '../utils/authSecurity';

interface User {
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasLocalUser: boolean; // Indica se já existe conta criada neste device
  isLoading: boolean;
  login: (email: string, pin: string) => Promise<boolean>;
  register: (email: string, pin: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (currentPin: string, newPin: string) => Promise<boolean>;
  recoverPassword: (emailConfirm: string, newPin: string) => Promise<boolean>;
  resetAppData: (pin: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Configuração de Persistência
const SESSION_KEY = 'finpro_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasLocalUser, setHasLocalUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar estado inicial e verificar persistência
  useEffect(() => {
    const storedUser = localStorage.getItem('finpro_auth_user');
    const sessionData = localStorage.getItem(SESSION_KEY);

    if (storedUser) {
      setHasLocalUser(true);
      
      // Verifica se existe sessão e se ela ainda é válida (dentro dos 7 dias)
      if (sessionData) {
        try {
          const { expiry } = JSON.parse(sessionData);
          const now = new Date().getTime();

          if (now < expiry) {
            const parsedUser = JSON.parse(storedUser);
            setUser({ email: parsedUser.email });
            setIsAuthenticated(true);
          } else {
            // Sessão expirada
            localStorage.removeItem(SESSION_KEY);
          }
        } catch (e) {
          console.error("Erro ao validar sessão", e);
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

  const register = async (email: string, pin: string) => {
    try {
      const salt = generateSalt();
      const hash = await hashPassword(pin, salt);
      const userPayload = { email, hash, salt };
      
      localStorage.setItem('finpro_auth_user', JSON.stringify(userPayload));
      // Marca flag de engajamento também, já que criou conta
      localStorage.setItem('finpro_has_used_manager', 'true');
      
      setUser({ email });
      setIsAuthenticated(true);
      setHasLocalUser(true);
      
      // Inicia persistência de 7 dias
      startSession();
      
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const login = async (email: string, pin: string) => {
    const storedData = localStorage.getItem('finpro_auth_user');
    if (!storedData) return false;

    try {
      const { email: storedEmail, hash, salt } = JSON.parse(storedData);

      // Validação: Email deve bater (case insensitive) e Hash deve bater usando o Salt armazenado
      if (email.toLowerCase() === storedEmail.toLowerCase() && await validatePassword(pin, hash, salt)) {
        setUser({ email });
        setIsAuthenticated(true);
        
        // Renova/Inicia persistência de 7 dias
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
    // Remove o token de sessão, exigindo novo login
    localStorage.removeItem(SESSION_KEY);
    // Não removemos 'finpro_auth_user' para não apagar a conta
  };

  const changePassword = async (currentPin: string, newPin: string): Promise<boolean> => {
    const storedData = localStorage.getItem('finpro_auth_user');
    if (!storedData) return false;

    try {
      const userData = JSON.parse(storedData);
      
      // Valida a senha atual
      const isValid = await validatePassword(currentPin, userData.hash, userData.salt);
      if (!isValid) return false;

      // Gera novo hash e salt
      const newSalt = generateSalt();
      const newHash = await hashPassword(newPin, newSalt);

      // Atualiza apenas as credenciais, mantendo o email
      const updatedUser = { ...userData, hash: newHash, salt: newSalt };
      localStorage.setItem('finpro_auth_user', JSON.stringify(updatedUser));
      
      return true;
    } catch (e) {
      console.error("Erro ao alterar senha", e);
      return false;
    }
  };

  const recoverPassword = async (emailConfirm: string, newPin: string): Promise<boolean> => {
    const storedData = localStorage.getItem('finpro_auth_user');
    if (!storedData) return false;

    try {
      const userData = JSON.parse(storedData);
      
      // Validação de segurança: O e-mail informado deve ser idêntico ao cadastrado
      if (emailConfirm.toLowerCase() !== userData.email.toLowerCase()) {
        return false;
      }

      // Gera novo hash e salt (Redefinição forçada autorizada pelo email)
      const newSalt = generateSalt();
      const newHash = await hashPassword(newPin, newSalt);

      const updatedUser = { ...userData, hash: newHash, salt: newSalt };
      localStorage.setItem('finpro_auth_user', JSON.stringify(updatedUser));
      
      return true;
    } catch (e) {
      console.error("Erro na recuperação de senha", e);
      return false;
    }
  };

  const resetAppData = async (pin: string): Promise<boolean> => {
    const storedData = localStorage.getItem('finpro_auth_user');
    if (!storedData) return false;

    try {
      const userData = JSON.parse(storedData);
      // Valida a senha antes de apagar
      const isValid = await validatePassword(pin, userData.hash, userData.salt);
      
      if (isValid) {
        // Apaga TUDO do localStorage
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
      recoverPassword,
      resetAppData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
