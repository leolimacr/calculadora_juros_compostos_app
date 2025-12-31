
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
  // Status agora suporta 'not-found' para feedback específico
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'success' | 'error' | 'not-found'>('idle');

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
    } else if (res.code === 'auth/user-not-found') {
      setForgotStatus('not-found');
    } else {
      setForgotStatus('error');
      setError(res.error || 'Não foi possível enviar o e-mail. Tente novamente.');
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
            <div className="text-center bg-emerald-900/20 p-6 rounded-2xl border border-emerald-500/20 animate-in zoom-in">
                <span className="text-4xl block mb-4">📧</span>
                <p className="text-emerald-400 font-bold mb-2">E-mail Enviado!</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                    Enviamos um e-mail para <strong>{forgotEmail}</strong> com o link de redefinição.<br/><br/>
                    Se não encontrar na caixa de entrada, <strong>verifique também o lixo eletrônico ou a pasta de spam</strong>.
                </p>
                <button 
                    onClick={() => setMode('login')}
                    className="mt-6 w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl transition-colors"
                >
                    Voltar ao Login
                </button>
            </div>
        ) : forgotStatus === 'not-found' ? (
            <div className="text-center bg-amber-900/20 p-6 rounded-2xl border border-amber-500/20 animate-in shake">
                <span className="text-4xl block mb-4">🤔</span>
                <p className="text-amber-400 font-bold mb-2">E-mail não encontrado</p>
                <p className="text-slate-300 text-sm mb-4">
                    Este e-mail não está cadastrado. Verifique se digitou corretamente ou crie uma conta nova.
                </p>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setForgotStatus('idle')}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded-xl transition-colors"
                    >
                        Tentar Outro
                    </button>
                    <button 
                        onClick={onSwitchToRegister}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl transition-colors"
                    >
                        Criar Conta
                    </button>
                </div>
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
                    <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-xl text-center">
                        <p className="text-red-400 text-xs font-bold">{error}</p>
                    </div>
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
