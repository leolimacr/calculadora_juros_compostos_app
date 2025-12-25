
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
        <input 
          type="password" 
          required
          value={currentPin}
          onChange={e => setCurrentPin(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors tracking-widest"
          placeholder="****"
        />
      </div>

      <div className="pt-2 border-t border-slate-700/50"></div>

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

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirme o Novo PIN</label>
        <input 
          type="password" 
          required
          value={confirmPin}
          onChange={e => setConfirmPin(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors tracking-widest"
          placeholder="****"
        />
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
