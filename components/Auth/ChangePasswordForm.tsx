
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ChangePasswordFormProps {
  onClose: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onClose }) => {
  const { changePassword } = useAuth();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPin.length < 4) {
      setStatus('error');
      setMessage('O novo PIN deve ter pelo menos 4 dígitos.');
      return;
    }

    if (newPin !== confirmPin) {
      setStatus('error');
      setMessage('A confirmação do novo PIN não confere.');
      return;
    }

    if (currentPin === newPin) {
      setStatus('error');
      setMessage('O novo PIN deve ser diferente do atual.');
      return;
    }

    setStatus('loading');
    const success = await changePassword(currentPin, newPin);

    if (success) {
      setStatus('success');
      setMessage('Senha alterada com sucesso!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setStatus('error');
      setMessage('PIN atual incorreto.');
    }
  };

  const EyeIcon = () => (
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
  );

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-in zoom-in">
          ✅
        </div>
        <h3 className="text-xl font-bold text-white">Sucesso!</h3>
        <p className="text-slate-400 mt-2">Sua senha foi atualizada.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-4">
        <p className="text-xs text-slate-400">
          Seus lançamentos e metas <strong>não</strong> serão alterados. Apenas sua chave de acesso mudará.
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PIN Atual</label>
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"}
            required
            value={currentPin}
            onChange={e => setCurrentPin(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-white outline-none focus:border-emerald-500 transition-colors tracking-widest"
            placeholder="****"
          />
          <EyeIcon />
        </div>
      </div>

      <div className="pt-2 border-t border-slate-700/50"></div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Novo PIN</label>
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"}
            required
            value={newPin}
            onChange={e => setNewPin(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-white outline-none focus:border-emerald-500 transition-colors tracking-widest"
            placeholder="****"
          />
          <EyeIcon />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirme o Novo PIN</label>
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"}
            required
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-white outline-none focus:border-emerald-500 transition-colors tracking-widest"
            placeholder="****"
          />
          <EyeIcon />
        </div>
      </div>

      {status === 'error' && (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm text-center font-medium animate-in shake">
          {message}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button 
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={status === 'loading'}
          className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {status === 'loading' ? 'Salvando...' : 'Alterar Senha'}
        </button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
