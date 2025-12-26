import React, { useState } from 'react';
import { FinancialProject } from '../types';
import { Target, Plus, X, Trash2, TrendingUp, PiggyBank, Briefcase, Edit2 } from 'lucide-react';

interface ProjectsModuleProps {
  projects: FinancialProject[];
  isDarkMode: boolean;
  onAddProject: (p: Omit<FinancialProject, 'id' | 'currentAmount' | 'status'>) => void;
  onUpdateProject: (id: string, updates: Partial<FinancialProject>) => void;
  onDeleteProject: (id: string) => void;
}

export const FinancialProjectsModule: React.FC<ProjectsModuleProps> = ({ projects = [], isDarkMode, onAddProject, onUpdateProject, onDeleteProject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ title: '', description: '', targetAmount: '', deadline: '', category: 'GOAL' as any });
  const [amountInput, setAmountInput] = useState<{[key:string]: string}>({});

  const safeNumber = (value: any) => {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (val: number) => {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const openNewProject = () => {
      setEditingId(null);
      setNewProject({ title: '', description: '', targetAmount: '', deadline: '', category: 'GOAL' });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const payload = {
          title: newProject.title,
          description: newProject.description,
          targetAmount: safeNumber(newProject.targetAmount),
          deadline: newProject.deadline,
          category: newProject.category
      };
      if (editingId) onUpdateProject(editingId, payload);
      else onAddProject(payload);
      setIsModalOpen(false);
  };

  const handleUpdateAmount = (id: string, current: number, add: boolean) => {
      const val = safeNumber(amountInput[id]);
      if (val <= 0) return;
      onUpdateProject(id, { currentAmount: Math.max(0, add ? current + val : current - val) });
      setAmountInput({...amountInput, [id]: ''});
  };

  const totalSaved = projects.reduce((acc, p) => acc + safeNumber(p.currentAmount), 0);
  const totalTarget = projects.reduce((acc, p) => acc + safeNumber(p.targetAmount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
        <header className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-3xl font-serif text-white">Projetos & Reservas</h2>
                <p className="text-slate-400">Metas financeiras e fundos.</p>
            </div>
            <button onClick={openNewProject} className="bg-gold-600 hover:bg-gold-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus size={18} /> Novo Projeto
            </button>
        </header>

        {/* RESUMO DE METAS */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center border-r border-slate-700 last:border-0">
                <p className="text-xs uppercase text-slate-500 font-bold mb-1">Total Acumulado</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalSaved)}</p>
            </div>
            <div className="text-center border-r border-slate-700 last:border-0">
                <p className="text-xs uppercase text-slate-500 font-bold mb-1">Meta Global</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalTarget)}</p>
            </div>
            <div className="text-center">
                <p className="text-xs uppercase text-slate-500 font-bold mb-1">Progresso Geral</p>
                <p className="text-2xl font-bold text-gold-500">{totalTarget > 0 ? ((totalSaved/totalTarget)*100).toFixed(1) : 0}%</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(proj => {
                const current = safeNumber(proj.currentAmount);
                const target = safeNumber(proj.targetAmount);
                const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
                
                return (
                <div key={proj.id} className="rounded-xl border p-6 flex flex-col bg-slate-800 border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${proj.category === 'RESERVE' ? 'bg-blue-500/10 text-blue-400' : 'bg-gold-500/10 text-gold-400'}`}>
                                {proj.category === 'RESERVE' ? <PiggyBank size={20}/> : <Target size={20}/>}
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{proj.title}</h3>
                                <p className="text-xs text-slate-500">{proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'Sem prazo'}</p>
                            </div>
                        </div>
                        <button onClick={() => onDeleteProject(proj.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={16}/></button>
                    </div>
                    
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1"><span className="text-slate-400">Progresso</span><span className="text-white font-bold">{progress.toFixed(1)}%</span></div>
                        <div className="w-full bg-slate-700 rounded-full h-2"><div className="h-2 rounded-full bg-gold-500" style={{width: `${progress}%`}}></div></div>
                    </div>

                    <div className="flex justify-between items-end mb-6">
                        <div><p className="text-xs text-slate-400">Atual</p><p className="text-xl font-bold text-white">{formatCurrency(current)}</p></div>
                        <div className="text-right"><p className="text-xs text-slate-400">Meta</p><p className="text-sm font-medium text-slate-300">{formatCurrency(target)}</p></div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-700 flex gap-2">
                        <input type="number" placeholder="Valor" value={amountInput[proj.id] || ''} onChange={e => setAmountInput({...amountInput, [proj.id]: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-2 text-sm text-white" />
                        <button onClick={() => handleUpdateAmount(proj.id, current, true)} className="bg-emerald-600 px-3 rounded text-white">+</button>
                    </div>
                </div>
            )})}
        </div>
        
        {isModalOpen && (
             <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6">
                    <h3 className="text-xl font-serif text-white mb-4">Novo Projeto</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input placeholder="Título" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" required />
                        <input type="number" placeholder="Meta (R$)" value={newProject.targetAmount} onChange={e => setNewProject({...newProject, targetAmount: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" required />
                        <button type="submit" className="w-full bg-gold-600 text-white font-bold py-2 rounded">Criar Projeto</button>
                    </form>
                </div>
             </div>
        )}
    </div>
  );
};