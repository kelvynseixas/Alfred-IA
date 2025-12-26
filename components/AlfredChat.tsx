import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToAlfred } from '../services/geminiService';
import { Mic, Send, Paperclip, Loader2, User as UserIcon, X, Image as ImageIcon } from 'lucide-react';
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
}

export const AlfredChat: React.FC<AlfredChatProps> = ({ appContext, onAIAction, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'alfred',
      text: "Olá. Sou o Alfred, seu gestor pessoal do ecossistema. Como posso ser útil hoje? Você pode pedir para adicionar tarefas, registrar despesas ou atualizar suas listas.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      imageUrl: selectedImage || undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const imageToSend = selectedImage;
    setSelectedImage(null); // Clear image immediately after sending UI update
    setLoading(true);

    try {
      const response = await sendMessageToAlfred(userMsg.text, appContext, imageToSend || undefined);
      
      const alfredMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'alfred',
        text: response.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, alfredMsg]);

      if (response.action && response.action.type !== 'NONE') {
        onAIAction(response.action);
      }

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'alfred',
        text: "Peço perdão, estou com dificuldades de conexão no momento.",
        timestamp: new Date()
      }]);
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

  const startListening = () => {
      if (!('webkitSpeechRecognition' in window)) {
          alert('Seu navegador não suporta reconhecimento de voz.');
          return;
      }
      
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognition.start();
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
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
             <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-gold-500 animate-spin" />
                    <span className="text-xs text-slate-400">Alfred está pensando...</span>
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - WhatsApp Style */}
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
                placeholder="Mensagem para Alfred..."
                className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-500"
            />
            {input.trim() || selectedImage ? (
                <button 
                    onClick={handleSend}
                    className="p-2 bg-gold-600 hover:bg-gold-500 text-white rounded-full transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            ) : (
                <button onClick={startListening} className={`p-2 transition-colors rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-white'}`}>
                    <Mic className="w-5 h-5" />
                </button>
            )}
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-2">
            Respostas geradas por IA. Alfred pode cometer equívocos.
        </p>
      </div>
    </div>
  );
};