import React, { useState } from 'react';
import { Transaction, TransactionType, DateRangeOption, RecurrencePeriod } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Plus, X, List, Trash2, Edit2, Tag, CalendarRange, Download, FileSpreadsheet, FileText, Repeat } from 'lucide-react';

interface FinancialModuleProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  isDarkMode: boolean;
}

const COLORS_EXPENSE = ['#ef4444', '#f87171', '#b91c1c', '#991b1b', '#fca5a5'];
const COLORS_INCOME = ['#10b981', '#34d399', '#059669', '#047857', '#6ee7b7'];
const COLORS_INVEST = ['#f59e0b', '#fbbf24', '#d97706', '#b45309', '#fcd34d'];

export const FinancialModule: React.FC<FinancialModuleProps> = ({ transactions, onAddTransaction, onDeleteTransaction, isDarkMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTrans, setNewTrans] = useState<{description: string, amount: string, type: TransactionType, category: string, recurrencePeriod: RecurrencePeriod, recurrenceInterval: number, recurrenceLimit: string }>({ 
      description: '', amount: '', type: TransactionType.EXPENSE, category: '', recurrencePeriod: 'NONE', recurrenceInterval: 1, recurrenceLimit: ''
  });

  // Details Modal State
  const [detailsView, setDetailsView] = useState<TransactionType | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>('30D');

  // --- Filter ---
  const filterTransactionsByDate = (txs: Transaction[]) => {
      const now = new Date();
      let days = 30;
      if (dateRange === '7D') days = 7;
      if (dateRange === '15D') days = 15;
      if (dateRange === '30D') days = 30;
      if (dateRange === '60D') days = 60;
      if (dateRange === 'CUSTOM') return txs; 
      const cutoff = new Date(now.setDate(now.getDate() - days));
      return txs.filter(t => new Date(t.date) >= cutoff);
  };
  const filteredData = filterTransactionsByDate(transactions);

  // --- Chart Data Logic ---
  const totalIncome = filteredData.filter(t => t.type === TransactionType.INCOME).reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredData.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, curr) => acc + curr.amount, 0);
  const totalInvested = filteredData.filter(t => t.type === TransactionType.INVESTMENT).reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense - totalInvested;

  const overviewChartData = [
    { name: 'Entradas', value: totalIncome, fill: '#10b981' },
    { name: 'Saídas', value: totalExpense, fill: '#ef4444' },
    { name: 'Invest.', value: totalInvested, fill: '#f59e0b' },
  ];

  const getCategoryData = (type: TransactionType) => {
      const grouped = filteredData.filter(t => t.type === type).reduce((acc:any, curr) => {
          acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
          return acc;
      }, {});
      return Object.keys(grouped).map(k => ({ name: k, value: grouped[k] }));
  };

  const incomeChartData = getCategoryData(TransactionType.INCOME);
  const expenseChartData = getCategoryData(TransactionType.EXPENSE);
  const investChartData = getCategoryData(TransactionType.INVESTMENT);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrans.description || !newTrans.amount) return;
    onAddTransaction({
      description: newTrans.description,
      amount: parseFloat(newTrans.amount),
      type: newTrans.type,
      category: newTrans.category || 'Geral',
      date: new Date().toISOString(),
      recurrencePeriod: newTrans.recurrencePeriod,
      recurrenceInterval: newTrans.recurrenceInterval,
      recurrenceLimit: newTrans.recurrenceLimit ? parseInt(newTrans.recurrenceLimit) : 0
    });
    setNewTrans({ description: '', amount: '', type: TransactionType.EXPENSE, category: '', recurrencePeriod: 'NONE', recurrenceInterval: 1, recurrenceLimit: '' });
    setIsModalOpen(false);
  };

  const getDetailsTitle = (type: TransactionType) => {
      if (type === TransactionType.INCOME) return 'Detalhamento de Entradas';
      if (type === TransactionType.EXPENSE) return 'Detalhamento de Saídas';
      return 'Detalhamento de Reservas & Investimentos';
  };

  const filteredTransactionsForDetails = detailsView ? filteredData.filter(t => t.type === detailsView) : [];
  const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6 animate-fade-in relative pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className={`text-3xl font-serif ${textPrimary}`}>Gestão Financeira</h2>
          <p className={textSecondary}>CFO Digital Dashboard</p>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-4 w-full md:w-auto">
             <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <CalendarRange size={16} className={textSecondary} />
                <select value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRangeOption)} className={`bg-transparent text-sm font-medium focus:outline-none ${textPrimary}`}>
                    <option value="7D">Últimos 7 dias</option>
                    <option value="15D">Últimos 15 dias</option>
                    <option value="30D">Últimos 30 dias</option>
                    <option value="60D">Últimos 60 dias</option>
                    <option value="CUSTOM">Todo Período</option>
                </select>
             </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-gold-600 hover:bg-gold-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg shadow-gold-900/20">
                <Plus size={18} /> <span className="hidden md:inline">Nova Transação</span>
            </button>
        </div>
      </header>
      
      {/* 4 CHARTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Chart 1: Overview */}
          <div className={`p-4 rounded-xl border ${cardBg}`}>
              <h3 className={`text-sm font-bold uppercase mb-4 ${textSecondary}`}>Visão Geral</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overviewChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </div>
          
          {/* Chart 2: Income */}
          <div className={`p-4 rounded-xl border ${cardBg}`}>
              <h3 className={`text-sm font-bold uppercase mb-4 ${textSecondary}`}>Entradas por Categoria</h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={incomeChartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {incomeChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS_INCOME[index % COLORS_INCOME.length]} />))}
                          </Pie>
                          <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}} />
                          <Legend />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Chart 3: Expense */}
          <div className={`p-4 rounded-xl border ${cardBg}`}>
              <h3 className={`text-sm font-bold uppercase mb-4 ${textSecondary}`}>Saídas por Categoria</h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={expenseChartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {expenseChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS_EXPENSE[index % COLORS_EXPENSE.length]} />))}
                          </Pie>
                          <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}} />
                          <Legend />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>

           {/* Chart 4: Investment */}
           <div className={`p-4 rounded-xl border ${cardBg}`}>
              <h3 className={`text-sm font-bold uppercase mb-4 ${textSecondary}`}>Investimentos</h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={investChartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {investChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS_INVEST[index % COLORS_INVEST.length]} />))}
                          </Pie>
                          <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}} />
                          <Legend />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* Manual Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-serif ${textPrimary}`}>Nova Transação</h3>
                    <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-red-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.INVESTMENT].map(t => (
                                <button type="button" key={t} onClick={() => setNewTrans({...newTrans, type: t})} className={`py-2 text-xs font-bold rounded border ${newTrans.type === t ? 'bg-slate-700 text-white border-gold-500' : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600')}`}>
                                    {t === 'INCOME' ? 'ENTRADA' : t === 'EXPENSE' ? 'SAÍDA' : 'INVEST.'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Descrição</label>
                        <input className="w-full border rounded p-2 bg-transparent focus:border-gold-500 focus:outline-none" value={newTrans.description} onChange={e => setNewTrans({...newTrans, description: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Valor (R$)</label>
                            <input type="number" step="0.01" className="w-full border rounded p-2 bg-transparent focus:border-gold-500 focus:outline-none" value={newTrans.amount} onChange={e => setNewTrans({...newTrans, amount: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Categoria</label>
                            <input className="w-full border rounded p-2 bg-transparent focus:border-gold-500 focus:outline-none" placeholder="Ex: Salário" value={newTrans.category} onChange={e => setNewTrans({...newTrans, category: e.target.value})} />
                        </div>
                    </div>

                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <label className="block text-xs text-slate-400 mb-2 font-bold uppercase">Recorrência</label>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <select value={newTrans.recurrencePeriod} onChange={e => setNewTrans({...newTrans, recurrencePeriod: e.target.value as any})} className="bg-slate-900 border border-slate-700 rounded p-2 text-xs">
                                <option value="NONE">Não Repetir</option>
                                <option value="DAILY">Diário</option>
                                <option value="WEEKLY">Semanal</option>
                                <option value="MONTHLY">Mensal</option>
                                <option value="YEARLY">Anual</option>
                            </select>
                            {newTrans.recurrencePeriod !== 'NONE' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">A cada</span>
                                    <input type="number" min="1" value={newTrans.recurrenceInterval} onChange={e => setNewTrans({...newTrans, recurrenceInterval: parseInt(e.target.value)})} className="w-12 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-center" />
                                    <span className="text-xs text-slate-400">{newTrans.recurrencePeriod === 'DAILY' ? 'dias' : newTrans.recurrencePeriod === 'MONTHLY' ? 'meses' : 'anos'}</span>
                                </div>
                            )}
                        </div>
                        {newTrans.recurrencePeriod !== 'NONE' && (
                             <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-slate-400">Finalizar após</span>
                                <input type="number" min="1" max="100" placeholder="∞" value={newTrans.recurrenceLimit} onChange={e => setNewTrans({...newTrans, recurrenceLimit: e.target.value})} className="w-16 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-center" />
                                <span className="text-xs text-slate-400">vezes</span>
                             </div>
                        )}
                    </div>

                    <button type="submit" className="w-full bg-gold-600 hover:bg-gold-500 text-white font-bold py-3 rounded mt-4">Confirmar</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};