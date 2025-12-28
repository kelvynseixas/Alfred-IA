
import React, { useState, useEffect, useMemo } from 'react';
import { User, Transaction, Account, TransactionType, DateRangeOption, RecurrencePeriod } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, CartesianGrid, Legend
} from 'recharts';
import { 
  LayoutDashboard, ArrowRightLeft, CreditCard, Target, LogOut, 
  Plus, ArrowUpCircle, ArrowDownCircle, MoreVertical, Bot, 
  Menu, X, Wallet, TrendingUp, TrendingDown, Calendar, Search, 
  CalendarRange, List, Trash2, Edit2, Repeat
} from 'lucide-react';

interface DashboardProps {
    user: User | null;
    accounts: Account[];
    transactions: Transaction[];
    onLogout: () => void;
    onRefreshData: () => void;
}

const COLORS_INCOME = ['#10b981', '#34d399', '#059669', '#6ee7b7', '#064e3b'];
const COLORS_EXPENSE = ['#ef4444', '#f87171', '#b91c1c', '#fca5a5', '#7f1d1d'];
const COLORS_INVEST = ['#f59e0b', '#fbbf24', '#d97706', '#fcd34d', '#78350f'];
const AXIS_COLOR = '#94a3b8';

const formatCurrency = (val: number) => (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Função auxiliar de auto-categorização
const autoCategorize = (description: string): string => {
    const d = description.toLowerCase();
    if (d.includes('uber') || d.includes('99') || d.includes('combustivel') || d.includes('posto')) return 'Transporte';
    if (d.includes('burguer') || d.includes('ifood') || d.includes('restaurante') || d.includes('mcdonalds')) return 'Alimentação';
    if (d.includes('arroz') || d.includes('mercado') || d.includes('assai') || d.includes('carrefour')) return 'Mercado';
    if (d.includes('loteria') || d.includes('jogo')) return 'Extra';
    if (d.includes('salario') || d.includes('freela')) return 'Renda';
    if (d.includes('aluguel') || d.includes('luz') || d.includes('internet')) return 'Moradia';
    if (d.includes('investimento') || d.includes('cdb') || d.includes('ações')) return 'Investimento';
    return ''; // Deixa vazio para manual se não encontrar
};

export const Dashboard: React.FC<DashboardProps> = ({ user, accounts, transactions, onLogout, onRefreshData }) => {
    // --- State ---
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Modal States
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [detailsType, setDetailsType] = useState<TransactionType | 'ALL'>('ALL');
    
    // Edit/Add State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<{
        description: string;
        amount: string;
        type: TransactionType;
        category: string;
        accountId: string;
        date: string;
        recurrencePeriod: RecurrencePeriod;
        recurrenceInterval: number;
        recurrenceLimit: string;
    }>({ 
        description: '', amount: '', type: TransactionType.EXPENSE, 
        category: '', accountId: '', date: new Date().toISOString().split('T')[0],
        recurrencePeriod: 'NONE', recurrenceInterval: 1, recurrenceLimit: ''
    });

    // Filter State
    const [dateRange, setDateRange] = useState<DateRangeOption>('30D');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // --- Filtering Logic ---
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        now.setHours(0,0,0,0); // Normalizar para início do dia
        
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            tDate.setHours(0,0,0,0);
            
            switch (dateRange) {
                case 'TODAY': 
                    return tDate.getTime() === now.getTime();
                case 'YESTERDAY':
                    const yest = new Date(now); yest.setDate(yest.getDate() - 1);
                    return tDate.getTime() === yest.getTime();
                case '7D': {
                    const cut = new Date(now); cut.setDate(cut.getDate() - 7);
                    return tDate >= cut;
                }
                case '15D': {
                    const cut = new Date(now); cut.setDate(cut.getDate() - 15);
                    return tDate >= cut;
                }
                case '30D': {
                    const cut = new Date(now); cut.setDate(cut.getDate() - 30);
                    return tDate >= cut;
                }
                case '60D': {
                    const cut = new Date(now); cut.setDate(cut.getDate() - 60);
                    return tDate >= cut;
                }
                case '90D': {
                    const cut = new Date(now); cut.setDate(cut.getDate() - 90);
                    return tDate >= cut;
                }
                case 'CUSTOM':
                    if (!customStart || !customEnd) return true;
                    return tDate >= new Date(customStart) && tDate <= new Date(customEnd);
                default: return true;
            }
        });
    }, [transactions, dateRange, customStart, customEnd]);

    // --- Calculations ---
    const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);
    const totalIncome = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + Number(t.amount), 0);
    const totalExpense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + Number(t.amount), 0);
    const totalInvested = filteredTransactions.filter(t => t.type === TransactionType.INVESTMENT).reduce((acc, t) => acc + Number(t.amount), 0);

    // Chart Data
    const comparativeData = [
        { name: 'Entradas', value: totalIncome, fill: '#10b981' },
        { name: 'Saídas', value: totalExpense, fill: '#ef4444' },
        { name: 'Invest.', value: totalInvested, fill: '#f59e0b' },
    ];

    const getCategoryData = (type: TransactionType) => {
        const grouped = filteredTransactions.filter(t => t.type === type).reduce((acc: any, curr) => {
            const cat = curr.category || 'Outros';
            acc[cat] = (acc[cat] || 0) + Number(curr.amount);
            return acc;
        }, {});
        return Object.keys(grouped).map(k => ({ name: k, value: grouped[k] }));
    };

    const incomeCatData = getCategoryData(TransactionType.INCOME);
    const expenseCatData = getCategoryData(TransactionType.EXPENSE);
    const investCatData = getCategoryData(TransactionType.INVESTMENT);

    // --- Actions ---
    const openAddModal = (type: TransactionType = TransactionType.EXPENSE) => {
        setEditingId(null);
        setFormData({
            description: '', amount: '', type, category: '', 
            accountId: accounts[0]?.id || '', date: new Date().toISOString().split('T')[0],
            recurrencePeriod: 'NONE', recurrenceInterval: 1, recurrenceLimit: ''
        });
        setIsTransactionModalOpen(true);
    };

    const openEditModal = (t: Transaction) => {
        setEditingId(t.id);
        setFormData({
            description: t.description,
            amount: t.amount.toString(),
            type: t.type,
            category: t.category,
            accountId: t.accountId,
            date: new Date(t.date).toISOString().split('T')[0],
            recurrencePeriod: t.recurrencePeriod || 'NONE',
            recurrenceInterval: t.recurrenceInterval || 1,
            recurrenceLimit: t.recurrenceLimit ? t.recurrenceLimit.toString() : ''
        });
        setIsTransactionModalOpen(true);
    };

    const handleDescriptionBlur = () => {
        if (!formData.category && formData.description) {
            const auto = autoCategorize(formData.description);
            if (auto) setFormData(prev => ({ ...prev, category: auto }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulação de salvamento (em produção seria um POST/PUT na API)
        console.log("Salvando:", formData);
        onRefreshData(); 
        setIsTransactionModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if(confirm("Deseja realmente excluir esta movimentação?")) {
            console.log("Deletando:", id);
            onRefreshData();
        }
    };

    const openDetails = (type: TransactionType) => {
        setDetailsType(type);
        setIsDetailsModalOpen(true);
    };

    // --- Components ---
    const StatCard = ({ title, value, icon, type, colorClass }: any) => (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl ${colorClass} bg-opacity-20`}>
                    {icon}
                </div>
                <button onClick={() => openDetails(type)} className="text-xs text-slate-500 hover:text-white bg-slate-800 px-2 py-1 rounded">
                    Detalhes
                </button>
            </div>
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-white font-sans">{value}</h3>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
                {React.cloneElement(icon, { size: 100 })}
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-950 font-sans text-slate-200 overflow-hidden">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-72 bg-slate-900 border-r border-slate-800">
                 <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-800">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-serif font-bold text-white leading-none">Alfred</h1>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Personal AI</span>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-slate-900 font-bold shadow-lg shadow-primary/20"><LayoutDashboard size={20} /> Painel Financeiro</button>
                    {/* Outros itens de menu podem vir aqui */}
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <LogOut size={20} /> Encerrar Sessão
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="h-auto min-h-[80px] border-b border-slate-800 bg-slate-950/95 backdrop-blur flex flex-col md:flex-row items-center justify-between px-6 py-4 gap-4 z-20">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                         <h2 className="text-xl font-bold text-white">Gestão Financeira</h2>
                    </div>
                    
                    {/* Filtro de Período */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                        <CalendarRange size={16} className="text-slate-400 ml-2" />
                        <select 
                            value={dateRange} 
                            onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
                            className="bg-transparent text-sm text-white focus:outline-none py-1"
                        >
                            <option value="TODAY">Hoje</option>
                            <option value="YESTERDAY">Ontem</option>
                            <option value="7D">7 Dias</option>
                            <option value="15D">15 Dias</option>
                            <option value="30D">30 Dias</option>
                            <option value="60D">60 Dias</option>
                            <option value="90D">90 Dias</option>
                            <option value="CUSTOM">Personalizado</option>
                        </select>
                        {dateRange === 'CUSTOM' && (
                            <div className="flex items-center gap-2 ml-2">
                                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-slate-800 text-xs rounded p-1 text-white border border-slate-700" />
                                <span className="text-slate-500">-</span>
                                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-slate-800 text-xs rounded p-1 text-white border border-slate-700" />
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => openAddModal()}
                        className="bg-primary hover:bg-primary-dark text-slate-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={18} /> Novo Registro
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* 1. CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard 
                            title="Saldo Total" 
                            value={formatCurrency(totalBalance)} 
                            icon={<Wallet size={24} className="text-blue-400" />} 
                            type="ALL" // Abre carteira geral
                            colorClass="bg-blue-500 text-blue-400"
                        />
                        <StatCard 
                            title="Entradas" 
                            value={formatCurrency(totalIncome)} 
                            icon={<ArrowUpCircle size={24} className="text-emerald-400" />} 
                            type={TransactionType.INCOME}
                            colorClass="bg-emerald-500 text-emerald-400"
                        />
                        <StatCard 
                            title="Saídas" 
                            value={formatCurrency(totalExpense)} 
                            icon={<ArrowDownCircle size={24} className="text-red-400" />} 
                            type={TransactionType.EXPENSE}
                            colorClass="bg-red-500 text-red-400"
                        />
                         <StatCard 
                            title="Invest./Reservas" 
                            value={formatCurrency(totalInvested)} 
                            icon={<Target size={24} className="text-amber-400" />} 
                            type={TransactionType.INVESTMENT}
                            colorClass="bg-amber-500 text-amber-400"
                        />
                    </div>

                    {/* 2. GRÁFICOS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                        {/* Gráfico Comparativo de Barras */}
                        <div className="xl:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-80">
                            <h3 className="font-bold text-white mb-4">Comparativo do Período</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparativeData} layout="vertical" margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                    <XAxis type="number" stroke={AXIS_COLOR} tickFormatter={(val) => `R$${val}`} />
                                    <YAxis dataKey="name" type="category" stroke={AXIS_COLOR} width={80} tick={{fill: 'white', fontSize: 12}} />
                                    <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff'}} formatter={(val: number) => formatCurrency(val)} />
                                    <Bar dataKey="value" barSize={40} radius={[0, 4, 4, 0]}>
                                        {comparativeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pizza Entradas */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center h-64">
                            <h3 className="text-sm font-bold text-emerald-400 mb-2">Categorias (Entrada)</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={incomeCatData} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                                        {incomeCatData.map((e, i) => <Cell key={i} fill={COLORS_INCOME[i % COLORS_INCOME.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{backgroundColor: '#0f172a'}} formatter={(val:number) => formatCurrency(val)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pizza Saídas */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center h-64">
                             <h3 className="text-sm font-bold text-red-400 mb-2">Categorias (Saída)</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={expenseCatData} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                                        {expenseCatData.map((e, i) => <Cell key={i} fill={COLORS_EXPENSE[i % COLORS_EXPENSE.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{backgroundColor: '#0f172a'}} formatter={(val:number) => formatCurrency(val)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pizza Investimentos */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center h-64">
                             <h3 className="text-sm font-bold text-amber-400 mb-2">Categorias (Invest.)</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={investCatData} innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                                        {investCatData.map((e, i) => <Cell key={i} fill={COLORS_INVEST[i % COLORS_INVEST.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{backgroundColor: '#0f172a'}} formatter={(val:number) => formatCurrency(val)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. HISTÓRICO (Últimas 15) */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-800">
                            <h3 className="font-bold text-white">Histórico Recente (Últimas 15)</h3>
                        </div>
                        <div className="divide-y divide-slate-800">
                            {filteredTransactions.slice(0, 15).map(t => (
                                <div key={t.id} className="p-4 hover:bg-slate-800/50 flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-500' : 
                                            t.type === TransactionType.EXPENSE ? 'bg-red-500/10 text-red-500' :
                                            'bg-amber-500/10 text-amber-500'
                                        }`}>
                                            {t.type === TransactionType.INCOME ? <ArrowUpCircle size={20} /> : 
                                             t.type === TransactionType.EXPENSE ? <ArrowDownCircle size={20} /> :
                                             <Target size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{t.description}</p>
                                            <div className="flex gap-2 text-xs text-slate-500">
                                                <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                                                <span className="bg-slate-800 px-1 rounded">{t.category}</span>
                                                {t.recurrencePeriod && t.recurrencePeriod !== 'NONE' && (
                                                    <span className="flex items-center gap-1 text-blue-400"><Repeat size={10} /> Recorrente</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`font-bold ${
                                            t.type === TransactionType.INCOME ? 'text-emerald-400' : 
                                            t.type === TransactionType.EXPENSE ? 'text-red-400' : 
                                            'text-amber-400'
                                        }`}>
                                            {t.type === TransactionType.EXPENSE ? '-' : ''}{formatCurrency(t.amount)}
                                        </span>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(t)} className="p-1 hover:text-blue-400"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(t.id)} className="p-1 hover:text-red-400"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <div className="p-8 text-center text-slate-500">Nenhuma movimentação neste período.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MODAL ADICIONAR/EDITAR */}
                {isTransactionModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">{editingId ? 'Editar Movimentação' : 'Nova Movimentação'}</h3>
                                <button onClick={() => setIsTransactionModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Tipo */}
                                <div className="grid grid-cols-3 gap-2">
                                    {[TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.INVESTMENT].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({...formData, type})}
                                            className={`p-2 rounded border text-xs font-bold ${
                                                formData.type === type 
                                                ? (type === 'INCOME' ? 'bg-emerald-600 border-emerald-600 text-white' : type === 'EXPENSE' ? 'bg-red-600 border-red-600 text-white' : 'bg-amber-600 border-amber-600 text-white')
                                                : 'bg-slate-800 border-slate-700 text-slate-400'
                                            }`}
                                        >
                                            {type === 'INCOME' ? 'Entrada' : type === 'EXPENSE' ? 'Saída' : 'Investimento'}
                                        </button>
                                    ))}
                                </div>

                                {/* Descrição & Valor */}
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Descrição</label>
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none"
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                        onBlur={handleDescriptionBlur}
                                        placeholder="Ex: Uber, Mercado..."
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Valor (R$)</label>
                                        <input 
                                            type="number" step="0.01"
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none"
                                            value={formData.amount}
                                            onChange={e => setFormData({...formData, amount: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Data</label>
                                        <input 
                                            type="date"
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none"
                                            value={formData.date}
                                            onChange={e => setFormData({...formData, date: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Categoria e Conta */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Categoria</label>
                                        <input 
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none"
                                            value={formData.category}
                                            onChange={e => setFormData({...formData, category: e.target.value})}
                                            placeholder="Automático se vazio"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Conta</label>
                                        <select 
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none"
                                            value={formData.accountId}
                                            onChange={e => setFormData({...formData, accountId: e.target.value})}
                                        >
                                            <option value="">Carteira Padrão</option>
                                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Recorrência */}
                                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
                                        <Repeat size={14} /> Recorrência
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select 
                                            className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white"
                                            value={formData.recurrencePeriod}
                                            onChange={e => setFormData({...formData, recurrencePeriod: e.target.value as RecurrencePeriod})}
                                        >
                                            <option value="NONE">Não Repetir</option>
                                            <option value="DAILY">Diário</option>
                                            <option value="WEEKLY">Semanal</option>
                                            <option value="MONTHLY">Mensal</option>
                                            <option value="YEARLY">Anual</option>
                                        </select>
                                        {formData.recurrencePeriod !== 'NONE' && (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" min="1" 
                                                    className="w-12 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white text-center"
                                                    value={formData.recurrenceInterval}
                                                    onChange={e => setFormData({...formData, recurrenceInterval: parseInt(e.target.value)})}
                                                />
                                                <span className="text-xs text-slate-500">
                                                    {formData.recurrencePeriod === 'DAILY' ? 'dias' : formData.recurrencePeriod === 'WEEKLY' ? 'sem.' : formData.recurrencePeriod === 'MONTHLY' ? 'meses' : 'anos'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {formData.recurrencePeriod !== 'NONE' && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs text-slate-500">Encerrar após:</span>
                                            <input 
                                                type="number" placeholder="∞"
                                                className="w-16 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white text-center"
                                                value={formData.recurrenceLimit}
                                                onChange={e => setFormData({...formData, recurrenceLimit: e.target.value})}
                                            />
                                            <span className="text-xs text-slate-500">vezes</span>
                                        </div>
                                    )}
                                </div>

                                <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-bold py-3 rounded-lg transition-colors">
                                    {editingId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL DETALHES (LISTA COMPLETA FILTRADA) */}
                {isDetailsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-850 rounded-t-xl">
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {detailsType === 'INCOME' ? 'Detalhamento de Entradas' : 
                                         detailsType === 'EXPENSE' ? 'Detalhamento de Saídas' : 
                                         detailsType === 'INVESTMENT' ? 'Investimentos e Reservas' : 'Extrato Completo'}
                                    </h3>
                                    <p className="text-xs text-slate-400">Filtrado pelo período selecionado ({dateRange})</p>
                                </div>
                                <button onClick={() => setIsDetailsModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-0">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-slate-800 text-slate-200 sticky top-0 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-3">Data</th>
                                            <th className="px-6 py-3">Descrição</th>
                                            <th className="px-6 py-3">Categoria</th>
                                            <th className="px-6 py-3 text-right">Valor</th>
                                            <th className="px-6 py-3 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {filteredTransactions
                                            .filter(t => detailsType === 'ALL' || t.type === detailsType)
                                            .map(t => (
                                            <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                                <td className="px-6 py-4 text-white font-medium">{t.description}</td>
                                                <td className="px-6 py-4"><span className="bg-slate-800 px-2 py-1 rounded text-xs">{t.category}</span></td>
                                                <td className={`px-6 py-4 text-right font-bold ${
                                                    t.type === 'INCOME' ? 'text-emerald-400' : t.type === 'EXPENSE' ? 'text-red-400' : 'text-amber-400'
                                                }`}>
                                                    {formatCurrency(t.amount)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-3">
                                                        <button onClick={() => { setIsDetailsModalOpen(false); openEditModal(t); }} className="text-slate-500 hover:text-blue-400"><Edit2 size={16} /></button>
                                                        <button onClick={() => handleDelete(t.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};
