
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthRegisterProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

const AuthRegister: React.FC<AuthRegisterProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register } = useAuth();
  
  // Form States
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMode, setSuccessMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações Básicas
    if (!email || !password || !name) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    if (!acceptedTerms) {
      setError('Você deve concordar com os termos.');
      return;
    }

    setLoading(true);
    
    // Chamada ao Firebase Auth
    const res = await register(email, password, name);
    
    if (res.success) {
      setSuccessMode(true);
    } else {
      setError(res.error || 'Erro ao criar conta.');
    }
    
    setLoading(false);
  };

  // Tela de Sucesso (Pós-Cadastro)
  if (successMode) {
    return (
      <div className="w-full max-w-sm mx-auto animate-in zoom-in duration-300 text-center">
        <div className="inline-block p-4 bg-emerald-500/20 rounded-full mb-4">
          <span className="text-4xl">✉️</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Verifique seu E-mail</h3>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          Enviamos um link de confirmação para <strong>{email}</strong>.<br/>
          Por favor, verifique sua caixa de entrada (e spam) para ativar todos os recursos.
        </p>
        <button 
          onClick={onSuccess} 
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
        >
          Entrar no App
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white">Crie sua Conta</h3>
          <p className="text-slate-400 text-xs mt-2">
            Salve seus dados na nuvem e acesse de qualquer lugar.
          </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label>
           <input 
             type="text" 
             value={name}
             onChange={e => setName(e.target.value)}
             className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
             placeholder="Como deseja ser chamado?"
           />
        </div>

        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
           <input 
             type="email" 
             value={email}
             onChange={e => setEmail(e.target.value)}
             className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
             placeholder="seu@email.com"
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
               placeholder="Mínimo 6 caracteres"
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

        <div>
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar Senha</label>
           <input 
             type={showPassword ? "text" : "password"} 
             value={confirmPassword}
             onChange={e => setConfirmPassword(e.target.value)}
             className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
             placeholder="Repita a senha"
           />
        </div>

        <div className="flex items-start gap-3 py-2">
           <input 
             type="checkbox" 
             id="terms" 
             checked={acceptedTerms}
             onChange={e => setAcceptedTerms(e.target.checked)}
             className="mt-1 bg-slate-900 border-slate-700 rounded text-emerald-500 focus:ring-emerald-500"
           />
           <label htmlFor="terms" className="text-xs text-slate-400 leading-relaxed cursor-pointer select-none">
             Li e concordo com os Termos de Uso e Política de Privacidade.
           </label>
        </div>

        {error && (
          <p className="text-red-400 text-sm font-medium text-center bg-red-900/10 p-2 rounded-lg border border-red-500/20 animate-pulse">
            {error}
          </p>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Criando conta...' : 'Cadastrar Grátis'}
        </button>
        
        <div className="text-center pt-2">
            <button type="button" onClick={onSwitchToLogin} className="text-xs text-slate-400 hover:text-white transition-colors">
                Já tem conta? <span className="text-emerald-400 font-bold">Faça login</span>
            </button>
        </div>
      </form>
    </div>
  );
};

export default AuthRegister;
