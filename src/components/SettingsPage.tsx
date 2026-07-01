import React, { useState } from 'react';
import {
  User, ShieldCheck, CreditCard, FileText,
  Pencil, Check, ChevronRight, ExternalLink, ArrowLeft, Lock, X,
  Trash2, Smartphone, AlertTriangle, Loader2, Bell,
  House, LayoutGrid, Crown, Brain
} from 'lucide-react';
import { FPI_COPY } from '../theme/fpiVoiceGuide';
import { auth, db, functions } from '../firebase';
import { ref, update } from 'firebase/database';
import { deleteUser } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFirebase } from '../hooks/useFirebase';
import { useEntitlement } from '../hooks/useEntitlement';
import { useSettingsState } from '../hooks/useSettingsState';
import { usePresencePreferences } from '../hooks/usePresencePreferences';
import { useSecuritySettings } from '../hooks/useSecuritySettings';
import CommandCalibration from './tools/nexus/CommandCalibration';
import { seedPersonaFromIntent } from '../services/personaService';

const SettingsPage: React.FC<any> = ({ onBack }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { userMeta, saveFinancialProfile, wipeUserData } = useFirebase(user?.uid);
  const { effectiveTier, billingStatus, loading: billingLoading } = useEntitlement();
  const isPro = effectiveTier !== 'free';
  const isPremium = effectiveTier === 'premium';
  const isNative = Capacitor.isNativePlatform();

  const settings = useSettingsState(user, userMeta, saveFinancialProfile);
  const presence = usePresencePreferences(user);
  const security = useSecuritySettings(user);

  const [deleteStep, setDeleteStep] = useState<'idle' | 'checking' | 'blocked_subscription' | 'confirming' | 'deleting' | 'error'>('idle');
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showCalibration, setShowCalibration] = useState(false);

  /* ── ESTADO SEGURO PARA EXCLUSÃO ──
   * A conta só pode ser excluída se não houver assinatura ativa.
   * effectiveTier === 'free' significa que não há cobrança em vigor.
   * billingStatus duplica a verificação para capturar inconsistências. */
  const isSafeToDelete = effectiveTier === 'free' && (!billingStatus || billingStatus === 'expired' || billingStatus === 'incomplete');

  const handleOpenExternal = async (path: string) => {
    const url = `https://www.financasproinvest.com.br${path}`;
    if (isNative) await Browser.open({ url });
    else window.open(url, '_blank');
  };

  /* ── ABRIR PORTAL STRIPE ── */
  const handleOpenPortal = async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const fn = httpsCallable(functions, 'createPortalSession');
      const result = await fn({ returnUrl: window.location.href });
      const data = result.data as { url: string };
      if (isNative) {
        await Browser.open({ url: data.url });
      } else {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao abrir portal de gerenciamento';
      setPortalError(msg);
    } finally {
      setPortalLoading(false);
    }
  };

  /* ── INICIAR FLUXO DE EXCLUSÃO ── */
  const handleDeleteAccount = async () => {
    if (billingLoading) return;
    setDeleteStep('checking');

    if (!isSafeToDelete) {
      setDeleteStep('blocked_subscription');
      return;
    }

    setDeleteStep('confirming');
  };

  /* ── CONFIRMAR E EXECUTAR EXCLUSÃO ── */
  const handleConfirmDelete = async () => {
    setDeleteStep('deleting');
    setDeleteError(null);

    try {
      await wipeUserData();
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
        alert("Sua conta e todos os dados associados foram removidos com sucesso.");
      }
      setDeleteStep('idle');
    } catch (error: any) {
      console.error("Erro ao excluir conta:", error);
      if (error.code === 'auth/requires-recent-login') {
        setDeleteError("Por segurança, a exclusão de conta exige um login recente. Faça login novamente e tente excluir em seguida.");
        await logout();
      } else {
        setDeleteError("Ocorreu um erro ao tentar excluir sua conta. Tente novamente mais tarde.");
      }
      setDeleteStep('error');
    }
  };

  const resetDeleteFlow = () => {
    setDeleteStep('idle');
    setPortalError(null);
    setDeleteError(null);
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

  const planBadge = () => {
    if (isPremium) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-200">
          <Crown size={12} /> Premium
        </span>
      );
    }
    if (isPro) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-600 border border-sky-200">
          Pro
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">
        Gratuito
      </span>
    );
  };

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

      {/* 1. PERFIL + 2. ASSINATURA (grid 2 colunas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 1. PERFIL */}
        <div className="rounded-[2rem] border border-slate-200/80 bg-white shadow-card p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <User size={140} />
          </div>
          <div className="flex items-center gap-6 mb-8 relative z-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-sky-600 to-emerald-500 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-md">
              {settings.nickname ? settings.nickname[0].toUpperCase() : user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Seu Perfil
              </p>
              {settings.isEditingNickname ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.tempNickname}
                    onChange={(e) => settings.setTempNickname(e.target.value)}
                    className="bg-slate-50 border border-emerald-500/50 rounded-xl px-4 py-2 text-slate-900 text-sm w-full outline-none focus:border-brand-primaryCta"
                    autoFocus
                  />
                  <button
                    onClick={settings.handleSaveNickname}
                    className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg"
                  >
                    <Check size={20} />
                  </button>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 group cursor-pointer"
                  onClick={() => {
                    settings.setTempNickname(settings.nickname);
                    settings.setIsEditingNickname(true);
                  }}
                >
                  <h3 className="text-2xl font-bold text-slate-900 truncate">
                    {settings.nickname || 'Definir...'}
                  </h3>
                  <Pencil
                    size={16}
                    className="text-slate-500 group-hover:text-emerald-500 transition-colors shrink-0"
                  />
                </div>
              )}
              <p className="text-xs text-slate-500 mt-1 truncate font-medium">{user?.email}</p>
            </div>
          </div>

          {/* Perfil Financeiro */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Perfil Financeiro
              </p>
              {!settings.isEditingProfile && (
                <button
                  onClick={() => settings.setIsEditingProfile(true)}
                  className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-500 transition-colors"
                >
                  <Pencil size={12} /> Editar
                </button>
              )}
            </div>
            {settings.isEditingProfile ? (
              <div className="space-y-4">
                {[
                  { key: 'monthlyIncome', label: 'Renda Mensal', placeholder: '5000' },
                  { key: 'emergencyReserveTarget', label: 'Meses de Reserva', placeholder: '6' },
                  { key: 'emergencyReserveCurrent', label: 'Reserva Atual (R$)', placeholder: '0' },
                  { key: 'marcoZero', label: 'Marco Zero (R$)', placeholder: '0' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">{label}</p>
                    <input
                      type="number"
                      value={(settings.profileForm as any)[key] ?? ''}
                      onChange={(e) => settings.setProfileProfileForm({ ...settings.profileForm, [key]: Number(e.target.value) })}
                      placeholder={placeholder}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-primaryCta"
                    />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => settings.setIsEditingProfile(false)}
                    className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={settings.handleSaveProfile}
                    disabled={settings.isSavingProfile}
                    className="flex-1 py-3 bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                  >
                    {settings.isSavingProfile ? (
                      <><Loader2 size={14} className="animate-spin" /> Salvando</>
                    ) : 'Salvar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Renda Mensal</span>
                  <span className="text-sm font-bold text-slate-900">R$ {settings.profileForm.monthlyIncome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Reserva de Emergência</span>
                  <span className="text-sm font-bold text-slate-900">{settings.profileForm.emergencyReserveTarget} meses</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Reserva Atual</span>
                  <span className="text-sm font-bold text-slate-900">R$ {settings.profileForm.emergencyReserveCurrent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Marco Zero</span>
                  <span className="text-sm font-bold text-slate-900">R$ {settings.profileForm.marcoZero}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. ASSINATURA */}
        <div className="rounded-[2rem] border border-slate-200/80 bg-white shadow-card p-8 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-tr from-sky-600 to-emerald-500 rounded-2xl text-white shadow-md">
              <Crown size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Assinatura</h3>
              <p className="text-xs text-slate-500 font-medium">Seu plano atual</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CreditCard className="text-emerald-500" size={24} />
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Plano Ativo
                </p>
                <p className="text-sm font-black text-slate-900 uppercase">
                  {planBadge()}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/app/mais/pricing')}
              className="text-[10px] font-black text-sky-600 bg-sky-50 px-4 py-2 rounded-xl uppercase tracking-widest flex items-center gap-2 border border-sky-200 hover:bg-sky-100 transition-all"
            >
              Ver planos <ExternalLink size={12} />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
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
          </div>

          {/* Calibração de Comando */}
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-200">
                <Brain size={18} />
              </div>
              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Sintonização de Comando</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              A calibração altera o tom do Nexus e as métricas prioritárias do seu cockpit.
            </p>
            {userMeta?.persona && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-[10px] font-black uppercase tracking-widest">
                Perfil Atual: {userMeta.persona.archetype}
              </div>
            )}
            <button
              onClick={() => setShowCalibration(true)}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-sky-900/20"
            >
              Recalibrar Inteligência
            </button>
          </div>
        </div>
      </div>

      {/* 3. PREFERÊNCIAS */}
      <div className="rounded-[2rem] border border-slate-200/80 bg-white shadow-card overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-white">
          <ShieldCheck size={20} className="text-emerald-500" />
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Preferências
          </h4>
        </div>
        {isNative ? (
          <div className="divide-y divide-slate-100">
            <button
              onClick={() => security.setActiveModal('pin')}
              className="w-full p-6 text-left hover:bg-slate-50 transition-colors flex justify-between items-center group"
            >
              <div>
                <span className="text-sm font-bold text-slate-900 block group-hover:text-emerald-600 transition-colors">
                  {security.hasPin ? 'Código de Proteção (PIN)' : 'Criar Código PIN'}
                </span>
                {!security.hasPin && (
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">
                    Recomendado para proteção de dados
                  </span>
                )}
              </div>
              <ChevronRight size={18} className="text-slate-500" />
            </button>
            <div className="p-6 flex justify-between items-center">
              <div>
                <p className="text-slate-900 font-bold text-sm">Sempre pedir PIN</p>
                <p className="text-xs text-slate-500">Exigir código ao abrir o app</p>
              </div>
              <Toggle active={security.alwaysAsk} onClick={security.handleToggleAlwaysAsk} />
            </div>
            <div className="p-6 flex justify-between items-center">
              <div>
                <p className="text-slate-900 font-bold text-sm">Biometria</p>
                <p className="text-xs text-slate-500">Usar FaceID ou Digital</p>
              </div>
              <Toggle active={security.useBiometrics} onClick={security.handleToggleBiometrics} />
            </div>
          </div>
        ) : (
          <div className="p-12 text-center space-y-4">
            <Smartphone size={40} className="text-slate-500 mx-auto mb-2" />
            <div>
              <p className="text-slate-900 font-bold text-sm">Apenas no App Mobile</p>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Baixe nosso aplicativo para configurar camadas extras de segurança física.
              </p>
            </div>
          </div>
        )}

        {/* Tela Inicial (Mobile) */}
        {isNative && (
          <div className="border-t border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <House size={18} className="text-amber-500" />
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Tela Inicial do App</p>
              </div>
              {security.savingStartupHome && (
                <Loader2 size={14} className="text-amber-500 animate-spin" />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => security.handleStartupHomeChange('home', isPremium, handleOpenExternal)}
                className={`rounded-2xl border p-5 text-left transition-all ${
                  security.startupHome === 'home'
                    ? 'border-amber-400 bg-amber-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-3 rounded-2xl ${security.startupHome === 'home' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <House size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Home</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resumo e rotina</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Abre o app na Home com resumo do mês, atalhos e acesso rápido ao Controla completo.
                </p>
              </button>
              <button
                onClick={() => security.handleStartupHomeChange('central', isPremium, handleOpenExternal)}
                className={`rounded-2xl border p-5 text-left transition-all ${
                  security.startupHome === 'central'
                    ? 'border-sky-400 bg-sky-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                } ${!isPremium ? 'opacity-80' : ''}`}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${security.startupHome === 'central' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <LayoutGrid size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Central financeira</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Visão completa do ecossistema</p>
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

        {/* Documentos Legais */}
        <div className="border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => security.setActiveModal('termos')}
            className="w-full p-6 text-left hover:bg-slate-100 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-4">
              <FileText size={20} className="text-slate-500" />
              <span className="text-sm font-bold text-slate-700">Termos e Privacidade</span>
            </div>
            <ChevronRight size={18} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* 4. NOTIFICAÇÕES E PRESENÇA */}
      <div className="rounded-[2rem] border border-slate-200/80 bg-white shadow-card overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-xl">
              <Bell size={18} className="text-teal-600" />
            </div>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Notificações e Presença
            </h4>
          </div>
          {presence.savingPresence && (
            <Loader2 size={14} className="text-teal-500 animate-spin" />
          )}
        </div>

        <div className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Canais */}
            <div className="space-y-0 divide-y divide-slate-100">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pb-3">Canais</p>
              <div className="py-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-slate-900">Notificações Push</p>
                  <p className="text-xs text-slate-500">Avisos no dispositivo</p>
                </div>
                <Toggle
                  active={presence.presencePrefs.pushEnabled}
                  onClick={() => presence.savePresencePrefs({ ...presence.presencePrefs, pushEnabled: !presence.presencePrefs.pushEnabled })}
                />
              </div>
              <div className="py-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-slate-900">Resumos por Email</p>
                  <p className="text-xs text-slate-500">Digest semanal e revisões</p>
                </div>
                <Toggle
                  active={presence.presencePrefs.emailEnabled}
                  onClick={() => presence.savePresencePrefs({ ...presence.presencePrefs, emailEnabled: !presence.presencePrefs.emailEnabled })}
                />
              </div>
            </div>

            {/* Temas */}
            <div className="space-y-0 divide-y divide-slate-100">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pb-3">Temas</p>
              {(
                [
                  { key: 'debts' as const, label: 'Dívidas', desc: 'Vencimentos e plano' },
                  { key: 'wealth' as const, label: 'Patrimônio', desc: 'Metas e aportes' },
                  { key: 'routine' as const, label: 'Rotina', desc: FPI_COPY.settingsRoutine },
                  { key: 'nexus' as const, label: 'Nexus', desc: 'Insights e análises' },
                ]
              ).map(({ key, label, desc }) => (
                <div key={key} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                  <Toggle
                    active={presence.presencePrefs.topics[key]}
                    onClick={() => presence.toggleTopic(key)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Frequência de Insights */}
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Frequência de Insights</p>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { value: 'essential' as const, label: 'Essencial', desc: 'Só urgências' },
                  { value: 'balanced' as const, label: 'Equilibrado', desc: 'Urgências + lembretes úteis' },
                  { value: 'complete' as const, label: 'Completo', desc: 'Tudo + insights Nexus' },
                ]
              ).map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => presence.savePresencePrefs({ ...presence.presencePrefs, intensity: value })}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    presence.presencePrefs.intensity === value
                      ? 'border-teal-500 bg-teal-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className={`text-sm font-black ${presence.presencePrefs.intensity === value ? 'text-teal-700' : 'text-slate-800'}`}>
                    {label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Horário de Disponibilidade */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Horário de Disponibilidade</p>
            <p className="text-sm font-bold text-slate-800 mb-4">Em quais horários o Nexus pode te notificar?</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Horário Comercial', value: 'business' },
                { label: 'Dia Inteiro', value: 'all-day' },
                { label: 'Personalizado', value: 'custom' },
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
      </div>

      {/* 5. DADOS */}
      <div className="space-y-6 mb-6">
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={security.handleClearCache}
            className="p-8 rounded-[2rem] border border-slate-200/80 bg-white shadow-card text-left hover:bg-slate-50 flex items-center justify-between group transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-5">
              <div className="p-4 bg-slate-100 rounded-2xl text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700 transition-colors">
                <Trash2 size={24} />
              </div>
              <div>
                <p className="text-slate-900 font-bold text-base leading-none">Limpar Cache</p>
                <p className="text-slate-500 text-xs mt-1">
                  Resolve instabilidades visuais e de sincronia
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-500" />
          </button>

          <button
            onClick={logout}
            className="p-8 bg-white hover:bg-slate-50 border border-slate-200 rounded-[2rem] text-left flex items-center justify-between group transition-all shadow-card active:scale-[0.98]"
          >
            <div className="flex items-center gap-5">
              <div className="p-4 bg-slate-100 rounded-2xl text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700 transition-colors">
                <ExternalLink size={24} className="rotate-180" />
              </div>
              <div>
                <p className="text-slate-900 font-bold text-base leading-none">Sair da Conta</p>
                <p className="text-slate-500 text-xs mt-1">
                  Encerrar sua sessão atual com segurança
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Zona de Risco — Excluir Conta */}
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="text-red-500" size={20} />
            <h3 className="text-red-700 font-black text-xs uppercase tracking-[0.2em]">
              Zona de Risco
            </h3>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <p className="text-red-800 font-bold text-sm">Excluir minha conta</p>
              <p className="text-xs text-red-600 mt-1 max-w-md">
                A exclusão da conta é irreversível e remove todos os seus registros e histórico com o Nexus.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteStep === 'deleting' || deleteStep === 'checking' || billingLoading}
              className="w-full md:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {deleteStep === 'deleting' ? (
                <><Loader2 size={16} className="animate-spin" /> EXCLUINDO...</>
              ) : (
                'Excluir Minha Conta'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modais */}
      {showCalibration && user?.uid && (
        <CommandCalibration
          userId={user.uid}
          initialAnswers={seedPersonaFromIntent(userMeta?.onboardingPersona || 'geral')}
          onComplete={() => setShowCalibration(false)}
          onClose={() => setShowCalibration(false)}
        />
      )}

      {security.activeModal === 'pin' && isNative && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-8 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 border border-emerald-200">
              <Lock size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">
              {security.hasPin ? 'Alterar PIN' : 'Definir PIN'}
            </h3>
            <p className="text-slate-500 text-xs mb-8">Insira 4 dígitos para proteger seu acesso</p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button
                  key={n}
                  onClick={() => security.handlePinKeyPress(String(n))}
                  className="h-16 rounded-2xl bg-surface-secondary text-slate-900 font-black text-2xl active:bg-sky-500 transition-colors shadow-sm border border-slate-200"
                >
                  {n}
                </button>
              ))}
              <div />
              <button
                onClick={() => security.handlePinKeyPress('0')}
                className="h-16 rounded-2xl bg-surface-secondary text-slate-900 font-black text-2xl active:bg-sky-500 transition-colors shadow-sm border border-slate-200"
              >
                0
              </button>
              <button
                onClick={() => security.setPinInput(prev => prev.slice(0, -1))}
                className="h-16 rounded-2xl text-red-600 flex items-center justify-center active:bg-red-50 transition-all"
              >
                <X size={28} />
              </button>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => { security.setActiveModal(null); security.setPinInput(''); }}
                className="flex-1 py-4 text-slate-500 font-bold uppercase text-xs tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={security.handleSavePin}
                disabled={security.pinInput.length !== 4}
                className="flex-1 py-4 bg-emerald-600 disabled:opacity-30 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {security.activeModal === 'termos' && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-10 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 bg-sky-50 blur-3xl"></div>

            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter flex items-center gap-3">
              <FileText className="text-sky-600" /> Documentos Legais
            </h3>
            <p className="text-slate-500 text-xs mb-8">Escolha qual documento deseja consultar</p>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  handleOpenExternal('/termos');
                  security.setActiveModal(null);
                }}
                className="w-full py-5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-200"
              >
                <FileText size={18} /> Termos de Uso
              </button>

              <button
                onClick={() => {
                  handleOpenExternal('/privacidade');
                  security.setActiveModal(null);
                }}
                className="w-full py-5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-200"
              >
                <ShieldCheck size={18} /> Política de Privacidade
              </button>

              <button
                onClick={() => security.setActiveModal(null)}
                className="w-full py-4 text-slate-500 font-bold uppercase text-xs tracking-widest hover:text-slate-500 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ASSINATURA ATIVA BLOQUEIA EXCLUSÃO ── */}
      {deleteStep === 'blocked_subscription' && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 bg-amber-50 blur-3xl"></div>

            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-200">
              <Crown size={28} className="text-amber-600" />
            </div>

            <h3 className="text-xl font-black text-slate-900 text-center mb-2">
              Você tem uma assinatura ativa
            </h3>
            <p className="text-slate-500 text-xs text-center leading-relaxed mb-6">
              Para excluir sua conta, você precisa primeiro cancelar sua assinatura. 
              O cancelamento não é feito automaticamente ao excluir a conta.
            </p>

            {portalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium text-center">
                {portalError}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
              >
                {portalLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> ABRINDO PORTAL...</>
                ) : (
                  <><ExternalLink size={16} /> Gerenciar assinatura</>
                )}
              </button>
              <button
                onClick={resetDeleteFlow}
                className="w-full py-3 text-slate-500 hover:text-slate-700 font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Voltar
              </button>
            </div>

            <p className="mt-4 text-[10px] text-slate-400 text-center leading-relaxed">
              Após cancelar no Portal Stripe, volte a esta tela. Se o estado da assinatura ainda não tiver atualizado, aguarde alguns instantes e tente novamente.
            </p>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRMAÇÃO FINAL (também fica visível durante a exclusão) ── */}
      {(deleteStep === 'confirming' || deleteStep === 'deleting') && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 bg-red-50 blur-3xl"></div>

            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-200">
              <AlertTriangle size={28} className="text-red-600" />
            </div>

            <h3 className="text-xl font-black text-slate-900 text-center mb-2">
              Excluir conta permanentemente?
            </h3>
            <p className="text-slate-500 text-xs text-center leading-relaxed mb-6">
              Esta ação é irreversível. Todos os seus lançamentos, metas, histórico com o Nexus e configurações serão apagados para sempre.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleConfirmDelete}
                disabled={deleteStep === 'deleting'}
                className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
              >
                {deleteStep === 'deleting' ? (
                  <><Loader2 size={16} className="animate-spin" /> EXCLUINDO...</>
                ) : (
                  'Sim, excluir minha conta'
                )}
              </button>
              <button
                onClick={resetDeleteFlow}
                className="w-full py-3 text-slate-500 hover:text-slate-700 font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ERRO NA EXCLUSÃO ── */}
      {deleteStep === 'error' && deleteError && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 bg-red-50 blur-3xl"></div>

            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-200">
              <AlertTriangle size={28} className="text-red-600" />
            </div>

            <h3 className="text-xl font-black text-slate-900 text-center mb-2">
              Erro ao excluir conta
            </h3>
            <p className="text-slate-500 text-xs text-center leading-relaxed mb-6">
              {deleteError}
            </p>

            <div className="space-y-3">
              <button
                onClick={handleDeleteAccount}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
              >
                Tentar novamente
              </button>
              <button
                onClick={resetDeleteFlow}
                className="w-full py-3 text-slate-500 hover:text-slate-700 font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
