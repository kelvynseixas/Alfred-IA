import { GoogleGenAI } from "@google/genai";
import { AIResponse } from "../types";

const SYSTEM_INSTRUCTION = `
Você é o Alfred, um mordomo digital de elite e Consultor Financeiro Sênior.
Sua função é gerenciar a vida financeira, tarefas e analisar tendências de gastos do usuário.

DATA E HORA ATUAL: ${new Date().toLocaleString('pt-BR')}

REGRAS:
1. Responda SEMPRE em JSON puro.
2. Valores monetários devem ser numbers.
3. Se o usuário pedir "Adicionar X de saldo na conta Y" ou similar:
   - Procure o NOME da conta no contexto fornecido (campo accounts).
   - Se encontrar, use o ID dessa conta no campo "accountId" do payload.
   - Gere uma ação do tipo "ADD_TRANSACTION" com type "INCOME" (ou "INVESTMENT" se o contexto sugerir).
4. Se o usuário pedir "Análise Financeira", analise o "financialContext".

FORMATO JSON:
{
  "reply": "Sua resposta aqui.",
  "action": {
    "type": "ADD_TRANSACTION" | "ADD_TASK" | "UPDATE_TASK" | "ADD_LIST_ITEM" | "CREATE_LIST_WITH_ITEMS" | "ADD_PROJECT" | "UPDATE_PROJECT" | "NONE",
    "payload": { ... }
  }
}

PAYLOAD ADD_TRANSACTION:
{ "description": string, "amount": number, "type": "INCOME"|"EXPENSE"|"INVESTMENT", "category": string, "accountId": string (ID da conta encontrada) }
`;

export const sendMessageToAlfred = async (
  message: string,
  contextData: any,
  imageBase64?: string,
  audioBase64?: string
): Promise<AIResponse> => {
  let rawTextFromAI = '';
  try {
    const key = sessionStorage.getItem('VITE_GEMINI_KEY');
    if (!key) {
        return { reply: "Perdão, Senhor. Minha chave de ativação não foi configurada no Painel Master.", action: { type: 'NONE', payload: null } };
    }

    const ai = new GoogleGenAI({ apiKey: key });
    const model = 'gemini-1.5-flash'; 
    
    // Preparar Contexto Financeiro Rico
    const financialContext = {
        accounts: contextData.accounts || [],
        recentTransactions: contextData.transactions?.slice(0, 10) || [],
        projects: contextData.projects || []
    };

    const contextPrompt = `
      CONTEXTO DE DADOS:
      - CONTAS DISPONÍVEIS (IDs e Nomes): ${JSON.stringify(financialContext.accounts.map((a:any) => ({ id: a.id, name: a.name })))}
      - Últimas Transações: ${JSON.stringify(financialContext.recentTransactions)}
      
      MENSAGEM DO USUÁRIO: "${message || '(Áudio Enviado)'}"
      
      IMPORTANTE: Se o usuário pedir para adicionar saldo em uma conta específica (ex: "Nubank", "PagBank"), use o ID correspondente da lista de contas acima.
    `;

    const contents: any[] = [{ text: contextPrompt }];
    
    if (imageBase64) {
        const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
        contents.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } });
    }

    if (audioBase64) {
        const cleanAudio = audioBase64.includes('base64,') ? audioBase64.split('base64,')[1] : audioBase64;
        contents.push({ inlineData: { mimeType: "audio/webm", data: cleanAudio } });
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      }
    });

    rawTextFromAI = response.text || '{}';
    let text = rawTextFromAI.replace(/```json/gi, '').replace(/```/g, '').trim();
    if (text.startsWith('json')) text = text.substring(4);
    
    console.log("AI Response:", text); // Debug
    return JSON.parse(text) as AIResponse;

  } catch (error) {
    console.error("Erro AI:", error);
    return {
      reply: "Peço perdão, Senhor. Tive uma instabilidade momentânea. Poderia repetir com mais detalhes?",
      action: { type: 'NONE', payload: null }
    };
  }
};