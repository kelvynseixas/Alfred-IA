import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { Calendar, CheckCircle2, Clock, AlertTriangle, Plus, X } from 'lucide-react';

interface TaskModuleProps {
  tasks: Task[];
  onToggleStatus: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id'>) => void;
}

export const TaskModule: React.FC<TaskModuleProps> = ({ tasks, onToggleStatus, onAddTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({ priority: 'medium', status: TaskStatus.PENDING });

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'medium': return 'text-gold-500 bg-gold-500/10 border-gold-500/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.date) return;
    onAddTask({
        title: newTask.title,
        date: newTask.date,
        time: newTask.time || '',
        priority: newTask.priority as any,
        status: TaskStatus.PENDING
    });
    setNewTask({ priority: 'medium', title: '', date: '', time: '' });
    setIsModalOpen(false);
  };

  const sortedTasks = [...tasks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
       <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-serif text-white">Concierge de Agenda</h2>
            <p className="text-slate-400">Gerenciando seu tempo precioso, Senhor.</p>
          </div>
          <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
                <Plus size={18} />
                Nova Tarefa
            </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Focus */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
                    <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gold-500" />
                        Próximas Tarefas
                    </h3>
                    
                    <div className="space-y-3">
                        {sortedTasks.map(task => (
                            <div key={task.id} 
                                className={`group p-4 rounded-lg border flex items-center justify-between transition-all duration-200 
                                ${task.status === TaskStatus.DONE 
                                    ? 'bg-slate-900/50 border-slate-800 opacity-50' 
                                    : 'bg-slate-800 border-slate-700 hover:border-gold-500/30 hover:bg-slate-750'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => onToggleStatus(task.id)}
                                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors
                                            ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 hover:border-gold-500'}`}
                                    >
                                        {task.status === TaskStatus.DONE && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    </button>
                                    <div>
                                        <p className={`font-medium ${task.status === TaskStatus.DONE ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                            {task.title}
                                        </p>
                                        <div className="flex gap-3 text-xs text-slate-400 mt-1">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(task.date).toLocaleDateString('pt-BR')}</span>
                                            {task.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.time}</span>}
                                        </div>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)} uppercase tracking-wider font-semibold`}>
                                    {task.priority === 'high' ? 'ALTA' : task.priority === 'medium' ? 'MÉDIA' : 'BAIXA'}
                                </span>
                            </div>
                        ))}

                        {sortedTasks.length === 0 && (
                            <div className="text-center py-12 text-slate-500 italic border border-dashed border-slate-700 rounded-lg">
                                "Uma agenda limpa é uma mente limpa, Senhor. Sem pendências."
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Suggestions / Stats */}
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
                    <h4 className="text-white font-serif text-lg mb-4">Resumo</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Pendentes</span>
                            <span className="text-white font-bold">{tasks.filter(t => t.status === TaskStatus.PENDING).length}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Concluídas</span>
                            <span className="text-emerald-400 font-bold">{tasks.filter(t => t.status === TaskStatus.DONE).length}</span>
                        </div>
                        <hr className="border-slate-700" />
                        <div className="bg-gold-500/10 p-4 rounded-lg border border-gold-500/20">
                            <div className="flex gap-2 items-start">
                                <AlertTriangle className="w-5 h-5 text-gold-500 flex-shrink-0" />
                                <p className="text-xs text-gold-100 italic">
                                    "Recomendo focar nas tarefas de Alta prioridade antes do almoço para manter a produtividade."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-serif text-white">Nova Tarefa</h3>
                        <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Título</label>
                            <input 
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-gold-500 focus:outline-none"
                                value={newTask.title}
                                onChange={e => setNewTask({...newTask, title: e.target.value})}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs text-slate-400 mb-1">Data</label>
                                <input 
                                    type="date"
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-gold-500 focus:outline-none"
                                    value={newTask.date}
                                    onChange={e => setNewTask({...newTask, date: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Hora</label>
                                <input 
                                    type="time"
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-gold-500 focus:outline-none"
                                    value={newTask.time}
                                    onChange={e => setNewTask({...newTask, time: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Prioridade</label>
                            <select 
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-gold-500 focus:outline-none"
                                value={newTask.priority}
                                onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                            >
                                <option value="low">Baixa</option>
                                <option value="medium">Média</option>
                                <option value="high">Alta</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-gold-600 hover:bg-gold-500 text-white font-bold py-3 rounded mt-4">
                            Agendar
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};