import { GoogleGenAI } from "@google/genai";
import { AIResponse } from "../types";

const SYSTEM_INSTRUCTION = `
Você é o Alfred, um mordomo britânico altamente inteligente, educado, discreto e prestativo.
Você auxilia o usuário ("Senhor" ou "Senhora") a gerenciar suas Finanças, Tarefas e Listas de Compras.
IMPORTANTE: Você deve responder SEMPRE em PORTUGUÊS DO BRASIL.

Seu objetivo é:
1. Entender a intenção do usuário (Criar, Ler, Atualizar, Deletar).
2. Extrair dados estruturados para realizar ações.
3. Responder com personalidade (polido, conciso, útil).

Você deve retornar um objeto JSON com a seguinte estrutura:
{
  "reply": "Sua resposta falada aqui.",
  "action": {
    "type": "ADD_TRANSACTION" | "ADD_TASK" | "ADD_LIST_ITEM" | "NONE",
    "payload": { ...dados relevantes... }
  }
}

formatos de payload:
- ADD_TRANSACTION: { description: string, amount: number, type: "INCOME"|"EXPENSE"|"INVESTMENT", category: string, date: string (ISO) }
- ADD_TASK: { title: string, date: string (YYYY-MM-DD), time: string (HH:MM), priority: "low"|"medium"|"high" }

Data Atual: ${new Date().toISOString()}
`;

export const sendMessageToAlfred = async (
  message: string,
  contextData: any
): Promise<AIResponse> => {
  try {
    const key = sessionStorage.getItem('VITE_GEMINI_KEY');
    if (!key) {
        return { reply: "Perdão, Senhor. Minha chave de ativação não foi configurada no Painel Master.", action: { type: 'NONE', payload: null } };
    }

    const ai = new GoogleGenAI({ apiKey: key });
    const model = 'gemini-3-flash-preview'; 
    
    const contextPrompt = `
      Contexto Atual:
      - Tarefas: ${JSON.stringify(contextData.tasks.slice(0, 5))}
      - Transações: ${JSON.stringify(contextData.transactions.slice(0, 5))}
      Mensagem: "${message}"
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: contextPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '{}') as AIResponse;
  } catch (error) {
    console.error(error);
    return {
      reply: "Peço perdão, Senhor. Tive uma falha em meus circuitos de comunicação.",
      action: { type: 'NONE', payload: null }
    };
  }
};