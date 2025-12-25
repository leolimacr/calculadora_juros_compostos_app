
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthLoginProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void; // Apenas se quiser permitir recriar, ou "Esqueci senha" (reset)
}

const AuthLogin: React.FC<AuthLoginProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-xl font-bold text-white mb-2 text-center">Bem-vindo de volta</h3>
      <p className="text-slate-400 text-sm mb-6 text-center">Digite seu PIN para desbloquear os dados deste dispositivo.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          {loading ? 'Verificando...' : 'Desbloquear'}
        </button>

        <div className="text-center pt-4 border-t border-slate-800">
             <button type="button" onClick={() => {
                 if(confirm("Isso apagará seus dados atuais para criar uma nova conta. Deseja continuar?")) {
                    localStorage.removeItem('finpro_auth_user');
                    onSwitchToRegister();
                 }
             }} className="text-xs text-slate-500 hover:text-slate-300">
                 Esqueci meu PIN / Resetar
             </button>
        </div>
      </form>
    </div>
  );
};

export default AuthLogin;
