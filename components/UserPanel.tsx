
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MarketWidget, NewsWidget } from './Widgets';
import { sendConfirmationEmail } from '../utils/email';
import { MarketQuote } from '../types';

interface UserPanelProps {
  onNavigate: (tool: string) => void;
  onAssetClick?: (asset: MarketQuote) => void; // Prop opcional para passar click se quiser, mas App.tsx controla via modal global
}

const UserPanel: React.FC<UserPanelProps> = ({ onNavigate }) => {
  const { user, resendVerificationEmail } = useAuth();
  const userName = user?.name || user?.email.split('@')[0] || 'Investidor';
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleResend = async () => {
    setResendStatus('sending');
    const token = await resendVerificationEmail();
    if (token) {
        await sendConfirmationEmail(user!.email, 'register', token as string);
        setResendStatus('sent');
        setTimeout(() => setResendStatus('idle'), 5000);
    } else {
        setResendStatus('idle');
    }
  };

  const tools = [
    { id: 'manager', name: 'Gerenciador Financeiro', desc: 'Controle receitas, despesas e metas.', icon: '💰', color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-500/30' },
    { id: 'compound', name: 'Juros Compostos', desc: 'Simule o crescimento do seu patrimônio.', icon: '📈', color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-500/30' },
    { id: 'fire', name: 'Calculadora FIRE', desc: 'Descubra sua independência financeira.', icon: '🔥', color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/30' },
    { id: 'debt', name: 'Otimizador de Dívidas', desc: 'Plano para sair do vermelho rápido.', icon: '🏔️', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-500/30' },
    { id: 'rent', name: 'Aluguel vs Financiamento', desc: 'Decida matematicamente sobre imóveis.', icon: '🏠', color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/30' },
    { id: 'roi', name: 'Calculadora ROI', desc: 'Retorno sobre investimento em projetos.', icon: '📊', color: 'text-teal-400', bg: 'bg-teal-900/20', border: 'border-teal-500/30' },
    { id: 'dividend', name: 'Simulador Dividendos', desc: 'Aposentadoria com renda passiva.', icon: '💎', color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-500/30' },
    { id: 'game', name: 'Simulador de Resiliência', desc: 'Teste suas decisões em um cenário de crise.', icon: '🎮', color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-500/30' },
  ];

  // Função interna para disparar evento de clique no ativo (gambiarra leve para evitar prop drilling complexo no UserPanel, 
  // mas o App.tsx controla 'selectedAsset' via MarketWidget que está dentro do UserPanel?
  // O App.tsx renderiza <UserPanel ... /> e <MarketTickerBar ... />. O Ticker está fora.
  // O Widget está dentro. Para o Widget funcionar, precisamos passar onAssetClick para UserPanel e depois para MarketWidget.
  // Mas como App.tsx renderiza o modal baseado em selectedAsset, precisamos de uma forma de setar selectedAsset no App.
  // Vou usar um EventBus simples ou passar a prop. Vamos passar a prop.
  // Mas UserPanelProps não tinha onAssetClick. Adicionei na interface acima.
  // Mas App.tsx não estava passando essa prop.
  // Solução: Vamos adicionar um EventListener customizado no App.tsx ou passar a prop. 
  // Passar a prop é o React Way.
  // Mas espera, o App.tsx renderiza: case 'panel': return <UserPanel onNavigate={navigateTo} />;
  // Preciso atualizar App.tsx para passar onAssetClick={handleAssetClick}.
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Saudação */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 shadow-xl relative overflow-hidden">
         <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-2">
               Bem-vindo de volta, <span className="text-emerald-400 capitalize">{userName}</span>!
            </h2>
            <p className="text-slate-400">Tudo pronto para dominar suas finanças hoje?</p>
         </div>
         <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"></div>
      </div>

      {/* Alerta de Verificação de E-mail */}
      {!user?.emailVerified && (
        <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                    <p className="text-amber-200 font-bold text-sm">Verifique seu e-mail ({user?.email})</p>
                    <p className="text-amber-200/70 text-xs">Algumas funções avançadas de backup dependem disso.</p>
                </div>
            </div>
            <button 
                onClick={handleResend}
                disabled={resendStatus !== 'idle'}
                className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
            >
                {resendStatus === 'sending' ? 'Enviando...' : resendStatus === 'sent' ? 'E-mail Enviado! ✅' : 'Reenviar E-mail'}
            </button>
        </div>
      )}

      {/* Main Grid Layout (Tools + Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_400px] gap-8 pb-24 lg:pb-0">
         
         {/* Main Column: Ferramentas */}
         <div className="space-y-8">
            <div>
               <h3 className="text-lg font-bold text-white mb-6 pl-2 border-l-4 border-emerald-500 uppercase tracking-widest text-sm">Suas Ferramentas</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {tools.map(tool => (
                     <div 
                        key={tool.id} 
                        onClick={() => onNavigate(tool.id)}
                        className={`bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-slate-500 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full shadow-lg hover:shadow-xl hover:-translate-y-1`}
                     >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${tool.bg} ${tool.color} border ${tool.border}`}>
                           {tool.icon}
                        </div>
                        <h4 className="font-bold text-white text-lg mb-2">{tool.name}</h4>
                        <p className="text-sm text-slate-400 mb-6 flex-grow">{tool.desc}</p>
                        <button className="text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 py-2 px-4 rounded-lg w-full transition-colors flex items-center justify-center gap-2 group-hover:bg-emerald-600">
                           Abrir Ferramenta <span>→</span>
                        </button>
                     </div>
                  ))}
               </div>
            </div>

            {/* Dica do Dia / CTA */}
            <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 flex flex-col md:flex-row items-center gap-6">
               <div className="bg-indigo-500/20 p-4 rounded-full text-3xl">💡</div>
               <div>
                  <h4 className="font-bold text-white mb-1">Dica do Dia</h4>
                  <p className="text-sm text-slate-300">
                     Já conferiu a <strong className="text-indigo-300">Inflação</strong> hoje? Use a ferramenta "Poder de Compra" para ver quanto seu dinheiro de 2010 vale agora.
                  </p>
               </div>
               <button 
                  onClick={() => onNavigate('inflation')}
                  className="md:ml-auto whitespace-nowrap text-sm font-bold text-indigo-400 hover:text-white transition-colors"
               >
                  Ver Agora
               </button>
            </div>
         </div>

         {/* Sidebar: Widgets (Market/News) - Visible on Mobile too (stacked) */}
         <aside className="space-y-6">
            
            {/* Contexto do Mercado */}
            <div className="space-y-2">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest pl-2 border-l-4 border-emerald-500">
                  Panorama rápido do mercado
               </h3>
               <p className="text-xs text-slate-400 leading-relaxed pl-2">
                  Clique em um ativo para ver o gráfico detalhado.
               </p>
            </div>

            {/* Injetando a função de clique global do App se disponível, senão fallback (apenas log ou null) */}
            <MarketWidget onAssetClick={(window as any).handleAssetClickGlobal} /> 
            <NewsWidget />
         </aside>

      </div>
    </div>
  );
};

export default UserPanel;
