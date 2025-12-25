import React, { useState } from 'react';
import { Transaction, TransactionType, DateRangeOption, RecurrencePeriod } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Plus, X, List, Trash2, Edit2, Tag, CalendarRange, Download, FileSpreadsheet, FileText, Repeat, ArrowUpCircle, ArrowDownCircle, Target } from 'lucide-react';

interface FinancialModuleProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onEditTransaction: (id: string, updates: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  isDarkMode: boolean;
}

const COLORS_EXPENSE = ['#ef4444', '#f87171', '#b91c1c', '#991b1b', '#fca5a5'];
const COLORS_INCOME = ['#10b981', '#34d399', '#059669', '#047857', '#6ee7b7'];
const COLORS_INVEST = ['#f59e0b', '#fbbf24', '#d97706', '#b45309', '#fcd34d'];

export const FinancialModule: React.FC<FinancialModuleProps> = ({ transactions, onAddTransaction, onEditTransaction, onDeleteTransaction, isDarkMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
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

  const openModal = (type: TransactionType) => {
      setEditingTransaction(null);
      setNewTrans({ description: '', amount: '', type, category: '', recurrencePeriod: 'NONE', recurrenceInterval: 1, recurrenceLimit: '' });
      setIsModalOpen(true);
  };

  const openEditModal = (t: Transaction) => {
      setEditingTransaction(t);
      setNewTrans({
          description: t.description,
          amount: t.amount.toString(),
          type: t.type,
          category: t.category,
          recurrencePeriod: t.recurrencePeriod || 'NONE',
          recurrenceInterval: t.recurrenceInterval || 1,
          recurrenceLimit: t.recurrenceLimit ? t.recurrenceLimit.toString() : ''
      });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrans.description || !newTrans.amount) return;

    const transactionData: any = {
      description: newTrans.description,
      amount: parseFloat(newTrans.amount),
      type: newTrans.type,
      category: newTrans.category || 'Geral',
      date: editingTransaction ? editingTransaction.date : new Date().toISOString(), // Keep original date if editing
      recurrencePeriod: newTrans.recurrencePeriod,
      recurrenceInterval: newTrans.recurrenceInterval,
      recurrenceLimit: newTrans.recurrenceLimit ? parseInt(newTrans.recurrenceLimit) : 0
    };

    if (editingTransaction) {
        onEditTransaction(editingTransaction.id, transactionData);
    } else {
        onAddTransaction(transactionData);
    }

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
        </div>
      </header>
      
      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button 
            onClick={() => openModal(TransactionType.INCOME)}
            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg hover:scale-[1.02]"
          >
              <ArrowUpCircle size={24} /> Nova Entrada
          </button>
          <button 
            onClick={() => openModal(TransactionType.EXPENSE)}
            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg hover:scale-[1.02]"
          >
              <ArrowDownCircle size={24} /> Nova Saída
          </button>
          <button 
            onClick={() => openModal(TransactionType.INVESTMENT)}
            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gold-600 hover:bg-gold-500 text-white font-bold transition-all shadow-lg hover:scale-[1.02]"
          >
              <Target size={24} /> Novo Investimento
          </button>
      </div>

      {/* OVERVIEW BAR CHART */}
      <div className={`p-6 rounded-xl border mb-6 ${cardBg}`}>
           <h3 className={`text-sm font-bold uppercase mb-4 ${textSecondary}`}>Visão Geral (Comparativo)</h3>
           <div className="h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overviewChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                           {overviewChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                           ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
           </div>
      </div>

      {/* 3 DETAILED CARDS (INCOME, EXPENSE, INVESTMENT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* INCOME CARD */}
          <div className={`p-4 rounded-xl border flex flex-col ${cardBg}`}>
              <div className="flex justify-between items-center mb-2">
                  <h3 className={`text-sm font-bold uppercase ${textSecondary}`}>Entradas</h3>
                  <ArrowUpCircle size={20} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-serif font-bold text-emerald-400 mb-4">
                  R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="h-40 mb-4 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={incomeChartData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                              {incomeChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS_INCOME[index % COLORS_INCOME.length]} />))}
                          </Pie>
                          <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <button 
                  onClick={() => setDetailsView(TransactionType.INCOME)}
                  className="w-full py-2 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                  <List size={16} /> Ver Detalhes
              </button>
          </div>

          {/* EXPENSE CARD */}
          <div className={`p-4 rounded-xl border flex flex-col ${cardBg}`}>
              <div className="flex justify-between items-center mb-2">
                  <h3 className={`text-sm font-bold uppercase ${textSecondary}`}>Saídas</h3>
                  <ArrowDownCircle size={20} className="text-red-500" />
              </div>
              <p className="text-2xl font-serif font-bold text-red-400 mb-4">
                  R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="h-40 mb-4 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={expenseChartData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                              {expenseChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS_EXPENSE[index % COLORS_EXPENSE.length]} />))}
                          </Pie>
                          <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <button 
                  onClick={() => setDetailsView(TransactionType.EXPENSE)}
                  className="w-full py-2 rounded-lg bg-red-500/10 text-red-400 font-bold hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                  <List size={16} /> Ver Detalhes
              </button>
          </div>

          {/* INVESTMENT CARD */}
          <div className={`p-4 rounded-xl border flex flex-col ${cardBg}`}>
              <div className="flex justify-between items-center mb-2">
                  <h3 className={`text-sm font-bold uppercase ${textSecondary}`}>Investimentos</h3>
                  <Target size={20} className="text-gold-500" />
              </div>
              <p className="text-2xl font-serif font-bold text-gold-400 mb-4">
                  R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="h-40 mb-4 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={investChartData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                              {investChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS_INVEST[index % COLORS_INVEST.length]} />))}
                          </Pie>
                          <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <button 
                  onClick={() => setDetailsView(TransactionType.INVESTMENT)}
                  className="w-full py-2 rounded-lg bg-gold-500/10 text-gold-400 font-bold hover:bg-gold-500 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                  <List size={16} /> Ver Detalhes
              </button>
          </div>
      </div>

      {/* Manual Entry/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-serif ${textPrimary}`}>
                        {editingTransaction ? 'Editar Transação' : (newTrans.type === 'INCOME' ? 'Nova Entrada' : newTrans.type === 'EXPENSE' ? 'Nova Saída' : 'Novo Investimento')}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-red-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Visual Type Indicator */}
                    <div className="flex justify-center mb-4">
                        <div className={`p-3 rounded-full ${
                            newTrans.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-500' :
                            newTrans.type === 'EXPENSE' ? 'bg-red-500/20 text-red-500' :
                            'bg-gold-500/20 text-gold-500'
                        }`}>
                            {newTrans.type === 'INCOME' ? <ArrowUpCircle size={32} /> :
                             newTrans.type === 'EXPENSE' ? <ArrowDownCircle size={32} /> :
                             <Target size={32} />}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Descrição</label>
                        <input className="w-full border rounded p-2 bg-transparent focus:border-gold-500 focus:outline-none" value={newTrans.description} onChange={e => setNewTrans({...newTrans, description: e.target.value})} required autoFocus />
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

                    <button type="submit" className={`w-full font-bold py-3 rounded mt-4 text-white ${
                         newTrans.type === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-500' :
                         newTrans.type === 'EXPENSE' ? 'bg-red-600 hover:bg-red-500' :
                         'bg-gold-600 hover:bg-gold-500'
                    }`}>
                        {editingTransaction ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                    </button>
                </form>
            </div>
        </div>
      )}

       {/* Details Modal */}
       {detailsView && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className={`${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl`}>
                  <div className={`p-6 border-b flex justify-between items-center rounded-t-xl ${isDarkMode ? 'bg-slate-850 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div>
                          <h3 className={`text-2xl font-serif ${textPrimary}`}>{getDetailsTitle(detailsView)}</h3>
                      </div>
                      <button onClick={() => setDetailsView(null)}><X className="text-slate-400 hover:text-red-500" /></button>
                  </div>
                  <div className={`flex-1 overflow-y-auto p-6 custom-scrollbar ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className={`text-xs uppercase sticky top-0 ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Data</th>
                                    <th className="px-4 py-3">Descrição</th>
                                    <th className="px-4 py-3">Categoria</th>
                                    <th className="px-4 py-3">Recorrência</th>
                                    <th className="px-4 py-3 text-right">Valor</th>
                                    <th className="px-4 py-3 text-center rounded-r-lg">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactionsForDetails.slice().reverse().map(t => (
                                    <tr key={t.id} className={`border-b transition-colors ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                                        <td className="px-4 py-3">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                        <td className={`px-4 py-3 font-medium ${textPrimary}`}>{t.description}</td>
                                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>{t.category}</span></td>
                                        <td className="px-4 py-3">
                                            {t.recurrencePeriod === 'MONTHLY' && <span className="flex items-center gap-1 text-blue-400"><Repeat size={12} /> Mensal</span>}
                                            {t.recurrencePeriod === 'WEEKLY' && <span className="flex items-center gap-1 text-purple-400"><Repeat size={12} /> Semanal</span>}
                                            {(!t.recurrencePeriod || t.recurrencePeriod === 'NONE') && '-'}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-bold ${detailsView === TransactionType.INCOME ? 'text-emerald-400' : detailsView === TransactionType.EXPENSE ? 'text-red-400' : 'text-gold-400'}`}>
                                            R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-center flex justify-center gap-2">
                                            <button onClick={() => openEditModal(t)} className="p-1 hover:bg-blue-500/10 rounded text-slate-500 hover:text-blue-400 transition-colors" title="Editar"><Edit2 size={16} /></button>
                                            <button onClick={() => onDeleteTransaction(t.id)} className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400 transition-colors" title="Excluir"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};