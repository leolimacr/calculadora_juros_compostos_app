import React from 'react';
import AiAdvisor from './AiAdvisor';
import { useAuth } from '../contexts/AuthContext';

// AGORA RECEBE A FUNÇÃO DE NAVEGAÇÃO COMO PROP
const AiChatPage: React.FC<{ onNavigate: (tool: string) => void }> = ({ onNavigate }) => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] to-slate-900">
      {/* Header */}
      <header className="bg-[#020617]/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => onNavigate('home')}
          >
            <img src="/icon.png" alt="Logo" className="w-8 h-8 rounded-lg" />
            <h1 className="text-lg font-black text-sky-400 tracking-tight">Consultor IA Finanças Pro</h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('home')}
              className="text-slate-400 hover:text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              ← Voltar ao Início
            </button>
            
            {!isAuthenticated && (
              <button 
                onClick={() => onNavigate('login')}
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Entrar para salvar histórico
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Consultor Financeiro IA
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Acesse seu histórico de conversas salvas na nuvem e continue de onde parou, 
            seja no celular ou no computador. {isAuthenticated ? `Logado como ${user?.email}` : 'Faça login para salvar suas conversas.'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <div className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full flex items-center gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              Histórico em Nuvem
            </div>
            <div className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full">
              Acesso Multiplataforma
            </div>
            <div className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full">
              Análise Personalizada
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <AiAdvisor 
            transactions={[]} 
            currentCalcResult={null} 
            goals={[]} 
            currentTool="chat_web"
          />
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="text-2xl mb-3">📱</div>
            <h3 className="text-white font-bold mb-2">Acesso Mobile</h3>
            <p className="text-slate-400 text-sm">
              Use o aplicativo Finanças Pro no celular para conversar com o Consultor IA em qualquer lugar.
            </p>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="text-2xl mb-3">💻</div>
            <h3 className="text-white font-bold mb-2">Versão Web</h3>
            <p className="text-slate-400 text-sm">
              Acesse pelo computador com mais espaço para análise e cópias de texto.
            </p>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="text-2xl mb-3">☁️</div>
            <h3 className="text-white font-bold mb-2">Sincronização</h3>
            <p className="text-slate-400 text-sm">
              Seu histórico de conversas é salvo na nuvem e sincronizado entre todos os dispositivos.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            Finanças Pro Invest • Consultor IA • {new Date().getFullYear()}
          </p>
          <p className="text-slate-600 text-xs mt-2">
            Esta ferramenta utiliza IA generativa. As respostas são sugestões e não substituem aconselhamento financeiro profissional.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AiChatPage;