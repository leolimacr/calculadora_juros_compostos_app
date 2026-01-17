import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

admin.initializeApp();

// 🔑 AQUI VAI SUA CHAVE DO GOOGLE AI STUDIO (GEMINI)
const GEMINI_API_KEY = "AIzaSyCH9hS4Cm_kVDCEW19ARHcAKiLNjTz3UYE";

export const getAiAdvice = functions.https.onCall(async (data, context) => {
  // Segurança: Só usuários logados podem usar a IA
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Faça login primeiro.');
  }

  const { prompt, context: financeData } = data;
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // "Personalidade" do Consultor Financeiro
  const systemInstruction = `
    Você é o Consultor Financeiro do Ecossistema Finanças Pro Invest. 
    Sua missão é dar conselhos objetivos, motivadores e baseados nos dados do usuário.
    Dados Atuais: ${financeData}
    Sempre use um tom profissional e amigável. Nunca incentive apostas.
  `;

  try {
    const result = await model.generateContent([systemInstruction, prompt]);
    const response = await result.response;
    return { answer: response.text() };
  } catch (error) {
    console.error("Erro Gemini:", error);
    return { answer: "Estou com dificuldade de me conectar ao servidor de inteligência agora. Tente em alguns minutos." };
  }
});