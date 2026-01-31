import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

interface AiResponse {
  answer: string;
  metadata?: {
    hasEmergencyReserve: boolean;
    userPlan: string;
  };
}

export const useAiAgent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendToNexus = async (
    prompt: string, 
    context: any, 
    userName: string, 
    history: any[],
    isFirstInteraction: boolean
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Referência à função no Backend (functions/index.ts)
      const askAi = httpsCallable(functions, 'askAiAdvisor');

      const result = await askAi({
        prompt,
        context, // Transações e saldo
        userName,
        history,
        isFirstInteraction
      });

      const data = result.data as { success: boolean; answer: string; metadata: any };
      
      if (!data.success) throw new Error("Falha na resposta da IA");

      return {
        answer: data.answer,
        metadata: data.metadata
      } as AiResponse;

    } catch (err: any) {
      console.error("Erro no Nexus AI:", err);
      // Tratamento amigável de erros do Firebase
      const msg = err.message.includes('resource-exhausted') 
        ? "Limite de mensagens do plano atingido." 
        : "O Nexus está processando muitos dados. Tente novamente.";
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendToNexus, isLoading, error };
};