import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToAlfred } from '../services/geminiService';
import { Mic, Send, Paperclip, Loader2, User as UserIcon, X, Image as ImageIcon, Square } from 'lucide-react';
import { ALFRED_ICON_URL } from '../App';

interface AlfredChatProps {
  appContext: any;
  onAIAction: (action: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'alfred';
  text: string;
  timestamp: Date;
  imageUrl?: string;
  audioUrl?: string; // Caminho do arquivo ou Base64 para preview local
}

export const AlfredChat: React.FC<AlfredChatProps> = ({ appContext, onAIAction, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'alfred',
      text: "Olá, Senhor. Sou o Alfred. Como estão as suas finanças hoje? Posso registrar despesas, analisar seu fluxo de caixa ou agendar compromissos. Basta dizer.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar histórico
  useEffect(() => {
    if (isOpen) {
        fetchChatHistory();
    }
  }, [isOpen]);

  const fetchChatHistory = async () => {
      try {
          const res = await fetch('/api/chat', {
             headers: { 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }
          });
          if (res.ok) {
              const history = await res.json();
              if (history && history.length > 0) {
                  // Mapeia histórico do banco para o estado
                  const mappedHistory = history.map((msg: any) => ({
                      id: msg.id.toString(),
                      sender: msg.sender,
                      text: msg.text,
                      imageUrl: msg.imageUrl || undefined,
                      audioUrl: msg.audioUrl || undefined,
                      timestamp: new Date(msg.timestamp)
                  }));
                  setMessages(mappedHistory);
              }
          }
      } catch (e) {
          console.error("Falha ao carregar histórico", e);
      }
  };

  // Salva no banco e retorna URLs reais dos arquivos salvos
  const saveMessageToDb = async (msg: Partial<Message>, audioBase64?: string, imageBase64?: string) => {
      try {
          const res = await fetch('/api/chat', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` 
              },
              body: JSON.stringify({
                  sender: msg.sender,
                  text: msg.text,
                  imageUrl: imageBase64 || msg.imageUrl,
                  audioUrl: audioBase64 || msg.audioUrl
              })
          });
          if (res.ok) {
              return await res.json();
          }
      } catch (e) { console.error(e); }
      return null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (audioBlob?: Blob) => {
    if (!input.trim() && !selectedImage && !audioBlob) return;

    setLoading(true);

    let audioBase64 = '';
    let audioPreviewUrl = '';

    if (audioBlob) {
        audioPreviewUrl = URL.createObjectURL(audioBlob);
        audioBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(audioBlob);
        });
    }

    const tempId = Date.now().toString();
    const userMsg: Message = {
      id: tempId,
      sender: 'user',
      text: input,
      imageUrl: selectedImage || undefined,
      audioUrl: audioPreviewUrl || undefined, 
      timestamp: new Date()
    };

    // UI Optimistic Update
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const imageToSend = selectedImage;
    setSelectedImage(null); 

    try {
      // 1. SALVAR NO SERVIDOR PRIMEIRO
      const savedData = await saveMessageToDb(userMsg, audioBase64, imageToSend || undefined);
      
      // Atualiza msg com URLs reais do servidor se disponível
      if (savedData) {
          setMessages(prev => prev.map(m => m.id === tempId ? {
              ...m, 
              imageUrl: savedData.imageUrl || m.imageUrl,
              audioUrl: savedData.audioUrl || m.audioUrl
          } : m));
      }

      // 2. ENVIAR PARA ALFRED (IA)
      // Nota: Enviamos o base64 para o Gemini pois ele precisa do dado inline, 
      // mas o sistema já garantiu a persistência no passo 1.
      const response = await sendMessageToAlfred(
          userMsg.text, 
          appContext, 
          imageToSend || undefined,
          audioBase64 || undefined
      );
      
      const alfredMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'alfred',
        text: response.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, alfredMsg]);
      
      // Salva resposta do Alfred no banco
      await saveMessageToDb(alfredMsg);

      if (response.action && response.action.type !== 'NONE') {
        onAIAction(response.action);
      }

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        sender: 'alfred',
        text: "Peço perdão, Senhor. Estou com dificuldades momentâneas de conexão com meus serviços cognitivos.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setSelectedImage(event.target.result as string);
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
              }
          };

          mediaRecorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              handleSend(audioBlob);
              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
      } catch (err) {
          alert("Não foi possível acessar o microfone.");
          console.error(err);
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/95 backdrop-blur">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-gold-600/50 shadow-lg shadow-gold-900/20 overflow-hidden">
                <img src={ALFRED_ICON_URL} alt="Alfred" className="w-full h-full object-cover" />
            </div>
            <div>
                <h3 className="font-serif text-white font-medium">Alfred</h3>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online
                </p>
            </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">Fechar</button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed flex flex-col gap-2
                ${msg.sender === 'user' 
                    ? 'bg-slate-700 text-white rounded-br-none' 
                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none shadow-lg'}`}
            >
              {msg.imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-white/10 mb-1">
                      <img src={msg.imageUrl} alt="Anexo" className="w-full h-auto max-h-48 object-cover" />
                  </div>
              )}
              {msg.audioUrl && (
                  <div className="mb-1">
                      <audio controls src={msg.audioUrl} className="w-full h-8" />
                  </div>
              )}
              {msg.text && <p>{msg.text}</p>}
            </div>
          </div>
        ))}
        {loading && (
             <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-gold-500 animate-spin" />
                    <span className="text-xs text-slate-400">Alfred está analisando...</span>
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        {selectedImage && (
            <div className="mb-2 p-2 bg-slate-800 rounded-lg flex items-center justify-between border border-slate-700">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded overflow-hidden">
                        <img src={selectedImage} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs text-slate-300">Imagem anexada</span>
                </div>
                <button onClick={() => setSelectedImage(null)} className="p-1 hover:bg-slate-700 rounded-full"><X size={14} className="text-slate-400" /></button>
            </div>
        )}

        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-full border border-slate-700">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept="image/*"
            />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white transition-colors" title="Anexar Imagem">
                <Paperclip className="w-5 h-5" />
            </button>
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isRecording ? "Ouvindo..." : "Diga, Patrão..."}
                disabled={isRecording}
                className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-500 disabled:opacity-50"
            />
            {input.trim() || selectedImage ? (
                <button 
                    onClick={() => handleSend()}
                    className="p-2 bg-gold-600 hover:bg-gold-500 text-white rounded-full transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            ) : (
                <button 
                    onClick={isRecording ? stopRecording : startRecording} 
                    className={`p-2 transition-all rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse scale-110 shadow-lg shadow-red-500/50' : 'text-slate-400 hover:text-white'}`}
                    title={isRecording ? "Parar Gravação" : "Gravar Áudio"}
                >
                    {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
                </button>
            )}
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-2">
            Alfred IA v2.0 - Consultoria Financeira & Gestão
        </p>
      </div>
    </div>
  );
};