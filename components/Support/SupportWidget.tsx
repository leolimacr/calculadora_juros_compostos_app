
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import firebase from 'firebase/compat/app';
import { db } from '../../firebase';

const SupportWidget: React.FC = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setStatus('sending');
    try {
      await db.collection('support_tickets').add({
        userId: user.uid,
        userEmail: user.email,
        subject,
        message,
        status: 'open',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        deviceInfo: navigator.userAgent
      });
      setStatus('success');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-slate-800 p-8 rounded-2xl border border-emerald-500/30 text-center animate-in zoom-in">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          ✅
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Chamado Aberto!</h3>
        <p className="text-slate-300 text-sm mb-6">
          Recebemos sua mensagem. Nossa equipe responderá em até 24 horas no e-mail <strong>{user?.email}</strong>.
        </p>
        <button 
          onClick={() => setStatus('idle')}
          className="text-emerald-400 font-bold hover:text-white underline text-sm"
        >
          Abrir outro chamado
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-700 shadow-xl max-w-2xl mx-auto">
      <div className="mb-8 border-b border-slate-700 pb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="text-3xl">🛟</span> Central de Ajuda
        </h2>
        <p className="text-slate-400 mt-2">
          Encontrou um bug ou tem dúvidas sobre sua conta Premium? Estamos aqui para ajudar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assunto</label>
          <select 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors"
            required
          >
            <option value="" disabled>Selecione um tópico...</option>
            <option value="Dúvida Financeira">Dúvida sobre uma ferramenta</option>
            <option value="Problema Técnico">Reportar Bug / Erro</option>
            <option value="Pagamento">Assinatura e Cobrança</option>
            <option value="Sugestão">Sugestão de Melhoria</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mensagem</label>
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Descreva detalhadamente o que aconteceu..."
            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors resize-none"
            required
          />
        </div>

        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex gap-3 items-start">
           <span className="text-lg">💡</span>
           <div>
             <p className="text-sm text-white font-bold">Dica Rápida</p>
             <p className="text-xs text-slate-400 mt-1">
               Se tiver problemas com dados que sumiram, verifique se você está logado com a mesma conta de e-mail usada anteriormente.
             </p>
           </div>
        </div>

        <button 
          type="submit" 
          disabled={status === 'sending'}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'sending' ? 'Enviando...' : 'Enviar Solicitação'}
        </button>
      </form>
    </div>
  );
};

export default SupportWidget;
