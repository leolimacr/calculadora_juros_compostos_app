import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

const SettingsPage: React.FC<any> = ({ onBack }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // FUNÇÃO DE SOM MODERNO (Sintetizador Nativo)
  const playSuccessSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota Lá (A5)
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.error("Erro ao reproduzir som:", e);
    }
  };

  const handleResetPassword = async () => {
    if (auth.currentUser?.email) {
      try {
        await sendPasswordResetEmail(auth, auth.currentUser.email);
        alert(`📧 E-mail Enviado!\n\nUm link de redefinição de senha foi enviado para: ${auth.currentUser.email}`);
      } catch (e) {
        alert("Erro ao solicitar redefinição. Tente novamente mais tarde.");
      }
    }
  };

  const Modal: React.FC<{ title: string, content: string, onClose: () => void }> = ({ title, content, onClose }) => (
    <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        <h3 className="text-2xl font-black text-white mb-6 border-b border-slate-800 pb-4">{title}</h3>
        <div className="flex-grow overflow-y-auto text-slate-400 text-sm leading-relaxed mb-6 pr-2 custom-scrollbar">
          {content}
        </div>
        <button onClick={onClose} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-900/20 transition-all">Entendido</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in pt-4 pb-20">
      <div className="flex items-center gap-4 px-2">
        <button onClick={onBack} className="bg-slate-800 p-3 rounded-2xl text-white active:scale-90 transition-transform">←</button>
        <h2 className="text-2xl font-black text-white tracking-tight">Configurações</h2>
      </div>

      <div className="bg-slate-800/50 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-xl">
        <div 
          className="p-6 border-b border-slate-800 flex justify-between items-center cursor-pointer active:bg-slate-800/80 transition-colors"
          onClick={() => {
            setSoundEnabled(!soundEnabled);
            if (!soundEnabled) playSuccessSound();
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🔔</span>
            <span className="text-white font-bold">Sons de Confirmação</span>
          </div>
          <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors duration-300 ${soundEnabled ? 'bg-emerald-600' : 'bg-slate-600'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </div>
        </div>

        <button 
          onClick={handleResetPassword}
          className="w-full p-6 text-left text-white hover:bg-slate-800 transition-colors flex justify-between items-center group"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🔐</span>
            <span className="font-bold">Segurança da Conta</span>
          </div>
          <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg uppercase tracking-widest group-active:scale-95 transition-all">Alterar Senha</span>
        </button>
      </div>

      <div className="bg-slate-800/50 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-xl">
        <button onClick={() => setActiveModal('termos')} className="w-full p-6 text-left text-slate-300 border-b border-slate-800 hover:bg-slate-800 flex justify-between items-center">
          <span className="font-medium text-sm">Termos de Uso</span>
          <span className="text-slate-600">›</span>
        </button>
        <button onClick={() => setActiveModal('privacidade')} className="w-full p-6 text-left text-slate-300 hover:bg-slate-800 flex justify-between items-center">
          <span className="font-medium text-sm">Política de Privacidade</span>
          <span className="text-slate-600">›</span>
        </button>
      </div>

      <div className="p-4 text-center">
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">Finanças Pro Invest v1.8.0</p>
      </div>

      {activeModal === 'termos' && (
        <Modal 
          onClose={() => setActiveModal(null)} 
          title="Termos de Uso" 
          content={`Bem-vindo ao Finanças Pro Invest.\n\n1. USO DO SERVIÇO: Este aplicativo fornece ferramentas de gestão financeira pessoal. As informações aqui contidas não constituem recomendação de investimento.\n\n2. RESPONSABILIDADE: O usuário é o único responsável pela precisão dos dados inseridos e pelas decisões tomadas com base nestas ferramentas.\n\n3. ASSINATURAS: O acesso aos recursos PRO e PREMIUM depende de pagamento recorrente. O cancelamento pode ser feito a qualquer momento através do nosso portal web.`} 
        />
      )}

      {activeModal === 'privacidade' && (
        <Modal 
          onClose={() => setActiveModal(null)} 
          title="Política de Privacidade" 
          content={`Sua privacidade é nossa prioridade.\n\n1. COLETA DE DADOS: Coletamos seu e-mail para autenticação e os dados financeiros inseridos para permitir o funcionamento das calculadoras e gráficos.\n\n2. SEGURANÇA: Seus dados são armazenados nos servidores do Google Firebase com criptografia de ponta.\n\n3. COMPARTILHAMENTO: O Finanças Pro Invest não vende ou compartilha seus dados pessoais com terceiros para fins publicitários.`} 
        />
      )}
    </div>
  );
};
export default SettingsPage;