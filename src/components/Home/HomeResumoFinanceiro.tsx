import React from 'react';

interface Props {
  heroPersona: 'dividas' | 'patrimonio';
  onNavigate: (route: string) => void;
  onStartNow: () => void;
  isAuthenticated: boolean;
  isPrivacyMode: boolean;
  userMeta: any;
  patrimonioAtivo: number;
  patrimonioPassivo: number;
  patrimonioTotal: number;
  metasAtivas: any[];
  diasRestantes: number | null;
  valorProximoAporte: number;
}

export const HomeResumoFinanceiro: React.FC<Props> = ({
  heroPersona, onNavigate, onStartNow, isAuthenticated, isPrivacyMode,
  userMeta, patrimonioAtivo, patrimonioPassivo, patrimonioTotal,
  metasAtivas, diasRestantes, valorProximoAporte,
}) => {
  const formatValue = (value: number) => {
    if (isPrivacyMode) return 'R$ •••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <section className="block lg:hidden px-4 py-6 max-w-[1600px] mx-auto w-full">
      <div className="grid grid-cols-2 gap-3">
        <div onClick={() => heroPersona === 'dividas' ? onNavigate('minhas-dividas') : isAuthenticated ? onNavigate('investimentos') : onStartNow()} className="col-span-2 bg-gradient-to-br from-emerald-50 to-white backdrop-blur-md rounded-2xl p-5 border border-emerald-200 cursor-pointer relative overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
            <p className="text-[10px] text-emerald-700 font-black uppercase tracking-widest">{heroPersona === 'dividas' ? 'Base inicial da sua organização' : 'Base patrimonial'}</p>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {heroPersona === 'dividas' ? 'Entrada organizada no ecossistema' : isAuthenticated && patrimonioAtivo != null ? formatValue(patrimonioAtivo) : 'R$ 142.500,00'}
          </p>
          <p className="text-xs text-emerald-700 font-medium">
            {heroPersona === 'dividas' ? 'Cadastre sua realidade e evolua com mais contexto e acompanhamento' : isAuthenticated ? 'Sua base patrimonial organizada para revisar decisões' : 'Exemplo visual de patrimônio consolidado'}
          </p>
        </div>

        <div onClick={() => onNavigate(heroPersona === 'dividas' ? 'minhas-dividas' : 'metas')} className="bg-gradient-to-b from-blue-50 to-white backdrop-blur-md rounded-xl p-4 border border-blue-200 cursor-pointer shadow-sm">
          <p className="text-[10px] text-blue-700 font-bold uppercase mb-1">{heroPersona === 'dividas' ? 'Próxima decisão' : 'Próxima revisão'}</p>
          <p className="text-xl font-black text-slate-900 truncate">{heroPersona === 'dividas' ? 'Cadastrar dívidas e iniciar um acompanhamento mais inteligente' : userMeta ? formatValue(valorProximoAporte) : 'R$ 1.200,00'}</p>
          <div className="mt-2">
            {heroPersona === 'dividas' ? (
              <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-1 rounded border border-blue-200">Ir para Minhas Dívidas</span>
            ) : userMeta ? (
              metasAtivas.length === 0 ? <span className="inline-block bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-1 rounded border border-amber-200">Definir meta</span> : (
                <span className={`inline-block text-[9px] font-bold px-2 py-1 rounded ${diasRestantes !== null && diasRestantes <= 0 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : diasRestantes !== null && diasRestantes <= 5 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                  {diasRestantes !== null ? (diasRestantes <= 0 ? 'Hoje!' : `Faltam ${diasRestantes} dias`) : 'Em breve'}
                </span>
              )
            ) : <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-1 rounded border border-blue-200">Faça login</span>}
          </div>
        </div>

        {heroPersona === 'dividas' ? (
          <div className="col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-200 border-dashed">
            <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Próximo passo</p>
            <p className="text-sm font-semibold text-slate-700">Depois do cadastro inicial, continue organizando sua rotina financeira para que o Nexus acompanhe mudanças, revise prioridades e sinalize próximos passos com mais contexto.</p>
          </div>
        ) : (
          <>
            <div onClick={() => isAuthenticated ? onNavigate('passivos') : onStartNow()} className="bg-white backdrop-blur-md rounded-xl p-4 border border-slate-200 cursor-pointer shadow-sm">
              <p className="text-[9px] text-slate-300 font-bold uppercase mb-1">Passivo</p>
              <p className="text-base font-bold text-slate-900 truncate">{isAuthenticated && patrimonioPassivo != null ? formatValue(patrimonioPassivo) : 'R$ 350.000,00'}</p>
            </div>
            <div className="bg-slate-50 backdrop-blur-md rounded-xl p-4 border border-slate-300 border-dashed">
              <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Total</p>
              <p className="text-sm font-bold text-slate-700 truncate">{isAuthenticated && patrimonioAtivo != null && patrimonioPassivo != null ? formatValue(patrimonioTotal) : 'R$ 492.500,00'}</p>
            </div>
          </>
        )}
      </div>
    </section>
  );
};