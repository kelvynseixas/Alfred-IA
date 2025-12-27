
import React, { useState } from 'react';
import { Investment } from '../types';
import { TrendingUp, Plus, Landmark, Trash2 } from 'lucide-react';

interface InvestmentsModuleProps {
  investments: Investment[];
  onAddInvestment: (inv: Omit<Investment, 'id'>) => void;
  onDeleteInvestment: (id: string) => void;
}

export const InvestmentsModule: React.FC<InvestmentsModuleProps> = ({ investments = [], onAddInvestment, onDeleteInvestment }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInv, setNewInv] = useState({ 
    name: '', type: 'CDB' as any, institution: '', initialAmount: '', currentAmount: '', interestRate: '', startDate: '', dueDate: '', liquidity: 'DAILY' as any, notes: '' 
  });

  const totalInvested = investments.reduce((acc, curr) => acc + Number(curr.currentAmount), 0);
  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddInvestment({
      ...newInv,
      initialAmount: parseFloat(newInv.initialAmount),
      currentAmount: parseFloat(newInv.currentAmount || newInv.initialAmount),
    } as any);
    setIsModalOpen(false);
    setNewInv({ name: '', type: 'CDB', institution: '', initialAmount: '', currentAmount: '', interestRate: '', startDate: '', dueDate: '', liquidity: 'DAILY', notes: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif text-white">Gestão de Investimentos</h2>
          <p className="text-slate-400">Visão detalhada do seu capital aplicado.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-gold-600 text-slate-950 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all hover:bg-gold-500 active:scale-95">
          <Plus size={18} /> Novo Ativo
        </button>
      </header>

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
        <div className="flex items-center gap-6"><div className="p-4 bg-gold-500/10 rounded-full text-gold-500"><TrendingUp size={40} /></div>
          <div><p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Patrimônio Investido</p><h1 className="text-4xl font-serif font-bold text-white">{formatCurrency(totalInvested)}</h1></div>
        </div>
        <div className="h-16 w-px bg-slate-800 hidden md:block"></div>
        <div className="flex gap-8">
          <div className="text-center"><p className="text-slate-500 text-[10px] font-bold uppercase">Rendimento Est. Mês</p><p className="text-emerald-400 font-bold">+ {formatCurrency(totalInvested * 0.0105)}</p></div>
          <div className="text-center"><p className="text-slate-500 text-[10px] font-bold uppercase">Taxa Média</p><p className="text-white font-bold">~1.05% a.m.</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {investments.map(inv => (
          <div key={inv.id} className="bg-slate-800 border border-slate-700 p-5 rounded-2xl hover:border-gold-500/50 transition-all group relative">
            <button onClick={() => onDeleteInvestment(inv.id)} className="absolute top-4 right-4 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
            <div className="flex justify-between items-start mb-4"><div className="flex items-center gap-3"><div className="p-2 bg-slate-700 rounded-lg text-slate-300"><Landmark size={20} /></div><div><h4 className="text-white font-bold group-hover:text-gold-400 transition-colors">{inv.name}</h4><p className="text-[10px] text-slate-500 uppercase font-bold">{inv.type} • {inv.institution}</p></div></div></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
               <div><p className="text-[10px] text-slate-500 uppercase">Aplicação Inicial</p><p className="text-sm font-medium text-slate-300">{formatCurrency(inv.initialAmount)}</p></div>
               <div className="text-right"><p className="text-[10px] text-slate-500 uppercase">Rentabilidade</p><p className="text-sm font-bold text-emerald-400">{inv.interestRate}</p></div>
            </div>
            <div className="flex justify-between items-end pt-4 border-t border-slate-700">
              <div><p className="text-xs text-slate-500 mb-1">Valor Atualizado</p><p className="text-xl font-bold text-white">{formatCurrency(inv.currentAmount)}</p></div>
              <div className="text-right"><p className="text-[10px] text-slate-500 font-bold">Vencimento: {inv.dueDate || 'Liquidez Diária'}</p><span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded text-gold-500 border border-gold-900/30">{inv.liquidity}</span></div>
            </div>
          </div>
        ))}
        {investments.length === 0 && <div className="md:col-span-2 py-10 text-center border-2 border-dashed border-slate-800 rounded-2xl"><p className="text-slate-500">Nenhum investimento cadastrado. Comece agora!</p></div>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-serif text-white mb-6">Cadastrar Nova Aplicação</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input placeholder="Nome do Título (ex: Tesouro Selic 2029)" required className="w-full bg-slate-850 border border-slate-700 p-3 rounded-lg text-white" value={newInv.name} onChange={e => setNewInv({...newInv, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <select className="bg-slate-850 border border-slate-700 p-3 rounded-lg text-white" value={newInv.type} onChange={e => setNewInv({...newInv, type: e.target.value as any})}><option value="CDB">CDB</option><option value="TESOURO">Tesouro Direto</option><option value="LCI_LCA">LCI / LCA</option><option value="ACOES">Ações</option><option value="FII">Fundos Imobiliários</option><option value="CRYPTO">Criptoativos</option></select>
                <input placeholder="Instituição (ex: XP, NuInvest)" required className="bg-slate-850 border border-slate-700 p-3 rounded-lg text-white" value={newInv.institution} onChange={e => setNewInv({...newInv, institution: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.01" placeholder="Valor Inicial" required className="bg-slate-850 border border-slate-700 p-3 rounded-lg text-white" value={newInv.initialAmount} onChange={e => setNewInv({...newInv, initialAmount: e.target.value})} />
                <input placeholder="Rendimento (ex: 110% CDI)" className="bg-slate-850 border border-slate-700 p-3 rounded-lg text-white" value={newInv.interestRate} onChange={e => setNewInv({...newInv, interestRate: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] text-slate-500 font-bold uppercase">Data de Início</label><input type="date" className="w-full bg-slate-850 border border-slate-700 p-3 rounded-lg text-white" value={newInv.startDate} onChange={e => setNewInv({...newInv, startDate: e.target.value})} /></div>
                <div><label className="text-[10px] text-slate-500 font-bold uppercase">Vencimento</label><input type="date" className="w-full bg-slate-850 border border-slate-700 p-3 rounded-lg text-white" value={newInv.dueDate} onChange={e => setNewInv({...newInv, dueDate: e.target.value})} /></div>
              </div>
              <select className="w-full bg-slate-850 border border-slate-700 p-3 rounded-lg text-white" value={newInv.liquidity} onChange={e => setNewInv({...newInv, liquidity: e.target.value as any})}><option value="DAILY">Liquidez Diária</option><option value="AT_MATURITY">No Vencimento</option><option value="LOCKED">Prazo Fechado (Carência)</option></select>
              <textarea placeholder="Notas adicionais..." className="w-full bg-slate-850 border border-slate-700 p-3 rounded-lg text-white h-20" value={newInv.notes} onChange={e => setNewInv({...newInv, notes: e.target.value})}></textarea>
              <div className="flex gap-4 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 text-slate-400 py-3">Cancelar</button><button type="submit" className="flex-1 bg-gold-600 text-slate-950 font-bold py-3 rounded-lg shadow-lg hover:bg-gold-500 transition-all">Salvar Aplicação</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};