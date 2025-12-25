import { GoogleGenAI } from "@google/genai";
import { AIResponse } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
- ADD_LIST_ITEM: { listName: string, itemName: string, category: string }

Se o usuário quiser apenas conversar, defina o tipo de ação como "NONE" e payload como null.
Data Atual: ${new Date().toISOString()}
`;

export const sendMessageToAlfred = async (
  message: string,
  contextData: any // Current state of the app to give context
): Promise<AIResponse> => {
  try {
    const model = 'gemini-3-flash-preview'; 
    
    // We inject the current app state so Alfred knows what's going on (simulating DB lookups)
    const contextPrompt = `
      Contexto Atual do App:
      - Tarefas Recentes: ${JSON.stringify(contextData.tasks.slice(0, 3))}
      - Transações Recentes: ${JSON.stringify(contextData.transactions.slice(0, 3))}
      - Listas: ${JSON.stringify(contextData.lists.map((l: any) => l.name))}
      
      Mensagem do Usuário: "${message}"
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: contextPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Alfred");
    }

    const parsedResponse = JSON.parse(responseText) as AIResponse;
    return parsedResponse;

  } catch (error) {
    console.error("Alfred encountered an error:", error);
    return {
      reply: "Peço perdão, Senhor. Parece que estou com dificuldades em conectar aos meus serviços cognitivos no momento.",
      action: { type: 'NONE', payload: null }
    };
  }
};