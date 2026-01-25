import React, { useState, useEffect } from 'react';
import { 
  User, ShieldCheck, Fingerprint, CreditCard, FileText, 
  LogOut, Pencil, Check, ChevronRight, ExternalLink, ArrowLeft, Lock, X, 
  VolumeX, Volume2
} from 'lucide-react';
import { auth, db } from '../firebase';
import { ref, update, onValue } from 'firebase/database';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
import { NativeBiometric } from 'capacitor-native-biometric';
import { useAuth } from '../contexts/AuthContext';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';

const SettingsPage: React.FC<any> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const { isPro, isPremium } = useSubscriptionAccess();

  // --- ESTADOS ---
  const [nickname, setNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState('');
  
  // Segurança Local
  const [hasPin, setHasPin] = useState(false);
  const [alwaysAsk, setAlwaysAsk] = useState(false);
  const [useBiometrics, setUseBiometrics] = useState(false);
  
  // Preferências
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modais
  const [activeModal, setActiveModal] = useState<string | null>(null); // 'pin', 'termos'
  const [pinInput, setPinInput] = useState('');

  // 1. Carregar Perfil do Firebase
  useEffect(() => {
    if (!user?.uid) return;
    const settingsRef = ref(db, `users/${user.uid}/settings`);
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setNickname(data.nickname || '');
      }
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Carregar Segurança do Dispositivo (Preferences)
  useEffect(() => {
    const loadLocalSettings = async () => {
      if (!user?.uid) return;
      
      const { value: pin } = await Preferences.get({ key: `pin_${user.uid}` });
      const { value: ask } = await Preferences.get({ key: `always_ask_${user.uid}` });
      const { value: bio } = await Preferences.get({ key: `use_biometrics_${user.uid}` });
      const { value: sound } = await Preferences.get({ key: `sound_enabled_${user.uid}` });

      setHasPin(!!pin);
      setAlwaysAsk(ask === 'true');
      setUseBiometrics(bio === 'true');
      setSoundEnabled(sound !== 'false'); // Padrão é true, só false se o usuário desativou
    };
    loadLocalSettings();
  }, [user]);

  // --- FUNÇÕES DE AÇÃO ---

  const handleSaveNickname = () => {
    if (!user?.uid) return;
    update(ref(db, `users/${user.uid}/settings`), { nickname: tempNickname });
    setNickname(tempNickname);
    setIsEditingNickname(false);
  };

  const handleOpenExternal = async (path: string) => {
    await Browser.open({ url: `https://www.financasproinvest.com.br${path}` });
  };

  const handleToggleAlwaysAsk = async () => {
    if (!hasPin) {
      alert("Crie um PIN de acesso primeiro.");
      setActiveModal('pin');
      return;
    }
    const newVal = !alwaysAsk;
    setAlwaysAsk(newVal);
    await Preferences.set({ key: `always_ask_${user?.uid}`, value: String(newVal) });
  };

  const handleToggleBiometrics = async () => {
    if (!hasPin) {
        alert("Crie um PIN de acesso primeiro para habilitar biometria.");
        setActiveModal('pin');
        return;
    }

    if (!useBiometrics) {
      try {
        const result = await NativeBiometric.isAvailable();
        if (result.isAvailable) {
            setUseBiometrics(true);
            await Preferences.set({ key: `use_biometrics_${user?.uid}`, value: 'true' });
        } else {
            alert("Biometria não disponível neste aparelho.");
        }
      } catch (e) {
        alert("Erro ao acessar biometria.");
      }
    } else {
      setUseBiometrics(false);
      await Preferences.set({ key: `use_biometrics_${user?.uid}`, value: 'false' });
    }
  };

  const handleToggleSound = async () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    // Salva localmente
    await Preferences.set({ key: `sound_enabled_${user?.uid}`, value: String(newVal) });
  };

  // Salvar o PIN
  const handleSavePin = async () => {
    if (pinInput.length !== 4) return;
    await Preferences.set({ key: `pin_${user?.uid}`, value: pinInput });
    setHasPin(true);
    setPinInput('');
    setActiveModal(null);
    alert("PIN configurado com sucesso! O App agora está protegido.");
  };

  const handlePinKeyPress = (num: string) => {
    if (pinInput.length < 4) setPinInput(prev => prev + num);
  };

  const Toggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <div onClick={onClick} className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors duration-300 cursor-pointer ${active ? 'bg-emerald-600' : 'bg-slate-700'}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Configurações</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Personalize sua experiência</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* SEÇÃO 1: PERFIL */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
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
                    <h3 className="text-xl font-bold text-white">{nickname || 'Definir apelido...'}</h3>
                    <Pencil size={14} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                )}
                <p className="text-xs text-slate-600 mt-1 truncate">{user?.email}</p>
             </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="text-emerald-500" size={20} />
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase">Seu Plano Atual</p>
                <p className="text-sm font-bold text-white">{isPremium ? 'Premium 👑' : isPro ? 'Pro ⭐' : 'Gratuito'}</p>
              </div>
            </div>
            <button onClick={() => handleOpenExternal('/pricing')} className="text-[10px] font-black text-sky-400 bg-sky-400/10 px-3 py-2 rounded-xl uppercase tracking-widest flex items-center gap-2">
              Mudar Plano <ExternalLink size={12}/>
            </button>
          </div>
        </div>

        {/* SEÇÃO 2: SEGURANÇA */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800/50">
             <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" /> Segurança
             </h4>
          </div>

          <button onClick={() => setActiveModal('pin')} className="w-full p-6 text-left hover:bg-slate-800 transition-colors flex justify-between items-center group border-b border-slate-800/50">
            <div>
                <span className="text-sm font-bold text-white block">{hasPin ? 'Alterar PIN de Acesso' : 'Criar PIN de Acesso'}</span>
                {!hasPin && <span className="text-xs text-emerald-400">Recomendado</span>}
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-white" />
          </button>

          <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
            <div>
              <p className="text-white font-bold text-sm">Sempre pedir PIN ao abrir</p>
              <p className="text-xs text-slate-500">Exigir código toda vez que iniciar (regra de 7 dias se desativado)</p>
            </div>
            <Toggle active={alwaysAsk} onClick={handleToggleAlwaysAsk} />
          </div>

          <div className="p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Fingerprint size={20} className="text-slate-400" />
              <div>
                <p className="text-white font-bold text-sm">Usar Biometria</p>
                <p className="text-xs text-slate-500">Digital ou FaceID</p>
              </div>
            </div>
            <Toggle active={useBiometrics} onClick={handleToggleBiometrics} />
          </div>
        </div>

        {/* SEÇÃO 3: PREFERÊNCIAS E TERMOS */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
          {/* REMOVEMOS O TOOGLE DE SOM AQUI */}
          <button onClick={() => setActiveModal('termos')} className="w-full p-6 text-left hover:bg-slate-800 flex justify-between items-center text-slate-400">
            <div className="flex items-center gap-3"><FileText size={18} /><span className="text-sm font-medium">Termos de Uso (Site)</span></div>
            <ChevronRight size={18} />
          </button>
        </div>

        <button onClick={logout} className="w-full py-5 flex items-center justify-center gap-3 text-red-500 font-black uppercase text-xs tracking-widest bg-red-500/5 border border-red-500/20 rounded-3xl active:scale-95">
          <LogOut size={18} /> Sair da Conta
        </button>
      </div>

      {/* MODAL CONFIGURAR PIN (Sem alteração) */}
      {activeModal === 'pin' && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500"><Lock size={32}/></div>
                <h3 className="text-xl font-black text-white mb-2">{hasPin ? 'Alterar PIN' : 'Definir PIN'}</h3>
                <p className="text-slate-400 text-sm mb-8">Digite 4 números para proteger seu app.</p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                        <button key={n} onClick={() => handlePinKeyPress(String(n))} className="h-14 rounded-xl bg-slate-800 text-white font-bold text-xl active:bg-slate-700">{n}</button>
                    ))}
                    <div/>
                    <button onClick={() => handlePinKeyPress('0')} className="h-14 rounded-xl bg-slate-800 text-white font-bold text-xl active:bg-slate-700">0</button>
                    <button onClick={() => setPinInput(prev => prev.slice(0, -1))} className="h-14 rounded-xl text-red-400 flex items-center justify-center active:bg-slate-800"><X size={24}/></button>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => { setActiveModal(null); setPinInput(''); }} className="flex-1 py-3 text-slate-400 font-bold">Cancelar</button>
                    <button onClick={handleSavePin} disabled={pinInput.length !== 4} className="flex-1 py-3 bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold">Salvar</button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL PRIVACIDADE (Agora é só um aviso) */}
      {activeModal === 'termos' && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl">
                <h3 className="text-xl font-black text-white mb-4">Privacidade</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">Seus dados são criptografados. O PIN e Biometria são salvos apenas no seu dispositivo. Para documentos completos, acesse o link abaixo.</p>
                <button onClick={() => handleOpenExternal('/termos')} className="w-full py-4 bg-sky-600 text-white rounded-2xl font-bold">Ver Termos no Site</button>
            </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;