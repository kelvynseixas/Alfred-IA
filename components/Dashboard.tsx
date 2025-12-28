
import React, { useState, useEffect, useMemo } from 'react';
import { User, Transaction, Account, TransactionType, DateRangeOption, RecurrencePeriod, Investment, InvestmentType } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { 
  LayoutDashboard, ArrowRightLeft, CreditCard, Target, LogOut, 
  Plus, ArrowUpCircle, ArrowDownCircle, MoreVertical, Bot, 
  Menu, X, Wallet, TrendingUp, TrendingDown, Calendar, Search, 
  CalendarRange, List, Trash2, Edit2, Repeat, Briefcase, Calculator
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
const formatPercent = (val: number) => (val || 0).toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 2 });

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

type ViewMode = 'FINANCE' | 'INVESTMENTS';

export const Dashboard: React.FC<DashboardProps & { investments?: Investment[] }> = ({ user, accounts, transactions, investments = [], onLogout, onRefreshData }) => {
    
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

    // --- LÓGICA FINANCEIRA ---
    const filteredTransactions = useMemo(() => {
        const now = new Date(); now.setHours(0,0,0,0);
        return transactions.filter(t => {
            const tDate = new Date(t.date); tDate.setHours(0,0,0,0);
            switch (dateRange) {
                case 'TODAY': return tDate.getTime() === now.getTime();
                case 'YESTERDAY': const yest = new Date(now); yest.setDate(yest.getDate() - 1); return tDate.getTime() === yest.getTime();
                case '7D': { const cut = new Date(now); cut.setDate(cut.getDate() - 7); return tDate >= cut; }
                case '15D': { const cut = new Date(now); cut.setDate(cut.getDate() - 15); return tDate >= cut; }
                case '30D': { const cut = new Date(now); cut.setDate(cut.getDate() - 30); return tDate >= cut; }
                case '60D': { const cut = new Date(now); cut.setDate(cut.getDate() - 60); return tDate >= cut; }
                case '90D': { const cut = new Date(now); cut.setDate(cut.getDate() - 90); return tDate >= cut; }
                case 'CUSTOM': if (!customStart || !customEnd) return true; return tDate >= new Date(customStart) && tDate <= new Date(customEnd);
                default: return true;
            }
        });
    }, [transactions, dateRange, customStart, customEnd]);

    const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);
    const totalIncome = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + Number(t.amount), 0);
    const totalExpense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + Number(t.amount), 0);
    const totalInvestedFlow = filteredTransactions.filter(t => t.type === TransactionType.INVESTMENT).reduce((acc, t) => acc + Number(t.amount), 0);

    // --- ACTIONS FINANCEIRO ---
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
        setFormData({
            description: t.description, amount: t.amount.toString(), type: t.type, category: t.category, accountId: t.accountId, date: new Date(t.date).toISOString().split('T')[0],
            recurrencePeriod: t.recurrencePeriod || 'NONE', recurrenceInterval: t.recurrenceInterval || 1, recurrenceLimit: t.recurrenceLimit ? t.recurrenceLimit.toString() : ''
        });
        setIsTransactionModalOpen(true);
    };

    const handleSubmitTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('alfred_token');
        if (!token) return;

        const payload = { ...formData, amount: parseFloat(formData.amount), recurrenceLimit: formData.recurrenceLimit ? parseInt(formData.recurrenceLimit) : 0 };
        const url = editingId ? `/api/transactions/${editingId}` : '/api/transactions';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                onRefreshData();
                setIsTransactionModalOpen(false);
            } else {
                alert("Erro ao salvar.");
            }
        } catch (error) { console.error(error); }
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

    // --- LÓGICA INVESTIMENTOS ---
    const totalInvestmentsAssets = investments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const avgYield = investments.length > 0 ? investments.reduce((acc, curr) => acc + Number(curr.yieldRate), 0) / investments.length : 0;
    
    // Projeção Simples (Juros Compostos Mensais aproximados)
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

    const openInvestModal = (inv?: Investment) => {
        if (inv) {
            setEditingInvestId(inv.id);
            setInvestFormData({
                name: inv.name, type: inv.type, amount: inv.amount.toString(), yieldRate: inv.yieldRate.toString(),
                redemptionTerms: inv.redemptionTerms, startDate: new Date(inv.startDate).toISOString().split('T')[0]
            });
        } else {
            setEditingInvestId(null);
            setInvestFormData({
                name: '', type: InvestmentType.CDB, amount: '', yieldRate: '', redemptionTerms: 'No Vencimento', startDate: new Date().toISOString().split('T')[0]
            });
        }
        setIsInvestModalOpen(true);
    };

    const handleSubmitInvest = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('alfred_token');
        if (!token) return;
        
        const payload = { ...investFormData, amount: parseFloat(investFormData.amount), yieldRate: parseFloat(investFormData.yieldRate) };
        const url = editingInvestId ? `/api/investments/${editingInvestId}` : '/api/investments';
        const method = editingInvestId ? 'PUT' : 'POST';

        try {
            await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            onRefreshData();
            setIsInvestModalOpen(false);
        } catch (e) { console.error(e); }
    };

    const handleDeleteInvest = async (id: string) => {
        if (!confirm("Remover este investimento da carteira?")) return;
        const token = localStorage.getItem('alfred_token');
        await fetch(`/api/investments/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        onRefreshData();
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
                         <h2 className="text-xl font-bold text-white">{activeView === 'FINANCE' ? 'Gestão Financeira' : 'Carteira de Ativos'}</h2>
                    </div>
                    
                    {activeView === 'FINANCE' ? (
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
                    ) : (
                        <button onClick={() => openInvestModal()} className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 whitespace-nowrap">
                            <Plus size={18} /> Novo Ativo
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
                                                {/* <Cell key="income" fill="#10b981" /> */}
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
                                                        <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
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
                                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                                    <div className="p-4 bg-emerald-500/20 rounded-full text-emerald-500"><Wallet size={32} /></div>
                                    <div>
                                        <p className="text-slate-500 text-sm font-medium">Patrimônio Investido</p>
                                        <h3 className="text-3xl font-bold text-white">{formatCurrency(totalInvestmentsAssets)}</h3>
                                    </div>
                                    <div className="absolute -right-4 -bottom-4 opacity-5"><Wallet size={100} /></div>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                                    <div className="p-4 bg-blue-500/20 rounded-full text-blue-500"><TrendingUp size={32} /></div>
                                    <div>
                                        <p className="text-slate-500 text-sm font-medium">Rentabilidade Média (a.a)</p>
                                        <h3 className="text-3xl font-bold text-white">{formatPercent(avgYield / 100)}</h3>
                                    </div>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                                    <div className="p-4 bg-amber-500/20 rounded-full text-amber-500"><Calculator size={32} /></div>
                                    <div>
                                        <p className="text-slate-500 text-sm font-medium">Projeção (+12 Meses)</p>
                                        <h3 className="text-3xl font-bold text-amber-400">{formatCurrency(projectionData[12]?.value || 0)}</h3>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Lista de Ativos */}
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

                                {/* Gráfico de Projeção */}
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
                </div>

                {/* --- MODAIS --- */}
                
                {/* Modal Movimentação (Entrada/Saída/Investimento Fluxo) */}
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
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Descrição</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} onBlur={handleDescriptionBlur} placeholder="Ex: Salário, Uber..." required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Valor (R$)</label>
                                        <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Data</label>
                                        <input type="date" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Categoria</label>
                                        <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Automático" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Conta</label>
                                        <select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none" value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})}>
                                            <option value="">Carteira Padrão</option>
                                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                        </select>
                                    </div>
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

                {/* Modal Investimento (Ativo) */}
                {isInvestModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl">
                             <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">{editingInvestId ? 'Editar Investimento' : 'Novo Ativo'}</h3>
                                <button onClick={() => setIsInvestModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleSubmitInvest} className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Nome do Ativo</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-emerald-500 focus:outline-none" value={investFormData.name} onChange={e => setInvestFormData({...investFormData, name: e.target.value})} placeholder="Ex: Tesouro Selic 2029" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Tipo</label>
                                        <select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-emerald-500 focus:outline-none" value={investFormData.type} onChange={e => setInvestFormData({...investFormData, type: e.target.value as InvestmentType})}>
                                            <option value="CDB">CDB</option>
                                            <option value="TESOURO">Tesouro Direto</option>
                                            <option value="ACOES">Ações</option>
                                            <option value="FII">FIIs</option>
                                            <option value="CRYPTO">Criptomoedas</option>
                                            <option value="POUPANCA">Poupança</option>
                                            <option value="OUTRO">Outro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Valor Investido (R$)</label>
                                        <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-emerald-500 focus:outline-none" value={investFormData.amount} onChange={e => setInvestFormData({...investFormData, amount: e.target.value})} required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Rentabilidade (% a.a)</label>
                                        <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-emerald-500 focus:outline-none" value={investFormData.yieldRate} onChange={e => setInvestFormData({...investFormData, yieldRate: e.target.value})} placeholder="Ex: 12.5" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase font-bold">Resgate</label>
                                        <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-emerald-500 focus:outline-none" value={investFormData.redemptionTerms} onChange={e => setInvestFormData({...investFormData, redemptionTerms: e.target.value})} placeholder="Ex: D+1, 2029..." />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Data de Início</label>
                                    <input type="date" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-emerald-500 focus:outline-none" value={investFormData.startDate} onChange={e => setInvestFormData({...investFormData, startDate: e.target.value})} />
                                </div>
                                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold py-3 rounded-lg transition-colors">{editingInvestId ? 'Salvar Alterações' : 'Adicionar Ativo à Carteira'}</button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// Subcomponente simples para Card (para evitar repetição e limpar código principal)
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
