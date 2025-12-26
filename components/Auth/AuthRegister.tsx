
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
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form Errors
  const [errors, setErrors] = useState({
    email: '',
    pin: '',
    confirmPin: '',
    terms: '',
    general: ''
  });
  
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let isValid = true;
    const newErrors = { email: '', pin: '', confirmPin: '', terms: '', general: '' };

    if (!email) {
      newErrors.email = '❌ E-mail é obrigatório.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = '❌ Formato de e-mail inválido.';
      isValid = false;
    }

    if (!pin) {
      newErrors.pin = '❌ PIN é obrigatório.';
      isValid = false;
    } else if (pin.length < 4) {
      newErrors.pin = '❌ O PIN deve ter no mínimo 4 caracteres.';
      isValid = false;
    }

    if (pin !== confirmPin) {
      newErrors.confirmPin = '❌ Os PINs não conferem.';
      isValid = false;
    }

    if (!acceptedTerms) {
      newErrors.terms = '❌ Você deve concordar com os termos para continuar.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const success = await register(email, pin, name);
    
    if (success) {
      // Envia e-mail mockado
      await sendConfirmationEmail(email, 'register');
      onSuccess();
    } else {
      setErrors(prev => ({ ...prev, general: 'Erro ao criar conta local. Tente novamente.' }));
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center mb-6">
          <div className="inline-block p-3 bg-emerald-500/10 rounded-full mb-3">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-xl font-bold text-white">Criar Acesso Local</h3>
          <p className="text-slate-400 text-xs mt-2">
            Seus dados ficam salvos apenas neste dispositivo.
          </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail (Login)</label>
           <input 
             type="email" 
             value={email}
             onChange={e => { setEmail(e.target.value); setErrors(prev => ({...prev, email: ''})); }}
             className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white outline-none transition-colors ${errors.email ? 'border-red-500' : 'border-slate-700 focus:border-emerald-500'}`}
             placeholder="Digite seu e-mail"
           />
           {errors.email && <p className="text-[10px] text-red-400 mt-1 font-bold">{errors.email}</p>}
        </div>

        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Como deseja ser chamado?</label>
           <input 
             type="text" 
             value={name}
             onChange={e => setName(e.target.value)}
             className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
             placeholder="Seu nome ou apelido (Opcional)"
           />
        </div>

        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Crie um PIN/Senha</label>
           <div className="relative">
             <input 
               type={showPassword ? "text" : "password"} 
               value={pin}
               onChange={e => { setPin(e.target.value); setErrors(prev => ({...prev, pin: ''})); }}
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

        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirme o PIN</label>
           <input 
             type={showPassword ? "text" : "password"} 
             value={confirmPin}
             onChange={e => { setConfirmPin(e.target.value); setErrors(prev => ({...prev, confirmPin: ''})); }}
             className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white outline-none transition-colors tracking-widest ${errors.confirmPin ? 'border-red-500' : 'border-slate-700 focus:border-emerald-500'}`}
             placeholder="- - - - - -"
           />
           {errors.confirmPin && <p className="text-[10px] text-red-400 mt-1 font-bold">{errors.confirmPin}</p>}
        </div>

        <div className="flex items-start gap-3 py-2">
           <input 
             type="checkbox" 
             id="terms" 
             checked={acceptedTerms}
             onChange={e => { setAcceptedTerms(e.target.checked); setErrors(prev => ({...prev, terms: ''})); }}
             className="mt-1 bg-slate-900 border-slate-700 rounded text-emerald-500 focus:ring-emerald-500"
           />
           <label htmlFor="terms" className="text-xs text-slate-400 leading-relaxed cursor-pointer select-none">
             Li e concordo com os <a href="/termos-de-uso" target="_blank" className="text-emerald-400 hover:underline" onClick={(e) => e.stopPropagation()}>Termos de Uso</a> e <a href="/politica-privacidade" target="_blank" className="text-emerald-400 hover:underline" onClick={(e) => e.stopPropagation()}>Política de Privacidade</a>.
           </label>
        </div>
        {errors.terms && <p className="text-[10px] text-red-400 font-bold text-center">{errors.terms}</p>}

        {errors.general && (
          <p className="text-red-400 text-sm font-medium text-center bg-red-900/10 p-2 rounded-lg border border-red-500/20">
            {errors.general}
          </p>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Criando Conta...' : 'Criar Conta'}
        </button>
        
        <div className="text-center pt-2">
            <button type="button" onClick={onSwitchToLogin} className="text-xs text-slate-400 hover:text-white transition-colors">
                Já tem conta? <span className="text-emerald-400 font-bold">Faça login aqui</span>
            </button>
        </div>
      </form>
    </div>
  );
};

export default AuthRegister;
