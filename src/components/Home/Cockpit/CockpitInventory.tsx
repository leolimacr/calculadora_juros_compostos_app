import React from 'react';
import { TrendingUp, Building2, CreditCard, AlertCircle, ChevronRight, Crown, ShieldCheck, Plus } from 'lucide-react';
import { FPI_COPY } from '../../../theme/fpiVoiceGuide';
import { useSubscriptionAccess } from '../../../hooks/useSubscriptionAccess';
import FeatureGate from '../../FeatureGate';

interface CockpitInventoryProps {
  totals: any;
  detailedCards: any[];
  isPrivacyMode: boolean;
  onNavigate: (tool: string, state?: any) => void;
  formatCurrency: (val: number) => string;
}

const CockpitInventory: React.FC<CockpitInventoryProps> = ({
  totals,
  detailedCards,
  isPrivacyMode,
  onNavigate,
  formatCurrency,
}) => {
  const { isPro, isPremium } = useSubscriptionAccess();
  const renderCardsCard = (item: any) => {
    const hasData = item.hasItems ?? item.value > 0;
    const displayCards = detailedCards.slice(0, 3);
    const totalPurchases = detailedCards.reduce((sum, c) => sum + c.purchaseCount, 0);

    return (
      <button
        key={item.id}
        onClick={item.action}
        className={`group relative flex flex-row md:flex-col p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border transition-all text-left bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] items-center md:items-start gap-4 md:gap-0 ${
          item.warning ? 'border-status-danger/30 hover:border-status-danger' : 'border-slate-200 hover:border-brand-primary/40'
        }`}
      >
        <div className={`p-3 rounded-2xl md:mb-6 shrink-0 ${
          item.warning ? 'bg-status-danger/10 text-status-danger' : 'bg-amber-50 text-amber-600'
        }`}>
          <item.icon size={22} />
        </div>

        <div className="flex-1 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {item.label}
          </p>
          <p className={`text-lg font-black tracking-tight ${
            hasData ? 'text-slate-900' : 'text-slate-400 italic font-medium'
          }`}>
            {isPrivacyMode ? '••••••' : item.warning ? 'Configurar Datas' : hasData ? formatCurrency(item.value) : 'Cadastrar +'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {item.warning ? (
            <div className="px-2 py-1 bg-status-danger text-white rounded-lg text-[8px] font-black uppercase animate-pulse">
              Ajustar
            </div>
          ) : (
            <ChevronRight size={14} className="text-brand-primary md:hidden" />
          )}
        </div>

        {hasData && !item.warning && (
          <div className="hidden md:block flex-1 space-y-4 mb-4 w-full">
            <div className="grid grid-cols-1 gap-3">
              {displayCards.map(card => (
                <div key={card.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-700 uppercase tracking-tight">{card.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">{card.purchaseCount} compras</span>
                      <span className="text-slate-900">{isPrivacyMode ? '••••' : formatCurrency(card.balance)}</span>
                    </div>
                  </div>
                  {card.limit > 0 && (
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${card.usagePercent > 90 ? 'bg-status-danger' : card.usagePercent > 70 ? 'bg-amber-500' : 'bg-brand-primary'}`}
                          style={{ width: `${card.usagePercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-slate-400">
                        <span>Uso: {card.usagePercent.toFixed(0)}%</span>
                        <span>Restam {isPrivacyMode ? '••••' : formatCurrency(card.available)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {totalPurchases > 0 && (
              <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest text-center py-2 bg-brand-primary/5 rounded-xl border border-brand-primary/10 group-hover:bg-brand-primary/10 transition-colors">
                Clique para ver as {totalPurchases} compras em aberto
              </p>
            )}
          </div>
        )}

        {!hasData && !item.warning && (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center py-4 space-y-2 opacity-40 w-full">
            <div className="p-3 bg-slate-50 rounded-full">
              <Plus size={20} className="text-slate-300" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{FPI_COPY.creditOrganize}</p>
          </div>
        )}

        {(hasData || item.warning) && (
          <div className="hidden md:flex pt-4 border-t border-slate-50 items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity mt-auto w-full">
            <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary">Gestão Completa de Cartões</span>
            <ChevronRight size={14} className="text-brand-primary" />
          </div>
        )}
      </button>
    );
  };

  const renderInventoryCard = (item: any) => {
    const hasData = item.hasItems ?? item.value > 0;
    const isLocked = item.locked && !isPremium;

    return (
      <button
        key={item.id}
        onClick={item.action}
        className={`group relative flex flex-row md:flex-col p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border transition-all text-left bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-95 items-center md:items-start gap-4 md:gap-0 ${
          item.warning ? 'border-status-danger/30 hover:border-status-danger' : 'border-slate-200 hover:border-brand-primary/40'
        }`}
      >
        <div className={`p-3 rounded-2xl md:mb-6 shrink-0 ${
          item.warning ? 'bg-status-danger/10 text-status-danger' :
          item.color === 'rose' ? 'bg-rose-50 text-rose-600' :
          item.color === 'amber' ? 'bg-amber-50 text-amber-600' :
          item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
          'bg-sky-50 text-sky-600'
        }`}>
          <item.icon size={22} />
        </div>

        <div className="flex-1 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {item.label}
          </p>
          <p className={`text-lg font-black tracking-tight ${
            hasData ? 'text-slate-900' : 'text-slate-400 italic font-medium'
          }`}>
            {isPrivacyMode ? '••••••' : item.warning ? 'Configurar Datas' : hasData ? formatCurrency(item.value) : 'Cadastrar +'}
          </p>
          {isLocked && item.proFeature && (
            <p className="text-[9px] font-bold text-slate-400 mt-2 line-through decoration-slate-300 hidden md:block">
              {item.proFeature}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {item.isValidated && (
            <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg border border-emerald-100" title="Validado hoje">
              <ShieldCheck size={14} />
            </div>
          )}
          {item.warning ? (
            <div className="px-2 py-1 bg-status-danger text-white rounded-lg text-[8px] font-black uppercase animate-pulse">
              Ajustar
            </div>
          ) : isLocked ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100 animate-pulse">
              <Crown size={10} className="text-emerald-600 fill-emerald-600" />
              <span className="text-[8px] font-black text-emerald-700 uppercase tracking-tighter">Pro</span>
            </div>
          ) : !hasData ? (
            <Plus size={16} className="text-slate-300 group-hover:text-brand-primary" />
          ) : null}
          <ChevronRight size={14} className="text-brand-primary md:hidden" />
        </div>

        {(hasData || item.warning) && (
          <div className="hidden md:flex mt-4 pt-4 border-t border-slate-50 items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity w-full">
            <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary">
              {item.isValidated ? 'Ver detalhes' : 'Validar agora'}
            </span>
            <ChevronRight size={14} className="text-brand-primary" />
          </div>
        )}
      </button>
    );
  };

  const inventoryItems = [
    { id: 'invest', label: 'Investimentos', icon: TrendingUp, color: 'emerald', value: totals.investments, hasItems: totals.hasInvestments, action: () => onNavigate('investimentos'), locked: true, proFeature: '+ Rentabilidade Real', isValidated: totals.validatedModules?.investments },
    { id: 'patrimonio', label: 'Bens', icon: Building2, color: 'sky', value: totals.bens, hasItems: totals.hasBens, action: () => onNavigate('passivos'), locked: true, proFeature: '+ Valorização Automática', isValidated: totals.validatedModules?.property },
    { id: 'cartoes', label: 'Cartões', icon: CreditCard, color: 'amber', value: totals.cards, hasItems: totals.hasCards, warning: totals.hasIncompleteCards, action: () => onNavigate('manager', { openCards: true }) },
    { id: 'dividas', label: 'Débitos', icon: AlertCircle, color: 'rose', value: totals.debt, hasItems: totals.hasDebts, action: () => onNavigate('minhas-dividas'), isValidated: totals.validatedModules?.debts }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Comando Patrimonial</h4>
        {!isPremium && <button onClick={() => onNavigate('pricing')} className="text-[10px] font-black text-emerald-600 uppercase hover:underline">Ver benefícios Pro</button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {inventoryItems.map(item => {
          if (item.id === 'cartoes') return renderCardsCard(item);
          return renderInventoryCard(item);
        })}
      </div>
    </div>
  );
};

export default CockpitInventory;
