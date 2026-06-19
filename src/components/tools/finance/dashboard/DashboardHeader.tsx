import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Info, RefreshCw, Plus } from 'lucide-react';

interface DashboardHeaderProps {
  showBackToTools: boolean;
  onNavigate?: (page: string) => void;
  periodLabel: string;
  streak: number;
  isMobile: boolean;
  isPrivacyMode: boolean;
  onTogglePrivacy: () => void;
  onOpenForm: () => void;
  handleRecurringButtonClick: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  showBackToTools,
  onNavigate,
  periodLabel,
  streak,
  isMobile,
  isPrivacyMode,
  onTogglePrivacy,
  onOpenForm,
  handleRecurringButtonClick,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Barra Fixa Invisível para Título CONTROLA (Mobile Only) */}
      <div className={`fixed top-16 left-0 z-[100] md:hidden h-14 w-full px-4 flex items-center bg-transparent pointer-events-none transition-all duration-300 ${isScrolled ? 'opacity-5' : 'opacity-100'}`}>
        <div className="flex items-center gap-3 pointer-events-auto">
          <img
            src="/assets/images/brand/controla-icon.png"            alt="Ícone do Controla"
            className="w-9 h-9 rounded-xl shadow-md border border-emerald-200/50 bg-white object-cover"
          />
          <h2 className="text-3xl font-black tracking-tight uppercase leading-tight bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
            Controla
          </h2>
        </div>
      </div>

      {/* HEADER DO GERENCIADOR */}
      {showBackToTools && onNavigate && (
        <button
          onClick={() => {
            onNavigate('home');
            setTimeout(() => {
              document.getElementById('secao-ferramentas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
          className="hidden md:flex mb-4 items-center gap-2 text-text-muted hover:text-brand-secondary transition-all font-black uppercase text-xxs tracking-ultra-wide"
        >
          ← Voltar
        </button>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/assets/images/brand/controla-icon.png"            alt="Ícone do Controla"
            className="hidden md:block w-8 h-8 md:w-9 md:h-9 rounded-xl shadow-soft border border-surface-elevated bg-surface-primary object-cover"
          />
          <div className="flex flex-col">
            <h2 className="hidden md:block text-lg md:text-2xl font-black text-text-primary tracking-tight uppercase leading-tight">
              Controla
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-text-muted text-xxs md:text-xs font-bold uppercase tracking-ultra-wide">
                {periodLabel}
              </p>
              {streak > 1 ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-secondary border border-surface-elevated rounded-full animate-in fade-in slide-in-from-top-1">
                  <span className="text-text-muted text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">
                    {streak} dias · consistência
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-primary border border-surface-elevated rounded-full opacity-60">
                  <span className="text-text-muted text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">
                    Registro diário
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 self-start md:self-auto">
          {/* BOTÃO RECORRÊNCIAS */}
          <div className="relative">
            <button
              onClick={handleRecurringButtonClick}
              onMouseEnter={() => !isMobile && setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="p-2.5 md:p-3 rounded-3xl bg-surface-primary border border-surface-elevated text-text-muted hover:text-brand-secondary hover:border-brand-secondary transition-all active:scale-95 shadow-soft"
            >
              <RefreshCw size={18} />
            </button>

            {/* Tooltip Desktop */}
            {!isMobile && showTooltip && (
              <div className="absolute top-full mt-3 right-0 z-[110] w-64 p-4 bg-surface-primary border border-surface-elevated rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 pointer-events-none">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-brand-secondary/10 rounded-lg text-brand-secondary">
                    <Info size={14} />
                  </div>
                  <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Planejamento Estratégico</span>
                </div>
                <p className="text-[11px] leading-relaxed text-text-secondary font-medium">
                  Este botão organiza seu futuro. Ao cadastrar contas fixas e assinaturas, o Controla projeta sua folga do mês para o fim do mês, evitando surpresas.
                </p>
              </div>
            )}
          </div>

          {/* BOTÃO OLHINHO */}
          <button
            onClick={onTogglePrivacy}
            className="p-2.5 md:p-3 rounded-3xl bg-surface-primary border border-surface-elevated text-text-muted hover:text-text-primary hover:border-text-muted transition-all active:scale-95 shadow-soft"
          >
            {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            onClick={onOpenForm}
            className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-3xl font-black text-xxs md:text-xs uppercase tracking-ultra-wide shadow-soft transition-transform active:scale-95 bg-brand-primary text-text-onBrand hover:bg-brand-primary/90 shadow-brand-glow"
          >
            <Plus size={16} />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default DashboardHeader;
