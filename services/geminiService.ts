import { GoogleGenAI } from "@google/genai";
import { AIResponse } from "../types";

const SYSTEM_INSTRUCTION = `
Você é o Alfred, um mordomo digital de elite. Sua função é gerenciar a vida financeira e tarefas do usuário.
Você deve responder SEMPRE em JSON puro, sem blocos de código markdown.

DATA E HORA ATUAL: ${new Date().toLocaleString('pt-BR')}

REGRAS RÍGIDAS DE OUTPUT:
1. Valores monetários devem ser NÚMEROS PUROS. Não use strings como "20.000" ou "20k". Use 20000.
2. Datas devem ser YYYY-MM-DD.
3. Se o usuário falar "20 mil", entenda como 20000.
4. Jamais use blocos \`\`\`json. Apenas o objeto JSON cru.

OBJETIVO JSON DE RESPOSTA:
{
  "reply": "Texto curto, elegante e confirmação da ação",
  "action": {
    "type": "ADD_TRANSACTION" | "ADD_TASK" | "UPDATE_TASK" | "ADD_LIST_ITEM" | "ADD_PROJECT" | "NONE",
    "payload": { ... }
  }
}

FORMATOS DE PAYLOAD:
- ADD_TRANSACTION:
  { 
    "description": string, 
    "amount": number (Ex: 50.50), 
    "type": "INCOME" | "EXPENSE" | "INVESTMENT", 
    "category": string, 
    "date": string,
    "recurrencePeriod": "MONTHLY" | "WEEKLY" | "YEARLY" | "DAILY" | "NONE",
    "recurrenceInterval": number (Padrão 1),
    "recurrenceLimit": number (0 para infinito)
  }

- ADD_PROJECT:
  {
    "title": string,
    "description": string,
    "targetAmount": number (Ex: 20000),
    "category": "GOAL" | "RESERVE" | "ASSET",
    "deadline": string (YYYY-MM-DD)
  }

- ADD_TASK:
  { 
    "title": string, 
    "date": string, 
    "time": string (HH:MM ou null), 
    "priority": "low" | "medium" | "high",
    "recurrencePeriod": string
  }

CASO DE USO 1:
Usuário: "Gastei 50 reais no ifood"
JSON: { "reply": "Registrado.", "action": { "type": "ADD_TRANSACTION", "payload": { "description": "iFood", "amount": 50, "type": "EXPENSE", "category": "Alimentação", "date": "${new Date().toISOString()}", "recurrencePeriod": "NONE" } } }

CASO DE USO 2:
Usuário: "Quero juntar 20 mil para um carro em 2 anos"
JSON: { "reply": "Criei o projeto Carro.", "action": { "type": "ADD_PROJECT", "payload": { "title": "Carro", "targetAmount": 20000, "category": "GOAL", "deadline": "DATA_CALCULADA" } } }
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
    
    // Contexto simplificado
    const tasksSimple = contextData.tasks.map((t:any) => ({ id: t.id, title: t.title, date: t.date })).slice(0, 5);
    const listsSimple = contextData.lists ? contextData.lists.map((l:any) => ({ id: l.id, name: l.name })) : [];
    
    const contextPrompt = `
      CONTEXTO DO USUÁRIO:
      - Tarefas Recentes: ${JSON.stringify(tasksSimple)}
      - Listas Disponíveis: ${JSON.stringify(listsSimple)}
      
      MENSAGEM DO USUÁRIO: "${message}"
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: contextPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      }
    });

    let text = response.text || '{}';
    // Limpeza extra de segurança
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    if (text.startsWith('json')) text = text.substring(4);

    return JSON.parse(text) as AIResponse;
  } catch (error) {
    console.error("Erro AI:", error);
    return {
      reply: "Peço perdão, Senhor. Tive uma falha em meus circuitos de dedução. Poderia repetir de forma mais clara?",
      action: { type: 'NONE', payload: null }
    };
  }
};