
import React, { useState } from 'react';
import { User, Transaction, Account, TransactionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LayoutDashboard, ArrowRightLeft, CreditCard, Target, LogOut, Plus, ArrowUpCircle, ArrowDownCircle, MoreVertical, Bot } from 'lucide-react';

interface DashboardProps {
    user: User | null;
    accounts: Account[];
    transactions: Transaction[];
    onLogout: () => void;
    onRefreshData: () => void;
}

const formatCurrency = (val: number) => (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const Dashboard: React.FC<DashboardProps> = ({ user, accounts, transactions, onLogout, onRefreshData }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTrans, setNewTrans] = useState({ description: '', amount: '', type: TransactionType.EXPENSE, accountId: '' });

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const monthlyIncome = transactions
        .filter(t => t.type === 'INCOME' && new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyExpense = transactions
        .filter(t => t.type === 'EXPENSE' && new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const handleAddTransaction = async () => {
        // Mock API call for now
        console.log("Adding transaction:", newTrans);
        onRefreshData(); // Refresh data after action
        setIsModalOpen(false);
        setNewTrans({ description: '', amount: '', type: TransactionType.EXPENSE, accountId: '' });
    };
    
    return (
        <div className="flex h-screen bg-slate-950">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 p-6 flex-col justify-between hidden md:flex">
                <div>
                    <div className="flex items-center gap-2 mb-10">
                        <Bot size={24} className="text-primary" />
                        <h1 className="text-2xl font-serif font-bold text-white">Alfred IA</h1>
                    </div>
                    <nav className="space-y-2">
                        <button className="w-full text-left p-3 rounded-lg flex gap-3 transition-colors bg-slate-800 text-primary font-bold"><LayoutDashboard size={20}/> Visão Geral</button>
                        <button className="w-full text-left p-3 rounded-lg flex gap-3 transition-colors text-slate-400 hover:bg-slate-800"><ArrowRightLeft size={20}/> Transações</button>
                        <button className="w-full text-left p-3 rounded-lg flex gap-3 transition-colors text-slate-400 hover:bg-slate-800"><CreditCard size={20}/> Cartões</button>
                        <button className="w-full text-left p-3 rounded-lg flex gap-3 transition-colors text-slate-400 hover:bg-slate-800"><Target size={20}/> Metas</button>
                    </nav>
                </div>
                <button onClick={onLogout} className="w-full flex gap-3 p-3 text-slate-500 hover:text-red-400 transition-colors border-t border-slate-800"><LogOut size={20}/> Sair</button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8">
                    <div>
                        <h2 className="text-xl font-bold text-white">Seu painel, Senhor {user?.name.split(' ')[0]}.</h2>
                        <p className="text-sm text-slate-400">Aqui está o resumo da sua propriedade.</p>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-dark text-slate-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                        <Plus size={18} /> Novo Registro
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700"><p className="text-sm text-slate-400">Saldo Total</p><p className="text-3xl font-bold text-white">{formatCurrency(totalBalance)}</p></div>
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700"><p className="text-sm text-slate-400">Receitas do Mês</p><p className="text-3xl font-bold text-emerald-400">{formatCurrency(monthlyIncome)}</p></div>
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700"><p className="text-sm text-slate-400">Despesas do Mês</p><p className="text-3xl font-bold text-red-400">{formatCurrency(monthlyExpense)}</p></div>
                    </div>

                    {/* Transactions List */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl">
                        <h3 className="text-lg font-bold text-white p-6">Últimos Registros</h3>
                        <div className="divide-y divide-slate-800">
                            {transactions.length > 0 ? transactions.slice(0, 5).map(t => (
                                <div key={t.id} className="p-4 flex justify-between items-center hover:bg-slate-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {t.type === 'INCOME' ? <ArrowUpCircle size={20}/> : <ArrowDownCircle size={20}/>}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{t.description}</p>
                                            <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()} • {t.category || 'Sem Categoria'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`font-bold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </span>
                                        <button className="text-slate-500 hover:text-white"><MoreVertical size={16} /></button>
                                    </div>
                                </div>
                            )) : <p className="p-6 text-center text-slate-500">Nenhum registro encontrado.</p>}
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Transaction Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-6">Novo Registro</h3>
                        <div className="space-y-4">
                            <input placeholder="Descrição" className="w-full bg-slate-800 p-3 rounded text-white" value={newTrans.description} onChange={e => setNewTrans({...newTrans, description: e.target.value})} />
                            <div className="flex gap-4">
                                <input type="number" placeholder="Valor" className="w-1/2 bg-slate-800 p-3 rounded text-white" value={newTrans.amount} onChange={e => setNewTrans({...newTrans, amount: e.target.value})} />
                                <select className="w-1/2 bg-slate-800 p-3 rounded text-white" value={newTrans.type} onChange={e => setNewTrans({...newTrans, type: e.target.value as any})}>
                                    <option value="EXPENSE">Despesa</option>
                                    <option value="INCOME">Receita</option>
                                </select>
                            </div>
                            <select className="w-full bg-slate-800 p-3 rounded text-white" value={newTrans.accountId} onChange={e => setNewTrans({...newTrans, accountId: e.target.value})}>
                                <option value="">Selecione a Conta</option>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-4 pt-6 mt-4 border-t border-slate-800">
                            <button onClick={() => setIsModalOpen(false)} className="w-full py-2 text-slate-400 rounded hover:bg-slate-800 transition-colors">Cancelar</button>
                            <button onClick={handleAddTransaction} className="w-full py-2 bg-primary text-slate-900 font-bold rounded hover:bg-primary-dark transition-colors">Adicionar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
