import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, database } from '../../firebase';
import { ref, set } from 'firebase/database';

const AuthRegister: React.FC<{ onSuccess: () => void, onSwitchToLogin: () => void }> = ({ onSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError('As senhas não coincidem.');
    setError('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Inicializa os dados do usuário no banco de dados
      await set(ref(database, 'users/' + userCredential.user.uid), {
        meta: { 
            plan: 'free', 
            launchLimit: 30, 
            launchCount: 0, 
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
      });
      onSuccess();
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setError('E-mail já cadastrado.');
      else if (err.code === 'auth/weak-password') setError('Senha fraca (mínimo 6 caracteres).');
      else setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-6 animate-in fade-in flex flex-col justify-center min-h-screen">
      
      {/* IDENTIDADE VISUAL UNIFICADA: ECOSSISTEMA FINANÇAS PRO INVEST */}
      <div className="flex flex-col items-center justify-center mb-10">
        <div className="flex items-center gap-3">
            {/* Ícone alinhado ao texto principal */}
            <img src="/icon.png" alt="Logo" className="w-11 h-11 rounded-xl shadow-lg shadow-sky-500/20" />
            
            <div className="flex flex-col">
                {/* Prefixo Verde */}
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] leading-none mb-1">Ecossistema</p>
                {/* Nome Principal Azul */}
                <h1 className="text-2xl font-black text-sky-400 tracking-tight leading-none">Finanças Pro Invest</h1>
            </div>
        </div>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-6 text-center">Criar Nova Conta</h2>

        {error && <div className="bg-red-500/20 text-red-200 p-3 rounded-xl mb-4 text-sm text-center border border-red-500/30">{error}</div>}
        
        <form onSubmit={handleRegister} className="space-y-4">
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
                    placeholder="Mínimo 6 caracteres"
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

            <div>
                <label className="text-slate-400 text-xs font-bold uppercase ml-1">Confirmar Senha</label>
                <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirm} 
                    onChange={(e) => setConfirm(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-sky-500 transition-all" 
                    placeholder="Repita sua senha"
                    required 
                />
            </div>

            <button 
                disabled={loading} 
                type="submit" 
                className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-4 rounded-2xl shadow-lg shadow-sky-900/40 transition-all disabled:opacity-50 active:scale-95 mt-4 tracking-widest"
            >
                {loading ? 'CRIANDO...' : 'CRIAR CONTA'}
            </button>
        </form>
        
        <div className="mt-8 text-center border-t border-slate-800 pt-6">
            <button onClick={onSwitchToLogin} className="text-slate-400 text-sm hover:text-white transition-colors">
                Já tem conta? <span className="text-sky-400 font-bold">Entrar agora</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthRegister;