
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Transaction, CalculationResult, Goal } from '../types';
import { formatCurrency } from '../utils/calculations';

interface AiAdvisorProps {
  transactions: Transaction[];
  currentCalcResult: CalculationResult | null;
  goals: Goal[];
  currentTool: string;
}

const AiAdvisor: React.FC<AiAdvisorProps> = ({ transactions, currentCalcResult, goals, currentTool }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Olá! Sou sua IA Financeira conectada em tempo real. Posso buscar dados atualizados (Selic, Inflação, Dólar) e analisar seus investimentos. Como posso ajudar?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateContext = () => {
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    const income = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);
    const expenses = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expenses;
    
    // Calculate raw savings rate
    const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;
    const transactionCount = transactions.length;

    // Data quality assessment
    let dataQualityNote = "";
    if (transactionCount < 5) {
      dataQualityNote = "ALERTA CRÍTICO: O usuário tem POUQUÍSSIMOS dados (menos de 5 lançamentos). A 'Taxa de Poupança' calculada é provavelmente irreal pois faltam despesas cadastradas. NÃO elogie cegamente essa taxa. Sugira cadastrar mais gastos do dia a dia.";
    } else {
      dataQualityNote = "Nota: Os valores são totais acumulados. Verifique se a proporção Receita/Despesa faz sentido para o período.";
    }
    
    let context = `DADOS FINANCEIROS REGISTRADOS (Contexto Real):
    - Total de Entradas (Histórico): ${formatCurrency(income)}
    - Total de Saídas (Histórico): ${formatCurrency(expenses)}
    - Saldo em Caixa: ${formatCurrency(balance)}
    - Taxa de Poupança (Cálculo Bruto): ${savingsRate}%
    - Contagem de Transações: ${transactionCount} (Entradas: ${incomeTransactions.length}, Saídas: ${expenseTransactions.length})
    - Ferramenta Visualizada Agora: ${currentTool}
    
    ${dataQualityNote}
    `;

    if (goals.length > 0) {
      context += `- Metas Ativas: ${goals.map(g => `${g.name} (Progresso: ${formatCurrency(g.currentAmount)} de ${formatCurrency(g.targetAmount)})`).join(', ')}\n`;
    }

    if (currentCalcResult && currentTool === 'compound') {
      context += `- Simulação Juros Compostos (Tela Atual): Aporte Mensal ${formatCurrency(currentCalcResult.history[1]?.totalInvested - currentCalcResult.history[0]?.totalInvested || 0)} -> Total Final ${formatCurrency(currentCalcResult.summary.totalFinal)}.\n`;
    }

    return context;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (!process.env.API_KEY) {
         throw new Error("API Key não configurada.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Usando Flash para respostas rápidas com Search Grounding
      const model = 'gemini-2.5-flash'; 
      
      const systemInstruction = `Você é um Consultor Financeiro Sênior do app Finanças Pro.
      Objetivo: Ajudar o usuário a enriquecer com conselhos diretos, matemáticos e realistas.
      
      ${generateContext()}
      
      DIRETRIZES DE RACIOCÍNIO (Siga rigorosamente):
      1. Ceticismo com Dados: Se a Taxa de Poupança for muito alta (>50%) e houver poucas transações, NÃO assuma que o usuário é rico. Assuma que ele ESQUECEU de lançar despesas. Alerte sobre isso gentilmente.
      2. Dados Externos: Se perguntarem cotações ou indicadores (Selic, IPCA, Dólar), USE a ferramenta googleSearch.
      3. Estilo: Seja conciso, profissional e use Markdown (negrito para destaque).
      4. Contexto: Responda baseado nos números fornecidos acima.
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: [
            ...messages.filter(m => !m.isError).map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            })),
            { role: 'user', parts: [{ text: input }] }
        ],
        config: {
            systemInstruction: systemInstruction,
            maxOutputTokens: 600,
            tools: [{ googleSearch: {} }], // Ativa Grounding
        }
      });

      const text = response.text || "Não consegui gerar uma resposta.";
      
      // Extração de Fontes (Grounding)
      let sources: { uri: string; title: string }[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      if (chunks) {
        sources = chunks
          .filter((c: any) => c.web?.uri && c.web?.title)
          .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));
        
        // Remove duplicatas
        sources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);
      }
      
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text, sources };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: '⚠️ Erro de conexão com a IA. Verifique sua chave de API ou conexão.', 
        isError: true 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[500px] lg:h-[calc(100vh-120px)] bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden sticky top-24">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-700 flex items-center gap-3">
        <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/50">
                IA
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse"></span>
        </div>
        <div>
          <h4 className="font-bold text-white text-sm">Consultor Virtual</h4>
          <div className="flex items-center gap-1">
             <span className="text-[10px] text-emerald-400 font-medium bg-emerald-900/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
               Google Search Ativo
             </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-slate-800">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div 
              className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-br-none' 
                  : msg.isError 
                    ? 'bg-red-900/50 border border-red-500/30 text-red-200'
                    : 'bg-slate-700 text-slate-200 rounded-bl-none border border-slate-600'
              }`}
            >
              {msg.text}
            </div>
            
            {/* Grounding Sources */}
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 max-w-[85%] flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1">
                {msg.sources.map((src, idx) => (
                  <a 
                    key={idx} 
                    href={src.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-400 hover:text-emerald-400 hover:border-emerald-500 transition-colors truncate max-w-[200px]"
                    title={src.title}
                  >
                    <span className="truncate">{src.title}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start">
             <div className="bg-slate-700 p-3 rounded-2xl rounded-bl-none border border-slate-600 flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-slate-900 border-t border-slate-700">
        <div className="relative">
            <input 
                type="text" 
                placeholder="Ex: Qual a inflação acumulada?" 
                className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:border-emerald-500 outline-none transition-all"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
            />
            <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-emerald-500 hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            </button>
        </div>
      </div>
    </div>
  );
};

export default AiAdvisor;
