import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

// 🔴 MANTENHA SUA CHAVE DA GROQ AQUI 🔴
const GROQ_API_KEY = "CHAVE_PROTEGIDA_PELO_DESENVOLVEDOR";

export const getAiAdvice = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login necessário.');
  }

  const prompt = data.prompt;
  const financeData = data.context;
  const userName = data.userName || "Investidor";
  const chatHistory = data.history || []; // Recebe o histórico da conversa atual

  // Prepara o histórico para a IA entender o contexto
  const formattedHistory = chatHistory.map((msg: any) => 
    `${msg.role === 'user' ? 'Usuário' : 'Consultor'}: ${msg.text}`
  ).join('\n');

  const systemPrompt = `
    Você é o "Consultor Finanças Pro Invest".
    
    REGRA DE NOME:
    Sempre chame o usuário por: "${userName}".

    REGRA DE TOM E EMOJIS:
    1. Seja profissional, mas próximo e acolhedor.
    2. Use emojis com parcimônia para destacar pontos importantes ou sentimentos (apenas 1 ou 2 por parágrafo). Não use em todas as frases.
    3. Fale português do Brasil.
    
    CONTEXTO FINANCEIRO:
    ${financeData}

    HISTÓRICO DA CONVERSA:
    ${formattedHistory}
  `;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 800
      })
    });

    if (!response.ok) throw new Error("Erro Groq");

    const json: any = await response.json();
    const answer = json.choices[0]?.message?.content || "Sem resposta.";

    return { answer: answer };

  } catch (error: any) {
    console.error("ERRO CRÍTICO:", error);
    return { 
      answer: `${userName}, tive um breve soluço na conexão. Pode repetir?` 
    };
  }
});