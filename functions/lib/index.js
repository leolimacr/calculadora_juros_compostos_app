"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarketData = exports.askAiAdvisor = void 0;
const https_1 = require("firebase-functions/v2/https");
const https_2 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const groq_sdk_1 = require("groq-sdk");
// Importar a função de dados de mercado
const marketData_1 = require("./marketData");
Object.defineProperty(exports, "getMarketData", { enumerable: true, get: function () { return marketData_1.getMarketData; } });
// Configuração das chaves de API (seguras)
const groqApiKey = (0, params_1.defineSecret)("GROQ_API_KEY");
// FUNÇÃO PRINCIPAL DO CONSULTOR IA
exports.askAiAdvisor = (0, https_1.onCall)({
    secrets: [groqApiKey],
    memory: "256MiB",
    timeoutSeconds: 60,
    region: "us-central1",
}, async (request) => {
    const apiKey = groqApiKey.value();
    if (!apiKey) {
        throw new https_2.HttpsError("failed-precondition", "Configuração incompleta.");
    }
    const { prompt, context: financeData, userName, history, isFirstInteraction } = request.data;
    if (!prompt)
        throw new https_2.HttpsError("invalid-argument", "Campo 'prompt' obrigatório.");
    const groq = new groq_sdk_1.Groq({ apiKey });
    try {
        // ✅ SOLUÇÃO DEFINITIVA: TEMPLATE PRÉ-DEFINIDO
        if (isFirstInteraction) {
            // TEMPLATE PRÉ-DEFINIDO PARA PRIMEIRA RESPOSTA
            const presentationTemplate = `Olá, ${userName || "Investidor"}! Me chamo Nexus, seu Consultor Finanças Pro Invest! É um prazer conversar com você. `;
            // Chama a API para obter apenas o conteúdo SUBSTANTIVO
            const systemPrompt = `VOCÊ É NEXUS, CONSULTOR IA DO FINANÇAS PRO INVEST.

# TAREFA:
Responda APENAS com o conteúdo SUBSTANTIVO da resposta, SEM SAUDAÇÕES INICIAIS.

# CONTEXTO:
- Esta é a PRIMEIRA interação
- A saudação inicial já está pré-definida: "${presentationTemplate}"
- Você deve fornecer APENAS a continuação da resposta

# EXEMPLOS:

USUÁRIO: "Olá, pode me ajudar?"
✅ SUA RESPOSTA: "Claro que posso te ajudar! No que posso auxiliar especificamente: planejamento financeiro, investimentos, orçamento ou outra área?"

USUÁRIO: "Oi, preciso de ajuda com investimentos"
✅ SUA RESPOSTA: "Posso ajudar sim! Para direcionar melhor: qual seu objetivo principal - crescimento, renda ou proteção do capital?"

USUÁRIO: "Bom dia"
✅ SUA RESPOSTA: "Bom dia! Como posso ajudá-lo com suas finanças hoje?"

# PROIBIDO:
- NUNCA comece com "Olá", "Oi", "Bom dia"
- NUNCA inclua "Me chamo Nexus" ou qualquer apresentação
- NUNCA pergunte "Como está seu dia?"`;
            const messages = [
                { role: "system", content: systemPrompt },
            ];
            if (history && Array.isArray(history)) {
                const recentHistory = history.slice(-8);
                recentHistory.forEach((msg) => {
                    const role = msg.role === "ai" ? "assistant" : msg.role;
                    const content = msg.text || msg.content || "";
                    if (role === "user" || role === "assistant") {
                        messages.push({ role, content });
                    }
                });
            }
            messages.push({ role: "user", content: prompt });
            const chatCompletion = await groq.chat.completions.create({
                messages: messages,
                model: "llama-3.3-70b-versatile",
                temperature: 0.1,
                max_tokens: 500,
                top_p: 0.9,
                frequency_penalty: 1.0,
                presence_penalty: 1.0,
            });
            let substantiveAnswer = chatCompletion.choices[0]?.message?.content || "Como posso ajudá-lo com suas finanças hoje?";
            // Limpa possíveis desvios
            const forbiddenStarts = ["Olá,", "Oi,", "Olá ", "Oi ", "Bom dia,"];
            forbiddenStarts.forEach(start => {
                if (substantiveAnswer.startsWith(start)) {
                    const firstPunctuation = substantiveAnswer.match(/[.!?]/);
                    if (firstPunctuation && firstPunctuation.index) {
                        substantiveAnswer = substantiveAnswer.substring(firstPunctuation.index + 1).trim();
                    }
                    else {
                        const words = substantiveAnswer.split(' ');
                        substantiveAnswer = words.slice(2).join(' ').trim();
                    }
                }
            });
            // Remove perguntas pessoais
            const personalQuestions = ["Como está seu dia hoje?", "Como vai você?", "Tudo bem?"];
            personalQuestions.forEach(question => {
                substantiveAnswer = substantiveAnswer.replace(question, "").trim();
            });
            // Combina template com resposta substantiva
            const finalAnswer = presentationTemplate + substantiveAnswer;
            return { success: true, answer: finalAnswer };
        }
        else {
            // RESPOSTAS SEGUINTES: Diretas, sem saudações
            const systemPrompt = `VOCÊ É NEXUS, CONSULTOR IA DO FINANÇAS PRO INVEST.

# CONTEXTO:
- O usuário ${userName || "Investidor"} JÁ CONHECE você
- Esta NÃO é a primeira interação

# REGRA ABSOLUTA:
NUNCA inicie respostas com:
- "Olá", "Oi", "Olá [nome]", "Oi [nome]"
- "Como posso ajudar", "Em que posso auxiliar"
- Qualquer saudação ou preâmbulo social

# SEU COMPORTAMENTO:
1. Responda DIRETAMENTE à pergunta atual
2. Comece IMEDIATAMENTE com conteúdo substantivo
3. Use "${userName || "Investidor"}" apenas no meio das frases

${financeData ? financeData : "Sem dados específicos."}`;
            const messages = [
                { role: "system", content: systemPrompt },
            ];
            if (history && Array.isArray(history)) {
                const recentHistory = history.slice(-8);
                recentHistory.forEach((msg) => {
                    const role = msg.role === "ai" ? "assistant" : msg.role;
                    const content = msg.text || msg.content || "";
                    if (role === "user" || role === "assistant") {
                        messages.push({ role, content });
                    }
                });
            }
            messages.push({ role: "user", content: prompt });
            const chatCompletion = await groq.chat.completions.create({
                messages: messages,
                model: "llama-3.3-70b-versatile",
                temperature: 0.2,
                max_tokens: 600,
                top_p: 0.9,
                frequency_penalty: 0.8,
                presence_penalty: 0.8,
            });
            let answer = chatCompletion.choices[0]?.message?.content || "Sem resposta.";
            // Pós-processamento para respostas seguintes
            const forbiddenStarts = [
                "Olá,", "Olá ", "Oi,", "Oi ",
                "Como posso", "Em que posso", "Vamos lá",
                "Então,", "Bom,", "Certo,", "É um prazer"
            ];
            for (const start of forbiddenStarts) {
                if (answer.startsWith(start)) {
                    const match = answer.match(/[.!?]/);
                    if (match && match.index) {
                        answer = answer.substring(match.index + 1).trim();
                    }
                    else {
                        const words = answer.split(' ');
                        answer = words.slice(2).join(' ').trim();
                    }
                    break;
                }
            }
            return { success: true, answer };
        }
    }
    catch (error) {
        console.error("Erro na API Groq:", error);
        // Fallback para primeira interação em caso de erro
        if (isFirstInteraction) {
            const fallbackAnswer = `Olá, ${userName || "Investidor"}! Me chamo Nexus, seu Consultor Finanças Pro Invest! É um prazer conversar com você sobre investimentos. Desculpe pelo problema técnico, estou pronto para ajudá-lo. Como posso auxiliá-lo com suas finanças hoje?`;
            return { success: true, answer: fallbackAnswer };
        }
        throw new https_2.HttpsError("internal", "Falha ao consultar IA.", { originalError: error.message });
    }
});
//# sourceMappingURL=index.js.map