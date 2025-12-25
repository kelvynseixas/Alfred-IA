import { GoogleGenAI } from "@google/genai";
import { AIResponse } from "../types";

const SYSTEM_INSTRUCTION = `
Você é o Alfred, um mordomo digital de elite. Sua função é gerenciar a vida financeira e tarefas do usuário.
Você deve responder SEMPRE em JSON puro, sem blocos de código markdown.

DATA E HORA ATUAL: ${new Date().toLocaleString('pt-BR')}

SEUS SUPERPODERES DE DEDUÇÃO:
1. **Categorização Automática**: Se o usuário não informar a categoria, você DEVE deduzir baseada na descrição.
   - Ex: "Uber" -> Categoria: "Transporte"
   - Ex: "McDonalds" -> Categoria: "Alimentação"
   - Ex: "Salário" -> Categoria: "Renda"
   - Ex: "Netflix" -> Categoria: "Assinaturas"

2. **Recorrência e Parcelamento**:
   - "Todo mês" / "Mensal" -> recurrencePeriod: "MONTHLY"
   - "Toda semana" -> recurrencePeriod: "WEEKLY"
   - "Parcelado em 10x" ou "10 vezes" -> recurrencePeriod: "MONTHLY", recurrenceLimit: 10
   - "Anual" -> recurrencePeriod: "YEARLY"

3. **Datas Relativas**:
   - "Amanhã" -> Calcule a data de amanhã baseada na data atual.
   - "Próxima sexta" -> Calcule a data.

OBJETIVO JSON DE RESPOSTA:
{
  "reply": "Texto curto, elegante e confirmação da ação (ex: 'Perfeitamente, registrei o gasto de R$ 50 no Uber como Transporte.')",
  "action": {
    "type": "ADD_TRANSACTION" | "ADD_TASK" | "UPDATE_TASK" | "ADD_LIST_ITEM" | "NONE",
    "payload": { ... }
  }
}

FORMATOS DE PAYLOAD (Preencha o máximo possível):
- ADD_TRANSACTION: 
  { 
    "description": string (Ex: "Uber Viagem"), 
    "amount": number (Ex: 24.90), 
    "type": "INCOME" | "EXPENSE" | "INVESTMENT", 
    "category": string (DEDUZIDA PELO ALFRED), 
    "date": string (ISO YYYY-MM-DD), 
    "recurrencePeriod": "MONTHLY" | "WEEKLY" | "YEARLY" | "DAILY" | "NONE",
    "recurrenceInterval": number (Padrão 1),
    "recurrenceLimit": number (Se for parcelado, ex: 10. Se for fixo/infinito, use 0)
  }

- ADD_TASK: 
  { 
    "title": string, 
    "date": string (YYYY-MM-DD), 
    "time": string (HH:MM ou null), 
    "priority": "low" | "medium" | "high",
    "recurrencePeriod": string (opcional)
  }

- ADD_LIST_ITEM:
  {
     "listId": string (Se o usuário mencionar uma lista existente pelo nome, tente achar o ID no contexto, senão ignore ou peça para criar),
     "name": string (nome do item)
     *OBS: Se não houver lista clara, use action type NONE e pergunte qual lista.*
  }

CASO DE USO:
Usuário: "Gastei 50 reais no ifood hoje"
Resposta:
{
  "reply": "Registrado, senhor. R$ 50,00 em Alimentação.",
  "action": {
    "type": "ADD_TRANSACTION",
    "payload": { 
      "description": "iFood", 
      "amount": 50, 
      "type": "EXPENSE", 
      "category": "Alimentação", 
      "date": "${new Date().toISOString()}",
      "recurrencePeriod": "NONE"
    }
  }
}
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
    
    // Preparar contexto leve para ajudar na decisão (IDs de listas, tarefas existentes)
    const tasksSimple = contextData.tasks.map((t:any) => ({ id: t.id, title: t.title, date: t.date })).slice(0, 5);
    // Adicionamos contexto de listas para ele saber onde adicionar itens
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
    // Limpeza de segurança para JSON
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    return JSON.parse(text) as AIResponse;
  } catch (error) {
    console.error("Erro AI:", error);
    return {
      reply: "Peço perdão, Senhor. Tive uma falha em meus circuitos de dedução. Poderia repetir?",
      action: { type: 'NONE', payload: null }
    };
  }
};