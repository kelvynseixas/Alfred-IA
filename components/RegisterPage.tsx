
import React, { useState, useEffect } from 'react';
import { Mail, Lock, User as UserIcon, Phone, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Plan } from '../types';

interface RegisterPageProps {
    onRegister: (data: any) => Promise<{ success: boolean; error?: string }>;
    onBack: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onBack }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        planId: null as number | null
    });

    useEffect(() => {
        // Fetch Plans
        fetch('/api/plans/public')
            .then(res => res.json())
            .then(data => setPlans(data))
            .catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const res = await onRegister(formData);
        setIsLoading(false);
        if (!res.success) alert(res.error);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                
                {/* Info Side */}
                <div className="md:w-1/3 bg-slate-800 p-8 flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-serif text-white mb-4">Bem-vindo à Propriedade</h2>
                        <p className="text-slate-400 text-sm">Configure seu acesso ao sistema Alfred e transforme sua gestão pessoal.</p>
                    </div>
                    <div className="space-y-4 mt-8">
                        <div className="flex items-center gap-3 text-sm text-slate-300">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                            <span>Dados Pessoais</span>
                        </div>
                        <div className={`flex items-center gap-3 text-sm ${step === 2 ? 'text-white font-bold' : 'text-slate-500'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-primary text-slate-900' : 'bg-slate-700 text-slate-500'}`}>2</div>
                            <span>Escolha do Plano</span>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="md:w-2/3 p-8">
                    {step === 1 && (
                        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
                            <h3 className="text-xl font-bold text-white mb-6">Suas Informações</h3>
                            
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input type="text" placeholder="Nome Completo" required className="w-full p-3 pl-10 bg-slate-950 border border-slate-700 rounded-lg text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input type="email" placeholder="E-mail" required className="w-full p-3 pl-10 bg-slate-950 border border-slate-700 rounded-lg text-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input type="text" placeholder="WhatsApp (DDD + Número)" required className="w-full p-3 pl-10 bg-slate-950 border border-slate-700 rounded-lg text-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input type="password" placeholder="Senha Forte" required className="w-full p-3 pl-10 bg-slate-950 border border-slate-700 rounded-lg text-white" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                            </div>

                            <div className="flex justify-between items-center mt-6">
                                <button type="button" onClick={onBack} className="text-slate-500 hover:text-white">Voltar</button>
                                <button type="submit" className="bg-primary hover:bg-primary-dark text-slate-900 px-6 py-2 rounded-lg font-bold flex items-center gap-2">Próximo <ArrowRight size={18} /></button>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                         <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white mb-6">Selecione seu Plano</h3>
                            <div className="grid gap-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {plans.map(plan => (
                                    <div 
                                        key={plan.id} 
                                        onClick={() => setFormData({...formData, planId: plan.id})}
                                        className={`p-4 border rounded-xl cursor-pointer transition-all ${formData.planId === plan.id ? 'bg-primary/10 border-primary' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-white">{plan.name}</h4>
                                            <span className="text-primary font-bold">R$ {plan.price}</span>
                                        </div>
                                        <ul className="space-y-1">
                                            {plan.features.map((f, i) => (
                                                <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                                                    <CheckCircle size={12} className="text-emerald-500" /> {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                             <div className="flex justify-between items-center mt-6">
                                <button type="button" onClick={() => setStep(1)} className="text-slate-500 hover:text-white">Voltar</button>
                                <button onClick={handleSubmit} disabled={!formData.planId || isLoading} className="bg-primary hover:bg-primary-dark text-slate-900 px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50">
                                    {isLoading ? <Loader2 className="animate-spin" /> : 'Finalizar Contratação'}
                                </button>
                            </div>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};
