import React, { useState } from 'react';
import { Transaction, TransactionType, DateRangeOption } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Plus, X, List, Trash2, Edit2, Tag, CalendarRange, Download, FileSpreadsheet, FileText } from 'lucide-react';

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
  const [newTrans, setNewTrans] = useState({ description: '', amount: '', type: TransactionType.EXPENSE, category: '' });

  // Details Modal State
  const [detailsView, setDetailsView] = useState<TransactionType | null>(null);
  const [detailsTab, setDetailsTab] = useState<'EXTRATO' | 'CATEGORIAS'>('EXTRATO');

  // Filter State
  const [dateRange, setDateRange] = useState<DateRangeOption>('30D');

  // --- Calculations & Filtering ---
  const filterTransactionsByDate = (txs: Transaction[]) => {
      const now = new Date();
      let days = 30;
      if (dateRange === '7D') days = 7;
      if (dateRange === '15D') days = 15;
      if (dateRange === '30D') days = 30;
      if (dateRange === '60D') days = 60;
      if (dateRange === 'CUSTOM') return txs; // Simplified for this demo

      const cutoff = new Date(now.setDate(now.getDate() - days));
      return txs.filter(t => new Date(t.date) >= cutoff);
  };

  const filteredData = filterTransactionsByDate(transactions);

  const totalIncome = filteredData.filter(t => t.type === TransactionType.INCOME).reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredData.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, curr) => acc + curr.amount, 0);
  const totalInvested = filteredData.filter(t => t.type === TransactionType.INVESTMENT).reduce((acc, curr) => acc + curr.amount, 0);
  
  const balance = totalIncome - totalExpense - totalInvested;

  // Chart Data Preparation
  const overviewData = [
    { name: 'Entradas', valor: totalIncome },
    { name: 'Saídas', valor: totalExpense },
    { name: 'Reservas/Invest.', valor: totalInvested },
  ];

  const expenseData = Object.values(filteredData
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc: any, curr) => {
      acc[curr.category] = { name: curr.category, value: (acc[curr.category]?.value || 0) + curr.amount };
      return acc;
    }, {}));

  const incomeData = Object.values(filteredData
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc: any, curr) => {
      acc[curr.category] = { name: curr.category, value: (acc[curr.category]?.value || 0) + curr.amount };
      return acc;
    }, {}));

  const investmentData = Object.values(filteredData
    .filter(t => t.type === TransactionType.INVESTMENT)
    .reduce((acc: any, curr) => {
      acc[curr.category] = { name: curr.category, value: (acc[curr.category]?.value || 0) + curr.amount };
      return acc;
    }, {}));


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrans.description || !newTrans.amount) return;
    onAddTransaction({
      description: newTrans.description,
      amount: parseFloat(newTrans.amount),
      type: newTrans.type,
      category: newTrans.category || 'Geral',
      date: new Date().toISOString()
    });
    setNewTrans({ description: '', amount: '', type: TransactionType.EXPENSE, category: '' });
    setIsModalOpen(false);
  };

  // --- Helper for Details Modal ---
  const getDetailsTitle = (type: TransactionType) => {
      if (type === TransactionType.INCOME) return 'Detalhamento de Entradas';
      if (type === TransactionType.EXPENSE) return 'Detalhamento de Saídas';
      return 'Detalhamento de Reservas & Investimentos';
  };

  const filteredTransactionsForDetails = detailsView 
    ? filteredData.filter(t => t.type === detailsView) 
    : [];
  
  const uniqueCategories = Array.from(new Set(filteredTransactionsForDetails.map(t => t.category)));

  // Style constants based on theme
  const cardBg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6 animate-fade-in relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className={`text-3xl font-serif ${textPrimary}`}>Gestão Financeira</h2>
          <p className={textSecondary}>CFO Digital Dashboard</p>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-4 w-full md:w-auto">
             {/* Date Filter */}
             <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <CalendarRange size={16} className={textSecondary} />
                <select 
                    value={dateRange} 
                    onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
                    className={`bg-transparent text-sm font-medium focus:outline-none ${textPrimary}`}
                >
                    <option value="7D">Últimos 7 dias</option>
                    <option value="15D">Últimos 15 dias</option>
                    <option value="30D">Últimos 30 dias</option>
                    <option value="60D">Últimos 60 dias</option>
                    <option value="CUSTOM">Personalizado</option>
                </select>
             </div>

            {/* Export Actions */}
            <div className="flex gap-2">
                <button className={`p-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`} title="Exportar PDF">
                    <FileText size={18} className="text-red-400" />
                </button>
                <button className={`p-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`} title="Exportar Excel">
                    <FileSpreadsheet size={18} className="text-emerald-400" />
                </button>
                 <button className={`p-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`} title="Exportar CSV">
                    <Download size={18} className="text-blue-400" />
                </button>
            </div>

            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-gold-600 hover:bg-gold-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg shadow-gold-900/20"
            >
                <Plus size={18} />
                <span className="hidden md:inline">Nova Transação</span>
            </button>
        </div>
      </header>
      
      {/* Balance Row */}
      <div className={`p-4 rounded-lg border flex justify-between items-center ${cardBg}`}>
            <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Saldo Líquido (Período)</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
            </div>
      </div>

      {/* KPI Row with Details Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl border backdrop-blur-sm group hover:border-emerald-500/30 transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
             <div className="flex justify-between mb-4">
                <div><p className={textSecondary + " text-sm"}>Entradas</p><h3 className="text-2xl font-semibold text-emerald-400 mt-1">R$ {totalIncome.toLocaleString('pt-BR')}</h3></div>
                <TrendingUp className="text-emerald-500/50 w-8 h-8" />
             </div>
             <button 
                onClick={() => setDetailsView(TransactionType.INCOME)}
                className={`w-full py-2 text-sm rounded flex items-center justify-center gap-2 transition-colors ${isDarkMode ? 'bg-slate-700/50 hover:bg-emerald-500/10 text-emerald-400' : 'bg-slate-100 hover:bg-emerald-50 text-emerald-600'}`}
             >
                <List size={14} /> Ver Detalhes
             </button>
        </div>
        <div className={`p-6 rounded-xl border backdrop-blur-sm group hover:border-red-500/30 transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
             <div className="flex justify-between mb-4">
                <div><p className={textSecondary + " text-sm"}>Saídas</p><h3 className="text-2xl font-semibold text-red-400 mt-1">R$ {totalExpense.toLocaleString('pt-BR')}</h3></div>
                <TrendingDown className="text-red-500/50 w-8 h-8" />
             </div>
             <button 
                onClick={() => setDetailsView(TransactionType.EXPENSE)}
                className={`w-full py-2 text-sm rounded flex items-center justify-center gap-2 transition-colors ${isDarkMode ? 'bg-slate-700/50 hover:bg-red-500/10 text-red-400' : 'bg-slate-100 hover:bg-red-50 text-red-600'}`}
             >
                <List size={14} /> Ver Detalhes
             </button>
        </div>
        <div className={`p-6 rounded-xl border backdrop-blur-sm group hover:border-gold-500/30 transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
             <div className="flex justify-between mb-4">
                <div><p className={textSecondary + " text-sm"}>Reservas/Invest.</p><h3 className="text-2xl font-semibold text-gold-400 mt-1">R$ {totalInvested.toLocaleString('pt-BR')}</h3></div>
                <DollarSign className="text-gold-500/50 w-8 h-8" />
             </div>
             <button 
                onClick={() => setDetailsView(TransactionType.INVESTMENT)}
                className={`w-full py-2 text-sm rounded flex items-center justify-center gap-2 transition-colors ${isDarkMode ? 'bg-slate-700/50 hover:bg-gold-500/10 text-gold-400' : 'bg-slate-100 hover:bg-gold-50 text-gold-600'}`}
             >
                <List size={14} /> Ver Detalhes
             </button>
        </div>
      </div>

      {/* 4 Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart 1: Balance Overview */}
        <div className={`p-6 rounded-xl border ${cardBg}`}>
          <h3 className={`text-lg font-medium mb-4 ${textPrimary}`}>1. Visão Geral ({dateRange})</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip cursor={{fill: isDarkMode ? '#1e293b' : '#f1f5f9'}} contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#fff' : '#000' }} />
                <Bar dataKey="valor" fill="#8884d8">
                    {overviewData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={[COLORS_INCOME[0], COLORS_EXPENSE[0], COLORS_INVEST[0]][index]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Expenses Breakdown */}
        <div className={`p-6 rounded-xl border ${cardBg}`}>
          <h3 className={`text-lg font-medium mb-4 ${textPrimary}`}>2. Saídas por Categoria</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {expenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_EXPENSE[index % COLORS_EXPENSE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#fff' : '#000' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Income Breakdown */}
        <div className={`p-6 rounded-xl border ${cardBg}`}>
          <h3 className={`text-lg font-medium mb-4 ${textPrimary}`}>3. Entradas por Categoria</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={incomeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {incomeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS_INCOME[index % COLORS_INCOME.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#fff' : '#000' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

         {/* Chart 4: Investment/Reserves Breakdown */}
         <div className={`p-6 rounded-xl border ${cardBg}`}>
          <h3 className={`text-lg font-medium mb-4 ${textPrimary}`}>4. Carteira de Investimentos</h3>
          <div className="h-64 w-full">
            {investmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={investmentData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                    <Tooltip cursor={{fill: isDarkMode ? '#1e293b' : '#f1f5f9'}} contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#fff' : '#000' }} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-500 italic">
                    Nenhum investimento registrado neste período.
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl w-full max-w-md p-6 shadow-2xl`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-serif ${textPrimary}`}>Nova Transação</h3>
                    <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-red-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.INVESTMENT].map(t => (
                                <button
                                    type="button"
                                    key={t}
                                    onClick={() => setNewTrans({...newTrans, type: t})}
                                    className={`py-2 text-xs font-bold rounded border ${newTrans.type === t 
                                        ? 'bg-slate-700 text-white border-gold-500' 
                                        : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200')}`}
                                >
                                    {t === 'INCOME' ? 'ENTRADA' : t === 'EXPENSE' ? 'SAÍDA' : 'INVEST.'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Descrição</label>
                        <input 
                            className={`w-full border rounded p-2 focus:border-gold-500 focus:outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                            value={newTrans.description}
                            onChange={e => setNewTrans({...newTrans, description: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Valor (R$)</label>
                        <input 
                            type="number" step="0.01"
                            className={`w-full border rounded p-2 focus:border-gold-500 focus:outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                            value={newTrans.amount}
                            onChange={e => setNewTrans({...newTrans, amount: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Categoria</label>
                        <input 
                            className={`w-full border rounded p-2 focus:border-gold-500 focus:outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                            placeholder="Ex: Alimentação, Salário..."
                            value={newTrans.category}
                            onChange={e => setNewTrans({...newTrans, category: e.target.value})}
                        />
                    </div>
                    <button type="submit" className="w-full bg-gold-600 hover:bg-gold-500 text-white font-bold py-3 rounded mt-4">
                        Confirmar
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsView && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className={`${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl`}>
                  {/* Modal Header */}
                  <div className={`p-6 border-b flex justify-between items-center rounded-t-xl ${isDarkMode ? 'bg-slate-850 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div>
                          <h3 className={`text-2xl font-serif ${textPrimary}`}>{getDetailsTitle(detailsView)}</h3>
                          <p className="text-slate-400 text-sm">Gerenciamento completo de registros</p>
                      </div>
                      <button onClick={() => setDetailsView(null)}><X className="text-slate-400 hover:text-red-500" /></button>
                  </div>

                  {/* Modal Tabs */}
                  <div className={`flex border-b ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <button 
                        onClick={() => setDetailsTab('EXTRATO')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${detailsTab === 'EXTRATO' ? 'border-gold-500 text-gold-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                          Extrato Geral
                      </button>
                      <button 
                        onClick={() => setDetailsTab('CATEGORIAS')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${detailsTab === 'CATEGORIAS' ? 'border-gold-500 text-gold-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                          Gerenciar Categorias
                      </button>
                  </div>

                  {/* Modal Content */}
                  <div className={`flex-1 overflow-y-auto p-6 custom-scrollbar ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
                      {detailsTab === 'EXTRATO' && (
                          <div className="space-y-4">
                              {filteredTransactionsForDetails.length === 0 ? (
                                  <div className="text-center py-12 text-slate-500 italic">Nenhum registro encontrado neste período.</div>
                              ) : (
                                  <table className="w-full text-left text-sm text-slate-400">
                                      <thead className={`text-xs uppercase sticky top-0 ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                          <tr>
                                              <th className="px-4 py-3 rounded-l-lg">Data</th>
                                              <th className="px-4 py-3">Descrição</th>
                                              <th className="px-4 py-3">Categoria</th>
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
                                                  <td className={`px-4 py-3 text-right font-bold ${detailsView === TransactionType.INCOME ? 'text-emerald-400' : detailsView === TransactionType.EXPENSE ? 'text-red-400' : 'text-gold-400'}`}>
                                                      R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                  </td>
                                                  <td className="px-4 py-3 text-center">
                                                      <button 
                                                        onClick={() => onDeleteTransaction(t.id)}
                                                        className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400 transition-colors" title="Excluir"
                                                      >
                                                          <Trash2 size={16} />
                                                      </button>
                                                  </td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              )}
                          </div>
                      )}

                      {detailsTab === 'CATEGORIAS' && (
                          <div className="space-y-6">
                              <div className="flex gap-4 mb-6">
                                  <input type="text" placeholder="Nova Categoria..." className={`flex-1 border rounded p-2 focus:border-gold-500 focus:outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                                  <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded">Criar</button>
                              </div>
                              <h4 className={`${textPrimary} font-medium mb-4 flex items-center gap-2`}>
                                  <Tag size={16} className="text-gold-500" /> Categorias Ativas
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {uniqueCategories.map(cat => (
                                      <div key={cat} className={`p-4 rounded border flex justify-between items-center group ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                          <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{cat}</span>
                                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button className="text-slate-500 hover:text-blue-500"><Edit2 size={14} /></button>
                                              <button className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};