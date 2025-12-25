
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
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasLocalUser, setHasLocalUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar estado inicial
  useEffect(() => {
    const storedUser = localStorage.getItem('finpro_auth_user');
    const activeSession = sessionStorage.getItem('finpro_auth_session');

    if (storedUser) {
      setHasLocalUser(true);
      if (activeSession === 'active') {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser({ email: parsedUser.email });
          setIsAuthenticated(true);
        } catch (e) {
          console.error("Erro ao ler dados do usuário", e);
          localStorage.removeItem('finpro_auth_user');
          setHasLocalUser(false);
        }
      }
    }
    setIsLoading(false);
  }, []);

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
      sessionStorage.setItem('finpro_auth_session', 'active');
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
        sessionStorage.setItem('finpro_auth_session', 'active');
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
    sessionStorage.removeItem('finpro_auth_session');
    // Não removemos 'finpro_auth_user' para não apagar a conta, apenas a sessão
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, hasLocalUser, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
