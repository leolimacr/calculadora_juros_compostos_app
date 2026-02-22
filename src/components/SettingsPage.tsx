import React, { useState, useEffect } from 'react';
import { 
  User, ShieldCheck, Fingerprint, CreditCard, FileText, 
  LogOut, Pencil, Check, ChevronRight, ExternalLink, ArrowLeft, Lock, X, 
  Trash2, Smartphone, AlertTriangle, Loader2
} from 'lucide-react';
import { auth, db } from '../firebase';
import { ref, update, onValue } from 'firebase/database';
import { deleteUser } from 'firebase/auth'; 
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
import { NativeBiometric } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { useFirebase } from '../hooks/useFirebase'; 
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';

const SettingsPage: React.FC<any> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const { wipeUserData } = useFirebase(user?.uid); 
  const { isPro, isPremium } = useSubscriptionAccess();
  const isNative = Capacitor.isNativePlatform();

  // Estados
  const [nickname, setNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState('');
  const [hasPin, setHasPin] = useState(false);
  const [alwaysAsk, setAlwaysAsk] = useState(false);
  const [useBiometrics, setUseBiometrics] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false); // Feedback para exclusão

  // Carregar Dados
  useEffect(() => {
    if (!user?.uid) return;
    const settingsRef = ref(db, `users/${user.uid}/settings`);
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setNickname(data.nickname || '');
    });
    
    const loadLocalSettings = async () => {
      const { value: pin } = await Preferences.get({ key: `pin_${user.uid}` });
      const { value: ask } = await Preferences.get({ key: `always_ask_${user.uid}` });
      const { value: bio } = await Preferences.get({ key: `use_biometrics_${user.uid}` });
      setHasPin(!!pin);
      setAlwaysAsk(ask === 'true');
      setUseBiometrics(bio === 'true');
    };
    loadLocalSettings();
    return () => unsubscribe();
  }, [user]);

  // Ações
  const handleSaveNickname = () => {
    if (!user?.uid) return;
    update(ref(db, `users/${user.uid}/settings`), { nickname: tempNickname });
    setNickname(tempNickname);
    setIsEditingNickname(false);
  };

  const handleOpenExternal = async (path: string) => {
    const url = `https://www.financasproinvest.com.br${path}`;
    if (isNative) await Browser.open({ url });
    else window.open(url, '_blank');
  };

  const handleToggleAlwaysAsk = async () => {
    if (!isNative) return alert("Disponível apenas no App Mobile.");
    if (!hasPin) return setActiveModal('pin');
    const newVal = !alwaysAsk;
    setAlwaysAsk(newVal);
    await Preferences.set({ key: `always_ask_${user?.uid}`, value: String(newVal) });
  };

  const handleToggleBiometrics = async () => {
    if (!isNative) return alert("Disponível apenas no App Mobile.");
    if (!hasPin) return setActiveModal('pin');
    if (!useBiometrics) {
      try {
        const result = await NativeBiometric.isAvailable();
        if (result.isAvailable) {
            setUseBiometrics(true);
            await Preferences.set({ key: `use_biometrics_${user?.uid}`, value: 'true' });
        } else alert("Biometria não disponível.");
      } catch (e) { alert("Erro na biometria."); }
    } else {
      setUseBiometrics(false);
      await Preferences.set({ key: `use_biometrics_${user?.uid}`, value: 'false' });
    }
  };

  const handleClearCache = async () => {
    if (window.confirm('Limpar cache local do aplicativo?')) {
        await Preferences.clear();
        window.location.reload();
    }
  };

  const handleSavePin = async () => {
    if (pinInput.length !== 4) return;
    await Preferences.set({ key: `pin_${user?.uid}`, value: pinInput });
    setHasPin(true);
    setPinInput('');
    setActiveModal(null);
    alert("PIN salvo!");
  };

  const handlePinKeyPress = (num: string) => { if (pinInput.length < 4) setPinInput(prev => prev + num); };

  // ⚠️ LÓGICA DE EXCLUSÃO DE CONTA (FOCO EM COMPLIANCE GOOGLE)
  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm("CUIDADO: Você deseja realmente EXCLUIR sua conta?");
    if (!confirm1) return;
    
    const confirm2 = window.confirm("ESTA AÇÃO É DEFINITIVA. Seus lançamentos, metas e histórico com o Nexus serão apagados para sempre. Deseja prosseguir?");
    if (!confirm2) return;

    setIsDeleting(true);

    try {
        // 1. Limpa os dados de negócio (Realtime e Firestore)
        await wipeUserData();
        
        // 2. Remove o usuário da Autenticação do Firebase
        if (auth.currentUser) {
            await deleteUser(auth.currentUser);
            alert("Sua conta e todos os dados associados foram removidos com sucesso.");
        }
    } catch (error: any) {
        console.error("Erro ao excluir conta:", error);
        
        // Erro comum: Token expirado (exige login recente para deletar conta)
        if (error.code === 'auth/requires-recent-login') {
            alert("Por segurança, a exclusão de conta exige um login recente. Por favor, entre novamente e tente excluir em seguida.");
            await logout();
        } else {
            alert("Ocorreu um erro ao tentar excluir sua conta. Tente novamente mais tarde.");
        }
    } finally {
        setIsDeleting(false);
    }
  };

  const Toggle = ({ active, onClick }: any) => (
    <div onClick={onClick} className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors duration-300 cursor-pointer ${active ? 'bg-emerald-600' : 'bg-slate-700'}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">
      
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all shadow-lg active:scale-95"><ArrowLeft size={24} /></button>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Configurações</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{isNative ? 'Preferências Mobile' : 'Preferências Web'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PERFIL */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5"><User size={140}/></div>
          <div className="flex items-center gap-6 mb-8 relative z-10">
             <div className="w-20 h-20 bg-gradient-to-tr from-sky-600 to-emerald-500 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl">
                {nickname ? nickname[0].toUpperCase() : user?.email?.[0].toUpperCase()}
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Seu Apelido</p>
                {isEditingNickname ? (
                  <div className="flex gap-2">
                    <input type="text" value={tempNickname} onChange={(e) => setTempNickname(e.target.value)} className="bg-slate-900 border border-emerald-500/50 rounded-xl px-4 py-2 text-white text-sm w-full outline-none focus:border-emerald-500" autoFocus />
                    <button onClick={handleSaveNickname} className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg"><Check size={20}/></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setTempNickname(nickname); setIsEditingNickname(true); }}>
                    <h3 className="text-2xl font-bold text-white truncate">{nickname || 'Definir...'}</h3>
                    <Pencil size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                  </div>
                )}
                <p className="text-xs text-slate-600 mt-1 truncate font-medium">{user?.email}</p>
             </div>
          </div>
          <div className="bg-black/20 border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <CreditCard className="text-emerald-500" size={24} />
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Plano Ativo</p>
                <p className="text-sm font-black text-white uppercase">{isPremium ? 'Premium 👑' : isPro ? 'Pro ⭐' : 'Gratuito'}</p>
              </div>
            </div>
            <button onClick={() => handleOpenExternal('/pricing')} className="text-[10px] font-black text-sky-400 bg-sky-400/10 px-4 py-2 rounded-xl uppercase tracking-widest flex items-center gap-2 border border-sky-400/20 hover:bg-sky-400/20 transition-all">Mudar <ExternalLink size={12}/></button>
          </div>
        </div>

        {/* SEGURANÇA */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl flex flex-col">
          <div className="p-6 border-b border-slate-800/50 flex items-center gap-3 bg-slate-800/20">
            <ShieldCheck size={20} className="text-emerald-500" />
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Segurança de Acesso</h4>
          </div>
          {isNative ? (
            <div className="divide-y divide-slate-800/50">
                <button onClick={() => setActiveModal('pin')} className="w-full p-6 text-left hover:bg-slate-800/50 transition-colors flex justify-between items-center group">
                    <div>
                      <span className="text-sm font-bold text-white block group-hover:text-sky-400 transition-colors">{hasPin ? 'Alterar Código PIN' : 'Criar Código PIN'}</span>
                      {!hasPin && <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter">Recomendado para proteção de dados</span>}
                    </div>
                    <ChevronRight size={18} className="text-slate-600" />
                </button>
                <div className="p-6 flex justify-between items-center">
                  <div><p className="text-white font-bold text-sm">Sempre pedir PIN</p><p className="text-xs text-slate-500">Exigir código ao abrir o app</p></div>
                  <Toggle active={alwaysAsk} onClick={handleToggleAlwaysAsk} />
                </div>
                <div className="p-6 flex justify-between items-center">
                  <div><p className="text-white font-bold text-sm">Biometria</p><p className="text-xs text-slate-500">Usar FaceID ou Digital</p></div>
                  <Toggle active={useBiometrics} onClick={handleToggleBiometrics} />
                </div>
            </div>
          ) : (
            <div className="p-12 text-center space-y-4">
              <Smartphone size={40} className="text-slate-700 mx-auto mb-2"/>
              <div>
                <p className="text-white font-bold text-sm">Apenas no App Mobile</p>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">Baixe nosso aplicativo para configurar camadas extras de segurança física.</p>
              </div>
            </div>
          )}
        </div>

        {/* SISTEMA */}
        <div className="md:col-span-2 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <button onClick={handleClearCache} className="p-8 text-left hover:bg-slate-800/40 flex items-center justify-between group transition-colors">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-slate-800 rounded-2xl text-slate-400 group-hover:text-white transition-colors"><Trash2 size={24} /></div>
                  <div><p className="text-white font-bold text-base leading-none">Limpar Cache</p><p className="text-slate-500 text-xs mt-1">Resolve instabilidades visuais e de sincronia</p></div>
                </div>
                <ChevronRight size={20} className="text-slate-600" />
            </button>
            <button onClick={() => setActiveModal('termos')} className="p-8 text-left hover:bg-slate-800/40 flex items-center justify-between group transition-colors">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-slate-800 rounded-2xl text-slate-400 group-hover:text-white transition-colors"><FileText size={24} /></div>
                  <div><p className="text-white font-bold text-base leading-none">Termos e Privacidade</p><p className="text-slate-500 text-xs mt-1">Como protegemos e tratamos seus dados</p></div>
                </div>
                <ExternalLink size={20} className="text-slate-600" />
            </button>
        </div>

        {/* ZONA DE PERIGO (COMPLIANCE GOOGLE) */}
        <div className="md:col-span-2 p-8 border border-red-500/20 bg-red-500/5 rounded-[3rem] shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="text-red-500" size={20}/>
              <h3 className="text-red-400 font-black text-xs uppercase tracking-[0.2em]">Gerenciamento Crítico da Conta</h3>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
                <button 
                  onClick={logout} 
                  className="flex-1 py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-black/20"
                >
                  Sair da Conta
                </button>
                <button 
                  onClick={handleDeleteAccount} 
                  disabled={isDeleting}
                  className="flex-1 py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? <><Loader2 size={16} className="animate-spin"/> PROCESSANDO...</> : 'Excluir Minha Conta'}
                </button>
            </div>
            <p className="text-red-400/40 text-[9px] mt-4 text-center font-bold uppercase tracking-tighter">A exclusão da conta é irreversível e remove todos os dados de lançamentos, metas e interações com a IA.</p>
        </div>

      </div>

      {/* MODAL PIN */}
      {activeModal === 'pin' && isNative && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-[3rem] p-8 w-full max-w-sm text-center shadow-2xl">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 border border-emerald-500/20"><Lock size={32}/></div>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">{hasPin ? 'Alterar PIN' : 'Definir PIN'}</h3>
                <p className="text-slate-500 text-xs mb-8">Insira 4 dígitos para proteger seu acesso</p>
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[1,2,3,4,5,6,7,8,9].map(n => (<button key={n} onClick={() => handlePinKeyPress(String(n))} className="h-16 rounded-2xl bg-slate-800 text-white font-black text-2xl active:bg-sky-500 transition-colors shadow-lg border border-slate-700/50">{n}</button>))}
                    <div/><button onClick={() => handlePinKeyPress('0')} className="h-16 rounded-2xl bg-slate-800 text-white font-black text-2xl active:bg-sky-500 transition-colors shadow-lg border border-slate-700/50">0</button>
                    <button onClick={() => setPinInput(prev => prev.slice(0, -1))} className="h-16 rounded-2xl text-red-400 flex items-center justify-center active:bg-red-900/20 transition-all"><X size={28}/></button>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => { setActiveModal(null); setPinInput(''); }} className="flex-1 py-4 text-slate-500 font-bold uppercase text-xs tracking-widest">Cancelar</button>
                  <button onClick={handleSavePin} disabled={pinInput.length !== 4} className="flex-1 py-4 bg-emerald-600 disabled:opacity-30 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Confirmar</button>
                </div>
            </div>
        </div>
      )}
      
      {/* MODAL TERMOS E PRIVACIDADE */}
		{activeModal === 'termos' && (
		  <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
			<div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 w-full max-w-md shadow-2xl relative overflow-hidden">
			  <div className="absolute top-0 right-0 p-10 bg-sky-500/5 blur-3xl"></div>
			  
			  <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter flex items-center gap-3">
				<FileText className="text-sky-500" /> Documentos Legais
			  </h3>
			  <p className="text-slate-500 text-xs mb-8">Escolha qual documento deseja consultar</p>

			  <div className="flex flex-col gap-4">
				{/* Opção Termos */}
				<button 
				  onClick={() => {
					handleOpenExternal('/termos');
					setActiveModal(null);
				  }} 
				  className="w-full py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-700"
				>
				  <FileText size={18} /> Termos de Uso
				</button>

				{/* Opção Privacidade */}
				<button 
				  onClick={() => {
					handleOpenExternal('/privacidade');
					setActiveModal(null);
				  }} 
				  className="w-full py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-700"
				>
				  <ShieldCheck size={18} /> Política de Privacidade
				</button>

				{/* Botão fechar */}
				<button 
				  onClick={() => setActiveModal(null)} 
				  className="w-full py-4 text-slate-500 font-bold uppercase text-xs tracking-widest hover:text-slate-400 transition-colors"
				>
				  Cancelar
				</button>
			  </div>
			</div>
		  </div>
		)}

    </div>
  );
};

export default SettingsPage;