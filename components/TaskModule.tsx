import React, { useState } from 'react';
import { Task, TaskStatus, RecurrencePeriod } from '../types';
import { Calendar, CheckCircle2, Clock, AlertTriangle, Plus, X, Edit2, Trash2, Repeat } from 'lucide-react';

interface TaskModuleProps {
  tasks: Task[];
  onToggleStatus: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onEditTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskModule: React.FC<TaskModuleProps> = ({ tasks, onToggleStatus, onAddTask, onEditTask, onDeleteTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<{ title: string, date: string, time: string, priority: string, recurrencePeriod: RecurrencePeriod, recurrenceInterval: number, recurrenceLimit: string }>({ 
      title: '', date: '', time: '', priority: 'medium', recurrencePeriod: 'NONE', recurrenceInterval: 1, recurrenceLimit: '' 
  });

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'medium': return 'text-gold-500 bg-gold-500/10 border-gold-500/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const formatDateDisplay = (dateStr: string) => {
      if(!dateStr) return '';
      const cleanDate = dateStr.split('T')[0];
      const [year, month, day] = cleanDate.split('-');
      return `${day}/${month}/${year}`;
  };

  const openNewTaskModal = () => {
      setEditingTask(null);
      setTaskForm({ title: '', date: '', time: '', priority: 'medium', recurrencePeriod: 'NONE', recurrenceInterval: 1, recurrenceLimit: '' });
      setIsModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
      setEditingTask(task.id);
      const dateForInput = task.date ? task.date.split('T')[0] : '';
      setTaskForm({ 
          title: task.title, 
          date: dateForInput, 
          time: task.time || '', 
          priority: task.priority,
          recurrencePeriod: task.recurrencePeriod || 'NONE',
          recurrenceInterval: task.recurrenceInterval || 1,
          recurrenceLimit: task.recurrenceLimit ? String(task.recurrenceLimit) : ''
      });
      setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
      if(confirm("Tem certeza que deseja excluir esta tarefa?")) onDeleteTask(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.date) return;
    
    const taskData: any = {
        title: taskForm.title,
        date: taskForm.date,
        time: taskForm.time || '',
        priority: taskForm.priority as any,
        status: TaskStatus.PENDING,
        recurrencePeriod: taskForm.recurrencePeriod,
        recurrenceInterval: taskForm.recurrenceInterval,
        recurrenceLimit: taskForm.recurrenceLimit ? parseInt(taskForm.recurrenceLimit) : 0
    };

    if (editingTask) {
        onEditTask(editingTask, taskData);
    } else {
        onAddTask(taskData);
    }
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
          <button onClick={openNewTaskModal} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium">
                <Plus size={18} /> Nova Tarefa
            </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
                    <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2"><Calendar className="w-5 h-5 text-gold-500" /> Próximas Tarefas</h3>
                    <div className="space-y-3">
                        {sortedTasks.map(task => (
                            <div key={task.id} className={`group p-4 rounded-lg border flex items-center justify-between transition-all duration-200 ${task.status === TaskStatus.DONE ? 'bg-slate-900/50 border-slate-800 opacity-50' : 'bg-slate-800 border-slate-700 hover:border-gold-500/30 hover:bg-slate-750'}`}>
                                <div className="flex items-center gap-4 flex-1">
                                    <button onClick={() => onToggleStatus(task.id)} className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 hover:border-gold-500'}`}>
                                        {task.status === TaskStatus.DONE && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    </button>
                                    <div className="min-w-0">
                                        <p className={`font-medium truncate ${task.status === TaskStatus.DONE ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.title}</p>
                                        <div className="flex gap-3 text-xs text-slate-400 mt-1">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDateDisplay(task.date)}</span>
                                            {task.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.time}</span>}
                                            {task.recurrencePeriod && task.recurrencePeriod !== 'NONE' && <span className="flex items-center gap-1 text-purple-400"><Repeat className="w-3 h-3"/> Repetir</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)} uppercase tracking-wider font-semibold hidden sm:inline-block`}>
                                        {task.priority === 'high' ? 'ALTA' : task.priority === 'medium' ? 'MÉDIA' : 'BAIXA'}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditTaskModal(task)} className="p-1.5 text-slate-400 hover:text-white bg-slate-700/50 rounded hover:bg-slate-700 transition-colors"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(task.id)} className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-700/50 rounded hover:bg-slate-700 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Stats */}
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
                    </div>
                </div>
            </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-serif text-white">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
                        <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Título</label>
                            <input className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-gold-500 focus:outline-none" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs text-slate-400 mb-1">Data</label>
                                <input type="date" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-gold-500 focus:outline-none" value={taskForm.date} onChange={e => setTaskForm({...taskForm, date: e.target.value})} required />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Hora</label>
                                <input type="time" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-gold-500 focus:outline-none" value={taskForm.time} onChange={e => setTaskForm({...taskForm, time: e.target.value})} />
                            </div>
                        </div>
                        <div>
                             <label className="block text-xs text-slate-400 mb-1">Prioridade</label>
                             <select className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-gold-500 focus:outline-none" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value as any})}>
                                 <option value="low">Baixa</option>
                                 <option value="medium">Média</option>
                                 <option value="high">Alta</option>
                             </select>
                        </div>
                        
                        <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
                            <label className="block text-xs text-slate-400 mb-2 font-bold">Repetição</label>
                            <div className="grid grid-cols-2 gap-2">
                                <select value={taskForm.recurrencePeriod} onChange={e => setTaskForm({...taskForm, recurrencePeriod: e.target.value as any})} className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white">
                                    <option value="NONE">Não Repetir</option>
                                    <option value="DAILY">Diário</option>
                                    <option value="WEEKLY">Semanal</option>
                                    <option value="MONTHLY">Mensal</option>
                                    <option value="YEARLY">Anual</option>
                                </select>
                                {taskForm.recurrencePeriod !== 'NONE' && (
                                    <div className="flex items-center gap-1">
                                        <input type="number" min="1" value={taskForm.recurrenceInterval} onChange={e => setTaskForm({...taskForm, recurrenceInterval: parseInt(e.target.value)})} className="w-10 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-center text-white" />
                                        <span className="text-xs text-slate-400">interv.</span>
                                    </div>
                                )}
                            </div>
                            {taskForm.recurrencePeriod !== 'NONE' && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-slate-400">Parar após</span>
                                    <input type="number" min="1" max="30" placeholder="∞" value={taskForm.recurrenceLimit} onChange={e => setTaskForm({...taskForm, recurrenceLimit: e.target.value})} className="w-16 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-center text-white" />
                                    <span className="text-xs text-slate-400">vezes</span>
                                </div>
                            )}
                        </div>

                        <button type="submit" className="w-full bg-gold-600 hover:bg-gold-500 text-white font-bold py-3 rounded mt-4">{editingTask ? 'Salvar Alterações' : 'Agendar'}</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};