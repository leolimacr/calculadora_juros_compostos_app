
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthLoginProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

const AuthLogin: React.FC<AuthLoginProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login, resetPassword } = useAuth();
  
  // Modes: 'login', 'forgot'
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');
    
    const res = await login(email, password);
    
    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'Erro ao fazer login.');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setLoading(true);
    setForgotStatus('idle');
    
    const res = await resetPassword(forgotEmail);
    
    if (res.success) {
      setForgotStatus('success');
    } else {
      setForgotStatus('error');
      setError(res.error || 'Erro ao enviar e-mail.');
    }
    setLoading(false);
  };

  // --- MODO: ESQUECI SENHA ---
  if (mode === 'forgot') {
    return (
      <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-right-4">
        <button 
          onClick={() => { setMode('login'); setForgotStatus('idle'); setError(''); }}
          className="text-xs text-slate-400 hover:text-white mb-4 flex items-center gap-1"
        >
          ← Voltar para Login
        </button>
        
        <h3 className="text-xl font-bold text-white mb-2 text-center">Recuperar Senha</h3>
        
        {forgotStatus === 'success' ? (
            <div className="text-center bg-emerald-900/20 p-6 rounded-2xl border border-emerald-500/20">
                <span className="text-4xl block mb-4">📧</span>
                <p className="text-emerald-400 font-bold mb-2">E-mail Enviado!</p>
                <p className="text-slate-300 text-sm">
                    Se o e-mail <strong>{forgotEmail}</strong> estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
                </p>
                <button 
                    onClick={() => setMode('login')}
                    className="mt-6 w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl transition-colors"
                >
                    Voltar ao Login
                </button>
            </div>
        ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-slate-400 text-sm mb-2 text-center">
                Digite seu e-mail para receber o link de redefinição.
                </p>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
                    <input 
                        type="email" 
                        required
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
                        placeholder="seu@email.com"
                    />
                </div>

                {forgotStatus === 'error' && error && (
                    <p className="text-red-400 text-xs text-center">{error}</p>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                </button>
            </form>
        )}
      </div>
    );
  }

  // --- MODO: LOGIN ---
  return (
    <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-left-4">
      <h3 className="text-xl font-bold text-white mb-2 text-center">Bem-vindo de volta</h3>
      <p className="text-slate-400 text-sm mb-6 text-center">Faça login para continuar.</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
           <input 
             type="email" 
             value={email}
             onChange={e => setEmail(e.target.value)}
             className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
             placeholder="Digite seu e-mail"
           />
        </div>

        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
           <div className="relative">
             <input 
               type={showPassword ? "text" : "password"} 
               value={password}
               onChange={e => setPassword(e.target.value)}
               className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
               placeholder="Sua senha"
             />
             <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                tabIndex={-1}
             >
                {showPassword ? '🐵' : '🙈'}
             </button>
           </div>
        </div>

        {error && (
          <div className="bg-red-900/10 p-3 rounded-lg border border-red-500/20 text-center animate-in shake">
             <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <div className="flex justify-center items-center pt-4 border-t border-slate-800">
             <button type="button" onClick={() => setMode('forgot')} className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">
                 Esqueci minha senha
             </button>
        </div>
      </form>
    </div>
  );
};

export default AuthLogin;
