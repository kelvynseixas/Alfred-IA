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

  // Helper para evitar quebra com valores nulos/undefined
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

  const openEditProject = (proj: FinancialProject) => {
      setEditingId(proj.id);
      setNewProject({
          title: proj.title,
          description: proj.description || '',
          targetAmount: proj.targetAmount.toString(),
          deadline: proj.deadline ? proj.deadline.split('T')[0] : '',
          category: proj.category
      });
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

      if (editingId) {
          onUpdateProject(editingId, payload);
      } else {
          onAddProject(payload);
      }
      
      setIsModalOpen(false);
      setNewProject({ title: '', description: '', targetAmount: '', deadline: '', category: 'GOAL' });
      setEditingId(null);
  };

  const handleUpdateAmount = (id: string, current: number, add: boolean) => {
      const val = safeNumber(amountInput[id]);
      if (val <= 0) return;
      const safeCurrent = safeNumber(current);
      const newAmount = add ? safeCurrent + val : safeCurrent - val;
      onUpdateProject(id, { currentAmount: Math.max(0, newAmount) });
      setAmountInput({...amountInput, [id]: ''});
  };

  const handleInputChange = (id: string, value: string) => {
       let val = value;
      if (val === '') {
          setAmountInput({...amountInput, [id]: ''});
          return;
      }
      if (!/^\d*\.?\d*$/.test(val)) return;
      if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
          val = val.replace(/^0+/, '');
      }
      setAmountInput({...amountInput, [id]: val});
  };

  const getProgress = (current: any, target: any) => {
      const c = safeNumber(current);
      const t = safeNumber(target);
      if (t === 0) return 0;
      return Math.min(100, (c / t) * 100);
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h2 className={`text-3xl font-serif ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Projetos & Reservas</h2>
                <p className="text-slate-400">Metas financeiras e fundos de emergência.</p>
            </div>
            <button onClick={openNewProject} className="bg-gold-600 hover:bg-gold-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus size={18} /> Novo Projeto
            </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(!projects || projects.length === 0) ? (
                <div className="col-span-full text-center py-12 text-slate-500">
                    Nenhum projeto encontrado. Crie um novo para começar.
                </div>
            ) : projects.map(proj => {
                const current = safeNumber(proj.currentAmount);
                const target = safeNumber(proj.targetAmount);
                const progress = getProgress(current, target);
                
                return (
                <div key={proj.id} className={`rounded-xl border p-6 flex flex-col ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${proj.category === 'RESERVE' ? 'bg-blue-500/10 text-blue-400' : proj.category === 'ASSET' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gold-500/10 text-gold-400'}`}>
                                {proj.category === 'RESERVE' ? <PiggyBank size={20}/> : proj.category === 'ASSET' ? <Briefcase size={20}/> : <Target size={20}/>}
                            </div>
                            <div>
                                <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{proj.title || 'Sem Título'}</h3>
                                <p className="text-xs text-slate-500">
                                    {proj.deadline ? `Meta: ${new Date(proj.deadline).toLocaleDateString()}` : 'Sem prazo'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => openEditProject(proj)} className="text-slate-500 hover:text-white"><Edit2 size={16}/></button>
                            <button onClick={() => onDeleteProject(proj.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={16}/></button>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Progresso</span>
                            <span className={`font-bold ${progress >= 100 ? 'text-emerald-400' : 'text-white'}`}>
                                {progress.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                            <div 
                                className={`h-2 rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500' : 'bg-gold-500'}`} 
                                style={{width: `${progress}%`}}
                            ></div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <p className="text-xs text-slate-400">Atual</p>
                            <p className="text-xl font-bold text-white">{formatCurrency(current)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">Meta</p>
                            <p className="text-sm font-medium text-slate-300">{formatCurrency(target)}</p>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-700">
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                inputMode="decimal" 
                                placeholder="Valor" 
                                value={amountInput[proj.id] || ''}
                                onChange={e => handleInputChange(proj.id, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:border-gold-500 focus:outline-none"
                            />
                            <button onClick={() => handleUpdateAmount(proj.id, current, true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 rounded font-bold text-lg">+</button>
                            <button onClick={() => handleUpdateAmount(proj.id, current, false)} className="bg-red-600 hover:bg-red-500 text-white px-3 rounded font-bold text-lg">-</button>
                        </div>
                    </div>
                </div>
            )})}
        </div>

        {isModalOpen && (
             <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-serif text-white">{editingId ? 'Editar Projeto' : 'Novo Projeto'}</h3>
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
                        <button type="submit" className="w-full bg-gold-600 hover:bg-gold-500 text-white font-bold py-2 rounded mt-2">{editingId ? 'Salvar Alterações' : 'Criar Projeto'}</button>
                    </form>
                </div>
             </div>
        )}
    </div>
  );
};