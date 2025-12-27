
import React, { useState } from 'react';
import { SubscriptionType, Plan } from '../types';
import { Mail, Lock, User, Phone, ArrowRight, Bot, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (name: string, email: string, phone: string, sub: SubscriptionType) => void;
  plans: Plan[];
  isDarkMode: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister, plans, isDarkMode }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const cardBg = isDarkMode ? 'bg-slate-900/80' : 'bg-white';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const inputBg = isDarkMode ? 'bg-slate-800' : 'bg-slate-50';

  const activePlans = plans.filter(p => p.active);
  
  const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      const result = await onLogin(email, password);
      if (!result.success) {
          setError(result.error || 'Ocorreu um erro desconhecido.');
      }
      setIsLoading(false);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const plan = plans.find(p => p.id === selectedPlanId);
      if (!plan) return;

      if (plan.trialDays === 0) {
          setIsProcessingPayment(true);
          setTimeout(() => {
              setIsProcessingPayment(false);
              onRegister(name, email, phone, plan.type);
          }, 3000);
      } else {
          onRegister(name, email, phone, plan.type);
      }
  };

  if (isProcessingPayment) {
      return (
          <div className={`min-h-screen flex items-center justify-center p-6 transition-colors ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
             <div className={`w-full max-w-md p-8 rounded-2xl border shadow-2xl text-center ${cardBg} ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                 <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center mb-6 animate-pulse">
                     <CreditCard className="w-8 h-8 text-white" />
                 </div>
                 <h2 className={`text-2xl font-serif font-bold mb-2 ${textPrimary}`}>Processando Pagamento...</h2>
                 <p className="text-slate-500">Aguarde enquanto confirmamos sua assinatura junto ao Gateway.</p>
             </div>
          </div>
      );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
      <div className={`w-full max-w-md p-8 rounded-2xl border shadow-2xl ${cardBg} ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gold-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-gold-900/20">
                <Bot className="w-10 h-10 text-slate-900" />
            </div>
            <h1 className={`text-3xl font-serif font-bold ${textPrimary}`}>Alfred IA</h1>
            <p className="text-slate-500 mt-2">{isRegistering ? 'Crie sua conta para começar' : 'Seu mordomo digital lhe aguarda'}</p>
        </div>

        <form className="space-y-4" onSubmit={isRegistering ? handleRegisterSubmit : handleLoginSubmit}>
          {isRegistering && (
            <>
              <div className="relative"><User className="absolute left-3 top-3 w-5 h-5 text-slate-500" /><input type="text" placeholder="Nome Completo" required value={name} onChange={e => setName(e.target.value)} className={`w-full p-3 pl-10 rounded-lg border focus:outline-none focus:border-gold-500 ${inputBg} ${isDarkMode ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`} /></div>
              <div className="relative"><Phone className="absolute left-3 top-3 w-5 h-5 text-slate-500" /><input type="tel" placeholder="WhatsApp" required value={phone} onChange={e => setPhone(e.target.value)} className={`w-full p-3 pl-10 rounded-lg border focus:outline-none focus:border-gold-500 ${inputBg} ${isDarkMode ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`} /></div>
              <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Selecione o Plano</label>
                  <select required value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)} className={`w-full p-3 rounded-lg border focus:outline-none focus:border-gold-500 ${inputBg} ${isDarkMode ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`}>
                      <option value="" disabled>Escolha uma opção...</option>
                      {activePlans.map(plan => (<option key={plan.id} value={plan.id}>{plan.name} - R$ {plan.price.toFixed(2)} ({plan.type}) - {plan.trialDays > 0 ? `${plan.trialDays} dias grátis` : 'Sem teste grátis'}</option>))}
                  </select>
              </div>
            </>
          )}

          <div className="relative"><Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" /><input type="email" placeholder="E-mail" required value={email} onChange={e => setEmail(e.target.value)} className={`w-full p-3 pl-10 rounded-lg border focus:outline-none focus:border-gold-500 ${inputBg} ${isDarkMode ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`} /></div>
          <div className="relative"><Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" /><input type="password" placeholder="Senha" required value={password} onChange={e => setPassword(e.target.value)} className={`w-full p-3 pl-10 rounded-lg border focus:outline-none focus:border-gold-500 ${inputBg} ${isDarkMode ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`} /></div>
          
          {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}

          <button type="submit" disabled={isLoading} className="w-full bg-gold-600 hover:bg-gold-500 text-slate-900 font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin" /> : (isRegistering ? (selectedPlanId && plans.find(p => p.id === selectedPlanId)?.trialDays === 0 ? 'Pagar e Criar Conta' : 'Criar Conta') : 'Entrar na Propriedade')}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-slate-400 hover:text-gold-500 text-sm font-medium">
                {isRegistering ? 'Já possui conta? Faça Login' : 'Não possui conta? Registre-se agora'}
            </button>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-600"><ShieldCheck size={12} /><span>Encriptação de nível bancário 256-bit</span></div>
      </div>
    </div>
  );
};
