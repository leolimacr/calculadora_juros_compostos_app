
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sendConfirmationEmail } from '../../utils/email';

interface AuthLoginProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

const AuthLogin: React.FC<AuthLoginProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login, requestPasswordReset, completePasswordReset } = useAuth();
  
  // Modes: 'login', 'forgot_email', 'forgot_code'
  const [mode, setMode] = useState<'login' | 'forgot_email' | 'forgot_code'>('login');

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
  const [verificationCode, setVerificationCode] = useState(''); // Código gerado
  const [inputCode, setInputCode] = useState(''); // Código digitado
  const [newPin, setNewPin] = useState(''); // Nova senha

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pin) return;

    setLoading(true);
    const success = await login(email, pin);
    
    if (success) {
      onSuccess();
    } else {
      setErrors(prev => ({...prev, general: '❌ E-mail ou PIN incorretos.'}));
    }
    setLoading(false);
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.includes('@')) return;

    setLoading(true);
    
    // Solicita reset. No AuthContext atual, ele retorna um token.
    // Vamos usar esse token como o "código correto" para simplificar a integração com a lógica existente.
    // Em um backend real, o código seria validado lá.
    
    // Gerar um código de 6 dígitos numérico para ser user-friendly
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code); // Guarda localmente para validar na próxima etapa

    // O requestPasswordReset do context guarda um token no localStorage.
    // Para manter a segurança do fluxo, vamos apenas enviar o email aqui e usar nosso código local para validar a UI
    // e depois chamar o completePasswordReset com o token real gerado pelo context.
    const token = await requestPasswordReset(forgotEmail);
    
    if (token) {
        await sendConfirmationEmail(forgotEmail, 'reset', code);
        setMode('forgot_code');
        // Hack: Guardamos o token "oficial" do sistema em um estado temporário se necessário, 
        // mas o completePasswordReset pede o token. 
        // Como o token do context é uma string complexa e queremos 6 dígitos,
        // vamos adaptar o AuthContext no futuro. Por agora, vamos usar o token retornado como ID da transação.
        sessionStorage.setItem('reset_token_temp', typeof token === 'string' ? token : '');
    } else {
        setErrors(prev => ({...prev, general: 'E-mail não encontrado.'}));
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode !== verificationCode) {
        alert('Código incorreto!');
        return;
    }
    if (newPin.length < 4) {
        alert('O novo PIN deve ter 4 dígitos.');
        return;
    }

    setLoading(true);
    const token = sessionStorage.getItem('reset_token_temp') || '';
    const success = await completePasswordReset(token, newPin);
    
    if (success) {
        alert('Senha redefinida com sucesso!');
        setMode('login');
    } else {
        alert('Erro ao redefinir. O token pode ter expirado.');
    }
    setLoading(false);
  };

  // --- MODO 2: DIGITAR CÓDIGO E NOVA SENHA ---
  if (mode === 'forgot_code') {
      return (
        <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-bold text-white mb-2 text-center">Criar Novo PIN</h3>
            <p className="text-slate-400 text-sm mb-6 text-center">Digite o código enviado para {forgotEmail}</p>

            <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                    <input 
                        type="text" 
                        placeholder="Código de 6 dígitos"
                        value={inputCode}
                        onChange={e => setInputCode(e.target.value.replace(/\D/g, '').substring(0,6))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-center text-xl tracking-widest outline-none focus:border-emerald-500"
                        autoFocus
                    />
                </div>
                <div>
                    <input 
                        type="password" 
                        placeholder="Novo PIN"
                        value={newPin}
                        onChange={e => setNewPin(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-center text-xl tracking-widest outline-none focus:border-emerald-500"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading || inputCode.length < 6 || newPin.length < 4}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                    {loading ? 'Salvando...' : 'Confirmar Alteração'}
                </button>
            </form>
        </div>
      );
  }

  // --- MODO 1: ESQUECI SENHA (E-MAIL) ---
  if (mode === 'forgot_email') {
    return (
      <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-right-4">
        <button 
          onClick={() => setMode('login')}
          className="text-xs text-slate-400 hover:text-white mb-4 flex items-center gap-1"
        >
          ← Voltar para Login
        </button>
        
        <h3 className="text-xl font-bold text-white mb-2 text-center">Recuperar Acesso</h3>
        
        <form onSubmit={handleSendResetCode} className="space-y-4">
             <p className="text-slate-400 text-sm mb-4 text-center">
               Digite seu e-mail cadastrado para receber o código.
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
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>
        </form>
      </div>
    );
  }

  // --- MODO LOGIN PADRÃO ---
  return (
    <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-left-4">
      <h3 className="text-xl font-bold text-white mb-2 text-center">Bem-vindo de volta</h3>
      <p className="text-slate-400 text-sm mb-6 text-center">Digite seu PIN para desbloquear.</p>

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
                {showPassword ? '🐵' : '🙈'}
             </button>
           </div>
        </div>

        {errors.general && (
          <div className="bg-red-900/10 p-2 rounded-lg border border-red-500/20 text-center animate-in shake">
             <p className="text-red-400 text-sm font-medium">{errors.general}</p>
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
             <button type="button" onClick={() => setMode('forgot_email')} className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">
                 Esqueci meu PIN
             </button>
        </div>
      </form>
    </div>
  );
};

export default AuthLogin;
