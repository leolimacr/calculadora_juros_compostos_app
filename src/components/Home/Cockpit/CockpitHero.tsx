import React, { useState, useMemo } from 'react';
import { AlertCircle, Crown, ChevronDown } from 'lucide-react';
import SovereignBuckets from '../../tools/finance/dashboard/SovereignBuckets';
import MarginTrajectoryPanel from '../../tools/finance/dashboard/MarginTrajectoryPanel';
import type { Transaction, UserMeta } from '../../../types';
import { useSubscriptionAccess } from '../../../hooks/useSubscriptionAccess';
import { getHeroHelperText, DISPONIBILIDADE_REAL } from '../../../theme/fpiVoiceGuide';
import ExpandableSection from '../../ui/ExpandableSection';

interface CockpitHeroProps {
  urgentBillsCount: number;
  userMeta: UserMeta | null | undefined;
  isPrivacyMode: boolean;
  sovereign: any;
  marcoZero: number;
  reserveCurrent: number;
  transactions: Transaction[];
  formatCurrency: (val: number) => string;
  onNavigate?: (tool: string) => void;
}

type ExpandedSection = 'hero' | 'saldoMes' | 'saldoAcumulado' | 'cartao' | 'contas' | 'falta' | null;

const CockpitHero: React.FC<CockpitHeroProps> = ({
  urgentBillsCount,
  userMeta,
  isPrivacyMode,
  sovereign,
  marcoZero,
  reserveCurrent,
  transactions,
  formatCurrency,
  onNavigate,
}) => {
  const { isPro, isPremium } = useSubscriptionAccess();
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [expandedInline, setExpandedInline] = useState<ExpandedSection>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const planLabel = isPremium ? 'Premium' : isPro ? 'Pro' : 'Free';

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const toggleInline = (section: ExpandedSection) => {
    setExpandedInline((prev) => (prev === section ? null : section));
  };

  const heroHelp = sovereign.commandMode
    ? getHeroHelperText(sovereign.commandMode, sovereign.heroValue)
    : DISPONIBILIDADE_REAL.heroHelpRotina;

  const colchaoTarget = userMeta?.financialProfile?.colchaoInicialTarget || 0;
  const reserveTarget = userMeta?.financialProfile?.emergencyReserveTarget || 0;
  const colchaoShortfall = Math.max(0, colchaoTarget - marcoZero);
  const reserveShortfall = Math.max(0, reserveTarget - reserveCurrent);
  const totalShortfall = colchaoShortfall + reserveShortfall;

  const heroValueDisplay = isPrivacyMode ? '••••••' : formatCurrency(sovereign.heroValue);

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-white border border-slate-200/60 p-8 shadow-floating group">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent_50%)]" />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="space-y-2 flex-1">
          {urgentBillsCount > 0 ? (
            <>
              <div className="flex items-center gap-2 text-status-danger animate-pulse">
                <AlertCircle size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Atenção Prioritária</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-slate-950">
                {urgentBillsCount} {urgentBillsCount === 1 ? 'conta vence' : 'contas vencem'} <br />
                <span className="text-brand-primary">hoje ou amanhã.</span>
              </h1>
            </>
          ) : (
            <>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mb-3">{greeting}, {userMeta?.nickname || 'Investidor'}</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest shadow-sm ${
                  isPremium ? 'bg-white text-emerald-600 border-emerald-100 shadow-emerald-500/10' :
                  isPro ? 'bg-white text-sky-600 border-sky-100 shadow-sky-500/10' :
                  'bg-white text-slate-400 border-slate-200'
                }`}>
                  {isPremium && <Crown size={12} className="fill-emerald-500" />}
                  {isPro && !isPremium && <Crown size={12} />}
                  Plano {planLabel}
                </span>
                {userMeta?.persona?.archetype && (
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Estratégia: {userMeta.persona.archetype === 'dividas' ? 'Sair do vermelho' : userMeta.persona.archetype === 'patrimonio' ? 'Crescimento' : 'Controle'}
                  </span>
                )}
              </div>
              <div className="flex flex-col md:flex-row md:items-end gap-8 mt-6">
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {sovereign.commandMode ? DISPONIBILIDADE_REAL.heroLabelComando : DISPONIBILIDADE_REAL.heroLabelRotina}
                  </p>
                  <h1 className={`text-5xl md:text-6xl font-black tracking-tighter leading-none text-transparent bg-clip-text drop-shadow-sm transition-all duration-500 ${
                    sovereign.commandMode && sovereign.heroValue < 0 
                      ? 'bg-gradient-to-br from-rose-600 via-slate-800 to-amber-600' 
                      : 'bg-gradient-to-br from-slate-950 via-slate-800 to-slate-600'
                  }`}>
                    {heroValueDisplay}
                  </h1>
                  
                  {/* Hero expandable composition */}
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
                      {heroHelp}
                    </p>

                    {sovereign.commandMode && (
                      <button
                        type="button"
                        onClick={() => toggleSection('hero')}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors py-1 min-h-[44px]"
                        aria-expanded={expandedSection === 'hero'}
                      >
                        <span>{expandedSection === 'hero' ? 'Recolher' : 'Ver composição'}</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${expandedSection === 'hero' ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}

                    {expandedSection === 'hero' && sovereign.commandMode && (
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Disponibilidade Real = Saldo acumulado − Cartão − Contas − Falta do Colchão − Falta da Reserva
                        </p>
                        <div className="space-y-1.5 text-[12px] font-medium text-slate-700">
                          <div className="flex justify-between">
                            <span>Saldo acumulado</span>
                            <span className="font-black">{formatCurrency(sovereign.accumulatedBalance)}</span>
                          </div>
                          <div className="flex justify-between text-amber-600">
                            <span>− Cartão de crédito</span>
                            <span className="font-black">−{formatCurrency(sovereign.virtualImpact)}</span>
                          </div>
                          <div className="flex justify-between text-amber-600">
                            <span>− Contas a pagar</span>
                            <span className="font-black">−{formatCurrency(sovereign.totalPendingBills)}</span>
                          </div>
                          <div className="flex justify-between text-sky-600">
                            <span>− Falta no Colchão Inicial</span>
                            <span className="font-black">−{formatCurrency(sovereign.colchaoShortfall)}</span>
                          </div>
                          <div className="flex justify-between text-sky-600">
                            <span>− Falta na Reserva de Emergência</span>
                            <span className="font-black">−{formatCurrency(sovereign.reserveShortfall)}</span>
                          </div>
                          <div className="border-t border-slate-200 pt-1.5 flex justify-between font-black text-slate-900">
                            <span>= Disponibilidade Real</span>
                            <span>{formatCurrency(sovereign.sovereignFreeBalance)}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          {DISPONIBILIDADE_REAL.composicaoDisponibilidadeReal}
                        </p>
                      </div>
                    )}
                    
                    {sovereign.commandMode && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                        {/* Saldo acumulado */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => toggleInline('saldoAcumulado')}
                            className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors py-1 min-h-[36px]"
                          >
                            <span>Acumulado: {isPrivacyMode ? '•••' : formatCurrency(sovereign.accumulatedBalance)}</span>
                            <ChevronDown size={12} className={`transition-transform ${expandedInline === 'saldoAcumulado' ? 'rotate-180' : ''}`} />
                          </button>
                          {expandedInline === 'saldoAcumulado' && (
                            <div className="absolute left-0 top-full mt-1 z-20 w-72 rounded-2xl bg-white border border-slate-200 shadow-lg p-4 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">Receitas acumuladas</span>
                                <span className="font-black">{formatCurrency(sovereign.accumulatedIncome)}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">− Despesas acumuladas</span>
                                <span className="font-black">−{formatCurrency(sovereign.accumulatedExpenses)}</span>
                              </div>
                              <div className="border-t border-slate-100 pt-1 flex justify-between text-[11px] font-black">
                                <span>= Saldo acumulado</span>
                                <span>{formatCurrency(sovereign.accumulatedBalance)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <span className="text-slate-200 text-[9px]">|</span>

                        {/* Cartão */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => toggleInline('cartao')}
                            className="flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase tracking-widest hover:text-amber-600 transition-colors py-1 min-h-[36px]"
                          >
                            <span>Cartão: {isPrivacyMode ? '•••' : formatCurrency(sovereign.virtualImpact)}</span>
                            <ChevronDown size={12} className={`transition-transform ${expandedInline === 'cartao' ? 'rotate-180' : ''}`} />
                          </button>
                          {expandedInline === 'cartao' && (
                            <div className="absolute left-0 top-full mt-1 z-20 w-72 rounded-2xl bg-white border border-slate-200 shadow-lg p-4 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                              <p className="text-[10px] text-slate-500 font-medium">
                                Total das faturas de cartão de crédito a vencer neste período.
                              </p>
                              <div className="flex justify-between text-[11px] font-black">
                                <span>Total no cartão</span>
                                <span className="text-amber-600">{formatCurrency(sovereign.virtualImpact)}</span>
                              </div>
                              {onNavigate && (
                                <button
                                  type="button"
                                  onClick={() => onNavigate('manager')}
                                  className="w-full mt-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest transition-all"
                                >
                                  Ver cartões
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <span className="text-slate-200 text-[9px]">|</span>

                        {/* Contas */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => toggleInline('contas')}
                            className="flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase tracking-widest hover:text-amber-600 transition-colors py-1 min-h-[36px]"
                          >
                            <span>Contas: {isPrivacyMode ? '•••' : formatCurrency(sovereign.totalPendingBills)}</span>
                            <ChevronDown size={12} className={`transition-transform ${expandedInline === 'contas' ? 'rotate-180' : ''}`} />
                          </button>
                          {expandedInline === 'contas' && (
                            <div className="absolute left-0 top-full mt-1 z-20 w-72 rounded-2xl bg-white border border-slate-200 shadow-lg p-4 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                              <p className="text-[10px] text-slate-500 font-medium">
                                Contas recorrentes cadastradas que ainda vencem neste período.
                              </p>
                              <div className="flex justify-between text-[11px] font-black">
                                <span>Total a pagar</span>
                                <span className="text-amber-600">{formatCurrency(sovereign.totalPendingBills)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {totalShortfall > 0 && (
                          <>
                            <span className="text-slate-200 text-[9px]">|</span>

                            {/* Falta proteger */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => toggleInline('falta')}
                                className="flex items-center gap-1 text-[9px] font-bold text-sky-500 uppercase tracking-widest hover:text-sky-600 transition-colors py-1 min-h-[36px]"
                              >
                                <span>Falta proteger: {isPrivacyMode ? '•••' : formatCurrency(totalShortfall)}</span>
                                <ChevronDown size={12} className={`transition-transform ${expandedInline === 'falta' ? 'rotate-180' : ''}`} />
                              </button>
                              {expandedInline === 'falta' && (
                                <div className="absolute left-0 top-full mt-1 z-20 w-72 rounded-2xl bg-white border border-slate-200 shadow-lg p-4 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-sky-600">Falta no Colchão Inicial</span>
                                    <span className="font-black">{formatCurrency(colchaoShortfall)}</span>
                                  </div>
                                  <p className="text-[9px] text-slate-400">{colchaoTarget > 0
                                    ? `Meta R$ ${colchaoTarget.toLocaleString('pt-BR')} − Saldo R$ ${marcoZero.toLocaleString('pt-BR')}`
                                    : 'Defina uma meta no Colchão Inicial.'}</p>
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-sky-600">Falta na Reserva de Emergência</span>
                                    <span className="font-black">{formatCurrency(reserveShortfall)}</span>
                                  </div>
                                  <p className="text-[9px] text-slate-400">{reserveTarget > 0
                                    ? `Meta R$ ${reserveTarget.toLocaleString('pt-BR')} − Saldo R$ ${reserveCurrent.toLocaleString('pt-BR')}`
                                    : 'Defina uma meta na Reserva de Emergência.'}</p>
                                  <div className="border-t border-slate-100 pt-1 flex justify-between text-[11px] font-black">
                                    <span>= Total a proteger</span>
                                    <span>{formatCurrency(totalShortfall)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {sovereign.commandMode && sovereign.leewayDays > 0 && !isPrivacyMode && (
                    <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 pt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {sovereign.leewayDays} dias de tranquilidade protegidos
                    </p>
                  )}

                  {!isPrivacyMode && sovereign.commandMode && (
                    <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                      {sovereign.totalCreditUsed > 0 && (
                        <div className="flex items-center gap-1.5 opacity-70">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            Crédito Comprometido: {formatCurrency(sovereign.totalCreditUsed)}
                          </span>
                        </div>
                      )}
                      {sovereign.totalDebtBalance > 0 && (
                        <div className="flex items-center gap-1.5 opacity-70">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            Peso das Dívidas: {formatCurrency(sovereign.totalDebtBalance)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pb-2">
                  {!sovereign.commandMode && sovereign.totalPendingBills > 0 && !isPrivacyMode && (
                    <div className="flex items-center gap-3 px-5 py-2 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        O que sobra:{' '}
                        <span className={`text-sm ${sovereign.projectedBalance >= 0 ? 'text-emerald-600' : 'text-status-danger'}`}>
                          {formatCurrency(sovereign.projectedBalance)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {sovereign.commandMode && (
                <div className="mt-6 w-full space-y-4">
                  <SovereignBuckets
                    snapshot={sovereign}
                    marcoZero={marcoZero}
                    reserveCurrent={reserveCurrent}
                    isPrivacyMode={isPrivacyMode}
                    variant="light"
                  />
                  <MarginTrajectoryPanel
                    transactions={transactions}
                    financialProfile={userMeta?.financialProfile}
                    currentMargin={sovereign.sovereignFreeBalance}
                    isPrivacyMode={isPrivacyMode}
                    variant="light"
                    months={6}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {!urgentBillsCount && (
          <div className="hidden lg:block w-72 h-48 shrink-0 relative animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="w-full h-full rounded-3xl overflow-hidden border border-slate-100 shadow-card relative group-hover:scale-[1.02] transition-transform duration-500">
              <img 
                src="/assets/images/lifestyle/cockpit-clarity.webp" 
                alt="Clareza Financeira" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute -bottom-3 -left-3 bg-white px-4 py-2 rounded-xl shadow-floating border border-slate-100 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nexus Active</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CockpitHero;
