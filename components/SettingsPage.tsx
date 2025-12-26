
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ContentModal from './ContentModal';

interface SettingsPageProps {
  onOpenChangePassword: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenChangePassword }) => {
  const { user, resetAppData, updateProfile } = useAuth();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [confirmPin, setConfirmPin] = useState('');
  const [resetError, setResetError] = useState('');
  
  // Profile Settings
  const [name, setName] = useState(user?.name || '');
  const [preferredHome, setPreferredHome] = useState(localStorage.getItem('preferredHomeScreen') || 'panel');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
  }, [user]);

  const handleSaveProfile = () => {
    updateProfile({ name });
    localStorage.setItem('preferredHomeScreen', preferredHome);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResetOnboarding = () => {
    if(confirm('Reiniciar o tour de boas-vindas na próxima abertura?')) {
        localStorage.removeItem('finpro_onboarding_completed');
        alert('Feito! Recarregue a página ou faça login novamente para ver o tour.');
    }
  };

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

      {/* Conta & Perfil */}
      <section className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
         <div className="p-6 border-b border-slate-700">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
               👤 Perfil & Preferências
            </h3>
         </div>
         <div className="p-6 space-y-6">
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Como deseja ser chamado?</label>
               <input 
                 type="text" 
                 className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-emerald-500"
                 value={name}
                 onChange={e => setName(e.target.value)}
                 placeholder="Seu nome"
               />
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tela Inicial (Mobile)</label>
               <select 
                 className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-emerald-500"
                 value={preferredHome}
                 onChange={e => setPreferredHome(e.target.value)}
               >
                 <option value="panel">🏠 Painel Principal (Padrão)</option>
                 <option value="manager">💰 Gerenciador Financeiro</option>
                 <option value="fire">🔥 Calculadora FIRE</option>
                 <option value="compound">📈 Juros Compostos</option>
                 <option value="debt">🏔️ Otimizador de Dívidas</option>
               </select>
               <p className="text-xs text-slate-500 mt-2">Escolha qual ferramenta abre primeiro ao iniciar o app.</p>
            </div>

            <button 
                onClick={handleSaveProfile}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-xl transition-colors w-full sm:w-auto"
            >
                {saveSuccess ? 'Salvo! ✅' : 'Salvar Alterações'}
            </button>

            <div className="pt-4 border-t border-slate-700">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Acesso</label>
                <div className="bg-slate-900 border border-slate-600 rounded-xl p-3 text-slate-300 font-mono text-sm mb-3">
                    {user?.email}
                </div>
                <button 
                onClick={onOpenChangePassword}
                className="text-sm text-emerald-400 hover:text-white underline font-bold"
                >
                Alterar PIN de Acesso
                </button>
            </div>
         </div>
      </section>

      {/* Onboarding */}
      <section className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
         <div className="p-6 border-b border-slate-700">
            <h3 className="font-bold text-white text-lg">🚀 Tour do Aplicativo</h3>
         </div>
         <div className="p-6">
            <p className="text-sm text-slate-300 mb-4">Quer rever o passo a passo inicial?</p>
            <button 
               onClick={handleResetOnboarding}
               className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm"
            >
               Reiniciar Tour de Boas-vindas
            </button>
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
