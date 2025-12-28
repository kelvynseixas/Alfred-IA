
import React, { useState, useEffect, useMemo } from 'react';
import { User, Transaction, Account, TransactionType, DateRangeOption, RecurrencePeriod, Investment, InvestmentType, Goal, GoalEntry, Task, TaskPriority } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { 
  LayoutDashboard, ArrowRightLeft, CreditCard, Target, LogOut, 
  Plus, ArrowUpCircle, ArrowDownCircle, MoreVertical, Bot, 
  Menu, X, Wallet, TrendingUp, TrendingDown, Calendar, Search, 
  CalendarRange, List, Trash2, Edit2, Repeat, Briefcase, Calculator, 
  Flag, Trophy, History, Minus, CheckCircle, CheckSquare, Clock, AlertCircle
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
const formatPercent = (val: number) => (val || 0).toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 1 });

// Função auxiliar para comparar datas ignorando horário (Fix Timezone Issue)
const isSameDay = (d1: Date, d2: Date) => {
    return d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0];
};

const autoCategorize = (description: string): string => {
    const d = description.toLowerCase();
    if (d.includes('uber') || d.includes('99') || d.includes('combustivel') || d.includes('posto')) return 'Transporte';
    if (d.includes('burguer') || d.includes('ifood') || d.includes('restaurante') || d.includes('mcdonalds')) return 'Alimentação';
    if (d.includes('arroz') || d.includes('mercado') || d.includes('assai') || d.includes('carrefour')) return 'Mercado';
    if (d.includes('loteria') || d.includes('jogo')) return 'Extra';
    if (d.includes('salario') || d.includes('freela')) return 'Renda';
    if (d.includes('aluguel') || d.includes('luz') || d.includes('internet')) return 'Moradia';
    if (d.includes('investimento') || d.includes('cdb') || d.includes('ações')) return 'Investimento';
    return ''; 
};

type ViewMode = 'FINANCE' | 'INVESTMENTS' | 'GOALS' | 'TASKS';

export const Dashboard: React.FC<DashboardProps & { investments?: Investment[], goals?: Goal[], tasks?: Task[] }> = ({ user, accounts, transactions, investments = [], goals = [], tasks = [], onLogout, onRefreshData }) => {
    
    // --- State Global ---
    const [activeView, setActiveView] = useState<ViewMode>('FINANCE');

    // --- State Financeiro ---
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [detailsType, setDetailsType] = useState<TransactionType | 'ALL'>('ALL');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRangeOption>('30D');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    
    const [formData, setFormData] = useState<{
        description: string; amount: string; type: TransactionType; category: string; accountId: string; date: string;
        recurrencePeriod: RecurrencePeriod; recurrenceInterval: number; recurrenceLimit: string;
    }>({ 
        description: '', amount: '', type: TransactionType.EXPENSE, category: '', accountId: '', date: new Date().toISOString().split('T')[0],
        recurrencePeriod: 'NONE', recurrenceInterval: 1, recurrenceLimit: ''
    });

    // --- State Investimentos ---
    const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
    const [editingInvestId, setEditingInvestId] = useState<string | null>(null);
    const [investFormData, setInvestFormData] = useState<{
        name: string; type: InvestmentType; amount: string; yieldRate: string; redemptionTerms: string; startDate: string;
    }>({
        name: '', type: InvestmentType.CDB, amount: '', yieldRate: '', redemptionTerms: 'No Vencimento', startDate: new Date().toISOString().split('T')[0]
    });

    // --- State Metas ---
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [goalFormData, setGoalFormData] = useState<{ name: string; targetAmount: string; deadline: string }>({
        name: '', targetAmount: '', deadline: ''
    });
    const [goalValues, setGoalValues] = useState<Record<string, string>>({}); 
    const [viewGoalHistoryId, setViewGoalHistoryId] = useState<string | null>(null);
    const [goalHistory, setGoalHistory] = useState<GoalEntry[]>([]);

    // --- State Tarefas ---
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [taskFormData, setTaskFormData] = useState<{
        description: string; dueDate: string; priority: TaskPriority; recurrence: RecurrencePeriod;
    }>({
        description: '', dueDate: new Date().toISOString().split('T')[0], priority: TaskPriority.MEDIUM, recurrence: 'NONE'
    });

    // --- LÓGICA FINANCEIRA ---
    const filteredTransactions = useMemo(() => {
        const now = new Date(); 
        const nowTime = now.getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        return transactions.filter(t => {
            const tDate = new Date(t.date); 
            const tDateStr = t.date.split('T')[0]; 
            const nowStr = now.toISOString().split('T')[0];

            switch (dateRange) {
                case 'TODAY': return tDateStr === new Date().toISOString().split('T')[0]; 
                case 'YESTERDAY': const yest = new Date(); yest.setDate(yest.getDate() - 1); return tDateStr === yest.toISOString().split('T')[0];
                case '7D': return (nowTime - tDate.getTime()) <= (7 * oneDay);
                case '15D': return (nowTime - tDate.getTime()) <= (15 * oneDay);
                case '30D': return (nowTime - tDate.getTime()) <= (30 * oneDay);
                case '60D': return (nowTime - tDate.getTime()) <= (60 * oneDay);
                case '90D': return (nowTime - tDate.getTime()) <= (90 * oneDay);
                case 'CUSTOM': if (!customStart || !customEnd) return true; return tDateStr >= customStart && tDateStr <= customEnd;
                default: return true;
            }
        });
    }, [transactions, dateRange, customStart, customEnd]);

    const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);
    const totalIncome = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + Number(t.amount), 0);
    const totalExpense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + Number(t.amount), 0);
    const totalInvestedFlow = filteredTransactions.filter(t => t.type === TransactionType.INVESTMENT).reduce((acc, t) => acc + Number(t.amount), 0);

    // --- LÓGICA INVESTIMENTOS ---
    const totalInvestmentsAssets = investments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const avgYield = investments.length > 0 ? investments.reduce((acc, curr) => acc + Number(curr.yieldRate), 0) / investments.length : 0;
    
    const projectionData = useMemo(() => {
        const today = new Date();
        const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        return months.map(m => {
            let total = 0;
            investments.forEach(inv => {
                const monthlyRate = (Number(inv.yieldRate) / 100) / 12;
                total += Number(inv.amount) * Math.pow(1 + monthlyRate, m);
            });
            const date = new Date(today);
            date.setMonth(date.getMonth() + m);
            return {
                month: m === 0 ? 'Atual' : `${m}m`,
                fullDate: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
                value: total
            };
        });
    }, [investments]);

    // --- LÓGICA METAS ---
    const totalGoalsTarget = goals.reduce((acc, g) => acc + Number(g.targetAmount), 0);
    const totalGoalsCurrent = goals.reduce((acc, g) => acc + Number(g.currentAmount), 0);
    const overallGoalProgress = totalGoalsTarget > 0 ? (totalGoalsCurrent / totalGoalsTarget) : 0;

    // --- LÓGICA TAREFAS ---
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.isCompleted).length;
    const pendingTasks = tasks.filter(t => !t.isCompleted).length;

    // --- HANDLERS FINANCEIRO ---
    const handleSubmitTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('alfred_token');
        if (!token) return;
        const amountFloat = parseFloat(formData.amount);
        if (isNaN(amountFloat)) { alert("Por favor, insira um valor válido."); return; }
        const payload = { ...formData, amount: amountFloat, recurrenceLimit: formData.recurrenceLimit ? parseInt(formData.recurrenceLimit) : 0 };
        const url = editingId ? `/api/transactions/${editingId}` : '/api/transactions';
        const method = editingId ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
            if (res.ok) { await onRefreshData(); setIsTransactionModalOpen(false); } else { const err = await res.json(); alert(`Erro ao salvar: ${err.error || 'Erro desconhecido'}`); }
        } catch (error) { console.error(error); alert("Erro de conexão com o servidor."); }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!confirm("Excluir movimentação?")) return;
        const token = localStorage.getItem('alfred_token');
        await fetch(`/api/transactions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        onRefreshData();
    };

    const handleDescriptionBlur = () => {
        if (!formData.category && formData.description) {
            const auto = autoCategorize(formData.description);
            if (auto) setFormData(prev => ({ ...prev, category: auto }));
        }
    };

    // --- HANDLERS INVESTIMENTO ---
    const handleSubmitInvest = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('alfred_token');
        if (!token) return;
        const payload = { ...investFormData, amount: parseFloat(investFormData.amount), yieldRate: parseFloat(investFormData.yieldRate) };
        const url = editingInvestId ? `/api/investments/${editingInvestId}` : '/api/investments';
        const method = editingInvestId ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
            if (res.ok) { await onRefreshData(); setIsInvestModalOpen(false); } else { alert("Erro ao salvar investimento."); }
        } catch (e) { console.error(e); }
    };

    const handleDeleteInvest = async (id: string) => {
        if (!confirm("Remover este investimento?")) return;
        const token = localStorage.getItem('alfred_token');
        await fetch(`/api/investments/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        onRefreshData();
    };

    // --- HANDLERS METAS ---
    const handleCreateGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('alfred_token');
        if (!token) return;
        try {
            const res = await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(goalFormData) });
            if (res.ok) { await onRefreshData(); setIsGoalModalOpen(false); setGoalFormData({ name: '', targetAmount: '', deadline: '' }); } else { alert("Erro ao criar meta."); }
        } catch (e) { console.error(e); }
    };

    const handleDeleteGoal = async (id: string) => {
        if (!confirm("Tem certeza que deseja desistir desta meta?")) return;
        const token = localStorage.getItem('alfred_token');
        await fetch(`/api/goals/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        onRefreshData();
    };

    const handleUpdateGoalBalance = async (id: string, isAddition: boolean) => {
        const valStr = goalValues[id];
        if (!valStr || isNaN(Number(valStr)) || Number(valStr) <= 0) return;
        const amount = isAddition ? parseFloat(valStr) : -parseFloat(valStr);
        const token = localStorage.getItem('alfred_token');
        try {
            await fetch(`/api/goals/${id}/entry`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ amount }) });
            setGoalValues(prev => ({ ...prev, [id]: '' })); onRefreshData();
        } catch (e) { console.error(e); }
    };

    const handleViewGoalHistory = async (id: string) => {
        setViewGoalHistoryId(id);
        const token = localStorage.getItem('alfred_token');
        try {
            const res = await fetch(`/api/goals/${id}/entries`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) { const data = await res.json(); setGoalHistory(data); }
        } catch (e) { console.error(e); }
    };

    // --- HANDLERS TAREFAS ---
    const handleSubmitTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('alfred_token');
        if (!token) return;
        const url = editingTaskId ? `/api/tasks/${editingTaskId}` : '/api/tasks';
        const method = editingTaskId ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(taskFormData) });
            if (res.ok) { await onRefreshData(); setIsTaskModalOpen(false); } else { alert("Erro ao salvar tarefa."); }
        } catch (e) { console.error(e); }
    };

    const handleToggleTask = async (id: string) => {
        const token = localStorage.getItem('alfred_token');
        try {
             await fetch(`/api/tasks/${id}/toggle`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
             onRefreshData();
        } catch(e) { console.error(e); }
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm("Remover esta tarefa?")) return;
        const token = localStorage.getItem('alfred_token');
        await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        onRefreshData();
    };

    // Auxiliares de modal
    const openAddModal = (type: TransactionType = TransactionType.EXPENSE) => {
        setEditingId(null);
        setFormData({
            description: '', amount: '', type, category: '', accountId: accounts[0]?.id || '', date: new Date().toISOString().split('T')[0],
            recurrencePeriod: 'NONE', recurrenceInterval: 1, recurrenceLimit: ''
        });
        setIsTransactionModalOpen(true);
    };

    const openEditModal = (t: Transaction) => {
        setEditingId(t.id);
        const dateStr = t.date.toString().split('T')[0];
        setFormData({
            description: t.description, amount: t.amount.toString(), type: t.type, category: t.category, accountId: t.accountId, date: dateStr,
            recurrencePeriod: t.recurrencePeriod || 'NONE', recurrenceInterval: t.recurrenceInterval || 1, recurrenceLimit: t.recurrenceLimit ? t.recurrenceLimit.toString() : ''
        });
        setIsTransactionModalOpen(true);
    };

    const openInvestModal = (inv?: Investment) => {
        if (inv) {
            setEditingInvestId(inv.id);
            setInvestFormData({ name: inv.name, type: inv.type, amount: inv.amount.toString(), yieldRate: inv.yieldRate.toString(), redemptionTerms: inv.redemptionTerms, startDate: new Date(inv.startDate).toISOString().split('T')[0] });
        } else {
            setEditingInvestId(null);
            setInvestFormData({ name: '', type: InvestmentType.CDB, amount: '', yieldRate: '', redemptionTerms: 'No Vencimento', startDate: new Date().toISOString().split('T')[0] });
        }
        setIsInvestModalOpen(true);
    };

    const openTaskModal = (task?: Task) => {
        if (task) {
            setEditingTaskId(task.id);
            setTaskFormData({ description: task.description, dueDate: new Date(task.dueDate).toISOString().split('T')[0], priority: task.priority, recurrence: task.recurrence });
        } else {
            setEditingTaskId(null);
            setTaskFormData({ description: '', dueDate: new Date().toISOString().split('T')[0], priority: TaskPriority.MEDIUM, recurrence: 'NONE' });
        }
        setIsTaskModalOpen(true);
    };

    return (
        <div className="flex h-screen bg-slate-950 font-sans text-slate-200 overflow-hidden">
            {/* Sidebar */}
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
                    <button onClick={() => setActiveView('FINANCE')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeView === 'FINANCE' ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <LayoutDashboard size={20} /> Painel Financeiro
                    </button>
                    <button onClick={() => setActiveView('INVESTMENTS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeView === 'INVESTMENTS' ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Briefcase size={20} /> Carteira Investimentos
                    </button>
                    <button onClick={() => setActiveView('GOALS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeView === 'GOALS' ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Flag size={20} /> Metas e Objetivos
                    </button>
                    <button onClick={() => setActiveView('TASKS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeView === 'TASKS' ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <CheckSquare size={20} /> Tarefas
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <LogOut size={20} /> Encerrar Sessão
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* --- HEADER --- */}
                <header className="h-auto min-h-[80px] border-b border-slate-800 bg-slate-950/95 backdrop-blur flex flex-col md:flex-row items-center justify-between px-6 py-4 gap-4 z-20">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                         <h2 className="text-xl font-bold text-white">
                             {activeView === 'FINANCE' ? 'Gestão Financeira' : activeView === 'INVESTMENTS' ? 'Carteira de Ativos' : activeView === 'GOALS' ? 'Planejamento de Metas' : 'Gerenciador de Tarefas'}
                         </h2>
                    </div>
                    
                    {activeView === 'FINANCE' && (
                        <>
                            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                                <CalendarRange size={16} className="text-slate-400 ml-2" />
                                <select 
                                    value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
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
                            <button onClick={() => openAddModal()} className="bg-primary hover:bg-primary-dark text-slate-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap">
                                <Plus size={18} /> Novo Registro
                            </button>
                        </>
                    )}
                    {activeView === 'INVESTMENTS' && (
                        <button onClick={() => openInvestModal()} className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 whitespace-nowrap">
                            <Plus size={18} /> Novo Ativo
                        </button>
                    )}
                    {activeView === 'GOALS' && (
                        <button onClick={() => setIsGoalModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 whitespace-nowrap">
                            <Plus size={18} /> Nova Meta
                        </button>
                    )}
                    {activeView === 'TASKS' && (
                         <button onClick={() => openTaskModal()} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-95 whitespace-nowrap">
                            <Plus size={18} /> Nova Tarefa
                        </button>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* === VIEW: FINANCEIRO === */}
                    {activeView === 'FINANCE' && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard title="Saldo Total" value={formatCurrency(totalBalance)} icon={<Wallet size={24} className="text-blue-400" />} colorClass="bg-blue-500 text-blue-400" onClick={() => setDetailsType('ALL')} />
                                <StatCard title="Entradas" value={formatCurrency(totalIncome)} icon={<ArrowUpCircle size={24} className="text-emerald-400" />} colorClass="bg-emerald-500 text-emerald-400" onClick={() => setDetailsType(TransactionType.INCOME)} />
                                <StatCard title="Saídas" value={formatCurrency(totalExpense)} icon={<ArrowDownCircle size={24} className="text-red-400" />} colorClass="bg-red-500 text-red-400" onClick={() => setDetailsType(TransactionType.EXPENSE)} />
                                <StatCard title="Fluxo Invest." value={formatCurrency(totalInvestedFlow)} icon={<Target size={24} className="text-amber-400" />} colorClass="bg-amber-500 text-amber-400" onClick={() => setDetailsType(TransactionType.INVESTMENT)} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                                <div className="xl:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-80">
                                    <h3 className="font-bold text-white mb-4">Comparativo do Período</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            { name: 'Entradas', value: totalIncome, fill: '#10b981' },
                                            { name: 'Saídas', value: totalExpense, fill: '#ef4444' },
                                            { name: 'Invest.', value: totalInvestedFlow, fill: '#f59e0b' },
                                        ]} layout="vertical" margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                            <XAxis type="number" stroke={AXIS_COLOR} tickFormatter={(val) => `R$${val}`} />
                                            <YAxis dataKey="name" type="category" stroke={AXIS_COLOR} width={80} tick={{fill: 'white', fontSize: 12}} />
                                            <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff'}} formatter={(val: number) => formatCurrency(val)} />
                                            <Bar dataKey="value" barSize={40} radius={[0, 4, 4, 0]}>
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-slate-800">
                                    <h3 className="font-bold text-white">Histórico Recente</h3>
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
                                                    {t.type === TransactionType.INCOME ? <ArrowUpCircle size={20} /> : t.type === TransactionType.EXPENSE ? <ArrowDownCircle size={20} /> : <Target size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm">{t.description}</p>
                                                    <div className="flex gap-2 text-xs text-slate-500">
                                                        <span>{new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                                        <span className="bg-slate-800 px-1 rounded">{t.category}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-400' : t.type === TransactionType.EXPENSE ? 'text-red-400' : 'text-amber-400'}`}>
                                                    {t.type === TransactionType.EXPENSE ? '-' : ''}{formatCurrency(t.amount)}
                                                </span>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditModal(t)} className="p-1 hover:text-blue-400"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteTransaction(t.id)} className="p-1 hover:text-red-400"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* === VIEW: INVESTIMENTOS === */}
                    {activeView === 'INVESTMENTS' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatCard title="Patrimônio Investido" value={formatCurrency(totalInvestmentsAssets)} icon={<Wallet size={24} className="text-emerald-500" />} colorClass="bg-emerald-500 text-emerald-500" />
                                <StatCard title="Rentabilidade Média" value={formatPercent(avgYield / 100)} icon={<TrendingUp size={24} className="text-blue-500" />} colorClass="bg-blue-500 text-blue-500" />
                                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                                    <div className="p-4 bg-amber-500/20 rounded-full text-amber-500"><Calculator size={32} /></div>
                                    <div>
                                        <p className="text-slate-500 text-sm font-medium">Projeção (+12 Meses)</p>
                                        <h3 className="text-3xl font-bold text-amber-400">{formatCurrency(projectionData[12]?.value || 0)}</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                        <h3 className="font-bold text-white">Carteira de Ativos</h3>
                                    </div>
                                    <div className="flex-1 overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-400">
                                            <thead className="bg-slate-800 text-slate-200 uppercase text-xs">
                                                <tr>
                                                    <th className="px-6 py-3">Ativo</th>
                                                    <th className="px-6 py-3">Tipo</th>
                                                    <th className="px-6 py-3 text-right">Valor</th>
                                                    <th className="px-6 py-3 text-right">Rentab. (a.a)</th>
                                                    <th className="px-6 py-3">Resgate</th>
                                                    <th className="px-6 py-3 text-center">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {investments.map(inv => (
                                                    <tr key={inv.id} className="hover:bg-slate-800/50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-white">{inv.name}</td>
                                                        <td className="px-6 py-4"><span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">{inv.type}</span></td>
                                                        <td className="px-6 py-4 text-right text-emerald-400 font-bold">{formatCurrency(Number(inv.amount))}</td>
                                                        <td className="px-6 py-4 text-right">{inv.yieldRate}%</td>
                                                        <td className="px-6 py-4 text-xs">{inv.redemptionTerms}</td>
                                                        <td className="px-6 py-4 flex justify-center gap-2">
                                                            <button onClick={() => openInvestModal(inv)} className="hover:text-blue-400"><Edit2 size={16} /></button>
                                                            <button onClick={() => handleDeleteInvest(inv.id)} className="hover:text-red-400"><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {investments.length === 0 && <tr><td colSpan={6} className="p-6 text-center">Nenhum investimento registrado.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-96">
                                    <h3 className="font-bold text-white mb-4">Projeção de Rendimento</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={projectionData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="month" stroke={AXIS_COLOR} tick={{fontSize: 10}} />
                                            <YAxis stroke={AXIS_COLOR} tickFormatter={(val) => `${val/1000}k`} tick={{fontSize: 10}} width={30} />
                                            <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}} formatter={(val: number) => formatCurrency(val)} />
                                            <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}

                    {/* === VIEW: METAS (GOALS) === */}
                    {activeView === 'GOALS' && (
                        <>
                            {/* Resumo */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard title="Metas Ativas" value={goals.length.toString()} icon={<Flag size={24} className="text-purple-400" />} colorClass="bg-purple-500 text-purple-400" />
                                <StatCard title="Total Alvo" value={formatCurrency(totalGoalsTarget)} icon={<Target size={24} className="text-slate-400" />} colorClass="bg-slate-500 text-slate-400" />
                                <StatCard title="Total Acumulado" value={formatCurrency(totalGoalsCurrent)} icon={<CheckCircle size={24} className="text-emerald-400" />} colorClass="bg-emerald-500 text-emerald-400" />
                                <StatCard title="Progresso Geral" value={formatPercent(overallGoalProgress)} icon={<Trophy size={24} className="text-amber-400" />} colorClass="bg-amber-500 text-amber-400" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {goals.map(goal => {
                                    const progress = Math.min(Number(goal.currentAmount) / Number(goal.targetAmount), 1);
                                    return (
                                        <div key={goal.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                                                        <Trophy size={24} />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleViewGoalHistory(goal.id)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Histórico"><History size={16} /></button>
                                                        <button onClick={() => handleDeleteGoal(goal.id)} className="p-2 bg-slate-800 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-500" title="Excluir"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-1">{goal.name}</h3>
                                                <p className="text-slate-500 text-xs mb-4">Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                                                
                                                <div className="flex justify-between items-end mb-2">
                                                    <span className="text-2xl font-bold text-emerald-400">{formatCurrency(Number(goal.currentAmount))}</span>
                                                    <span className="text-sm text-slate-500">de {formatCurrency(Number(goal.targetAmount))}</span>
                                                </div>
                                                <div className="w-full bg-slate-800 rounded-full h-2 mb-6">
                                                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${progress * 100}%` }}></div>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 mt-auto">
                                                <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Atualizar Saldo</label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                                                        placeholder="0,00"
                                                        value={goalValues[goal.id] || ''}
                                                        onChange={(e) => setGoalValues(prev => ({ ...prev, [goal.id]: e.target.value }))}
                                                    />
                                                    <button 
                                                        onClick={() => handleUpdateGoalBalance(goal.id, false)}
                                                        className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded transition-colors"
                                                    >
                                                        <Minus size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateGoalBalance(goal.id, true)}
                                                        className="p-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-500 rounded transition-colors"
                                                    >
                                                        <Plus size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {goals.length === 0 && (
                                    <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl">
                                        <Flag size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>Nenhuma meta definida. Comece a planejar seus sonhos!</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* === VIEW: TAREFAS (TASKS) === */}
                    {activeView === 'TASKS' && (
                         <>
                            {/* KPIs Tarefas */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatCard title="Total Tarefas" value={totalTasks.toString()} icon={<CheckSquare size={24} className="text-blue-400" />} colorClass="bg-blue-500 text-blue-400" />
                                <StatCard title="Concluídas" value={completedTasks.toString()} icon={<CheckCircle size={24} className="text-emerald-400" />} colorClass="bg-emerald-500 text-emerald-400" />
                                <StatCard title="Pendentes" value={pendingTasks.toString()} icon={<AlertCircle size={24} className="text-amber-400" />} colorClass="bg-amber-500 text-amber-400" />
                            </div>

                            {/* Lista de Tarefas */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                    <h3 className="font-bold text-white">Lista de Tarefas</h3>
                                </div>
                                <div className="divide-y divide-slate-800">
                                    {tasks.map(task => (
                                        <div key={task.id} className={`p-4 hover:bg-slate-800/50 flex items-center justify-between group transition-all ${task.isCompleted ? 'opacity-50' : ''}`}>
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => handleToggleTask(task.id)} className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${task.isCompleted ? 'bg-emerald-500 border-emerald-500 text-slate-900' : 'border-slate-600 hover:border-emerald-500'}`}>
                                                    {task.isCompleted && <CheckCircle size={16} />}
                                                </button>
                                                <div>
                                                    <p className={`font-bold text-sm ${task.isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>{task.description}</p>
                                                    <div className="flex gap-2 text-xs text-slate-500 items-center mt-1">
                                                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(task.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                            task.priority === TaskPriority.HIGH ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                            task.priority === TaskPriority.MEDIUM ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                        }`}>{task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Média' : 'Baixa'}</span>
                                                        {task.recurrence !== 'NONE' && <span className="bg-slate-800 px-1 rounded flex items-center gap-1"><Repeat size={10} /> {task.recurrence}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openTaskModal(task)} className="p-2 hover:bg-blue-500/20 rounded text-slate-500 hover:text-blue-400"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDeleteTask(task.id)} className="p-2 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {tasks.length === 0 && <div className="p-8 text-center text-slate-500">Nenhuma tarefa encontrada.</div>}
                                </div>
                            </div>
                         </>
                    )}
                </div>

                {/* --- MODAIS --- */}
                
                {/* Modal Movimentação */}
                {isTransactionModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">{editingId ? 'Editar Movimentação' : 'Nova Movimentação'}</h3>
                                <button onClick={() => setIsTransactionModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleSubmitTransaction} className="space-y-4">
                                <div className="grid grid-cols-3 gap-2">
                                    {[TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.INVESTMENT].map(type => (
                                        <button key={type} type="button" onClick={() => setFormData({...formData, type})} className={`p-2 rounded border text-xs font-bold ${formData.type === type ? (type === 'INCOME' ? 'bg-emerald-600 border-emerald-600 text-white' : type === 'EXPENSE' ? 'bg-red-600 border-red-600 text-white' : 'bg-amber-600 border-amber-600 text-white') : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                            {type === 'INCOME' ? 'Entrada' : type === 'EXPENSE' ? 'Saída' : 'Aporte/Inv.'}
                                        </button>
                                    ))}
                                </div>
                                <div><input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} onBlur={handleDescriptionBlur} placeholder="Descrição" required /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required placeholder="Valor" />
                                    <input type="date" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Categoria" />
                                    <select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})}>
                                        <option value="">Carteira Padrão</option>
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                    </select>
                                </div>
                                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2"><Repeat size={14} /> Recorrência</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white" value={formData.recurrencePeriod} onChange={e => setFormData({...formData, recurrencePeriod: e.target.value as RecurrencePeriod})}>
                                            <option value="NONE">Não Repetir</option>
                                            <option value="DAILY">Diário</option>
                                            <option value="WEEKLY">Semanal</option>
                                            <option value="MONTHLY">Mensal</option>
                                            <option value="YEARLY">Anual</option>
                                        </select>
                                        {formData.recurrencePeriod !== 'NONE' && (
                                            <div className="flex items-center gap-2">
                                                <input type="number" min="1" className="w-12 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white text-center" value={formData.recurrenceInterval} onChange={e => setFormData({...formData, recurrenceInterval: parseInt(e.target.value)})} />
                                                <span className="text-xs text-slate-500">{formData.recurrencePeriod === 'DAILY' ? 'dias' : formData.recurrencePeriod === 'WEEKLY' ? 'sem.' : formData.recurrencePeriod === 'MONTHLY' ? 'meses' : 'anos'}</span>
                                            </div>
                                        )}
                                    </div>
                                    {formData.recurrencePeriod !== 'NONE' && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs text-slate-500">Encerrar após:</span>
                                            <input type="number" placeholder="∞" className="w-16 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white text-center" value={formData.recurrenceLimit} onChange={e => setFormData({...formData, recurrenceLimit: e.target.value})} />
                                            <span className="text-xs text-slate-500">vezes</span>
                                        </div>
                                    )}
                                </div>
                                <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-bold py-3 rounded-lg transition-colors">{editingId ? 'Salvar Alterações' : 'Confirmar Lançamento'}</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Investimento */}
                {isInvestModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl">
                             <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">{editingInvestId ? 'Editar Investimento' : 'Novo Ativo'}</h3>
                                <button onClick={() => setIsInvestModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleSubmitInvest} className="space-y-4">
                                <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={investFormData.name} onChange={e => setInvestFormData({...investFormData, name: e.target.value})} placeholder="Nome do Ativo" required />
                                <div className="grid grid-cols-2 gap-4">
                                    <select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={investFormData.type} onChange={e => setInvestFormData({...investFormData, type: e.target.value as InvestmentType})}>
                                        <option value="CDB">CDB</option>
                                        <option value="TESOURO">Tesouro Direto</option>
                                        <option value="ACOES">Ações</option>
                                        <option value="FII">FIIs</option>
                                        <option value="CRYPTO">Criptomoedas</option>
                                        <option value="POUPANCA">Poupança</option>
                                        <option value="OUTRO">Outro</option>
                                    </select>
                                    <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={investFormData.amount} onChange={e => setInvestFormData({...investFormData, amount: e.target.value})} required placeholder="Valor" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={investFormData.yieldRate} onChange={e => setInvestFormData({...investFormData, yieldRate: e.target.value})} placeholder="Rentabilidade %" />
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={investFormData.redemptionTerms} onChange={e => setInvestFormData({...investFormData, redemptionTerms: e.target.value})} placeholder="Resgate" />
                                </div>
                                <input type="date" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={investFormData.startDate} onChange={e => setInvestFormData({...investFormData, startDate: e.target.value})} />
                                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold py-3 rounded-lg transition-colors">{editingInvestId ? 'Salvar Alterações' : 'Adicionar Ativo à Carteira'}</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Nova Meta */}
                {isGoalModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
                             <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Nova Meta</h3>
                                <button onClick={() => setIsGoalModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleCreateGoal} className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Nome da Meta</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none" value={goalFormData.name} onChange={e => setGoalFormData({...goalFormData, name: e.target.value})} placeholder="Ex: Viagem Europa" required />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Valor Alvo (R$)</label>
                                    <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none" value={goalFormData.targetAmount} onChange={e => setGoalFormData({...goalFormData, targetAmount: e.target.value})} required />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Prazo</label>
                                    <input type="date" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none" value={goalFormData.deadline} onChange={e => setGoalFormData({...goalFormData, deadline: e.target.value})} required />
                                </div>
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors">Criar Meta</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Histórico Meta */}
                {viewGoalHistoryId && (
                     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl h-[60vh] flex flex-col">
                             <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
                                <h3 className="text-xl font-bold text-white">Histórico de Movimentações</h3>
                                <button onClick={() => setViewGoalHistoryId(null)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-slate-800 text-slate-200 uppercase text-xs sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Data</th>
                                            <th className="px-4 py-2 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {goalHistory.map(entry => (
                                            <tr key={entry.id}>
                                                <td className="px-4 py-3">{new Date(entry.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} {new Date(entry.date).toLocaleTimeString('pt-BR')}</td>
                                                <td className={`px-4 py-3 text-right font-bold ${entry.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {entry.amount > 0 ? '+' : ''}{formatCurrency(Number(entry.amount))}
                                                </td>
                                            </tr>
                                        ))}
                                        {goalHistory.length === 0 && <tr><td colSpan={2} className="p-4 text-center">Nenhum registro encontrado.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                 {/* Modal Tarefa */}
                 {isTaskModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
                             <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">{editingTaskId ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
                                <button onClick={() => setIsTaskModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleSubmitTask} className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Descrição</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-purple-500 focus:outline-none" value={taskFormData.description} onChange={e => setTaskFormData({...taskFormData, description: e.target.value})} placeholder="Ex: Pagar conta de luz" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Data Limite</label>
                                        <input type="date" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-purple-500 focus:outline-none" value={taskFormData.dueDate} onChange={e => setTaskFormData({...taskFormData, dueDate: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Prioridade</label>
                                        <select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-purple-500 focus:outline-none" value={taskFormData.priority} onChange={e => setTaskFormData({...taskFormData, priority: e.target.value as TaskPriority})}>
                                            <option value="LOW">Baixa</option>
                                            <option value="MEDIUM">Média</option>
                                            <option value="HIGH">Alta</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Recorrência</label>
                                    <select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-purple-500 focus:outline-none" value={taskFormData.recurrence} onChange={e => setTaskFormData({...taskFormData, recurrence: e.target.value as RecurrencePeriod})}>
                                        <option value="NONE">Nenhuma</option>
                                        <option value="DAILY">Diária</option>
                                        <option value="WEEKLY">Semanal</option>
                                        <option value="MONTHLY">Mensal</option>
                                        <option value="YEARLY">Anual</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors">{editingTaskId ? 'Salvar' : 'Adicionar Tarefa'}</button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const StatCard = ({ title, value, icon, colorClass, onClick }: any) => (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group flex flex-col justify-between h-40">
        <div className="flex justify-between items-start">
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-20`}>{icon}</div>
            {onClick && <button onClick={onClick} className="text-xs text-slate-500 hover:text-white bg-slate-800 px-2 py-1 rounded">Detalhes</button>}
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
