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
4. Sua única e exclusiva saída DEVE SER um objeto JSON válido.

NÃO FAÇA ISSO (ERROS COMUNS):
- NÃO use \`\`\`json.
- NÃO adicione comentários (// ou /* */).
- NÃO use vírgulas extras no final de objetos ou arrays.
- NÃO retorne texto puro ou explicações fora do JSON.

OBJETIVO JSON DE RESPOSTA:
{
  "reply": "Texto curto, elegante e confirmação da ação",
  "action": {
    "type": "ADD_TRANSACTION" | "ADD_TASK" | "UPDATE_TASK" | "ADD_LIST_ITEM" | "ADD_PROJECT" | "NONE",
    "payload": { ... }
  }
}

FORMATOS DE PAYLOAD:
- ADD_TRANSACTION: { "description": string, "amount": number, "type": "INCOME" | "EXPENSE" | "INVESTMENT", "category": string, "date": string, "recurrencePeriod": "MONTHLY" | "NONE", "recurrenceLimit": number }
- ADD_PROJECT: { "title": string, "targetAmount": number, "category": "GOAL" | "RESERVE", "deadline": string }
- ADD_TASK: { "title": string, "date": string, "time": string, "priority": "low" | "medium" | "high" }
- ADD_LIST_ITEM: { "listId": string (OBRIGATÓRIO - use o ID da lista do contexto), "name": string }

CASOS DE USO:
Usuário: "Gastei 50 no ifood"
JSON: { "reply": "Registrado.", "action": { "type": "ADD_TRANSACTION", "payload": { "description": "iFood", "amount": 50, "type": "EXPENSE", "category": "Alimentação", "date": "${new Date().toISOString()}", "recurrencePeriod": "NONE" } } }

Usuário: "Quero juntar 20 mil para um carro"
JSON: { "reply": "Criei o projeto Carro.", "action": { "type": "ADD_PROJECT", "payload": { "title": "Carro", "targetAmount": 20000, "category": "GOAL" } } }

Usuário: "adicione leite na lista de compras"
(Contexto: [{ "id": "1", "name": "Compras" }])
JSON: { "reply": "Leite adicionado à sua lista de compras.", "action": { "type": "ADD_LIST_ITEM", "payload": { "listId": "1", "name": "Leite" } } }
`;

export const sendMessageToAlfred = async (
  message: string,
  contextData: any
): Promise<AIResponse> => {
  let rawTextFromAI = '';
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

    rawTextFromAI = response.text || '{}';
    // Limpeza extra de segurança
    let text = rawTextFromAI.replace(/```json/gi, '').replace(/```/g, '').trim();
    if (text.startsWith('json')) text = text.substring(4);
    
    console.log("Resposta da IA (após limpeza):", text); // Log para depuração
    return JSON.parse(text) as AIResponse;

  } catch (error) {
    console.error("Erro AI:", error);
    console.error("Texto bruto da IA que causou o erro:", rawTextFromAI); // Log do texto problemático
    return {
      reply: "Peço perdão, Senhor. Tive uma falha em meus circuitos de dedução. Poderia repetir de forma mais clara?",
      action: { type: 'NONE', payload: null }
    };
  }
};