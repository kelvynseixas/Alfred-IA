import { GoogleGenAI } from "@google/genai";
import { AIResponse } from "../types";

const SYSTEM_INSTRUCTION = `
Você é o Alfred, um mordomo digital de elite e Consultor Financeiro Sênior.
Sua função é gerenciar a vida financeira, tarefas e analisar tendências de gastos do usuário.

DATA E HORA ATUAL: ${new Date().toLocaleString('pt-BR')}

REGRAS:
1. Responda SEMPRE em JSON puro.
2. Valores monetários devem ser numbers.
3. Se o usuário pedir "Análise Financeira", "Como estão minhas contas" ou "Dica de economia", analise o "financialContext" fornecido e dê uma resposta em "reply" com insights valiosos.
4. Para ações (criar tarefa, transação), use o campo "action".

FORMATO JSON:
{
  "reply": "Sua resposta aqui. Se for análise financeira, seja detalhista mas elegante.",
  "action": {
    "type": "ADD_TRANSACTION" | "ADD_TASK" | "UPDATE_TASK" | "ADD_LIST_ITEM" | "CREATE_LIST_WITH_ITEMS" | "ADD_PROJECT" | "UPDATE_PROJECT" | "NONE",
    "payload": { ... }
  }
}
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
    // Usando 1.5-flash para máxima estabilidade e compatibilidade com chaves antigas e novas
    const model = 'gemini-1.5-flash'; 
    
    // Preparar Contexto Financeiro Rico
    const financialContext = {
        accounts: contextData.accounts || [],
        recentTransactions: contextData.transactions?.slice(0, 10) || [],
        projects: contextData.projects || []
    };

    const contextPrompt = `
      CONTEXTO FINANCEIRO E TAREFAS:
      - Contas/Saldos: ${JSON.stringify(financialContext.accounts)}
      - Últimas Transações: ${JSON.stringify(financialContext.recentTransactions)}
      - Projetos/Metas: ${JSON.stringify(financialContext.projects)}
      - Tarefas Pendentes: ${JSON.stringify(contextData.tasks?.slice(0,5))}
      
      MENSAGEM DO USUÁRIO: "${message || '(Áudio Enviado)'}"
      
      Se o usuário perguntar sobre saldo, use os dados de 'Contas'.
      Se perguntar onde gastou mais, analise 'Últimas Transações'.
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
    
    return JSON.parse(text) as AIResponse;

  } catch (error) {
    console.error("Erro AI:", error);
    return {
      reply: "Peço perdão, Senhor. Tive uma instabilidade momentânea. Poderia repetir?",
      action: { type: 'NONE', payload: null }
    };
  }
};