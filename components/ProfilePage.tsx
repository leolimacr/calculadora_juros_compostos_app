
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ContentModal from './ContentModal';

interface ProfilePageProps {
  onOpenChangePassword: () => void;
  navigateToHome: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenChangePassword, navigateToHome }) => {
  const { user, updateProfile, resetAppData } = useAuth();
  
  // Local states
  const [name, setName] = useState(user?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [preferredHome, setPreferredHome] = useState(localStorage.getItem('preferredHomeScreen') || 'panel');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Danger Zone
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [confirmPin, setConfirmPin] = useState('');
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    setName(user?.name || '');
  }, [user]);

  const handleSaveName = () => {
    updateProfile({ name });
    setIsEditingName(false);
  };

  const handleHomeChange = (val: string) => {
    setPreferredHome(val);
    localStorage.setItem('preferredHomeScreen', val);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
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
      window.location.href = '/'; 
    } else {
      setResetError('PIN incorreto.');
    }
  };

  const closeResetModal = () => {
    setIsResetModalOpen(false);
    setResetStep(1);
    setConfirmPin('');
    setResetError('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
         <button onClick={navigateToHome} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
            <span>←</span> Voltar
         </button>
         <h1 className="text-xl font-bold text-white">Meu Perfil</h1>
         <div className="w-8"></div> {/* Spacer */}
      </div>

      {/* Hero Profile */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 shadow-xl flex flex-col md:flex-row items-center gap-6">
         <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg border-4 border-slate-800">
            {user?.name ? user.name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
         </div>
         <div className="text-center md:text-left space-y-1">
            <h2 className="text-2xl font-bold text-white">{user?.name || 'Investidor'}</h2>
            <p className="text-slate-400 font-mono text-sm">{user?.email}</p>
            <span className="inline-block bg-emerald-900/30 text-emerald-400 text-[10px] px-2 py-1 rounded border border-emerald-500/20 mt-2">
               Conta Local Ativa
            </span>
         </div>
      </div>

      {/* Seção 1: Informações Pessoais */}
      <section className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
         <div className="p-5 border-b border-slate-700 bg-slate-800/50">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
               📋 Informações Pessoais
            </h3>
         </div>
         <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="w-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome de Exibição</label>
                  <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={name}
                        disabled={!isEditingName}
                        onChange={e => setName(e.target.value)}
                        className={`flex-1 bg-slate-900 border ${isEditingName ? 'border-emerald-500' : 'border-slate-600'} rounded-xl px-4 py-3 text-white outline-none transition-all`}
                     />
                     {isEditingName ? (
                        <button onClick={handleSaveName} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-xl font-bold transition-colors">OK</button>
                     ) : (
                        <button onClick={() => setIsEditingName(true)} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 rounded-xl font-bold transition-colors text-sm">Editar</button>
                     )}
                  </div>
               </div>
            </div>
            
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">E-mail (Login)</label>
               <div className="bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-400 font-mono text-sm flex justify-between items-center">
                  <span>{user?.email}</span>
                  <span className="text-xs text-slate-600">Somente Leitura</span>
               </div>
            </div>
         </div>
      </section>

      {/* Seção 2: Segurança */}
      <section className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
         <div className="p-5 border-b border-slate-700 bg-slate-800/50">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
               🔐 Segurança
            </h3>
         </div>
         <div className="p-6">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-700">
               <div>
                  <p className="text-white font-bold text-sm">PIN de Acesso</p>
                  <p className="text-slate-500 text-xs mt-1">Usado para desbloquear o app</p>
               </div>
               <button 
                  onClick={onOpenChangePassword}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-slate-600"
               >
                  Alterar PIN
               </button>
            </div>
         </div>
      </section>

      {/* Seção 3: Preferências */}
      <section className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
         <div className="p-5 border-b border-slate-700 bg-slate-800/50">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
               🎯 Preferências
            </h3>
         </div>
         <div className="p-6 space-y-6">
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ferramenta Inicial (Mobile)</label>
               <select 
                 className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none"
                 value={preferredHome}
                 onChange={e => handleHomeChange(e.target.value)}
               >
                 <option value="panel">🏠 Painel Principal (Padrão)</option>
                 <option value="manager">💰 Gerenciador Financeiro</option>
                 <option value="compound">📈 Juros Compostos</option>
                 <option value="fire">🔥 Calculadora FIRE</option>
                 <option value="debt">🏔️ Otimizador de Dívidas</option>
               </select>
               <p className="text-xs text-slate-500 mt-2">Define qual tela abre primeiro ao iniciar o app no celular.</p>
               {saveSuccess && <p className="text-emerald-400 text-xs font-bold mt-2 animate-pulse">Preferência salva!</p>}
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-900 rounded-xl border border-slate-700 opacity-60 cursor-not-allowed">
               <span className="text-white text-sm font-medium">Tema Escuro</span>
               <div className="w-10 h-5 bg-emerald-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow"></div>
               </div>
            </div>
         </div>
      </section>

      {/* Seção 5: Zona Perigosa */}
      <section className="bg-red-900/10 rounded-2xl border border-red-500/20 overflow-hidden">
         <div className="p-5 border-b border-red-500/20 bg-red-900/10">
            <h3 className="font-bold text-red-400 text-sm uppercase tracking-wider flex items-center gap-2">
               🚨 Zona Perigosa
            </h3>
         </div>
         <div className="p-6">
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
               As ações abaixo são irreversíveis. Tenha certeza absoluta antes de prosseguir.
            </p>
            <button 
               onClick={() => setIsResetModalOpen(true)}
               className="w-full bg-red-600/90 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-red-900/20 border border-red-500/50"
            >
               Resetar Todos os Dados
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

export default ProfilePage;
