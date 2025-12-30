
import React from 'react';

const ChangelogPage: React.FC = () => {
  const changes = [
    {
      version: 'v1.2.0',
      date: '15 Dez 2025',
      title: 'Modo Freemium & Nuvem',
      items: [
        '✨ Lançamento do Plano Premium: Agora você pode ter lançamentos ilimitados.',
        '☁️ Integração Firebase: Sincronização segura de dados na nuvem para assinantes.',
        '🔒 Melhorias de segurança no login local.'
      ]
    },
    {
      version: 'v1.1.5',
      date: '01 Dez 2025',
      title: 'Poder de Compra',
      items: [
        '💸 Nova ferramenta de inflação: Calcule quanto seu dinheiro perdeu de valor desde 2010.',
        '📱 Melhorias na instalação do PWA (ícone e splash screen).',
        '🐛 Correção no cálculo de juros compostos mensal.'
      ]
    },
    {
      version: 'v1.1.0',
      date: '20 Nov 2025',
      title: 'Gamificação',
      items: [
        '🎮 Simulador de Resiliência: Um mini-game para testar suas decisões financeiras.',
        '📊 Novos gráficos no Dashboard principal.',
        '🤖 IA Advisor agora usa dados do mercado em tempo real.'
      ]
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 px-4 pb-24">
      <div className="border-b border-slate-800 pb-6 mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-white mb-2">Novidades & Atualizações</h1>
        <p className="text-slate-400">Acompanhe a evolução do Finanças Pro Invest.</p>
      </div>

      <div className="space-y-12">
        {changes.map((change, idx) => (
          <div key={idx} className="relative pl-8 md:pl-0">
            {/* Linha do tempo (Desktop) */}
            <div className="hidden md:block absolute left-[-9px] top-2 w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-900"></div>
            <div className="hidden md:block absolute left-[0px] top-6 bottom-[-48px] w-0.5 bg-slate-800 -z-10"></div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-12">
               <div className="md:w-32 flex-shrink-0 pt-1">
                  <span className="font-mono text-emerald-400 font-bold block">{change.version}</span>
                  <span className="text-xs text-slate-500">{change.date}</span>
               </div>
               
               <div className="flex-grow bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <h3 className="text-xl font-bold text-white mb-4">{change.title}</h3>
                  <ul className="space-y-3">
                    {change.items.map((item, i) => (
                      <li key={i} className="text-slate-300 text-sm leading-relaxed flex items-start gap-2">
                        <span className="text-slate-500 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
               </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-12 text-center">
         <p className="text-slate-600 text-xs">Versão Atual: 1.2.0-beta</p>
      </div>
    </div>
  );
};

export default ChangelogPage;
