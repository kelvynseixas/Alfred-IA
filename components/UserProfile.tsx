import React, { useState } from 'react';
import { User, Plan, PaymentHistory, SubscriptionType } from '../types';
import { User as UserIcon, Lock, Eye, EyeOff, Camera, FileText, CreditCard, X, QrCode, Barcode, CheckCircle, Loader2 } from 'lucide-react';

interface UserProfileProps {
  user: User;
  plans?: Plan[];
  isDarkMode: boolean;
  onUpdateUser: (u: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, plans, isDarkMode, onUpdateUser }) => {
  const [showPass, setShowPass] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'SELECT' | 'PROCESSING' | 'SUCCESS'>('SELECT');
  const [selectedMethod, setSelectedMethod] = useState<'PIX' | 'CREDIT_CARD' | 'BOLETO' | null>(null);
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const url = URL.createObjectURL(e.target.files[0]);
        onUpdateUser({ ...user, avatarUrl: url });
    }
  };

  const getDaysRemaining = () => {
    if (!user.trialEndsAt) return 0;
    const end = new Date(user.trialEndsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24)); 
  };
  const daysRemaining = getDaysRemaining();
  
  // Resolve Plan Name
  const currentPlan = plans?.find(p => p.id === user.planId) || plans?.find(p => p.type === user.subscription);

  const cardClass = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const inputClass = isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';

  const handleProcessPayment = () => {
      if (!selectedMethod || !currentPlan) return;

      setPaymentStep('PROCESSING');

      setTimeout(() => {
          // Logic to extend subscription
          const now = new Date();
          const currentEnd = new Date(user.trialEndsAt || now);
          // If expired, start counting from NOW, otherwise extend current date
          const baseDate = currentEnd < now ? now : currentEnd;

          let daysToAdd = 30;
          if (user.subscription === SubscriptionType.QUARTERLY) daysToAdd = 90;
          if (user.subscription === SubscriptionType.SEMIANNUAL) daysToAdd = 180;
          if (user.subscription === SubscriptionType.ANNUAL) daysToAdd = 365;

          const newEnd = new Date(baseDate.getTime() + (daysToAdd * 86400000));

          const newHistoryItem: PaymentHistory = {
              id: Date.now().toString(),
              date: now.toISOString(),
              amount: currentPlan.price,
              method: selectedMethod,
              status: 'PAID'
          };

          const updatedUser: User = {
              ...user,
              active: true, // Reactivate if suspended
              trialEndsAt: newEnd.toISOString(),
              paymentHistory: [newHistoryItem, ...(user.paymentHistory || [])]
          };

          onUpdateUser(updatedUser);
          setPaymentStep('SUCCESS');
      }, 3000); // Simulate 3s processing
  };

  const closePaymentModal = () => {
      setIsPaymentModalOpen(false);
      setPaymentStep('SELECT');
      setSelectedMethod(null);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <header className={`mb-8 border-b pb-6 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <h2 className={`text-3xl font-serif ${textPrimary}`}>Meu Perfil</h2>
        <p className="text-slate-400">Gerencie seus dados e assinatura</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
            <div className={`rounded-xl border p-6 flex flex-col items-center text-center ${cardClass}`}>
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-slate-700 border-2 border-gold-500 flex items-center justify-center mb-4 overflow-hidden">
                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-4xl font-serif text-white">{user.name.charAt(0)}</span>}
                    </div>
                    <label className="absolute bottom-4 right-0 p-2 bg-gold-600 rounded-full cursor-pointer shadow-lg hover:bg-gold-500 transition-colors">
                        <Camera size={16} className="text-slate-900" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </label>
                </div>
                <h3 className={`text-xl font-medium ${textPrimary}`}>{user.name}</h3>
                <p className="text-slate-400 text-sm mb-4 uppercase font-bold tracking-widest">{user.role}</p>
                
                {daysRemaining <= 5 && (
                    <button 
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded font-bold text-sm flex items-center justify-center gap-2 mb-2 animate-pulse shadow-lg transition-transform active:scale-95"
                    >
                        <CreditCard size={16} /> Pagar Agora
                    </button>
                )}
            </div>

            <div className={`rounded-xl border p-6 ${cardClass}`}>
                <h4 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Assinatura</h4>
                <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Plano</span>
                        <span className="text-white font-bold">{currentPlan ? currentPlan.name : user.subscription}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Ciclo</span>
                        <span className="text-gold-400 font-bold">{user.subscription}</span>
                    </div>
                    
                    <div className={`p-3 rounded border text-center ${daysRemaining <= 5 ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-900/50 border-slate-700'}`}>
                         <p className={`text-xs uppercase font-bold mb-1 ${daysRemaining <= 5 ? 'text-red-400' : 'text-slate-500'}`}>Vencimento</p>
                         <p className={`text-lg font-bold ${daysRemaining <= 5 ? 'text-red-500' : 'text-emerald-400'}`}>
                             {daysRemaining > 0 ? `Falta ${daysRemaining} dias` : 'Vencido'}
                         </p>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Status</span>
                        <span className={user.active ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                            {user.active ? 'ATIVO' : 'SUSPENSO'}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div className="md:col-span-2 space-y-6">
            <div className={`rounded-xl border p-8 ${cardClass}`}>
                <h3 className={`text-lg font-medium mb-6 flex items-center gap-2 ${textPrimary}`}>
                    <UserIcon className="w-5 h-5 text-gold-500" /> Dados Pessoais
                </h3>
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Nome Completo</label>
                        <input type="text" defaultValue={user.name} className={`w-full border rounded p-2.5 focus:border-gold-500 focus:outline-none ${inputClass}`} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Email</label>
                            <input type="email" defaultValue={user.email} className={`w-full border rounded p-2.5 focus:border-gold-500 focus:outline-none ${inputClass}`} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Telefone</label>
                            <input type="tel" defaultValue={user.phone} className={`w-full border rounded p-2.5 focus:border-gold-500 focus:outline-none ${inputClass}`} />
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button className="bg-gold-600 hover:bg-gold-500 text-slate-900 px-6 py-2 rounded font-bold transition-colors">Salvar Alterações</button>
                </div>
            </div>

            <div className={`rounded-xl border p-8 ${cardClass}`}>
                  <h3 className={`text-lg font-medium mb-6 flex items-center gap-2 ${textPrimary}`}>
                      <Lock className="w-5 h-5 text-gold-500" /> Alterar Senha
                  </h3>
                  <div className="space-y-4">
                      <div className="relative">
                          <label className="block text-xs text-slate-400 mb-1">Nova Senha</label>
                          <input type={showPass ? "text" : "password"} className={`w-full border rounded p-2.5 focus:border-gold-500 focus:outline-none ${inputClass}`} />
                          <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-8 text-slate-500">
                              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                      </div>
                      <button className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded font-medium transition-colors">Atualizar Senha</button>
                  </div>
            </div>
            
            {/* Payment History */}
            <div className={`rounded-xl border p-8 ${cardClass}`}>
                <h3 className={`text-lg font-medium mb-6 flex items-center gap-2 ${textPrimary}`}>
                    <FileText className="w-5 h-5 text-gold-500" /> Histórico de Pagamentos (PagSeguro)
                </h3>
                {user.paymentHistory && user.paymentHistory.length > 0 ? (
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className={`text-xs uppercase ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-100'}`}>
                            <tr>
                                <th className="p-3">Data</th>
                                <th className="p-3">Valor</th>
                                <th className="p-3">Método</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {user.paymentHistory.map(pay => (
                                <tr key={pay.id} className="border-b border-slate-700">
                                    <td className="p-3">{new Date(pay.date).toLocaleDateString()}</td>
                                    <td className="p-3 text-gold-500">R$ {pay.amount.toFixed(2)}</td>
                                    <td className="p-3">{pay.method === 'CREDIT_CARD' ? 'Cartão' : pay.method}</td>
                                    <td className="p-3"><span className="text-emerald-500 text-xs font-bold">{pay.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-slate-500 italic">Nenhum pagamento registrado.</p>
                )}
            </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && currentPlan && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
              <div className={`${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl w-full max-w-md p-0 shadow-2xl overflow-hidden`}>
                  
                  {/* Modal Header */}
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                      <h3 className="text-white font-serif font-bold text-lg">Renovar Assinatura</h3>
                      {paymentStep !== 'PROCESSING' && (
                          <button onClick={closePaymentModal}><X className="text-slate-400 hover:text-white" /></button>
                      )}
                  </div>

                  {/* STEP 1: SELECT METHOD */}
                  {paymentStep === 'SELECT' && (
                      <div className="p-6">
                          <div className="text-center mb-6">
                              <p className="text-slate-400 text-sm mb-1">Plano Selecionado</p>
                              <p className={`text-2xl font-bold ${textPrimary}`}>{currentPlan.name}</p>
                              <p className="text-gold-500 font-bold text-3xl mt-2">R$ {currentPlan.price.toFixed(2)}</p>
                              <p className="text-xs text-slate-500">Ciclo {user.subscription}</p>
                          </div>

                          <div className="space-y-3">
                              <button 
                                onClick={() => setSelectedMethod('PIX')}
                                className={`w-full p-4 rounded-lg border flex items-center justify-between transition-all ${selectedMethod === 'PIX' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'border-slate-700 hover:bg-slate-800 text-slate-400'}`}
                              >
                                  <div className="flex items-center gap-3">
                                      <QrCode />
                                      <span className="font-medium">PIX (Aprovação Imediata)</span>
                                  </div>
                                  {selectedMethod === 'PIX' && <CheckCircle size={18} />}
                              </button>

                              <button 
                                onClick={() => setSelectedMethod('CREDIT_CARD')}
                                className={`w-full p-4 rounded-lg border flex items-center justify-between transition-all ${selectedMethod === 'CREDIT_CARD' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'border-slate-700 hover:bg-slate-800 text-slate-400'}`}
                              >
                                  <div className="flex items-center gap-3">
                                      <CreditCard />
                                      <span className="font-medium">Cartão de Crédito</span>
                                  </div>
                                  {selectedMethod === 'CREDIT_CARD' && <CheckCircle size={18} />}
                              </button>

                              <button 
                                onClick={() => setSelectedMethod('BOLETO')}
                                className={`w-full p-4 rounded-lg border flex items-center justify-between transition-all ${selectedMethod === 'BOLETO' ? 'bg-orange-500/10 border-orange-500 text-orange-400' : 'border-slate-700 hover:bg-slate-800 text-slate-400'}`}
                              >
                                  <div className="flex items-center gap-3">
                                      <Barcode />
                                      <span className="font-medium">Boleto Bancário</span>
                                  </div>
                                  {selectedMethod === 'BOLETO' && <CheckCircle size={18} />}
                              </button>
                          </div>

                          <button 
                            disabled={!selectedMethod}
                            onClick={handleProcessPayment}
                            className="w-full mt-6 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg"
                          >
                              Continuar para Pagamento
                          </button>
                      </div>
                  )}

                  {/* STEP 2: PROCESSING */}
                  {paymentStep === 'PROCESSING' && (
                      <div className="p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                          <Loader2 className="w-16 h-16 text-gold-500 animate-spin mb-4" />
                          <h4 className={`text-xl font-bold mb-2 ${textPrimary}`}>Processando Pagamento...</h4>
                          <p className="text-slate-500 text-sm">Validando transação com a operadora.</p>
                          <p className="text-slate-500 text-xs mt-4">Por favor, não feche esta janela.</p>
                      </div>
                  )}

                  {/* STEP 3: SUCCESS */}
                  {paymentStep === 'SUCCESS' && (
                      <div className="p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
                              <CheckCircle className="w-8 h-8 text-white" />
                          </div>
                          <h4 className={`text-2xl font-bold mb-2 text-emerald-500`}>Sucesso!</h4>
                          <p className="text-slate-400 mb-6">Sua assinatura foi renovada com sucesso.</p>
                          <button 
                            onClick={closePaymentModal}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-2 rounded-lg font-medium"
                          >
                              Fechar
                          </button>
                      </div>
                  )}

              </div>
          </div>
      )}
    </div>
  );
};