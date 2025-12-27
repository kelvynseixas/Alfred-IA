
import React from 'react';
import { ShieldCheck, BarChart2, Zap, Users, CreditCard, CheckCircle, Bot } from 'lucide-react';

interface LandingPageProps {
    onLoginClick: () => void;
}

const FeatureCard = ({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) => (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
        <div className="flex items-center gap-4 mb-3">
            <div className="text-primary">{icon}</div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <p className="text-slate-400 text-sm">{text}</p>
    </div>
);

const PlanCard = ({ title, price, period, features, popular = false }: { title: string, price: string, period: string, features: string[], popular?: boolean }) => (
    <div className={`border rounded-xl p-6 flex flex-col ${popular ? 'bg-slate-800 border-primary' : 'bg-slate-900 border-slate-800'}`}>
        {popular && <span className="text-xs bg-primary text-slate-900 font-bold px-3 py-1 rounded-full self-start mb-4">RECOMENDADO</span>}
        <h3 className="text-2xl font-serif text-white mb-2">{title}</h3>
        <p className="mb-6"><span className="text-4xl font-bold text-white">{price}</span><span className="text-slate-400">/{period}</span></p>
        <ul className="space-y-3 text-slate-300 text-sm mb-8 flex-1">
            {features.map((f, i) => <li key={i} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" />{f}</li>)}
        </ul>
        <button className={`w-full py-3 rounded-lg font-bold transition-colors ${popular ? 'bg-primary hover:bg-primary-dark text-slate-900' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
            Contratar Serviços
        </button>
    </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  return (
    <div className="bg-slate-950">
        <header className="fixed top-0 left-0 right-0 bg-slate-950/80 backdrop-blur-sm z-50 border-b border-slate-800">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Bot size={24} className="text-primary" />
                    <h1 className="text-2xl font-serif font-bold text-white">Alfred IA</h1>
                </div>
                <nav className="hidden md:flex gap-6 text-sm text-slate-300">
                    <a href="#recursos" className="hover:text-primary">Capacidades</a>
                    <a href="#planos" className="hover:text-primary">Planos</a>
                </nav>
                <button onClick={onLoginClick} className="bg-primary hover:bg-primary-dark text-slate-900 font-bold px-5 py-2 rounded-lg text-sm transition-colors">
                    Acessar Propriedade
                </button>
            </div>
        </header>

        <main>
            {/* Hero Section */}
            <section className="pt-32 pb-20 text-center bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="container mx-auto px-6">
                    <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight max-w-3xl mx-auto">
                        Sua vida, <span className="text-primary">perfeitamente</span> organizada.
                    </h2>
                    <p className="text-slate-400 mt-6 max-w-xl mx-auto">
                        Alfred é seu mordomo digital pessoal, gerenciando finanças, tarefas e compromissos com discrição e eficiência.
                    </p>
                    <div className="mt-10 flex justify-center gap-4">
                        <button onClick={onLoginClick} className="bg-primary hover:bg-primary-dark text-slate-900 font-bold px-8 py-3 rounded-lg transition-colors">Acessar Painel</button>
                        <a href="#planos" className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-8 py-3 rounded-lg transition-colors">Ver Planos</a>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="recursos" className="py-20 bg-slate-950">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                         <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">As Capacidades ao seu dispor</h2>
                         <p className="text-slate-400 mt-4 max-w-2xl mx-auto">Tudo que um mordomo digital pode fazer para otimizar sua vida e seus negócios.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard icon={<Zap size={24} />} title="Comandos por Conversa" text="Converse com Alfred pelo WhatsApp para registrar despesas, agendar tarefas ou consultar seu dia." />
                        <FeatureCard icon={<BarChart2 size={24} />} title="Visão Geral da Propriedade" text="Um painel que exibe o estado de suas finanças, investimentos e tarefas em um só lugar." />
                        <FeatureCard icon={<CreditCard size={24} />} title="Gestão de Ativos" text="Alfred monitora seus cartões, contas e investimentos, garantindo que tudo esteja em ordem." />
                        <FeatureCard icon={<Users size={24} />} title="Perfis de Gestão" text="Gerencie suas finanças pessoais, empresariais ou compartilhe um perfil com seu cônjuge." />
                        <FeatureCard icon={<ShieldCheck size={24} />} title="Discrição e Segurança" text="Seus dados são criptografados e tratados com a máxima confidencialidade." />
                        <FeatureCard icon={<CheckCircle size={24} />} title="Metas e Objetivos" text="Defina seus objetivos e Alfred o ajudará a acompanhar o progresso para alcançá-los." />
                    </div>
                </div>
            </section>

            {/* Plans Section */}
            <section id="planos" className="py-20 bg-slate-900">
                 <div className="container mx-auto px-6">
                     <div className="text-center mb-12">
                         <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">Contrate os Serviços de Alfred</h2>
                         <p className="text-slate-400 mt-4 max-w-2xl mx-auto">Escolha o plano que melhor se adequa às suas necessidades.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <PlanCard title="Plano Mensal" price="R$ 37" period="mês" features={['Assistente WhatsApp', 'Perfis Pessoal e Empresarial', 'Perfil de Casal', 'Suporte Prioritário']} />
                        <PlanCard title="Plano Anual" price="R$ 10" period="mês" features={['Tudo do Mensal', '50% de Desconto', 'Backup Automático', 'Acesso por 1 ano']} popular={true} />
                        <PlanCard title="Plano Vitalício" price="R$ 147" period="uma vez" features={['Tudo do Anual', 'Acesso Para Sempre', 'Atualizações Futuras', 'Suporte Vitalício']} />
                    </div>
                 </div>
            </section>
        </main>

        <footer className="bg-slate-950 border-t border-slate-800">
            <div className="container mx-auto px-6 py-8 text-center text-slate-500 text-sm">
                <p>&copy; {new Date().getFullYear()} Alfred IA. Todos os serviços reservados.</p>
            </div>
        </footer>
    </div>
  );
};
