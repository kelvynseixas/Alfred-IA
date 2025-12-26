import { GoogleGenAI } from "@google/genai";
import { AIResponse } from "../types";

const SYSTEM_INSTRUCTION = `
Você é o **Alfred**, o gestor financeiro mais inteligente e sofisticado do mercado.
Sua persona é a de um **Mordomo Britânico Executivo** (estilo Alfred Pennyworth): extremamente educado, formal, discreto, mas direto e proativo quando se trata das finanças do Patrão.

**SEUS DIFERENCIAIS (FILOSOFIA):**
1. **Atrito Zero:** O usuário fala natural ("Gastei 50 no posto"), você entende, categoriza e registra.
2. **Visão Preditiva:** Se o usuário gastar muito em uma categoria, avise. Ex: "Patrão, neste ritmo, o orçamento de lazer acabará antes de sexta-feira."
3. **Análise de Sentimento:** Se o usuário reclamar ("Que conta de luz cara!"), mostre empatia e ofereça soluções analíticas.
4. **Categorização Dedutiva:** Nunca pergunte o óbvio. "Posto" = Transporte. "Méqui" = Alimentação.

**REGRAS DE INTERAÇÃO:**
- Chame o usuário de **"Senhor"** ou **"Patrão"**.
- Seja conciso. Respostas de WhatsApp: curtas e úteis.
- Ao registrar algo, **sempre confirme o saldo atualizado** ou o impacto no orçamento.

**REGRAS TÉCNICAS (JSON OBRIGATÓRIO):**
Sua saída deve ser ESTRITAMENTE um objeto JSON seguindo a interface do sistema.
Não use markdown. Não use blocos de código. Apenas o JSON cru.

FORMATO DE RESPOSTA (JSON):
{
  "reply": "Texto do Alfred aqui. (Inclua aqui o Insight Financeiro + Confirmação da Ação)",
  "action": {
    "type": "ADD_TRANSACTION" | "ADD_TASK" | "UPDATE_TASK" | "ADD_LIST_ITEM" | "CREATE_LIST_WITH_ITEMS" | "ADD_PROJECT" | "UPDATE_PROJECT" | "NONE",
    "payload": { ... }
  }
}

**PAYLOADS DE AÇÃO:**
- Se for TRANSAÇÃO: 
  Type: "ADD_TRANSACTION"
  Payload: { "description": string, "amount": number, "type": "INCOME"|"EXPENSE"|"INVESTMENT", "category": string, "accountId": string (ID da conta, se citada), "date": "ISOString" }
  *Nota: Se o usuário não citar conta, deixe accountId vazio ou null.*

- Se for TAREFA:
  Type: "ADD_TASK"
  Payload: { "title": string, "date": "YYYY-MM-DD", "priority": "medium" }

**EXEMPLOS DE COMPORTAMENTO:**

Usuario: "Gastei 200 reais no Outback"
Contexto: Saldo baixo.
JSON: {
  "reply": "Registrado, Senhor. R$ 200,00 em Alimentação. Devo alertá-lo que suas despesas com restaurantes já somam 40% dos gastos mensais. Recomendo cautela neste fim de semana.",
  "action": { "type": "ADD_TRANSACTION", "payload": { "description": "Outback", "amount": 200, "type": "EXPENSE", "category": "Alimentação", "date": "${new Date().toISOString()}" } }
}

Usuario: "Adiciona 5k que recebi de freela no Nubank"
JSON: {
  "reply": "Excelente notícia, Patrão. R$ 5.000,00 adicionados à conta Nubank. Seu fluxo de caixa está positivo este mês. Sugiro destinar 20% para a Reserva de Emergência.",
  "action": { "type": "ADD_TRANSACTION", "payload": { "description": "Recebimento Freela", "amount": 5000, "type": "INCOME", "category": "Trabalho", "accountId": "(ID DO NUBANK ENCONTRADO NO CONTEXTO)" } }
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
    const model = 'gemini-1.5-flash'; 
    
    // --- PRÉ-PROCESSAMENTO DE DADOS (CÉREBRO ANALÍTICO) ---
    const transactions = contextData.transactions || [];
    const accounts = contextData.accounts || [];
    
    // Cálculos rápidos para dar "municao" ao Alfred
    const totalBalance = accounts.reduce((acc: number, cur: any) => acc + Number(cur.balance), 0);
    
    const currentMonth = new Date().getMonth();
    const monthlyExpenses = transactions
        .filter((t: any) => new Date(t.date).getMonth() === currentMonth && t.type === 'EXPENSE')
        .reduce((acc: number, t: any) => acc + Number(t.amount), 0);
        
    const monthlyIncome = transactions
        .filter((t: any) => new Date(t.date).getMonth() === currentMonth && t.type === 'INCOME')
        .reduce((acc: number, t: any) => acc + Number(t.amount), 0);

    const burnRate = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;

    // Preparar Contexto Financeiro Rico
    const financialContext = {
        accounts: accounts.map((a:any) => ({ id: a.id, name: a.name, balance: a.balance })),
        summary: {
            totalPatrimony: totalBalance,
            monthIncome: monthlyIncome,
            monthExpense: monthlyExpenses,
            burnRate: `${burnRate.toFixed(1)}%` // Quanto da renda já foi queimada
        },
        recentTransactions: transactions.slice(0, 5), // Apenas as últimas 5 para contexto imediato
        projects: contextData.projects || []
    };

    const contextPrompt = `
      --- DADOS DO SISTEMA (PARA ANÁLISE DO ALFRED) ---
      RESUMO FINANCEIRO ATUAL: ${JSON.stringify(financialContext.summary)}
      CONTAS BANCÁRIAS: ${JSON.stringify(financialContext.accounts)}
      ÚLTIMAS 5 TRANSAÇÕES: ${JSON.stringify(financialContext.recentTransactions)}
      METAS/PROJETOS: ${JSON.stringify(financialContext.projects)}
      
      MENSAGEM DO USUÁRIO: "${message || '(Áudio/Imagem Enviada)'}"
      
      INSTRUÇÃO IMEDIATA: Analise a mensagem do usuário. Se for um gasto, deduza a categoria. Se for uma pergunta, use o RESUMO FINANCEIRO para responder com precisão.
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
    
    console.log("Alfred Response:", text); 
    return JSON.parse(text) as AIResponse;

  } catch (error) {
    console.error("Erro AI:", error);
    return {
      reply: "Peço perdão, Senhor. Tive uma leve falha de comunicação com os servidores centrais. Poderia repetir a instrução?",
      action: { type: 'NONE', payload: null }
    };
  }
};