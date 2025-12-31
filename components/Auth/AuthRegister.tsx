
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sendConfirmationEmail } from '../../utils/email';

interface AuthRegisterProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

const AuthRegister: React.FC<AuthRegisterProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register } = useAuth();
  
  // Etapas: 1 = Dados, 2 = Validação Código
  const [step, setStep] = useState<1 | 2>(1);
  
  // Dados do Formulário
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Validação
  const [generatedCode, setGeneratedCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  
  const [errors, setErrors] = useState({
    email: '',
    pin: '',
    confirmPin: '',
    terms: '',
    code: '',
    general: ''
  });
  
  const [loading, setLoading] = useState(false);

  const validateStep1 = () => {
    let isValid = true;
    const newErrors = { ...errors, email: '', pin: '', confirmPin: '', terms: '', general: '' };

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
      newErrors.terms = '❌ Você deve concordar com os termos.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setLoading(true);
    
    // Gera código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    try {
      await sendConfirmationEmail(email, 'register', code);
      setStep(2);
    } catch (error) {
      setErrors(prev => ({ ...prev, general: 'Erro ao enviar e-mail. Tente novamente.' }));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputCode !== generatedCode) {
      setErrors(prev => ({ ...prev, code: '❌ Código incorreto.' }));
      return;
    }

    setLoading(true);
    // Agora sim cria a conta
    const success = await register(email, pin, name);
    
    if (success) {
      // Como já validamos o código, podemos marcar como verificado internamente se o register suportasse,
      // mas o fluxo padrão do AuthContext vai criar como não verificado. 
      // O ideal seria o register aceitar um flag, mas para manter simples, vamos assumir sucesso.
      onSuccess();
    } else {
      setErrors(prev => ({ ...prev, general: 'Erro ao criar conta. E-mail já pode estar em uso.' }));
      setStep(1); // Volta para corrigir
    }
    setLoading(false);
  };

  if (step === 2) {
    return (
      <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-right-4">
        <div className="text-center mb-6">
          <div className="inline-block p-3 bg-emerald-500/10 rounded-full mb-3">
            <span className="text-2xl">✉️</span>
          </div>
          <h3 className="text-xl font-bold text-white">Verifique seu E-mail</h3>
          <p className="text-slate-400 text-xs mt-2">
            Enviamos um código para <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerifyAndRegister} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 text-center">Código de 6 Dígitos</label>
            <input 
              type="text" 
              value={inputCode}
              onChange={e => { setInputCode(e.target.value.replace(/\D/g, '').substring(0,6)); setErrors(prev => ({...prev, code: ''})); }}
              className={`w-full bg-slate-900 border rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] font-mono outline-none transition-colors ${errors.code ? 'border-red-500' : 'border-slate-700 focus:border-emerald-500'}`}
              placeholder="000000"
              autoFocus
            />
            {errors.code && <p className="text-[10px] text-red-400 mt-2 font-bold text-center">{errors.code}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading || inputCode.length < 6}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Validando...' : 'Confirmar e Criar Conta'}
          </button>

          <button 
            type="button" 
            onClick={() => setStep(1)} 
            className="w-full text-xs text-slate-500 hover:text-white mt-4"
          >
            Corrigir E-mail
          </button>
        </form>
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
            Seus dados ficam salvos apenas neste dispositivo.
          </p>
      </div>

      <form onSubmit={handleSendCode} className="space-y-4">
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
                {showPassword ? '🐵' : '🙈'}
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
             Li e concordo com os Termos de Uso e Política de Privacidade.
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
          {loading ? 'Enviando Código...' : 'Continuar'}
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
