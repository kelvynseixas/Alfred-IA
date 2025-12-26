
import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToAlfred } from '../services/geminiService';
import { Mic, Send, Paperclip, Loader2, X, Square } from 'lucide-react';
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
  audioUrl?: string; 
}

export const AlfredChat: React.FC<AlfredChatProps> = ({ appContext, onAIAction, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'alfred',
      text: "Olá, Senhor. Sou o Alfred. Como posso ser útil em sua jornada financeira hoje? Posso registrar uma despesa, analisar uma meta ou agendar seus compromissos.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (audioBlob?: Blob) => {
    if (!input.trim() && !selectedImage && !audioBlob) return;

    setLoading(true);
    let audioBase64: string | undefined;

    if (audioBlob) {
        audioBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(audioBlob);
        });
    }
    
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      imageUrl: selectedImage || undefined,
      audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const currentImage = selectedImage;
    setInput('');
    setSelectedImage(null);

    try {
      const response = await sendMessageToAlfred(
          currentInput, 
          appContext,
          currentImage || undefined,
          audioBase64
      );
      
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
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'alfred',
        text: "Senhor, sinto informar que houve um erro inesperado na minha central de comunicações. Poderia tentar novamente?",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) audioChunksRef.current.push(event.data);
          };

          mediaRecorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              handleSend(audioBlob);
              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
      } catch (err) {
          alert("Acesso ao microfone negado ou não suportado.");
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
    <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col animate-slide-in-right">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/95 backdrop-blur">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-gold-600/50 shadow-lg overflow-hidden">
                <img src={ALFRED_ICON_URL} alt="Alfred" className="w-full h-full object-cover" />
            </div>
            <div>
                <h3 className="font-serif text-white font-medium">Alfred Personal</h3>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest animate-pulse">Servidor Ativo</p>
            </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20 custom-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg ${msg.sender === 'user' ? 'bg-slate-700 text-white rounded-br-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'}`}>
              {msg.text}
              {msg.audioUrl && <audio src={msg.audioUrl} controls className="mt-2 h-8 w-full" />}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                 <Loader2 className="w-4 h-4 text-gold-500 animate-spin" />
                 <span className="text-xs text-slate-400">Processando sua instrução, Senhor...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-full border border-slate-700 group focus-within:border-gold-500/50 transition-all">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white"><Paperclip size={18} /></button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
              if (e.target.files?.[0]) {
                const reader = new FileReader();
                reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
                reader.readAsDataURL(e.target.files[0]);
              }
            }} />
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isRecording ? "Alfred está ouvindo..." : "Instruções ao mordomo..."}
                className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-500"
                disabled={isRecording}
            />
            {input.trim() || selectedImage ? (
                <button onClick={() => handleSend()} className="p-2 bg-gold-600 text-slate-900 rounded-full hover:bg-gold-500 transition-all"><Send size={16}/></button>
            ) : (
                <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-white'}`}
                >
                    {isRecording ? <Square size={16} /> : <Mic size={18} />}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
