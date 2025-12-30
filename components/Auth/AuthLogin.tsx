
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sendConfirmationEmail } from '../../utils/email';

interface AuthLoginProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

const AuthLogin: React.FC<AuthLoginProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login, requestPasswordReset } = useAuth();
  
  // View Modes: 'login' | 'forgot'
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  // Login States
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [loading, setLoading] = useState(false);
  
  const [errors, setErrors] = useState({
    email: '',
    pin: '',
    general: ''
  });

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Tenta preencher email se já existir salvo
  React.useEffect(() => {
    const stored = localStorage.getItem('finpro_auth_user');
    if (stored) {
        try {
            const { email } = JSON.parse(stored);
            setEmail(email);
        } catch(e) {}
    }
  }, []);

  const validateLogin = () => {
    let isValid = true;
    const newErrors = { email: '', pin: '', general: '' };

    if (!email.trim()) {
        newErrors.email = '❌ E-mail é obrigatório.';
        isValid = false;
    }
    if (!pin.trim()) {
        newErrors.pin = '❌ PIN é obrigatório.';
        isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setLoading(true);
    const success = await login(email, pin);
    
    if (success) {
      onSuccess();
    } else {
      const stored = localStorage.getItem('finpro_auth_user');
      if (!stored) {
         setErrors(prev => ({...prev, general: '❌ Este e-mail não está cadastrado.'}));
      } else {
         const { email: storedEmail } = JSON.parse(stored);
         if (email.toLowerCase() !== storedEmail.toLowerCase()) {
            setErrors(prev => ({...prev, general: '❌ Este e-mail não está cadastrado.'}));
         } else {
            setErrors(prev => ({...prev, general: '❌ PIN incorreto.'}));
         }
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.includes('@')) {
        setErrors(prev => ({...prev, general: 'E-mail inválido'}));
        return;
    }

    setLoading(true);
    // Request reset (retorna o token simulado ou true)
    const token = await requestPasswordReset(forgotEmail);
    
    // Simula envio de email
    if (token) {
        await sendConfirmationEmail(forgotEmail, 'reset', typeof token === 'string' ? token : 'mock_token');
    }
    
    setLoading(false);
    setForgotStatus('success');
  };

  if (mode === 'forgot') {
    return (
      <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-right-4">
        <button 
          onClick={() => { setMode('login'); setForgotStatus('idle'); }}
          className="text-xs text-slate-400 hover:text-white mb-4 flex items-center gap-1"
        >
          ← Voltar para Login
        </button>
        
        <h3 className="text-xl font-bold text-white mb-2 text-center">Recuperar Acesso</h3>
        
        {forgotStatus === 'success' ? (
          <div className="bg-emerald-500/20 border border-emerald-500/50 p-6 rounded-xl text-center animate-in zoom-in">
            <div className="text-4xl mb-3">📧</div>
            <p className="text-emerald-400 font-bold text-lg mb-2">Verifique seu E-mail</p>
            <p className="text-sm text-slate-300 mb-4">
              Se o e-mail <strong>{forgotEmail}</strong> estiver cadastrado, enviamos um link para criar um novo PIN.
            </p>
            <p className="text-xs text-slate-500">(Verifique também a caixa de Spam/Lixeira)</p>
            <button 
                onClick={() => setMode('login')}
                className="mt-4 text-emerald-400 hover:text-white font-bold text-sm underline"
            >
                Voltar ao Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
             <p className="text-slate-400 text-sm mb-4 text-center">
               Digite seu e-mail cadastrado para receber instruções.
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

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Enviando...
                  </>
              ) : 'Enviar Instruções'}
            </button>
          </form>
        )}
      </div>
    );
  }

  // --- MODO DE LOGIN PADRÃO ---
  return (
    <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-left-4">
      <h3 className="text-xl font-bold text-white mb-2 text-center">Bem-vindo de volta</h3>
      <p className="text-slate-400 text-sm mb-6 text-center">Digite seu PIN para desbloquear os dados.</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail Cadastrado</label>
           <input 
             type="email" 
             value={email}
             onChange={e => { setEmail(e.target.value); setErrors(prev => ({...prev, email: '', general: ''})); }}
             className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white outline-none transition-colors ${errors.email ? 'border-red-500' : 'border-slate-700 focus:border-emerald-500'}`}
             placeholder="Digite seu e-mail"
           />
           {errors.email && <p className="text-[10px] text-red-400 mt-1 font-bold">{errors.email}</p>}
        </div>

        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PIN / Senha</label>
           <div className="relative">
             <input 
               type={showPassword ? "text" : "password"} 
               value={pin}
               onChange={e => { setPin(e.target.value); setErrors(prev => ({...prev, pin: '', general: ''})); }}
               className={`w-full bg-slate-900 border rounded-xl pl-4 pr-12 py-3 text-white outline-none transition-colors tracking-widest ${errors.pin ? 'border-red-500' : 'border-slate-700 focus:border-emerald-500'}`}
               placeholder="- - - - - -"
             />
             <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                tabIndex={-1}
             >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
                )}
             </button>
           </div>
           {errors.pin && <p className="text-[10px] text-red-400 mt-1 font-bold">{errors.pin}</p>}
        </div>

        {errors.general && (
          <div className="bg-red-900/10 p-2 rounded-lg border border-red-500/20 text-center animate-in shake">
             <p className="text-red-400 text-sm font-medium">{errors.general}</p>
             {errors.general.includes('não está cadastrado') && (
               <button 
                 type="button" 
                 onClick={onSwitchToRegister} 
                 className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline mt-1"
               >
                 Criar conta agora?
               </button>
             )}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>

        <div className="flex justify-center items-center pt-4 border-t border-slate-800">
             <button type="button" onClick={() => setMode('forgot')} className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">
                 Esqueci meu PIN
             </button>
        </div>
      </form>
    </div>
  );
};

export default AuthLogin;
