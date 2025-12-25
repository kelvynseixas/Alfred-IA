import React, { useState } from 'react';
import { FinancialProject } from '../types';
import { Target, Plus, X, Trash2, TrendingUp, PiggyBank, Briefcase } from 'lucide-react';

interface ProjectsModuleProps {
  projects: FinancialProject[];
  isDarkMode: boolean;
  onAddProject: (p: Omit<FinancialProject, 'id' | 'currentAmount' | 'status'>) => void;
  onUpdateProject: (id: string, updates: Partial<FinancialProject>) => void;
  onDeleteProject: (id: string) => void;
}

export const FinancialProjectsModule: React.FC<ProjectsModuleProps> = ({ projects, isDarkMode, onAddProject, onUpdateProject, onDeleteProject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', targetAmount: '', deadline: '', category: 'GOAL' as any });
  const [amountInput, setAmountInput] = useState<{[key:string]: string}>({});

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onAddProject({
          title: newProject.title,
          description: newProject.description,
          targetAmount: parseFloat(newProject.targetAmount),
          deadline: newProject.deadline,
          category: newProject.category
      });
      setIsModalOpen(false);
      setNewProject({ title: '', description: '', targetAmount: '', deadline: '', category: 'GOAL' });
  };

  const handleUpdateAmount = (id: string, current: number, add: boolean) => {
      const val = parseFloat(amountInput[id] || '0');
      if (val <= 0) return;
      const newAmount = add ? current + val : current - val;
      onUpdateProject(id, { currentAmount: Math.max(0, newAmount) });
      setAmountInput({...amountInput, [id]: ''});
  };

  const getProgress = (current: number, target: number) => Math.min(100, (current / target) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h2 className={`text-3xl font-serif ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Projetos & Reservas</h2>
                <p className="text-slate-400">Metas financeiras e fundos de emergência.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-gold-600 hover:bg-gold-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus size={18} /> Novo Projeto
            </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(proj => (
                <div key={proj.id} className={`rounded-xl border p-6 flex flex-col ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${proj.category === 'RESERVE' ? 'bg-blue-500/10 text-blue-400' : proj.category === 'ASSET' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gold-500/10 text-gold-400'}`}>
                                {proj.category === 'RESERVE' ? <PiggyBank size={20}/> : proj.category === 'ASSET' ? <Briefcase size={20}/> : <Target size={20}/>}
                            </div>
                            <div>
                                <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{proj.title}</h3>
                                <p className="text-xs text-slate-500">{proj.deadline ? `Meta: ${new Date(proj.deadline).toLocaleDateString()}` : 'Sem prazo'}</p>
                            </div>
                        </div>
                        <button onClick={() => onDeleteProject(proj.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={16}/></button>
                    </div>
                    
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Progresso</span>
                            <span className={`font-bold ${getProgress(proj.currentAmount, proj.targetAmount) >= 100 ? 'text-emerald-400' : 'text-white'}`}>
                                {getProgress(proj.currentAmount, proj.targetAmount).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                            <div 
                                className={`h-2 rounded-full transition-all duration-1000 ${getProgress(proj.currentAmount, proj.targetAmount) >= 100 ? 'bg-emerald-500' : 'bg-gold-500'}`} 
                                style={{width: `${getProgress(proj.currentAmount, proj.targetAmount)}%`}}
                            ></div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <p className="text-xs text-slate-400">Atual</p>
                            <p className="text-xl font-bold text-white">R$ {proj.currentAmount.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">Meta</p>
                            <p className="text-sm font-medium text-slate-300">R$ {proj.targetAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-700">
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                placeholder="Valor" 
                                value={amountInput[proj.id] || ''}
                                onChange={e => setAmountInput({...amountInput, [proj.id]: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:border-gold-500 focus:outline-none"
                            />
                            <button onClick={() => handleUpdateAmount(proj.id, Number(proj.currentAmount), true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 rounded font-bold text-lg">+</button>
                            <button onClick={() => handleUpdateAmount(proj.id, Number(proj.currentAmount), false)} className="bg-red-600 hover:bg-red-500 text-white px-3 rounded font-bold text-lg">-</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {isModalOpen && (
             <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-serif text-white">Novo Projeto</h3>
                        <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input placeholder="Título (ex: Carro Novo)" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" required />
                        <input type="number" placeholder="Meta (R$)" value={newProject.targetAmount} onChange={e => setNewProject({...newProject, targetAmount: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" required />
                        <div className="grid grid-cols-2 gap-4">
                             <input type="date" value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
                             <select value={newProject.category} onChange={e => setNewProject({...newProject, category: e.target.value as any})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                                 <option value="GOAL">Objetivo</option>
                                 <option value="RESERVE">Reserva</option>
                                 <option value="ASSET">Patrimônio</option>
                             </select>
                        </div>
                        <button type="submit" className="w-full bg-gold-600 hover:bg-gold-500 text-white font-bold py-2 rounded mt-2">Criar Projeto</button>
                    </form>
                </div>
             </div>
        )}
    </div>
  );
};