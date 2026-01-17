import React, { useState } from 'react';
import { useFirebase } from '../hooks/useFirebase';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useFirebase();
  const navigate = useNavigate();
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setLocalError('Falha ao entrar. Verifique email e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -ml-20 -mt-20"></div>
      
      <div className="w-full max-w-sm z-10 flex flex-col items-center">
        
        {/* HEADER DA MARCA (Logo + Nome Lado a Lado) */}
        <div className="mb-10 text-center animate-fade-in w-full">
          <p className="text-green-500 font-bold tracking-widest text-[10px] mb-4 uppercase">
            Gerenciador Financeiro
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <img 
              src="/logo.png" 
              alt="Finanças Pro Invest" 
              // rounded-2xl: Quinas Arredondadas
              // shadow-green-900/50: Sombra verde suave
              className="w-14 h-14 object-cover rounded-2xl shadow-lg shadow-green-900/30"
              onError={(e) => {e.currentTarget.style.display='none'}}
            />
            <h1 className="text-2xl font-bold text-white tracking-tight leading-tight text-left">
              Finanças <br />
              Pro Invest
            </h1>
          </div>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-500" size={20} />
            <input
              type="email"
              placeholder="Seu e-mail"
              className="w-full bg-gray-900 text-white pl-10 p-3.5 rounded-xl border border-gray-800 focus:border-green-500 outline-none transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-500" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              className="w-full bg-gray-900 text-white pl-10 p-3.5 rounded-xl border border-gray-800 focus:border-green-500 outline-none transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-500 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {localError && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{localError}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 transition-all active:scale-95 mt-4"
          >
            {loading ? 'Acessando...' : 'ENTRAR NA CONTA'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/register" className="text-gray-500 hover:text-green-400 text-sm transition-colors">
            Não tem uma conta? <span className="font-bold underline">Cadastre-se grátis</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;