
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sendConfirmationEmail } from '../../utils/email';

interface AuthRegisterProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

const AuthRegister: React.FC<AuthRegisterProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length < 4) {
      setError('O PIN deve ter pelo menos 4 dígitos.');
      return;
    }

    if (pin !== confirmPin) {
      setError('Os PINs não conferem.');
      return;
    }

    setLoading(true);
    const success = await register(email, pin);
    
    if (success) {
      setRegisterSuccess(true);
      
      // Envia e-mail mockado
      await sendConfirmationEmail(email, 'register');
      
      // Delay para o usuário ler a mensagem antes de entrar
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } else {
      setError('Erro ao criar conta local.');
      setLoading(false);
    }
  };

  if (registerSuccess) {
    return (
      <div className="w-full max-w-sm mx-auto text-center animate-in zoom-in duration-500">
        <div className="inline-block p-4 bg-emerald-500/20 rounded-full mb-4">
           <span className="text-4xl">🎉</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Conta Criada!</h3>
        <p className="text-slate-300 text-sm mb-4 leading-relaxed">
          Seu cofre digital está pronto.
        </p>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
           <p className="text-xs text-slate-400">
             Enviamos uma mensagem para <strong>{email}</strong>. 
             Confirme o acesso por lá para maior segurança.
           </p>
        </div>
        <p className="text-xs text-slate-500 mt-6 animate-pulse">Entrando no sistema...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center mb-6">
          <div className="inline-block p-3 bg-emerald-500/10 rounded-full mb-3">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-xl font-bold text-white">Criar Acesso Local</h3>
          <p className="text-slate-400 text-xs mt-2">
            Seus dados serão criptografados e salvos <strong>apenas neste dispositivo</strong>.
          </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
           <input 
             type="email" 
             required
             value={email}
             onChange={e => setEmail(e.target.value)}
             className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
             placeholder="Para recuperar acesso futuramente"
           />
        </div>

        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Crie um PIN/Senha</label>
           <input 
             type="password" 
             required
             value={pin}
             onChange={e => setPin(e.target.value)}
             className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors tracking-widest"
             placeholder="****"
           />
        </div>

        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirme o PIN</label>
           <input 
             type="password" 
             required
             value={confirmPin}
             onChange={e => setConfirmPin(e.target.value)}
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
          {loading ? 'Criando Cofre...' : 'Proteger e Acessar'}
        </button>
        
        <div className="text-center pt-2">
            <button type="button" onClick={onSwitchToLogin} className="text-xs text-emerald-500 hover:text-emerald-400 font-bold">
                Já tenho uma conta neste dispositivo
            </button>
        </div>
      </form>
    </div>
  );
};

export default AuthRegister;
