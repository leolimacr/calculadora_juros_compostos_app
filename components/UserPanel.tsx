
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MarketWidget, NewsWidget } from './Widgets';
import { sendConfirmationEmail } from '../utils/email';
import { MarketQuote } from '../types';
import ContentModal from './ContentModal';

interface UserPanelProps {
  onNavigate: (tool: string) => void;
  onAssetClick?: (asset: MarketQuote) => void;
}

const UserPanel: React.FC<UserPanelProps> = ({ onNavigate, onAssetClick }) => {
  const { user, verifyEmail, resendVerificationEmail } = useAuth();
  const userName = user?.name || user?.email.split('@')[0] || 'Investidor';
  
  const [verificationState, setVerificationState] = useState<'idle' | 'input_code' | 'verified'>('idle');
  const [code, setCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStartVerification = async () => {
    // 1. Gera código e envia
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setCode(newCode);
    
    // Envia o e-mail (Simulado via Alert para o usuário ver)
    await sendConfirmationEmail(user!.email, 'register', newCode);
    
    // Abre modal para inserir
    setIsModalOpen(true);
    setVerificationState('input_code');
  };

  const handleConfirmCode = async () => {
    if (inputCode === code) {
        // Usa o método do AuthContext para marcar como verificado
        // Precisamos de um token. O resendVerificationEmail gera um token e salva no localStorage.
        // Vamos chamar ele para garantir que o token existe no banco local, e então validar com ele.
        const token = await resendVerificationEmail(); 
        if (token) {
            await verifyEmail(token as string);
            setVerificationState('verified');
            setTimeout(() => setIsModalOpen(false), 2000);
        }
    } else {
        alert('Código incorreto!');
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
      {!user?.emailVerified && verificationState !== 'verified' && (
        <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                    <p className="text-amber-200 font-bold text-sm">Verifique seu e-mail ({user?.email})</p>
                    <p className="text-amber-200/70 text-xs">Algumas funções avançadas de backup dependem disso.</p>
                </div>
            </div>
            <button 
                onClick={handleStartVerification}
                className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
                Verificar Agora
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

            <MarketWidget onAssetClick={onAssetClick} /> 
            <NewsWidget />
         </aside>

      </div>

      {/* Modal de Validação de Código */}
      <ContentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Validar E-mail">
         {verificationState === 'verified' ? (
             <div className="text-center py-8">
                 <div className="text-5xl mb-4">✅</div>
                 <h3 className="text-xl font-bold text-white">E-mail Confirmado!</h3>
                 <p className="text-slate-400 mt-2">Sua conta está segura.</p>
             </div>
         ) : (
             <div className="space-y-4 text-center">
                 <p className="text-slate-300">Digite o código de 6 dígitos enviado para <strong>{user?.email}</strong> (Verifique o Alerta do navegador ou Console)</p>
                 <input 
                    type="text"
                    value={inputCode}
                    onChange={e => setInputCode(e.target.value.replace(/\D/g, '').substring(0,6))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-center text-2xl tracking-widest text-white outline-none focus:border-emerald-500"
                    placeholder="000000"
                 />
                 <button onClick={handleConfirmCode} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500">
                    Confirmar Código
                 </button>
             </div>
         )}
      </ContentModal>
    </div>
  );
};

export default UserPanel;
