
import React, { useState } from 'react';
import { Transaction, TransactionType, RecurrencePeriod, Account, FinancialProject } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Plus, ArrowUpCircle, ArrowDownCircle, DollarSign, Repeat, Target, Trash2 } from 'lucide-react';

interface FinancialModuleProps {
  transactions: Transaction[];
  accounts: Account[];
  projects: FinancialProject[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onAddAccount: (a: Omit<Account, 'id'>) => void;
}

export const FinancialModule: React.FC<FinancialModuleProps> = ({ transactions, accounts, projects, onAddTransaction, onDeleteTransaction, onAddAccount }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTrans, setNewTrans] = useState({ 
    description: '', amount: '', type: TransactionType.EXPENSE, category: '', recurrencePeriod: 'NONE' as RecurrencePeriod, accountId: '', projectId: '' 
  });

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totals = {
    income: transactions.filter(t => t.type === TransactionType.INCOME).reduce((a, b) => a + Number(b.amount), 0),
    expense: transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((a, b) => a + Number(b.amount), 0),
    reserve: transactions.filter(t => t.type === TransactionType.RESERVE).reduce((a, b) => a + Number(b.amount), 0),
    balance: accounts.reduce((a, b) => a + Number(b.balance), 0)
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTransaction({
      ...newTrans,
      amount: parseFloat(newTrans.amount),
      date: new Date().toISOString()
    });
    setIsModalOpen(false);
    setNewTrans({ description: '', amount: '', type: TransactionType.EXPENSE, category: '', recurrencePeriod: 'NONE', accountId: '', projectId: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-850 p-6 rounded-2xl border border-gold-500/30 relative overflow-hidden shadow-2xl">
          <DollarSign className="absolute -right-4 -top-4 text-gold-500/10 w-32 h-32" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Saldo em Contas</p>
          <h1 className="text-4xl font-serif font-bold text-white mb-4">{formatCurrency(totals.balance)}</h1>
          <button onClick={() => setIsModalOpen(true)} className="bg-gold-600 hover:bg-gold-500 text-slate-950 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all active:scale-95">
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-center">
          <p className="text-slate-500 text-[10px] font-bold uppercase">Entradas</p>
          <p className="text-xl font-bold text-emerald-400">+{formatCurrency(totals.income)}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-center">
          <p className="text-slate-500 text-[10px] font-bold uppercase">Saídas (Despesas + Reservas)</p>
          <p className="text-xl font-bold text-red-400">-{formatCurrency(totals.expense + totals.reserve)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-white font-serif mb-6">Fluxo de Caixa Mensal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactions.slice(0, 10).reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" tickFormatter={d => new Date(d).getDate().toString()} stroke="#94a3b8" tick={{fill: '#f1f5f9'}} fontSize={12} />
                <YAxis stroke="#94a3b8" tick={{fill: '#f1f5f9'}} fontSize={10} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {transactions.slice(0, 10).reverse().map((t, i) => (
                    <Cell key={i} fill={t.type === 'INCOME' ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center">
          <h3 className="text-white font-serif mb-4">Distribuição</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{name: 'Receitas', val: totals.income}, {name: 'Saídas', val: totals.expense + totals.reserve}]} dataKey="val" innerRadius={50} outerRadius={70}>
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Receitas</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Saídas</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center"><h3 className="text-white font-serif">Histórico Recente</h3></div>
        <div className="divide-y divide-slate-800">
          {transactions.map(t => (
            <div key={t.id} className="p-4 flex justify-between items-center hover:bg-slate-800/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : t.type === 'RESERVE' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                  {t.type === 'INCOME' ? <ArrowUpCircle size={20}/> : t.type === 'RESERVE' ? <Target size={20}/> : <ArrowDownCircle size={20}/>}
                </div>
                <div>
                  <p className="text-white font-medium">{t.description}</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-2">
                    {new Date(t.date).toLocaleDateString()} • {t.category} 
                    {t.recurrencePeriod !== 'NONE' && <Repeat size={10} className="text-gold-500" />}
                    {t.projectId && <span className="text-blue-400 font-bold uppercase tracking-tighter">Reserva para Meta</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-bold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
                <button onClick={() => onDeleteTransaction(t.id)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-serif text-white mb-6">Lançamento de Valor</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input placeholder="Descrição" required className="w-full bg-slate-850 border border-slate-700 p-3 rounded-lg text-white" value={newTrans.description} onChange={e => setNewTrans({...newTrans, description: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.01" placeholder="Valor" required className="bg-slate-850 border border-slate-700 p-3 rounded-lg text-white" value={newTrans.amount} onChange={e => setNewTrans({...newTrans, amount: e.target.value})} />
                <select className="bg-slate-850 border border-slate-700 p-3 rounded-lg text-white" value={newTrans.type} onChange={e => setNewTrans({...newTrans, type: e.target.value as any})}>
                  <option value={TransactionType.EXPENSE}>Despesa</option>
                  <option value={TransactionType.INCOME}>Receita</option>
                  <option value={TransactionType.RESERVE}>Reserva (Poupar para Meta)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select className="bg-slate-850 border border-slate-700 p-3 rounded-lg text-white" value={newTrans.accountId} onChange={e => setNewTrans({...newTrans, accountId: e.target.value})} required>
                  <option value="">Conta Vinculada</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select className="bg-slate-850 border border-slate-700 p-3 rounded-lg text-white" value={newTrans.recurrencePeriod} onChange={e => setNewTrans({...newTrans, recurrencePeriod: e.target.value as any})}>
                  <option value="NONE">Sem Recorrência</option>
                  <option value="DAILY">Diário</option>
                  <option value="WEEKLY">Semanal</option>
                  <option value="MONTHLY">Mensal</option>
                  <option value="YEARLY">Anual</option>
                </select>
              </div>
              {newTrans.type === TransactionType.RESERVE && (
                <div className="animate-fade-in">
                  <label className="text-xs text-blue-400 font-bold uppercase mb-1 block">Vincular a um Projeto</label>
                  <select className="w-full bg-slate-850 border border-blue-500/50 p-3 rounded-lg text-white" value={newTrans.projectId} onChange={e => setNewTrans({...newTrans, projectId: e.target.value})} required>
                    <option value="">Selecione a Meta...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              )}
              <input placeholder="Categoria" className="w-full bg-slate-850 border border-slate-700 p-3 rounded-lg text-white" value={newTrans.category} onChange={e => setNewTrans({...newTrans, category: e.target.value})} />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 text-slate-400 py-3">Cancelar</button>
                <button type="submit" className="flex-1 bg-gold-600 text-slate-950 font-bold py-3 rounded-lg">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};