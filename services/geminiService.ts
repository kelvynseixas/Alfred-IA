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
    "type": "ADD_TRANSACTION" | "ADD_TASK" | "UPDATE_TASK" | "ADD_LIST_ITEM" | "CREATE_LIST_WITH_ITEMS" | "ADD_PROJECT" | "UPDATE_PROJECT" | "NONE",
    "payload": { ... }
  }
}

FORMATOS DE PAYLOAD:
- ADD_TRANSACTION: { "description": string, "amount": number, "type": "INCOME" | "EXPENSE" | "INVESTMENT", "category": string, "date": string, "recurrencePeriod": "MONTHLY" | "NONE", "recurrenceLimit": number }
- ADD_PROJECT: { "title": string, "targetAmount": number, "category": "GOAL" | "RESERVE", "deadline": string }
- UPDATE_PROJECT: { "id": string, "amountToAdd": number } (Use quando o usuário quiser adicionar saldo a um projeto existente)
- ADD_TASK: { "title": string, "date": string, "time": string, "priority": "low" | "medium" | "high" }
- ADD_LIST_ITEM: { "listId": string (OBRIGATÓRIO - use o ID da lista do contexto), "name": string }
- CREATE_LIST_WITH_ITEMS: { "listName": string, "items": string[] } (Use quando o usuário listar vários itens e não houver lista adequada no contexto)

CASOS DE USO:
Usuário: "Gastei 50 no ifood"
JSON: { "reply": "Registrado.", "action": { "type": "ADD_TRANSACTION", "payload": { "description": "iFood", "amount": 50, "type": "EXPENSE", "category": "Alimentação", "date": "${new Date().toISOString()}", "recurrencePeriod": "NONE" } } }

Usuário: "Quero juntar 20 mil para um carro" (Se NÃO existir projeto Carro)
JSON: { "reply": "Criei o projeto Carro.", "action": { "type": "ADD_PROJECT", "payload": { "title": "Carro", "targetAmount": 20000, "category": "GOAL" } } }

Usuário: "Guardei 500 reais pro carro" (Se JÁ existir projeto Carro com ID "123")
JSON: { "reply": "Atualizei o saldo do projeto Carro.", "action": { "type": "UPDATE_PROJECT", "payload": { "id": "123", "amountToAdd": 500 } } }

Usuário: "Preciso comprar cimento, areia e brita pra obra" (Contexto: SEM lista 'Obras' ou 'Materiais')
JSON: { "reply": "Criei a lista 'Obras' com os itens solicitados.", "action": { "type": "CREATE_LIST_WITH_ITEMS", "payload": { "listName": "Obras", "items": ["Cimento", "Areia", "Brita"] } } }
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
    const model = 'gemini-2.5-flash-latest'; // Modelo com melhor suporte multimodal (Áudio/Imagem)
    
    // Contexto simplificado
    const tasksSimple = contextData.tasks.map((t:any) => ({ id: t.id, title: t.title, date: t.date })).slice(0, 5);
    const listsSimple = contextData.lists ? contextData.lists.map((l:any) => ({ id: l.id, name: l.name })) : [];
    const projectsSimple = contextData.projects ? contextData.projects.map((p:any) => ({ id: p.id, title: p.title, currentAmount: p.currentAmount, targetAmount: p.targetAmount })) : [];
    
    const contextPrompt = `
      CONTEXTO DO USUÁRIO:
      - Projetos/Metas Atuais: ${JSON.stringify(projectsSimple)}
      - Tarefas Recentes: ${JSON.stringify(tasksSimple)}
      - Listas Disponíveis: ${JSON.stringify(listsSimple)}
      
      MENSAGEM/ÁUDIO DO USUÁRIO: "${message || '(Áudio Enviado)'}"
    `;

    // Montar conteúdo (Texto + Imagem/Áudio Opcional)
    const contents: any[] = [{ text: contextPrompt }];
    
    if (imageBase64) {
        // Remove header do base64 se existir
        const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
        contents.push({
            inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64
            }
        });
    }

    if (audioBase64) {
        // Remove header do base64 se existir
        const cleanAudio = audioBase64.split(',')[1] || audioBase64;
        contents.push({
            inlineData: {
                // Gemini aceita mp3, wav, aac, etc. O MediaRecorder geralmente gera webm ou mp4.
                // 'audio/webm' é seguro para chrome/firefox recorders.
                mimeType: "audio/webm", 
                data: cleanAudio
            }
        });
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: contents, // Passa array de partes
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      }
    });

    rawTextFromAI = response.text || '{}';
    // Limpeza extra de segurança
    let text = rawTextFromAI.replace(/```json/gi, '').replace(/```/g, '').trim();
    if (text.startsWith('json')) text = text.substring(4);
    
    console.log("Resposta da IA (após limpeza):", text);
    return JSON.parse(text) as AIResponse;

  } catch (error) {
    console.error("Erro AI:", error);
    console.error("Texto bruto da IA que causou o erro:", rawTextFromAI); 
    return {
      reply: "Peço perdão, Senhor. Tive uma falha em meus circuitos de dedução. Poderia repetir de forma mais clara?",
      action: { type: 'NONE', payload: null }
    };
  }
};