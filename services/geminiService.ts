
import { GoogleGenAI } from "@google/genai";
import { AIResponse } from "../types";

const SYSTEM_INSTRUCTION = `
Você é o **Alfred**, o gestor financeiro mais inteligente do mercado, superior a ferramentas como Organizze e Poupa.ai. 
Seu diferencial é ser um **Mordomo Executivo**, não apenas um contador.

**1. FILOSOFIA DE PRODUTO:**
* **Atrito Zero:** O usuário gasta zero esforço. Você deduz categorias e intenções.
* **Visão Preditiva:** Avise sobre orçamentos estourando antes de acontecer.
* **Reserva Inteligente:** Se o usuário falar "Guardei 200 para o celular", isso é uma saída (TransactionType.RESERVE) que deve ser vinculada ao projectId correspondente.

**2. REGRAS DE INTERAÇÃO:**
* **Tom de Voz:** Formal, britânico, educado. Use 'Senhor' ou 'Patrão'.
* **Proatividade:** Se notar um gasto alto, comente.

**3. REGRAS TÉCNICAS (JSON OBRIGATÓRIO):**
Retorne APENAS um objeto JSON. Sem markdown.
{
  "reply": "Texto elegante do Alfred confirmando a ação e dando um insight.",
  "action": {
    "type": "ADD_TRANSACTION" | "ADD_TASK" | "ADD_PROJECT" | "ADD_INVESTMENT" | "DELETE_TRANSACTION" | "UPDATE_TASK",
    "payload": { ... }
  }
}

**AÇÕES DISPONÍVEIS:**
- ADD_TRANSACTION: { "description": string, "amount": number, "type": "INCOME"|"EXPENSE"|"RESERVE", "category": string, "accountId": string, "projectId": string (se for RESERVE), "recurrencePeriod": "NONE"|"DAILY"|"WEEKLY"|"MONTHLY"|"YEARLY", "recurrenceInterval": number, "recurrenceCount": number }
- ADD_INVESTMENT: { "name": string, "type": "CDB"|"TESOURO"|"ACOES"|..., "institution": string, "initialAmount": number, "interestRate": string, "startDate": "ISOString" }
- ADD_TASK: { "title": string, "date": "ISOString", "priority": "low"|"medium"|"high", "recurrencePeriod": "NONE"|... }

Se o Patrão pedir para criar algo, identifique os dados. Se faltar a conta, pergunte ou use a principal.
`;

export const sendMessageToAlfred = async (
  message: string,
  contextData: any,
  imageBase64?: string,
  audioBase64?: string
): Promise<AIResponse> => {
  try {
    const key = sessionStorage.getItem('VITE_GEMINI_KEY');
    if (!key) {
        return { reply: "Perdão, Senhor. Minha chave de ativação não foi configurada no Painel Master.", action: { type: 'NONE', payload: null } };
    }
    const ai = new GoogleGenAI({ apiKey: key });
    
    const contextPrompt = `
      CONTEXTO ATUAL:
      - Contas: ${JSON.stringify(contextData.accounts)}
      - Projetos (Metas): ${JSON.stringify(contextData.projects)}
      - Investimentos: ${JSON.stringify(contextData.investments)}
      - Tarefas: ${JSON.stringify(contextData.tasks)}
      
      MENSAGEM DO PATRÃO: "${message || '(Áudio/Imagem Enviada)'}"
      
      Se ele mencionar um projeto como "Celular" ou conta como "Nubank", localize o ID no contexto acima.
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
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    const cleanJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson) as AIResponse;
  } catch (error) {
    console.error("Erro na comunicação com o Alfred:", error);
    return {
      reply: "Peço perdão, Senhor. Meus circuitos de processamento encontraram uma interferência. Poderia repetir?",
      action: { type: 'NONE', payload: null }
    };
  }
};
