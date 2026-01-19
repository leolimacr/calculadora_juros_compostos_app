import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut, sendEmailVerification, User } from 'firebase/auth';
import { auth } from '../../firebase';

const AuthLogin: React.FC<{ onSuccess: () => void, onSwitchToRegister: () => void }> = ({ onSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para armazenar usuário não verificado temporariamente
  const [unverifiedUser, setUnverifiedUser] = useState<User | null>(null);

  // --- LOGIN COM VERIFICAÇÃO DE E-MAIL ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setUnverifiedUser(null);
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // TRAVA DE SEGURANÇA: Verifica se o e-mail foi validado
      if (!user.emailVerified) {
        // Guardamos o usuário na memória para permitir o reenvio, mas NÃO liberamos o onSuccess
        setUnverifiedUser(user);
        setError('E-mail não verificado.');
        setLoading(false);
        return;
      }

      // Se passou, libera o acesso ao Dashboard
      onSuccess();
    } catch (err: any) {
      // Se der erro, garante que não tem ninguém logado
      await signOut(auth);
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Aguarde um momento.');
      } else {
        setError('Erro ao entrar. Tente novamente.');
      }
    } finally {
      if (loading) setLoading(false);
    }
  };

  // --- REENVIAR E-MAIL DE VERIFICAÇÃO ---
  const handleResendVerification = async () => {
    if (!unverifiedUser) return;
    
    setLoading(true);
    try {
      await sendEmailVerification(unverifiedUser);
      setSuccessMsg(`E-mail reenviado para ${email}! Verifique o SPAM.`);
      setError('');
      setUnverifiedUser(null);
      await signOut(auth); // Agora sim deslogamos por segurança
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
         setError('Aguarde alguns minutos antes de reenviar.');
      } else {
         setError('Erro ao reenviar.');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- RECUPERAÇÃO DE SENHA ---
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Digite seu e-mail para recuperar a senha.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg(`Link de recuperação enviado para ${email}.`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') setError('E-mail não cadastrado.');
      else setError('Erro ao enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-6 animate-in fade-in flex flex-col justify-center min-h-screen">
      
      {/* IDENTIDADE VISUAL */}
      <div className="flex flex-col items-center justify-center mb-12">
        <div className="flex items-center gap-3">
            <img src="/icon.png" alt="Logo" className="w-11 h-11 rounded-xl shadow-lg shadow-sky-500/20" />
            <div className="flex flex-col">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] leading-none mb-1">Ecossistema</p>
                <h1 className="text-2xl font-black text-sky-400 tracking-tight leading-none">Finanças Pro Invest</h1>
            </div>
        </div>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-6 text-center">Acessar Conta</h2>
        
        {/* Mensagens de Erro (Com botão de Reenvio) */}
        {error && (
            <div className="bg-red-500/20 text-red-200 p-3 rounded-xl mb-4 text-sm text-center border border-red-500/30 flex flex-col gap-2">
                <span>{error}</span>
                {/* Se o erro for de verificação, mostra o botão */}
                {unverifiedUser && (
                    <button 
                        onClick={handleResendVerification}
                        className="text-xs font-bold underline hover:text-white transition-colors"
                    >
                        Não recebeu? Clique para reenviar.
                    </button>
                )}
            </div>
        )}

        {/* Mensagens de Sucesso */}
        {successMsg && <div className="bg-emerald-500/20 text-emerald-200 p-3 rounded-xl mb-4 text-sm text-center border border-emerald-500/30">{successMsg}</div>}
        
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
                <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 text-xs font-bold uppercase ml-1">Senha</label>
                    <button 
                        type="button" 
                        onClick={handleForgotPassword}
                        className="text-[10px] font-bold text-sky-400 hover:text-white uppercase tracking-wider"
                    >
                        Esqueceu?
                    </button>
                </div>
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
                {loading ? 'PROCESSANDO...' : 'ENTRAR'}
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