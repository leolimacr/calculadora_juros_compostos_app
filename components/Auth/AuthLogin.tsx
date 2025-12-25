
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sendConfirmationEmail } from '../../utils/email';

interface AuthLoginProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

const AuthLogin: React.FC<AuthLoginProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login, recoverPassword } = useAuth();
  
  // View Modes: 'login' | 'reset'
  const [mode, setMode] = useState<'login' | 'reset'>('login');

  // Login States
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset States
  const [resetEmail, setResetEmail] = useState('');
  const [newPin, setNewPin] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showRegisterHint, setShowRegisterHint] = useState(false); // Novo estado para o CTA

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
    setError('');
    setLoading(true);

    const success = await login(email, pin);
    if (success) {
      onSuccess();
    } else {
      setError('E-mail ou PIN incorretos.');
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setShowRegisterHint(false);
    setLoading(true);

    if (newPin.length < 4) {
      setResetError('O novo PIN deve ter min. 4 dígitos.');
      setLoading(false);
      return;
    }

    const success = await recoverPassword(resetEmail, newPin);
    
    if (success) {
      // Envia e-mail de confirmação (Mock)
      await sendConfirmationEmail(resetEmail, 'reset');
      
      setResetSuccess(true);
      // Auto-switch back to login after success
      setTimeout(() => {
        setMode('login');
        setPin(''); 
        setEmail(resetEmail); // Preenche o email para facilitar
        setError(''); 
        setResetSuccess(false);
      }, 3000); // Aumentado tempo para leitura da mensagem de e-mail
    } else {
      setResetError('E-mail não confere com o cadastro local.');
      setShowRegisterHint(true); // Ativa o CTA para cadastro
    }
    setLoading(false);
  };

  const handleGoToRegister = () => {
    // Reseta estados e vai para registro
    setMode('login');
    setResetError('');
    setShowRegisterHint(false);
    onSwitchToRegister();
  };

  // --- MODO DE RECUPERAÇÃO DE SENHA ---
  if (mode === 'reset') {
    return (
      <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-right-4">
        <button 
          onClick={() => setMode('login')}
          className="text-xs text-slate-400 hover:text-white mb-4 flex items-center gap-1"
        >
          ← Voltar para Login
        </button>
        
        <h3 className="text-xl font-bold text-white mb-2 text-center">Recuperar Acesso</h3>
        <p className="text-slate-400 text-sm mb-6 text-center">
          Para garantir sua segurança sem perder seus dados, confirme o e-mail cadastrado.
        </p>

        {resetSuccess ? (
          <div className="bg-emerald-500/20 border border-emerald-500/50 p-6 rounded-xl text-center animate-in zoom-in">
            <p className="text-emerald-400 font-bold text-lg mb-2">Sucesso!</p>
            <p className="text-sm text-slate-200">Sua senha foi redefinida.</p>
            <p className="text-xs text-slate-400 mt-2">
               Enviamos uma mensagem para seu e-mail ({resetEmail}) confirmando a alteração.
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
             <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirme seu E-mail</label>
              <input 
                type="email" 
                required
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
                placeholder="Deve ser igual ao cadastro"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Novo PIN</label>
              <input 
                type="password" 
                required
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors tracking-widest"
                placeholder="****"
              />
            </div>

            {resetError && (
              <div className="bg-red-900/10 p-3 rounded-lg border border-red-500/20 text-center animate-in shake">
                 <p className="text-red-400 text-sm font-medium">{resetError}</p>
                 
                 {showRegisterHint && (
                   <p className="mt-2 text-xs text-slate-400 pt-2 border-t border-red-500/10">
                      Ainda não criou sua conta neste dispositivo?{' '}
                      <button
                        type="button"
                        className="text-emerald-400 hover:text-emerald-300 font-semibold underline-offset-2 underline transition-colors"
                        onClick={handleGoToRegister}
                      >
                        Crie agora clicando aqui
                      </button>
                   </p>
                 )}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Redefinir PIN'}
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
      <p className="text-slate-400 text-sm mb-6 text-center">Digite seu PIN para desbloquear os dados deste dispositivo.</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail Cadastrado</label>
           <input 
             type="email" 
             required
             value={email}
             onChange={e => setEmail(e.target.value)}
             className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
             placeholder="seu@email.com"
           />
        </div>

        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PIN / Senha</label>
           <input 
             type="password" 
             required
             value={pin}
             onChange={e => setPin(e.target.value)}
             className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors tracking-widest"
             placeholder="****"
           />
        </div>

        {error && <p className="text-red-400 text-sm font-medium text-center bg-red-900/10 p-2 rounded-lg border border-red-500/20">{error}</p>}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>

        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
             <button type="button" onClick={() => setMode('reset')} className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">
                 Esqueci meu PIN
             </button>
             
             <button type="button" onClick={() => {
                 if(confirm("ATENÇÃO: Isso apagará TODOS os seus dados financeiros para criar uma conta nova. Deseja continuar?")) {
                    localStorage.removeItem('finpro_auth_user');
                    onSwitchToRegister();
                 }
             }} className="text-xs text-red-500/50 hover:text-red-400 transition-colors">
                 Resetar Conta (Apagar Tudo)
             </button>
        </div>
      </form>
    </div>
  );
};

export default AuthLogin;
