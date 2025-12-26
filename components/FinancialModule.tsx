import React, { useState } from 'react';
import { Transaction, TransactionType, DateRangeOption, RecurrencePeriod, Account } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { X, List, Trash2, Edit2, CalendarRange, Repeat, ArrowUpCircle, ArrowDownCircle, Target, Plus, Wallet, Landmark, CreditCard, DollarSign, TrendingUp, MoreVertical } from 'lucide-react';

interface FinancialModuleProps {
  transactions: Transaction[];
  accounts: Account[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onEditTransaction: (id: string, updates: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onAddAccount: (a: Omit<Account, 'id'>) => void;
  isDarkMode: boolean;
}

const COLORS_EXPENSE = ['#ef4444', '#f87171', '#b91c1c', '#991b1b', '#fca5a5'];
const COLORS_INCOME = ['#10b981', '#34d399', '#059669', '#047857', '#6ee7b7'];

export const FinancialModule: React.FC<FinancialModuleProps> = ({ transactions, accounts = [], onAddTransaction, onEditTransaction, onDeleteTransaction, onAddAccount, isDarkMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  
  // Forms
  const [newTrans, setNewTrans] = useState<{description: string, amount: string, type: TransactionType, category: string, recurrencePeriod: RecurrencePeriod, accountId: string }>({ 
      description: '', amount: '', type: TransactionType.EXPENSE, category: '', recurrencePeriod: 'NONE', accountId: ''
  });
  const [newAccount, setNewAccount] = useState({ name: '', type: 'CHECKING', balance: '', color: '#3b82f6' });

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // --- CÁLCULOS ---
  // 1. Saldo Total (Soma das Contas)
  const totalBalance = accounts.reduce((acc, curr) => acc + parseFloat(curr.balance.toString()), 0);

  // 2. Resumos (Entradas, Saídas, Investimentos) - Baseado nas transações visíveis
  const incomeTotal = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + parseFloat(t.amount.toString()), 0);

  const expenseTotal = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + parseFloat(t.amount.toString()), 0);

  const investmentTotal = transactions
    .filter(t => t.type === TransactionType.INVESTMENT)
    .reduce((acc, t) => acc + parseFloat(t.amount.toString()), 0);

  // --- HANDLERS ---
  const openNewTransaction = () => {
      setEditingTransactionId(null);
      setNewTrans({ description: '', amount: '', type: TransactionType.EXPENSE, category: '', recurrencePeriod: 'NONE', accountId: '' });
      setIsModalOpen(true);
  };

  const openEditTransaction = (t: Transaction) => {
      setEditingTransactionId(t.id);
      setNewTrans({
          description: t.description,
          amount: t.amount.toString(),
          type: t.type,
          category: t.category,
          recurrencePeriod: t.recurrencePeriod || 'NONE',
          accountId: t.accountId || ''
      });
      setIsModalOpen(true);
  };

  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
        ...newTrans,
        amount: parseFloat(newTrans.amount),
    };

    if (editingTransactionId) {
        onEditTransaction(editingTransactionId, payload);
    } else {
        onAddTransaction({
            ...payload,
            recurrenceInterval: 1,
            recurrenceLimit: 0
        });
    }
    setIsModalOpen(false);
  };

  const handleSubmitAccount = (e: React.FormEvent) => {
      e.preventDefault();
      onAddAccount({
          name: newAccount.name,
          type: newAccount.type as any,
          balance: parseFloat(newAccount.balance) || 0,
          color: newAccount.color
      });
      setIsAccountModalOpen(false);
      setNewAccount({ name: '', type: 'CHECKING', balance: '', color: '#3b82f6' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. SALDO GERAL (TOPO) */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl border border-gold-500/30 flex justify-between items-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><DollarSign size={120} className="text-gold-500" /></div>
          <div className="relative z-10">
              <p className="text-slate-400 font-medium text-sm uppercase tracking-wider mb-1">Patrimônio Líquido Total</p>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">{formatCurrency(totalBalance)}</h1>
          </div>
          <div className="relative z-10 flex gap-2">
               <button onClick={() => setIsAccountModalOpen(true)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg transition-transform active:scale-95">
                   <Plus size={16} /> Conta
               </button>
               <button onClick={openNewTransaction} className="bg-gold-600 hover:bg-gold-500 text-slate-900 px-6 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg transition-transform active:scale-95">
                   <Plus size={16} /> Transação
               </button>
          </div>
      </div>

      {/* 2. CARDS DE RESUMO (ENTRADA, SAÍDA, INVESTIMENTO) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Entradas</p>
                  <p className="text-xl font-bold text-emerald-400">+{formatCurrency(incomeTotal)}</p>
              </div>
              <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-500"><ArrowUpCircle size={24} /></div>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Saídas</p>
                  <p className="text-xl font-bold text-red-400">-{formatCurrency(expenseTotal)}</p>
              </div>
              <div className="p-3 rounded-full bg-red-500/20 text-red-500"><ArrowDownCircle size={24} /></div>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Reservas/Invest.</p>
                  <p className="text-xl font-bold text-blue-400">{formatCurrency(investmentTotal)}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20 text-blue-500"><TrendingUp size={24} /></div>
          </div>
      </div>

      {/* 3. LISTA DE CONTAS (CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map(acc => (
              <div key={acc.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col justify-between hover:border-slate-500 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                      <div className="p-2 rounded-lg bg-slate-700 text-white">
                          {acc.type === 'WALLET' ? <Wallet size={18}/> : acc.type === 'INVESTMENT' ? <TrendingUp size={18}/> : <Landmark size={18}/>}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{acc.type}</span>
                  </div>
                  <div>
                      <h4 className="text-slate-300 font-medium truncate">{acc.name}</h4>
                      <p className={`text-xl font-bold ${acc.balance >= 0 ? 'text-white' : 'text-red-400'}`}>{formatCurrency(parseFloat(acc.balance.toString()))}</p>
                  </div>
              </div>
          ))}
      </div>

      {/* 4. GRÁFICOS E ANÁLISES */}
      <h3 className="text-lg font-serif text-white mt-4">Análise de Tendências</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* GRÁFICO DE BARRAS - Cores Corrigidas e Texto Branco */}
           <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 lg:col-span-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-4">Fluxo de Caixa (Últimos Lançamentos)</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={transactions.slice(0, 10).reverse()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                tickFormatter={d => new Date(d).getDate().toString()} 
                                stroke="#94a3b8" 
                                tick={{ fill: '#e2e8f0' }} 
                            />
                            <YAxis 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                tick={{ fill: '#e2e8f0' }}
                            />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff'}} 
                                formatter={(val:number) => formatCurrency(val)} 
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="amount">
                                {transactions.slice(0, 10).reverse().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.type === 'INCOME' ? '#10b981' : '#ef4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
           </div>
           
           {/* GRÁFICO DE PIZZA */}
           <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center">
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Distribuição</h4>
                <div className="w-full h-48">
                    <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                             <Pie data={[
                                 { name: 'Saídas', value: transactions.filter(t=>t.type==='EXPENSE').reduce((a,b)=>a+parseFloat(b.amount.toString()),0) },
                                 { name: 'Entradas', value: transactions.filter(t=>t.type==='INCOME').reduce((a,b)=>a+parseFloat(b.amount.toString()),0) }
                             ]} innerRadius={40} outerRadius={70} dataKey="value">
                                 <Cell fill="#ef4444" />
                                 <Cell fill="#10b981" />
                             </Pie>
                             <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', color: '#fff'}} />
                         </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> <span className="text-slate-300">Entradas</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> <span className="text-slate-300">Saídas</span></div>
                </div>
           </div>
      </div>

      {/* 5. HISTÓRICO DE TRANSAÇÕES (Com Edição e Exclusão) */}
      <div>
          <h3 className="text-lg font-serif text-white mb-4">Últimas Transações</h3>
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              {transactions.slice(0, 10).map(t => (
                  <div key={t.id} className="p-4 border-b border-slate-700 flex justify-between items-center hover:bg-slate-700/30 transition-colors group">
                      <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${t.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-500' : t.type === 'INVESTMENT' ? 'bg-blue-500/20 text-blue-500' : 'bg-red-500/20 text-red-500'}`}>
                              {t.type === 'INCOME' ? <ArrowUpCircle size={20}/> : t.type === 'INVESTMENT' ? <TrendingUp size={20}/> : <ArrowDownCircle size={20}/>}
                          </div>
                          <div>
                              <p className="text-white font-medium">{t.description}</p>
                              <div className="flex gap-2 text-xs text-slate-400">
                                  <span>{new Date(t.date).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>{t.category}</span>
                                  {t.accountId && <span>• {accounts.find(a => a.id.toString() === t.accountId?.toString())?.name}</span>}
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <span className={`font-bold ${t.type === 'INCOME' ? 'text-emerald-400' : t.type === 'INVESTMENT' ? 'text-blue-400' : 'text-red-400'}`}>
                              {t.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(t.amount)}
                          </span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditTransaction(t)} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white" title="Editar">
                                  <Edit2 size={14} />
                              </button>
                              <button onClick={() => onDeleteTransaction(t.id)} className="p-1.5 bg-slate-700 hover:bg-red-600/20 rounded text-slate-300 hover:text-red-400" title="Excluir">
                                  <Trash2 size={14} />
                              </button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* MODAL TRANSAÇÃO (NOVA/EDITAR) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
                <h3 className="text-xl font-serif text-white mb-4">{editingTransactionId ? 'Editar Transação' : 'Nova Transação'}</h3>
                <form onSubmit={handleSubmitTransaction} className="space-y-4">
                    <input placeholder="Descrição" value={newTrans.description} onChange={e => setNewTrans({...newTrans, description: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white" required />
                    <input type="number" placeholder="Valor (R$)" value={newTrans.amount} onChange={e => setNewTrans({...newTrans, amount: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white" required />
                    <div className="grid grid-cols-2 gap-4">
                         <select value={newTrans.type} onChange={e => setNewTrans({...newTrans, type: e.target.value as any})} className="bg-slate-800 border border-slate-700 rounded p-3 text-white">
                             <option value="EXPENSE">Despesa</option>
                             <option value="INCOME">Receita</option>
                             <option value="INVESTMENT">Investimento</option>
                         </select>
                         <select value={newTrans.accountId} onChange={e => setNewTrans({...newTrans, accountId: e.target.value})} className="bg-slate-800 border border-slate-700 rounded p-3 text-white" required>
                             <option value="" disabled>Selecione a Conta</option>
                             {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                         </select>
                    </div>
                    <input placeholder="Categoria (ex: Mercado)" value={newTrans.category} onChange={e => setNewTrans({...newTrans, category: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white" />
                    <button type="submit" className="w-full bg-gold-600 hover:bg-gold-500 text-white font-bold py-3 rounded mt-2">{editingTransactionId ? 'Atualizar' : 'Salvar'}</button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-500 py-2">Cancelar</button>
                </form>
            </div>
        </div>
      )}

      {/* MODAL NOVA CONTA */}
      {isAccountModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm p-6 shadow-2xl">
                <h3 className="text-xl font-serif text-white mb-4">Adicionar Conta</h3>
                <form onSubmit={handleSubmitAccount} className="space-y-4">
                    <input placeholder="Nome da Conta (ex: Nubank)" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white" required />
                    <select value={newAccount.type} onChange={e => setNewAccount({...newAccount, type: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white">
                        <option value="CHECKING">Conta Corrente</option>
                        <option value="SAVINGS">Poupança</option>
                        <option value="INVESTMENT">Investimentos</option>
                        <option value="WALLET">Carteira Física</option>
                    </select>
                    <input type="number" placeholder="Saldo Inicial (R$)" value={newAccount.balance} onChange={e => setNewAccount({...newAccount, balance: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white" />
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded mt-2">Criar Conta</button>
                    <button type="button" onClick={() => setIsAccountModalOpen(false)} className="w-full text-slate-500 py-2">Cancelar</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};