import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut, sendEmailVerification, User } from 'firebase/auth';
import { auth } from '../../firebase';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface AuthLoginProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

const AuthLogin: React.FC<AuthLoginProps> = ({ onSuccess, onSwitchToRegister }) => {
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
        setUnverifiedUser(user);
        setError('E-mail não verificado.');
        setLoading(false);
        return;
      }

      // Se passou, libera o acesso
      onSuccess();
    } catch (err: any) {
      await signOut(auth); // Garante logout se der erro
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Aguarde um momento.');
      } else {
        setError('Erro ao entrar. Tente novamente.');
      }
      setLoading(false);
    }
  };

  // --- REENVIAR E-MAIL ---
  const handleResendVerification = async () => {
    if (!unverifiedUser) return;
    
    setLoading(true);
    try {
      await sendEmailVerification(unverifiedUser);
      setSuccessMsg(`E-mail reenviado para ${email}! Verifique o SPAM.`);
      setError('');
      setUnverifiedUser(null);
      await signOut(auth);
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
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="w-full max-w-md space-y-8">
        
        {/* HEADER LIMPO (Sem "Gerenciador Financeiro") */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto shadow-2xl border border-slate-700">
             <img src="/icon.png" alt="Logo" className="w-12 h-12 rounded-xl" />
          </div>
          
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Finanças Pro Invest</h1>
          </div>
          
          <p className="text-slate-400 text-sm">Entre para dominar o seu patrimônio.</p>
        </div>

        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl backdrop-blur-sm">
          
          {/* Mensagens de Erro e Sucesso */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold text-center mb-6 flex flex-col gap-2">
                <span>{error}</span>
                {unverifiedUser && (
                    <button 
                        onClick={handleResendVerification}
                        className="underline hover:text-white transition-colors"
                    >
                        Não recebeu? Clique para reenviar o link.
                    </button>
                )}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-xs font-bold text-center mb-6">
                {successMsg}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={20} />
              <input 
                type="email" 
                placeholder="Seu e-mail" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-sky-500 transition-all font-medium placeholder:text-slate-600"
                required
              />
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Sua senha" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white pl-12 pr-12 py-4 rounded-2xl outline-none focus:border-sky-500 transition-all font-medium placeholder:text-slate-600"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>

            <div className="flex justify-end">
                <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-[10px] font-bold text-sky-400 hover:text-white uppercase tracking-wider transition-colors"
                >
                    Esqueceu a senha?
                </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {loading ? 'Acessando...' : 'Acessar Conta'} <ArrowRight size={16}/>
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-800">
            <p className="text-slate-500 text-sm mb-2">Ainda não tem conta?</p>
            <button onClick={onSwitchToRegister} className="text-emerald-400 font-bold hover:text-emerald-300 uppercase text-xs tracking-widest hover:underline">
              Criar Conta Gratuita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLogin;