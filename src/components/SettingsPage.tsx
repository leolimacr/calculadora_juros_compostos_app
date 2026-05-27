import React, { useState, useEffect } from 'react';
import {
  User, ShieldCheck, CreditCard, FileText,
  Pencil, Check, ChevronRight, ExternalLink, ArrowLeft, Lock, X,
  Trash2, Smartphone, AlertTriangle, Loader2, Bell,
  House, LayoutGrid, Crown
} from 'lucide-react';
import { firestore } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [startupHome, setStartupHome] = useState<'home' | 'central'>('home');
  const [savingStartupHome, setSavingStartupHome] = useState(false);

  // --- PRESENÇA ---
  const [presencePrefs, setPresencePrefs] = useState({
    pushEnabled: true,
    emailEnabled: true,
    intensity: 'balanced' as 'essential' | 'balanced' | 'complete',
    topics: { debts: true, wealth: true, routine: true, nexus: true },
    allowedHoursStart: 8,
    allowedHoursEnd: 21,
  });
  const [savingPresence, setSavingPresence] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const loadPresence = async () => {
      const docRef = doc(firestore, `users/${user.uid}/presencePreferences/config`);
      const snap = await getDoc(docRef);
      if (snap.exists()) setPresencePrefs(snap.data() as typeof presencePrefs);
    };
    loadPresence();
  }, [user?.uid]);

  const savePresencePrefs = async (updated: typeof presencePrefs) => {
    if (!user?.uid) return;
    setSavingPresence(true);
    try {
      await setDoc(
        doc(firestore, `users/${user.uid}/presencePreferences/config`),
        { ...updated, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        { merge: true }
      );
      setPresencePrefs(updated);
    } finally {
      setSavingPresence(false);
    }
  };

  const toggleTopic = (key: keyof typeof presencePrefs.topics) => {
    const updated = {
      ...presencePrefs,
      topics: { ...presencePrefs.topics, [key]: !presencePrefs.topics[key] },
    };
    savePresencePrefs(updated);
  };

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
      const { value: preferredHome } = await Preferences.get({ key: `app_home_${user.uid}` });
      setHasPin(!!pin);
      setAlwaysAsk(ask === 'true');
      setUseBiometrics(bio === 'true');
      setStartupHome(preferredHome === 'central' ? 'central' : 'home');
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

  const handleStartupHomeChange = async (next: 'home' | 'central') => {
    if (!user?.uid) return;
    if (!isNative) return alert("Disponível apenas no App Mobile.");
    if (next === 'central' && !isPremium) {
      handleOpenExternal('/pricing');
      return;
    }

    setSavingStartupHome(true);
    try {
      await Preferences.set({ key: `app_home_${user.uid}`, value: next });
      setStartupHome(next);
    } finally {
      setSavingStartupHome(false);
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

  const handlePinKeyPress = (num: string) => {
    if (pinInput.length < 4) setPinInput(prev => prev + num);
  };

  // Exclusão de conta
  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm("CUIDADO: Você deseja realmente EXCLUIR sua conta?");
    if (!confirm1) return;
    
    const confirm2 = window.confirm("ESTA AÇÃO É DEFINITIVA. Seus lançamentos, metas e histórico com o Nexus serão apagados para sempre. Deseja prosseguir?");
    if (!confirm2) return;

    setIsDeleting(true);

    try {
      await wipeUserData();
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
        alert("Sua conta e todos os dados associados foram removidos com sucesso.");
      }
    } catch (error: any) {
      console.error("Erro ao excluir conta:", error);
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
    <div
      onClick={onClick}
      className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors duration-300 cursor-pointer ${
        active ? 'bg-emerald-600' : 'bg-slate-300'
      }`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
          active ? 'translate-x-5' : 'translate-x-0'
        }`}
      ></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">
      
      {/* Header da página */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-500 hover:text-slate-800 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Mais Opções
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
            {isNative ? 'Preferências Mobile' : 'Preferências Web'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PERFIL (Minha Jornada) */}
        <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <User size={140} />
          </div>
          <div className="flex items-center gap-6 mb-8 relative z-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-sky-600 to-emerald-500 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-md">
              {nickname ? nickname[0].toUpperCase() : user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Seu Perfil
              </p>
              {isEditingNickname ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempNickname}
                    onChange={(e) => setTempNickname(e.target.value)}
                    className="bg-slate-50 border border-emerald-500/50 rounded-xl px-4 py-2 text-slate-900 text-sm w-full outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveNickname}
                    className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg"
                  >
                    <Check size={20} />
                  </button>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 group cursor-pointer"
                  onClick={() => {
                    setTempNickname(nickname);
                    setIsEditingNickname(true);
                  }}
                >
                  <h3 className="text-2xl font-bold text-slate-900 truncate">
                    {nickname || 'Definir...'}
                  </h3>
                  <Pencil
                    size={16}
                    className="text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0"
                  />
                </div>
              )}
              <p className="text-xs text-slate-500 mt-1 truncate font-medium">{user?.email}</p>
            </div>
          </div>
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <CreditCard className="text-emerald-500" size={24} />
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Plano Ativo
                </p>
                <p className="text-sm font-black text-slate-900 uppercase">
                  {isPremium ? 'Premium 👑' : isPro ? 'Pro ⭐' : 'Gratuito'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenExternal('/pricing')}
              className="text-[10px] font-black text-sky-600 bg-sky-50 px-4 py-2 rounded-xl uppercase tracking-widest flex items-center gap-2 border border-sky-200 hover:bg-sky-100 transition-all"
            >
              Ver planos <ExternalLink size={12} />
            </button>
          </div>

          <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-5 relative z-10">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Sua evolução
            </p>
            <p className="text-sm font-black text-slate-900 leading-snug">
              {isPremium
                ? 'Você já está na camada mais completa do produto.'
                : isPro
                  ? 'Seu controle diário já está destravado. O próximo salto é a Central completa.'
                  : 'Seu foco agora é criar hábito no Controla antes de subir de plano.'}
            </p>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {isPremium
                ? 'A melhor decisão agora é usar a Central e ajustar a tela inicial conforme sua rotina.'
                : isPro
                  ? 'O upgrade que passa a fazer sentido para você agora é o Premium, porque a visão mais ampla começa a gerar mais valor.'
                  : 'Quando o limite do Free começar a te frear, o Pro é o upgrade natural. O Premium entra quando você quiser visão financeira mais integrada.'}
            </p>
          </div>
        </div>

        {/* PRIVACIDADE E ACESSO */}
        <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-md flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
            <ShieldCheck size={20} className="text-emerald-500" />
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Privacidade e Acesso
            </h4>
          </div>
          {isNative ? (
            <div className="divide-y divide-slate-100">
              <button
                onClick={() => setActiveModal('pin')}
                className="w-full p-6 text-left hover:bg-slate-100 transition-colors flex justify-between items-center group"
              >
                <div>
                  <span className="text-sm font-bold text-slate-900 block group-hover:text-sky-500 transition-colors">
                    {hasPin ? 'Código de Proteção (PIN)' : 'Criar Código PIN'}
                  </span>
                  {!hasPin && (
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">
                      Recomendado para proteção de dados
                    </span>
                  )}
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
              <div className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-slate-900 font-bold text-sm">Sempre pedir PIN</p>
                  <p className="text-xs text-slate-500">Exigir código ao abrir o app</p>
                </div>
                <Toggle active={alwaysAsk} onClick={handleToggleAlwaysAsk} />
              </div>
              <div className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-slate-900 font-bold text-sm">Biometria</p>
                  <p className="text-xs text-slate-500">Usar FaceID ou Digital</p>
                </div>
                <Toggle active={useBiometrics} onClick={handleToggleBiometrics} />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center space-y-4">
              <Smartphone size={40} className="text-slate-400 mx-auto mb-2" />
              <div>
                <p className="text-slate-900 font-bold text-sm">Apenas no App Mobile</p>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                  Baixe nosso aplicativo para configurar camadas extras de segurança física.
                </p>
              </div>
            </div>
          )}
          {/* Documentos Legais Integrados em Segurança */}
          <div className="mt-auto border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => setActiveModal('termos')}
              className="w-full p-6 text-left hover:bg-slate-100 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-4">
                <FileText size={20} className="text-slate-400" />
                <span className="text-sm font-bold text-slate-700">Termos e Privacidade</span>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* SUA EXPERIÊNCIA (Presença + Tela Inicial) */}
        <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-md">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
            <div className="flex items-center gap-3">
              <LayoutGrid size={20} className="text-sky-500" />
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Sua Experiência
              </h4>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Seu Ritual e Avisos */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-teal-500" />
                  <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Seu Ritual e Avisos</p>
                </div>
                {savingPresence && (
                  <Loader2 size={14} className="text-teal-500 animate-spin" />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Canais */}
                <div className="space-y-0 divide-y divide-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-3">Canais</p>
                  <div className="py-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Notificações Push</p>
                      <p className="text-xs text-slate-500">Avisos no dispositivo</p>
                    </div>
                    <Toggle
                      active={presencePrefs.pushEnabled}
                      onClick={() => savePresencePrefs({ ...presencePrefs, pushEnabled: !presencePrefs.pushEnabled })}
                    />
                  </div>
                  <div className="py-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Resumos por Email</p>
                      <p className="text-xs text-slate-500">Digest semanal e revisões</p>
                    </div>
                    <Toggle
                      active={presencePrefs.emailEnabled}
                      onClick={() => savePresencePrefs({ ...presencePrefs, emailEnabled: !presencePrefs.emailEnabled })}
                    />
                  </div>
                </div>

                {/* Temas */}
                <div className="space-y-0 divide-y divide-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-3">Temas</p>
                  {(
                    [
                      { key: 'debts', label: 'Dívidas', desc: 'Vencimentos e plano' },
                      { key: 'wealth', label: 'Patrimônio', desc: 'Metas e aportes' },
                      { key: 'routine', label: 'Rotina', desc: 'Gastos e Controla' },
                      { key: 'nexus', label: 'Nexus', desc: 'Insights e análises' },
                    ] as const
                  ).map(({ key, label, desc }) => (
                    <div key={key} className="py-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                      <Toggle
                        active={presencePrefs.topics[key]}
                        onClick={() => toggleTopic(key)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Frequência de Insights */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Frequência de Insights</p>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { value: 'essential', label: 'Essencial', desc: 'Só urgências' },
                      { value: 'balanced', label: 'Equilibrado', desc: 'Urgências + lembretes úteis' },
                      { value: 'complete', label: 'Completo', desc: 'Tudo + insights Nexus' },
                    ] as const
                  ).map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => savePresencePrefs({ ...presencePrefs, intensity: value })}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        presencePrefs.intensity === value
                          ? 'border-teal-500 bg-teal-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className={`text-sm font-black ${presencePrefs.intensity === value ? 'text-teal-700' : 'text-slate-800'}`}>
                        {label}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Placeholder: Horário de Disponibilidade */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Horário de Disponibilidade</p>
                <p className="text-sm font-bold text-slate-800 mb-4">Em quais horários o Nexus pode te notificar?</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Horário Comercial', value: 'business' },
                    { label: 'Dia Inteiro', value: 'all-day' },
                    { label: 'Personalizado', value: 'custom' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => console.log('Presence hour option:', opt.value)}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-teal-500 hover:text-teal-600 transition-all"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tela Inicial (Mobile) */}
            {isNative && (
              <div className="pt-8 border-t border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <House size={18} className="text-amber-500" />
                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Tela Inicial do App</p>
                  </div>
                  {savingStartupHome && (
                    <Loader2 size={14} className="text-amber-500 animate-spin" />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleStartupHomeChange('home')}
                    className={`rounded-[1.75rem] border p-5 text-left transition-all ${
                      startupHome === 'home'
                        ? 'border-amber-400 bg-amber-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-3 rounded-2xl ${startupHome === 'home' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <House size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                          Home
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Resumo e rotina
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Abre o app na Home com resumo do mês, atalhos e acesso rápido ao Controla completo.
                    </p>
                  </button>

                  <button
                    onClick={() => handleStartupHomeChange('central')}
                    className={`rounded-[1.75rem] border p-5 text-left transition-all ${
                      startupHome === 'central'
                        ? 'border-sky-400 bg-sky-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    } ${!isPremium ? 'opacity-80' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${startupHome === 'central' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <LayoutGrid size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                            Central financeira
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Visão completa do ecossistema
                          </p>
                        </div>
                      </div>
                      {!isPremium && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-200">
                          <Crown size={12} /> Premium
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Ideal para quem quer abrir o app já na visão mais ampla, com Central, patrimônio, dívidas, Nexus e evolução do plano.
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CONTA E DADOS (Ações de Conta) */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={handleClearCache}
              className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-left hover:bg-slate-100 flex items-center justify-between group transition-colors shadow-md"
            >
              <div className="flex items-center gap-5">
                <div className="p-4 bg-slate-800 rounded-2xl text-slate-400 group-hover:text-white transition-colors">
                  <Trash2 size={24} />
                </div>
                <div>
                  <p className="text-slate-900 font-bold text-base leading-none">Limpar Cache</p>
                  <p className="text-slate-500 text-xs mt-1">
                    Resolve instabilidades visuais e de sincronia
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>

            <button 
              onClick={logout} 
              className="p-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-[2.5rem] text-left flex items-center justify-between group transition-all shadow-md active:scale-[0.98]"
            >
              <div className="flex items-center gap-5">
                <div className="p-4 bg-slate-700 rounded-2xl text-slate-400 group-hover:text-white transition-colors">
                  <ExternalLink size={24} className="rotate-180" />
                </div>
                <div>
                  <p className="text-white font-bold text-base leading-none">Sair da Conta</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Encerrar sua sessão atual com segurança
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-500" />
            </button>
          </div>

          <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-[3rem] shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="text-red-500" size={20} />
              <h3 className="text-red-500 font-black text-xs uppercase tracking-[0.2em]">
                Conta e Dados
              </h3>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <p className="text-slate-900 font-bold text-sm">Remover meus dados</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  A exclusão da conta é irreversível e remove todos os seus registros e histórico com o Nexus.
                </p>
              </div>
              <button 
                onClick={handleDeleteAccount} 
                disabled={isDeleting}
                className="w-full md:w-auto px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> PROCESSANDO...
                  </>
                ) : (
                  'Excluir Minha Conta'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PIN */}
      {activeModal === 'pin' && isNative && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-[3rem] p-8 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 border border-emerald-500/20">
              <Lock size={32} />
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">
              {hasPin ? 'Alterar PIN' : 'Definir PIN'}
            </h3>
            <p className="text-slate-500 text-xs mb-8">Insira 4 dígitos para proteger seu acesso</p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button
                  key={n}
                  onClick={() => handlePinKeyPress(String(n))}
                  className="h-16 rounded-2xl bg-slate-800 text-white font-black text-2xl active:bg-sky-500 transition-colors shadow-lg border border-slate-700/50"
                >
                  {n}
                </button>
              ))}
              <div />
              <button
                onClick={() => handlePinKeyPress('0')}
                className="h-16 rounded-2xl bg-slate-800 text-white font-black text-2xl active:bg-sky-500 transition-colors shadow-lg border border-slate-700/50"
              >
                0
              </button>
              <button
                onClick={() => setPinInput(prev => prev.slice(0, -1))}
                className="h-16 rounded-2xl text-red-400 flex items-center justify-center active:bg-red-900/20 transition-all"
              >
                <X size={28} />
              </button>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => { setActiveModal(null); setPinInput(''); }}
                className="flex-1 py-4 text-slate-500 font-bold uppercase text-xs tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePin}
                disabled={pinInput.length !== 4}
                className="flex-1 py-4 bg-emerald-600 disabled:opacity-30 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
              >
                Confirmar
              </button>
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
              <button 
                onClick={() => {
                  handleOpenExternal('/termos');
                  setActiveModal(null);
                }} 
                className="w-full py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <FileText size={18} /> Termos de Uso
              </button>

              <button 
                onClick={() => {
                  handleOpenExternal('/privacidade');
                  setActiveModal(null);
                }} 
                className="w-full py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <ShieldCheck size={18} /> Política de Privacidade
              </button>

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
