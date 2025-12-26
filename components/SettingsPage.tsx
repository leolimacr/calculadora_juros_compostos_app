
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ContentModal from './ContentModal';

interface SettingsPageProps {
  onOpenChangePassword: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenChangePassword }) => {
  const { user, resetAppData } = useAuth();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [confirmPin, setConfirmPin] = useState('');
  const [resetError, setResetError] = useState('');

  const handleReset = async () => {
    if (resetStep === 1) {
      setResetStep(2);
      return;
    }

    if (!confirmPin) {
        setResetError('Digite seu PIN para confirmar.');
        return;
    }

    const success = await resetAppData(confirmPin);
    if (success) {
      window.location.href = '/'; // Força reload completo para limpar estados
    } else {
      setResetError('PIN incorreto. Ação cancelada.');
    }
  };

  const closeResetModal = () => {
    setIsResetModalOpen(false);
    setResetStep(1);
    setConfirmPin('');
    setResetError('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-3xl font-bold text-white mb-6">Configurações</h2>

      {/* Conta */}
      <section className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
         <div className="p-6 border-b border-slate-700">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
               👤 Dados da Conta
            </h3>
         </div>
         <div className="p-6 space-y-6">
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">E-mail Cadastrado</label>
               <div className="bg-slate-900 border border-slate-600 rounded-xl p-4 text-slate-300 font-mono flex justify-between items-center">
                  <span>{user?.email}</span>
                  <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">Ativo</span>
               </div>
               <p className="text-xs text-slate-500 mt-2">O e-mail é usado apenas para recuperação de acesso.</p>
            </div>

            <button 
               onClick={onOpenChangePassword}
               className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors border border-slate-600"
            >
               Alterar PIN de Acesso
            </button>
         </div>
      </section>

      {/* Preferências (Placeholder) */}
      <section className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden opacity-75">
         <div className="p-6 border-b border-slate-700">
            <h3 className="font-bold text-white text-lg">⚙️ Preferências</h3>
         </div>
         <div className="p-6 space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
               <span className="text-sm text-slate-300 font-medium">Tema Escuro</span>
               <div className="w-10 h-6 bg-emerald-600 rounded-full relative cursor-not-allowed opacity-80">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
               </div>
            </div>
            <p className="text-xs text-slate-500 text-center">Mais opções em breve...</p>
         </div>
      </section>

      {/* Zona de Perigo */}
      <section className="bg-red-900/10 rounded-2xl border border-red-500/30 overflow-hidden">
         <div className="p-6 border-b border-red-500/20">
            <h3 className="font-bold text-red-400 text-lg flex items-center gap-2">
               ⚠️ Zona de Perigo
            </h3>
         </div>
         <div className="p-6">
            <p className="text-sm text-slate-300 mb-6">
               Ao resetar os dados, todas as suas transações, metas e históricos salvos neste dispositivo serão <strong>apagados permanentemente</strong>. Sua conta (login) será desconectada.
            </p>
            <button 
               onClick={() => setIsResetModalOpen(true)}
               className="w-full bg-red-600/90 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-900/20"
            >
               Resetar Dados do Aplicativo
            </button>
         </div>
      </section>

      {/* Modal de Confirmação Reset */}
      <ContentModal
         isOpen={isResetModalOpen}
         onClose={closeResetModal}
         title="Resetar Dados"
      >
         <div className="space-y-6 text-center">
            {resetStep === 1 ? (
               <>
                  <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto">🗑️</div>
                  <h3 className="text-xl font-bold text-white">Tem certeza absoluta?</h3>
                  <p className="text-slate-300">
                     Essa ação não pode ser desfeita. Você perderá todo o histórico financeiro salvo neste navegador.
                  </p>
                  <div className="flex gap-3">
                     <button onClick={closeResetModal} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold">Cancelar</button>
                     <button onClick={handleReset} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">Sim, apagar tudo</button>
                  </div>
               </>
            ) : (
               <>
                  <h3 className="text-xl font-bold text-white">Confirmação de Segurança</h3>
                  <p className="text-slate-300 mb-4">Digite seu PIN para confirmar a exclusão.</p>
                  <input 
                     type="password" 
                     placeholder="PIN"
                     className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-center text-2xl tracking-widest text-white mb-4 focus:border-red-500 outline-none"
                     value={confirmPin}
                     onChange={e => setConfirmPin(e.target.value)}
                     autoFocus
                  />
                  {resetError && <p className="text-red-400 font-bold text-sm mb-4">{resetError}</p>}
                  <div className="flex gap-3">
                     <button onClick={closeResetModal} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold">Cancelar</button>
                     <button onClick={handleReset} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">Confirmar Reset</button>
                  </div>
               </>
            )}
         </div>
      </ContentModal>
    </div>
  );
};

export default SettingsPage;
