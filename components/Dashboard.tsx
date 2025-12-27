
import React, { useState, useEffect } from 'react';
import { User, Transaction, Account, TransactionType } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, CartesianGrid 
} from 'recharts';
import { 
  LayoutDashboard, ArrowRightLeft, CreditCard, Target, LogOut, 
  Plus, ArrowUpCircle, ArrowDownCircle, MoreVertical, Bot, 
  Menu, X, Wallet, TrendingUp, TrendingDown, Calendar, Search
} from 'lucide-react';

interface DashboardProps {
    user: User | null;
    accounts: Account[];
    transactions: Transaction[];
    onLogout: () => void;
    onRefreshData: () => void;
}

// --- Constants & Helpers ---
const COLORS_INCOME = ['#10b981', '#34d399', '#059669', '#6ee7b7'];
const COLORS_EXPENSE = ['#ef4444', '#f87171', '#b91c1c', '#fca5a5'];
const AXIS_COLOR = '#94a3b8'; // Slate 400

const formatCurrency = (val: number) => (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const Dashboard: React.FC<DashboardProps> = ({ user, accounts, transactions, onLogout, onRefreshData }) => {
    // State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
    
    // New Transaction State
    const [newTrans, setNewTrans] = useState({ 
        description: '', 
        amount: '', 
        type: TransactionType.EXPENSE, 
        accountId: '',
        category: ''
    });

    // --- Data Calculations ---
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    
    const currentMonth = new Date().getMonth();
    const monthlyTransactions = transactions.filter(t => new Date(t.date).getMonth() === currentMonth);
    
    const incomeTotal = monthlyTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + Number(t.amount), 0);
        
    const expenseTotal = monthlyTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.amount), 0);

    // Chart Data Preparation
    const overviewData = [
        { name: 'Receitas', value: incomeTotal, fill: '#10b981' },
        { name: 'Despesas', value: expenseTotal, fill: '#ef4444' },
    ];

    const getCategoryData = (type: TransactionType) => {
        const grouped = monthlyTransactions.filter(t => t.type === type).reduce((acc:any, curr) => {
            acc[curr.category || 'Outros'] = (acc[curr.category || 'Outros'] || 0) + curr.amount;
            return acc;
        }, {});
        return Object.keys(grouped).map(k => ({ name: k, value: grouped[k] }));
    };
    
    const incomeCategoryData = getCategoryData(TransactionType.INCOME);
    const expenseCategoryData = getCategoryData(TransactionType.EXPENSE);

    // --- Handlers ---
    const handleAddTransaction = async () => {
        // In a real scenario, this would POST to the API
        console.log("Adding transaction:", newTrans);
        // Simulate adding for UI feedback if API isn't connected
        onRefreshData(); 
        setIsModalOpen(false);
        setNewTrans({ description: '', amount: '', type: TransactionType.EXPENSE, accountId: '', category: '' });
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/^0+/, ''); 
        setNewTrans({ ...newTrans, amount: val });
    };

    // --- Components ---
    
    const Sidebar = ({ className = "" }: { className?: string }) => (
        <aside className={`bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 ${className}`}>
            <div>
                <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-800">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-serif font-bold text-white leading-none">Alfred</h1>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Personal AI</span>
                    </div>
                </div>
                
                <nav className="p-4 space-y-2">
                    <button 
                        onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-primary text-slate-900 font-bold shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <LayoutDashboard size={20} /> Visão Geral
                    </button>
                    <button 
                         onClick={() => { setActiveTab('transactions'); setIsMobileMenuOpen(false); }}
                         className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'transactions' ? 'bg-primary text-slate-900 font-bold shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <ArrowRightLeft size={20} /> Transações
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                        <CreditCard size={20} /> Cartões
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                        <Target size={20} /> Metas
                    </button>
                </nav>
            </div>
            
            <div className="p-4 border-t border-slate-800">
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                    <LogOut size={20} /> Encerrar Sessão
                </button>
            </div>
        </aside>
    );

    const StatCard = ({ title, value, icon, trend, colorClass }: any) => (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClass} bg-opacity-20`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                        {trend === 'up' ? '+12%' : '-5%'}
                    </span>
                )}
            </div>
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl lg:text-3xl font-bold text-white font-sans">{value}</h3>
            </div>
            {/* Decoration */}
            <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12">
                {React.cloneElement(icon, { size: 100 })}
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-950 font-sans text-slate-200 overflow-hidden">
            
            {/* Desktop Sidebar */}
            <Sidebar className="w-72 hidden md:flex" />

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <Sidebar className="w-4/5 relative z-10" />
                    <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 text-white p-2">
                        <X size={28} />
                    </button>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                
                {/* Header */}
                <header className="h-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between px-6 lg:px-10 shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-white p-2 hover:bg-slate-800 rounded-lg">
                            <Menu size={24} />
                        </button>
                        <div>
                            <h2 className="text-lg lg:text-xl font-bold text-white">
                                {new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'}, {user?.name.split(' ')[0]}.
                            </h2>
                            <p className="text-xs text-slate-400 hidden sm:block">Aqui está o panorama atual da sua propriedade.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                            <Calendar size={16} className="text-slate-400" />
                            <span className="text-sm text-slate-300 capitalize">{new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                         </div>
                         <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-primary hover:bg-primary-dark text-slate-900 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            <Plus size={18} /> <span className="hidden sm:inline">Novo Registro</span>
                         </button>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 custom-scrollbar">
                    
                    {/* 1. Summary Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            title="Saldo Total" 
                            value={formatCurrency(totalBalance)} 
                            icon={<Wallet size={24} className="text-blue-400" />} 
                            colorClass="bg-blue-500 text-blue-400"
                        />
                        <StatCard 
                            title="Receitas (Mês)" 
                            value={formatCurrency(incomeTotal)} 
                            icon={<TrendingUp size={24} className="text-emerald-400" />} 
                            colorClass="bg-emerald-500 text-emerald-400"
                            trend="up"
                        />
                        <StatCard 
                            title="Despesas (Mês)" 
                            value={formatCurrency(expenseTotal)} 
                            icon={<TrendingDown size={24} className="text-red-400" />} 
                            colorClass="bg-red-500 text-red-400"
                            trend="down"
                        />
                    </div>

                    {/* 2. Charts Section (Only shown in overview tab) */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            
                            {/* Main Bar Chart */}
                            <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-white">Fluxo de Caixa</h3>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-1 text-xs text-slate-400"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Entrada</div>
                                        <div className="flex items-center gap-1 text-xs text-slate-400"><div className="w-2 h-2 rounded-full bg-red-500"></div>Saída</div>
                                    </div>
                                </div>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={overviewData} layout="vertical" barSize={30}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                            <XAxis type="number" stroke={AXIS_COLOR} tickFormatter={(val) => `R$${val/1000}k`} />
                                            <YAxis dataKey="name" type="category" stroke={AXIS_COLOR} width={70} tick={{fill: 'white', fontSize: 12}} />
                                            <Tooltip 
                                                cursor={{fill: '#1e293b'}}
                                                contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff'}}
                                                formatter={(val: number) => formatCurrency(val)}
                                            />
                                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                {overviewData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Donut Chart (Expenses) */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
                                <h3 className="font-bold text-white mb-4">Despesas por Categoria</h3>
                                <div className="flex-1 min-h-[200px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                                data={expenseCategoryData} 
                                                innerRadius={60} 
                                                outerRadius={80} 
                                                paddingAngle={5} 
                                                dataKey="value"
                                            >
                                                {expenseCategoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS_EXPENSE[index % COLORS_EXPENSE.length]} stroke="rgba(0,0,0,0)" />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                 contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff'}}
                                                 formatter={(val: number) => formatCurrency(val)}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Centered Text */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center">
                                            <span className="text-xs text-slate-500 block">Total</span>
                                            <span className="text-lg font-bold text-white">{formatCurrency(expenseTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                    {expenseCategoryData.slice(0, 3).map((entry, index) => (
                                        <div key={index} className="flex items-center gap-1.5 text-xs bg-slate-800 px-2 py-1 rounded-full text-slate-300">
                                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS_EXPENSE[index % COLORS_EXPENSE.length]}}></div>
                                            {entry.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Recent Transactions List */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-white">
                                {activeTab === 'transactions' ? 'Todas as Transações' : 'Transações Recentes'}
                            </h3>
                            {activeTab === 'overview' && (
                                <button onClick={() => setActiveTab('transactions')} className="text-xs text-primary hover:underline">Ver tudo</button>
                            )}
                        </div>
                        
                        {activeTab === 'transactions' && (
                             <div className="px-6 py-4 bg-slate-900 border-b border-slate-800">
                                 <div className="relative">
                                     <Search className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                                     <input type="text" placeholder="Buscar transação..." className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                                 </div>
                             </div>
                        )}

                        <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
                            {transactions.length > 0 ? (
                                transactions.slice(0, activeTab === 'overview' ? 5 : undefined).map((t) => (
                                    <div key={t.id} className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                            }`}>
                                                {t.type === TransactionType.INCOME ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{t.description}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                                                    <span>•</span>
                                                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{t.category || 'Geral'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <span className={`font-bold text-sm ${t.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-white'}`}>
                                                {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                                            </span>
                                            <button className="text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-500 italic">
                                    Nenhuma transação encontrada.
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Floating Chat Button (Always visible) */}
                <button className="absolute bottom-6 right-6 bg-primary text-slate-900 w-14 h-14 rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:bg-primary-dark transition-transform hover:scale-105 z-30">
                    <Bot size={28} />
                </button>

            </main>

            {/* Add Transaction Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-fade-in">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
                        
                        <h3 className="text-xl font-serif font-bold text-white mb-6">Novo Registro</h3>
                        
                        <div className="space-y-4">
                            {/* Amount Input */}
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Valor</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3.5 text-slate-400">R$</span>
                                    <input 
                                        type="number" 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-white font-bold text-lg focus:outline-none focus:border-primary"
                                        value={newTrans.amount}
                                        onChange={handleAmountChange}
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Descrição</label>
                                <input 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-primary" 
                                    value={newTrans.description} 
                                    onChange={e => setNewTrans({...newTrans, description: e.target.value})}
                                    placeholder="Ex: Supermercado"
                                />
                            </div>

                            {/* Type Selector */}
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setNewTrans({...newTrans, type: TransactionType.EXPENSE})}
                                    className={`p-3 rounded-xl border flex justify-center items-center gap-2 font-bold text-sm transition-all ${
                                        newTrans.type === TransactionType.EXPENSE ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                                    }`}
                                >
                                    <ArrowDownCircle size={16} /> Saída
                                </button>
                                <button 
                                    onClick={() => setNewTrans({...newTrans, type: TransactionType.INCOME})}
                                    className={`p-3 rounded-xl border flex justify-center items-center gap-2 font-bold text-sm transition-all ${
                                        newTrans.type === TransactionType.INCOME ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                                    }`}
                                >
                                    <ArrowUpCircle size={16} /> Entrada
                                </button>
                            </div>

                            {/* Category & Account */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                     <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Categoria</label>
                                     <input 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-primary" 
                                        value={newTrans.category} 
                                        onChange={e => setNewTrans({...newTrans, category: e.target.value})}
                                        placeholder="Geral"
                                     />
                                </div>
                                <div>
                                     <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Conta</label>
                                     <select 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-primary appearance-none" 
                                        value={newTrans.accountId} 
                                        onChange={e => setNewTrans({...newTrans, accountId: e.target.value})}
                                     >
                                        <option value="">Carteira</option>
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                     </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-800">
                            <button 
                                onClick={handleAddTransaction} 
                                className="w-full py-3.5 bg-primary text-slate-900 font-bold rounded-xl hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20"
                            >
                                Confirmar Lançamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
