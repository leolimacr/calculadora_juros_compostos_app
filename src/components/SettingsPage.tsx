import React, { useState, useEffect } from 'react';
import { 
  User, ShieldCheck, Fingerprint, CreditCard, FileText, 
  LogOut, Pencil, Check, ChevronRight, ExternalLink, ArrowLeft, Lock, X, 
  Trash2, Smartphone, AlertTriangle
} from 'lucide-react';
import { auth, db } from '../firebase';
import { ref, update, onValue } from 'firebase/database';
import { deleteUser } from 'firebase/auth'; // Import para deletar Auth
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
import { NativeBiometric } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { useFirebase } from '../hooks/useFirebase'; // Import do Hook
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';

const SettingsPage: React.FC<any> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const { wipeUserData } = useFirebase(user?.uid); // Função de limpeza
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

  // ⚠️ LÓGICA DE EXCLUSÃO DE CONTA (MANDATÓRIO GOOGLE)
  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm("ATENÇÃO: Você tem certeza que deseja excluir sua conta?");
    if (!confirm1) return;
    
    const confirm2 = window.confirm("Esta ação é IRREVERSÍVEL. Todos os seus lançamentos e histórico serão apagados permanentemente. Continuar?");
    if (!confirm2) return;

    try {
        // 1. Apaga dados do banco
        await wipeUserData();
        
        // 2. Apaga usuário da autenticação
        if (auth.currentUser) {
            await deleteUser(auth.currentUser);
            alert("Conta excluída com sucesso.");
        }
    } catch (error: any) {
        console.error("Erro ao excluir:", error);
        if (error.code === 'auth/requires-recent-login') {
            alert("Por segurança, faça login novamente antes de excluir sua conta.");
            await logout();
        } else {
            alert("Erro ao excluir conta. Tente novamente.");
        }
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
        <button onClick={onBack} className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all"><ArrowLeft size={24} /></button>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Configurações</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{isNative ? 'App Mobile' : 'Conta Web'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PERFIL */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5"><User size={120}/></div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
             <div className="w-16 h-16 bg-gradient-to-tr from-sky-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                {nickname ? nickname[0].toUpperCase() : user?.email?.[0].toUpperCase()}
             </div>
             <div className="flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Apelido</p>
                {isEditingNickname ? (
                  <div className="flex gap-2">
                    <input type="text" value={tempNickname} onChange={(e) => setTempNickname(e.target.value)} className="bg-slate-900 border border-emerald-500/50 rounded-lg px-3 py-1 text-white text-sm w-full" autoFocus />
                    <button onClick={handleSaveNickname} className="bg-emerald-600 p-2 rounded-lg text-white"><Check size={16}/></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setTempNickname(nickname); setIsEditingNickname(true); }}>
                    <h3 className="text-xl font-bold text-white truncate max-w-[200px]">{nickname || 'Definir...'}</h3>
                    <Pencil size={14} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                )}
                <p className="text-xs text-slate-600 mt-1 truncate">{user?.email}</p>
             </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <CreditCard className="text-emerald-500" size={20} />
              <div><p className="text-[10px] font-black text-slate-500 uppercase">Plano</p><p className="text-sm font-bold text-white">{isPremium ? 'Premium 👑' : isPro ? 'Pro ⭐' : 'Gratuito'}</p></div>
            </div>
            {/* LINK EXTERNO DE PAGAMENTO (CUIDADO AQUI) */}
            <button onClick={() => handleOpenExternal('/pricing')} className="text-[10px] font-black text-sky-400 bg-sky-400/10 px-3 py-2 rounded-xl uppercase tracking-widest flex items-center gap-2">Mudar <ExternalLink size={12}/></button>
          </div>
        </div>

        {/* SEGURANÇA */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl flex flex-col justify-center">
          <div className="p-6 border-b border-slate-800/50"><h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500" /> Segurança</h4></div>
          {isNative ? (
            <>
                <button onClick={() => setActiveModal('pin')} className="w-full p-6 text-left hover:bg-slate-800 transition-colors flex justify-between items-center border-b border-slate-800/50">
                    <div><span className="text-sm font-bold text-white block">{hasPin ? 'Alterar PIN' : 'Criar PIN'}</span>{!hasPin && <span className="text-xs text-emerald-400">Recomendado</span>}</div><ChevronRight size={18} className="text-slate-600" />
                </button>
                <div className="p-6 border-b border-slate-800/50 flex justify-between items-center"><div><p className="text-white font-bold text-sm">Sempre pedir PIN</p><p className="text-xs text-slate-500">Ao abrir o app</p></div><Toggle active={alwaysAsk} onClick={handleToggleAlwaysAsk} /></div>
                <div className="p-6 flex justify-between items-center"><div><p className="text-white font-bold text-sm">Biometria</p><p className="text-xs text-slate-500">FaceID / Digital</p></div><Toggle active={useBiometrics} onClick={handleToggleBiometrics} /></div>
            </>
          ) : (
            <div className="p-6 text-center"><Smartphone size={32} className="text-slate-600 mx-auto mb-2"/><p className="text-white font-bold text-sm">Apenas no App Mobile</p><p className="text-slate-500 text-xs">Baixe o app para configurar PIN e Biometria.</p></div>
          )}
        </div>

        {/* SISTEMA */}
        <div className="md:col-span-2 bg-slate-800/40 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <button onClick={handleClearCache} className="p-6 text-left hover:bg-slate-800 flex items-center justify-between group">
                <div className="flex items-center gap-4"><div className="p-3 bg-slate-700/30 rounded-xl text-slate-400"><Trash2 size={24} /></div><div><p className="text-white font-bold text-sm">Limpar Cache</p><p className="text-slate-500 text-xs">Corrige erros visuais</p></div></div><ChevronRight size={18} className="text-slate-600" />
            </button>
            <button onClick={() => setActiveModal('termos')} className="p-6 text-left hover:bg-slate-800 flex items-center justify-between group">
                <div className="flex items-center gap-4"><div className="p-3 bg-slate-700/30 rounded-xl text-slate-400"><FileText size={24} /></div><div><p className="text-white font-bold text-sm">Termos e Privacidade</p><p className="text-slate-500 text-xs">Documentação legal</p></div></div><ExternalLink size={18} className="text-slate-600" />
            </button>
        </div>

        {/* ZONA DE PERIGO (MANDATÓRIO GOOGLE) */}
        <div className="md:col-span-2 p-6 border border-red-500/20 bg-red-500/5 rounded-[2rem]">
            <h3 className="text-red-400 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><AlertTriangle size={16}/> Zona de Perigo</h3>
            <div className="flex flex-col md:flex-row gap-4">
                <button onClick={logout} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">Sair da Conta</button>
                <button onClick={handleDeleteAccount} className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors">Excluir Minha Conta</button>
            </div>
            <p className="text-red-400/60 text-[10px] mt-3 text-center">A exclusão removerá permanentemente todos os seus dados e lançamentos.</p>
        </div>

      </div>

      {/* MODAIS (PIN e TERMOS - MANTIDOS IGUAIS) */}
      {activeModal === 'pin' && isNative && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] p-8 w-full max-w-sm text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500"><Lock size={32}/></div>
                <h3 className="text-xl font-black text-white mb-2">{hasPin ? 'Alterar PIN' : 'Definir PIN'}</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[1,2,3,4,5,6,7,8,9].map(n => (<button key={n} onClick={() => handlePinKeyPress(String(n))} className="h-14 rounded-xl bg-slate-800 text-white font-bold text-xl active:bg-slate-700">{n}</button>))}
                    <div/><button onClick={() => handlePinKeyPress('0')} className="h-14 rounded-xl bg-slate-800 text-white font-bold text-xl active:bg-slate-700">0</button><button onClick={() => setPinInput(prev => prev.slice(0, -1))} className="h-14 rounded-xl text-red-400 flex items-center justify-center active:bg-slate-800"><X size={24}/></button>
                </div>
                <div className="flex gap-3"><button onClick={() => { setActiveModal(null); setPinInput(''); }} className="flex-1 py-3 text-slate-400 font-bold">Cancelar</button><button onClick={handleSavePin} disabled={pinInput.length !== 4} className="flex-1 py-3 bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold">Salvar</button></div>
            </div>
        </div>
      )}
      
      {activeModal === 'termos' && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-lg">
                <h3 className="text-xl font-black text-white mb-4">Privacidade</h3>
                <p className="text-slate-400 text-sm mb-6">Seus dados são criptografados e o processamento financeiro segue rigorosos padrões de segurança.</p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => handleOpenExternal('/termos')} className="w-full py-4 bg-sky-600 text-white rounded-2xl font-bold">Ler Termos Completos</button>
                    <button onClick={() => setActiveModal(null)} className="w-full py-3 text-slate-400 font-bold">Fechar</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;