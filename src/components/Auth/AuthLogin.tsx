import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';

const AuthLogin: React.FC<{ onSuccess: () => void, onSwitchToRegister: () => void }> = ({ onSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: any) {
      setError('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-6 animate-in fade-in flex flex-col justify-center min-h-screen">
      
      {/* IDENTIDADE VISUAL UNIFICADA: ECOSSISTEMA FINANÇAS PRO INVEST */}
      <div className="flex flex-col items-center justify-center mb-12">
        <div className="flex items-center gap-3">
            {/* Ícone com altura pareada ao nome principal */}
            <img src="/icon.png" alt="Logo" className="w-11 h-11 rounded-xl shadow-lg shadow-sky-500/20" />
            
            <div className="flex flex-col">
                {/* Nome Ecossistema em Verde e Pequeno */}
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] leading-none mb-1">Ecossistema</p>
                {/* Nome Principal em Azul Claro e Grande */}
                <h1 className="text-2xl font-black text-sky-400 tracking-tight leading-none">Finanças Pro Invest</h1>
            </div>
        </div>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-6 text-center">Acessar Conta</h2>
        
        {error && <div className="bg-red-500/20 text-red-200 p-3 rounded-xl mb-4 text-sm text-center border border-red-500/30">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="text-slate-400 text-xs font-bold uppercase ml-1">E-mail</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-sky-500 transition-all" 
                    placeholder="seu@email.com"
                    required 
                />
            </div>
            
            <div className="relative">
                <label className="text-slate-400 text-xs font-bold uppercase ml-1">Senha</label>
                <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-sky-500 transition-all pr-12" 
                    placeholder="******"
                    required 
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[38px] text-slate-400 hover:text-white transition-colors"
                >
                    {showPassword ? '🙈' : '👁️'}
                </button>
            </div>

            <button 
                disabled={loading} 
                type="submit" 
                className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-4 rounded-2xl shadow-lg shadow-sky-900/40 transition-all disabled:opacity-50 active:scale-95 mt-4 tracking-widest"
            >
                {loading ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
        </form>
        
        <div className="mt-8 text-center border-t border-slate-800 pt-6">
            <button onClick={onSwitchToRegister} className="text-slate-400 text-sm hover:text-white transition-colors">
                Não tem conta? <span className="text-sky-400 font-bold">Criar grátis</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthLogin;