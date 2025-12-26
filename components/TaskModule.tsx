
import React, { useState } from 'react';
import { Task, TaskStatus, RecurrencePeriod } from '../types';
import { Calendar, CheckCircle2, Clock, Plus, X, Trash2, Repeat } from 'lucide-react';

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
  const [taskForm, setTaskForm] = useState<{ title: string, date: string, time: string, priority: 'low'|'medium'|'high', recurrencePeriod: RecurrencePeriod, recurrenceInterval: string, recurrenceCount: string }>({ 
      title: '', date: '', time: '', priority: 'medium', recurrencePeriod: 'NONE', recurrenceInterval: '', recurrenceCount: ''
  });

  const openNewTaskModal = () => {
      setEditingTask(null);
      setTaskForm({ title: '', date: '', time: '', priority: 'medium', recurrencePeriod: 'NONE', recurrenceInterval: '', recurrenceCount: '' });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData: any = { 
      ...taskForm,
      recurrenceInterval: parseInt(taskForm.recurrenceInterval) || undefined,
      recurrenceCount: parseInt(taskForm.recurrenceCount) || undefined, 
      status: TaskStatus.PENDING 
    };
    if (editingTask) onEditTask(editingTask, taskData);
    else onAddTask(taskData);
    setIsModalOpen(false);
  };

  const sortedTasks = [...tasks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const pendingCount = tasks.filter(t => t.status === TaskStatus.PENDING).length;
  const doneCount = tasks.filter(t => t.status === TaskStatus.DONE).length;

  return (
    <div className="space-y-6 animate-fade-in">
       <header className="mb-6 flex justify-between items-center">
          <div><h2 className="text-3xl font-serif text-white">Agenda Executiva</h2><p className="text-slate-400">Gerenciando seu tempo precioso.</p></div>
          <button onClick={openNewTaskModal} className="bg-gold-600 hover:bg-gold-500 text-slate-950 px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={18} /> Nova Tarefa</button>
        </header>

        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-xl border border-slate-700 flex justify-around mb-6 shadow-lg">
             <div className="text-center"><p className="text-slate-400 text-xs font-bold uppercase mb-1">Tarefas Pendentes</p><p className="text-3xl font-serif text-white">{pendingCount}</p></div>
             <div className="w-px bg-slate-700 h-12 self-center"></div>
             <div className="text-center"><p className="text-slate-400 text-xs font-bold uppercase mb-1">Concluídas Hoje</p><p className="text-3xl font-serif text-emerald-400">{doneCount}</p></div>
        </div>

        <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
            <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2"><Calendar className="w-5 h-5 text-gold-500" /> Próximas Tarefas</h3>
            <div className="space-y-3">
                {sortedTasks.map(task => (
                    <div key={task.id} className={`group p-4 rounded-lg border flex items-center justify-between transition-all duration-200 ${task.status === TaskStatus.DONE ? 'bg-slate-900/50 border-slate-800 opacity-50' : 'bg-slate-800 border-slate-700 hover:border-gold-500/30 hover:bg-slate-750'}`}>
                        <div className="flex items-center gap-4 flex-1">
                            <button onClick={() => onToggleStatus(task.id)} className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 hover:border-gold-500'}`}>{task.status === TaskStatus.DONE && <CheckCircle2 className="w-4 h-4 text-white" />}</button>
                            <div>
                                <p className={`font-medium ${task.status === TaskStatus.DONE ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.title}</p>
                                <div className="flex gap-3 text-xs text-slate-400 mt-1">
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(task.date).toLocaleDateString()}</span>
                                    {task.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.time}</span>}
                                    {task.recurrencePeriod !== 'NONE' && <Repeat className="w-3 h-3 text-gold-400" />}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => onDeleteTask(task.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                    </div>
                ))}
            </div>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-serif text-white">Nova Tarefa</h3><button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button></div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="Título da Tarefa" required />
                        <div className="grid grid-cols-2 gap-4">
                             <input type="date" className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white" value={taskForm.date} onChange={e => setTaskForm({...taskForm, date: e.target.value})} required />
                             <input type="time" className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white" value={taskForm.time} onChange={e => setTaskForm({...taskForm, time: e.target.value})} />
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <h4 className="text-sm font-bold text-slate-300 mb-2">Recorrência</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <select className="col-span-3 md:col-span-1 bg-slate-850 border border-slate-700 p-3 rounded-lg text-white text-sm" value={taskForm.recurrencePeriod} onChange={e => setTaskForm({...taskForm, recurrencePeriod: e.target.value as any})}>
                              <option value="NONE">Nunca</option><option value="DAILY">Diário</option><option value="WEEKLY">Semanal</option><option value="MONTHLY">Mensal</option><option value="YEARLY">Anual</option>
                            </select>
                            <input type="number" placeholder={`A cada X ${taskForm.recurrencePeriod === 'DAILY' ? 'dias' : taskForm.recurrencePeriod.toLowerCase().replace('ly','s')}`} disabled={taskForm.recurrencePeriod === 'NONE'} className="bg-slate-850 border border-slate-700 p-3 rounded-lg text-white text-sm disabled:opacity-50" value={taskForm.recurrenceInterval} onChange={e => setTaskForm({...taskForm, recurrenceInterval: e.target.value})} />
                            <input type="number" placeholder="Repetir X vezes" disabled={taskForm.recurrencePeriod === 'NONE'} className="bg-slate-850 border border-slate-700 p-3 rounded-lg text-white text-sm disabled:opacity-50" value={taskForm.recurrenceCount} onChange={e => setTaskForm({...taskForm, recurrenceCount: e.target.value})} />
                          </div>
                        </div>
                        <button type="submit" className="w-full bg-gold-600 hover:bg-gold-500 text-slate-950 font-bold py-3 rounded-lg mt-4">Agendar Tarefa</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
