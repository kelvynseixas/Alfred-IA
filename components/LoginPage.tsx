import React, { useState } from 'react';
import { SubscriptionType } from '../types';
import { Mail, Lock, User, Phone, ArrowRight, Bot, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, pass: string) => void;
  onRegister: (name: string, email: string, phone: string, sub: SubscriptionType) => void;
  isDarkMode: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister, isDarkMode }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subType, setSubType] = useState<SubscriptionType>(SubscriptionType.MONTHLY);

  const cardBg = isDarkMode ? 'bg-slate-900/80' : 'bg-white';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const inputBg = isDarkMode ? 'bg-slate-800' : 'bg-slate-50';

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
      <div className={`w-full max-w-md p-8 rounded-2xl border shadow-2xl ${cardBg} ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gold-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-gold-900/20">
                <Bot className="w-10 h-10 text-slate-900" />
            </div>
            <h1 className={`text-3xl font-serif font-bold ${textPrimary}`}>Alfred IA</h1>
            <p className="text-slate-500 mt-2">{isRegistering ? 'Crie sua conta e comece o teste de 15 dias' : 'Seu mordomo digital lhe aguarda'}</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            if (isRegistering) onRegister(name, email, phone, subType);
            else onLogin(email, password);
        }}>
          {isRegistering && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input type="text" placeholder="Nome Completo" required value={name} onChange={e => setName(e.target.value)} className={`w-full p-3 pl-10 rounded-lg border focus:outline-none focus:border-gold-500 ${inputBg} ${isDarkMode ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`} />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input type="tel" placeholder="WhatsApp" required value={phone} onChange={e => setPhone(e.target.value)} className={`w-full p-3 pl-10 rounded-lg border focus:outline-none focus:border-gold-500 ${inputBg} ${isDarkMode ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`} />
              </div>
              <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Selecione o Plano</label>
                  <div className="grid grid-cols-1 gap-2">
                      <button type="button" onClick={() => setSubType(SubscriptionType.MONTHLY)} className={`p-3 rounded-lg border text-left flex justify-between items-center ${subType === SubscriptionType.MONTHLY ? 'border-gold-500 bg-gold-500/10' : 'border-slate-700'}`}>
                          <span className={textPrimary}>Mensal</span>
                          <span className="text-gold-500 font-bold">R$ 39,90</span>
                      </button>
                      <button type="button" onClick={() => setSubType(SubscriptionType.SEMIANNUAL)} className={`p-3 rounded-lg border text-left flex justify-between items-center ${subType === SubscriptionType.SEMIANNUAL ? 'border-gold-500 bg-gold-500/10' : 'border-slate-700'}`}>
                          <span className={textPrimary}>Semestral</span>
                          <span className="text-gold-500 font-bold">R$ 199,50</span>
                      </button>
                      <button type="button" onClick={() => setSubType(SubscriptionType.ANNUAL)} className={`p-3 rounded-lg border text-left flex justify-between items-center ${subType === SubscriptionType.ANNUAL ? 'border-gold-500 bg-gold-500/10' : 'border-slate-700'}`}>
                          <span className={textPrimary}>Anual</span>
                          <span className="text-gold-500 font-bold">R$ 399,00</span>
                      </button>
                  </div>
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <input type="email" placeholder="E-mail" required value={email} onChange={e => setEmail(e.target.value)} className={`w-full p-3 pl-10 rounded-lg border focus:outline-none focus:border-gold-500 ${inputBg} ${isDarkMode ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`} />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <input type="password" placeholder="Senha" required value={password} onChange={e => setPassword(e.target.value)} className={`w-full p-3 pl-10 rounded-lg border focus:outline-none focus:border-gold-500 ${inputBg} ${isDarkMode ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`} />
          </div>

          <button type="submit" className="w-full bg-gold-600 hover:bg-gold-500 text-slate-900 font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
            {isRegistering ? 'Iniciar Teste Grátis' : 'Entrar na Propriedade'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-slate-400 hover:text-gold-500 text-sm font-medium">
                {isRegistering ? 'Já possui conta? Faça Login' : 'Não possui conta? Registre-se agora'}
            </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-600">
            <ShieldCheck size={12} />
            <span>Encriptação de nível bancário 256-bit</span>
        </div>
      </div>
    </div>
  );
};