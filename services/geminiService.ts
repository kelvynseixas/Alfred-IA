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

Se o usuário pedir para ALTERAR ou ATUALIZAR uma tarefa existente (ex: "mudar prioridade", "mudar data"), você deve:
1. Procurar no "Contexto Atual" qual tarefa se assemelha ao pedido.
2. Usar a ação "UPDATE_TASK" e incluir o "id" da tarefa encontrada no payload.

Você deve retornar APENAS um objeto JSON com a seguinte estrutura, sem markdown:
{
  "reply": "Sua resposta falada aqui.",
  "action": {
    "type": "ADD_TRANSACTION" | "ADD_TASK" | "UPDATE_TASK" | "ADD_LIST_ITEM" | "NONE",
    "payload": { ...dados relevantes... }
  }
}

formatos de payload:
- ADD_TRANSACTION: { description: string, amount: number, type: "INCOME"|"EXPENSE"|"INVESTMENT", category: string, date: string (ISO), recurrencePeriod?: "MONTHLY"|"WEEKLY"|"NONE" }
- ADD_TASK: { title: string, date: string (YYYY-MM-DD), time: string (HH:MM), priority: "low"|"medium"|"high" }
- UPDATE_TASK: { id: string, updates: { priority?: "high", date?: string, time?: string, title?: string } }

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
    
    // Preparar contexto leve
    const tasksContext = contextData.tasks.map((t:any) => ({ id: t.id, title: t.title, date: t.date, time: t.time })).slice(0, 10);
    
    const contextPrompt = `
      Contexto Atual de Tarefas (Use os IDs daqui para updates):
      ${JSON.stringify(tasksContext)}
      
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

    let text = response.text || '{}';
    // Remove markdown code blocks (```json ... ```) case insensitive
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    return JSON.parse(text) as AIResponse;
  } catch (error) {
    console.error(error);
    return {
      reply: "Peço perdão, Senhor. Tive uma falha em meus circuitos de comunicação.",
      action: { type: 'NONE', payload: null }
    };
  }
};