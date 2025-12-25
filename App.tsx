import React, { useState, useEffect } from 'react';
import { 
  ModuleType, 
  Transaction, 
  TransactionType, 
  Task, 
  TaskStatus, 
  ListGroup, 
  ItemStatus,
  User,
  UserRole,
  SubscriptionType,
  Notification
} from './types';
import { FinancialModule } from './components/FinancialModule';
import { TaskModule } from './components/TaskModule';
import { ListModule } from './components/ListModule';
import { AdminPanel } from './components/AdminPanel';
import { AlfredChat } from './components/AlfredChat';
import { UserProfile } from './components/UserProfile';
import { LoginPage } from './components/LoginPage';
import { TutorialModule } from './components/TutorialModule';
import { LayoutDashboard, CheckSquare, List, Settings, LogOut, Bot, User as UserIcon, BookOpen } from 'lucide-react';

export const ALFRED_ICON_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%230f172a' stroke='%23d97706' stroke-width='2'/%3E%3Cpath d='M50 25C40 25 32 33 32 43C32 55 42 60 50 60C58 60 68 55 68 43C68 33 60 25 50 25Z' fill='%23f1f5f9'/%3E%3Cpath d='M35 40C35 40 38 42 42 42' stroke='%230f172a' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M65 40C65 40 62 42 58 42' stroke='%230f172a' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M50 70L30 90H70L50 70Z' fill='%23d97706'/%3E%3Cpath d='M50 60V70' stroke='%23d97706' stroke-width='2'/%3E%3Cpath d='M42 50C45 52 55 52 58 50' stroke='%230f172a' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('alfred_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.FINANCE);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<ListGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
        fetchDashboardData();
    }
  }, [isAuthenticated, activeModule]);

  const fetchDashboardData = async () => {
    try {
        const res = await fetch('/api/data/dashboard', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }
        });
        const data = await res.json();
        if (res.ok) {
            setTransactions(data.transactions || []);
            setTasks(data.tasks || []);
            setLists(data.lists || []);
            if(data.users) setUsers(data.users);
            
            if (data.config?.aiKeys?.gemini) {
                sessionStorage.setItem('VITE_GEMINI_KEY', data.config.aiKeys.gemini);
            }
        }
    } catch (e) { console.error("Erro ao carregar dados", e); }
  };

  // --- Handlers Financeiro ---
  const handleAddTransaction = async (t: Omit<Transaction, 'id'>) => {
    const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` },
        body: JSON.stringify(t)
    });
    if (res.ok) fetchDashboardData();
  };

  const handleDeleteTransaction = async (id: string) => {
    await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }
    });
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // --- Handlers Tarefas ---
  const handleAddTask = async (t: Omit<Task, 'id'>) => {
    const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` },
        body: JSON.stringify(t)
    });
    if (res.ok) fetchDashboardData();
  };

  const handleToggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === TaskStatus.DONE ? TaskStatus.PENDING : TaskStatus.DONE;
    await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` },
        body: JSON.stringify({ status: newStatus })
    });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  // --- Handlers Listas ---
  const handleAddList = async (name: string) => {
    const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` },
        body: JSON.stringify({ name })
    });
    if (res.ok) fetchDashboardData();
  };

  const handleAddItem = async (listId: string, name: string) => {
      // Logic inside ListModule component calls fetch but we can handle global state here if refactored
      // For now ListModule can just call reload or we assume local update.
      // Better: ListModule triggers reload.
      fetchDashboardData();
  };

  const handleToggleItem = async (listId: string, itemId: string) => {
      const list = lists.find(l => l.id === listId);
      const item = list?.items.find(i => i.id === itemId);
      if(!item) return;
      const newStatus = item.status === ItemStatus.DONE ? ItemStatus.PENDING : ItemStatus.DONE;
      
      await fetch(`/api/lists/items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` },
          body: JSON.stringify({ status: newStatus })
      });
      fetchDashboardData();
  };

  const handleDeleteItem = async (listId: string, itemId: string) => {
      await fetch(`/api/lists/items/${itemId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }
      });
      fetchDashboardData();
  };

  // --- Handlers User ---
  const handleUpdateUser = async (u: User) => {
      const res = await fetch('/api/users/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` },
          body: JSON.stringify(u)
      });
      if (res.ok) {
          setCurrentUser(u);
          alert('Perfil atualizado com sucesso.');
      }
  };

  const handleLogin = async (email: string, pass: string) => {
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('alfred_token', data.token);
            setCurrentUser(data.user);
            setIsAuthenticated(true);
        } else alert(data.error);
    } catch(e) { alert("Erro de conexão"); }
  };

  const handleLogout = () => {
    localStorage.removeItem('alfred_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} onRegister={() => {}} plans={[]} isDarkMode={isDarkMode} />;

  const btnClass = (mod: ModuleType) => `w-full text-left p-3 rounded-lg flex gap-3 transition-colors ${activeModule === mod ? 'bg-slate-800 text-gold-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`;

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-6 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Bot className="text-gold-500 w-8 h-8" />
            <h1 className="text-2xl font-serif font-bold tracking-tight text-white">Alfred IA</h1>
          </div>
          <nav className="space-y-1">
            <button onClick={() => setActiveModule(ModuleType.FINANCE)} className={btnClass(ModuleType.FINANCE)}><LayoutDashboard size={20}/> Financeiro</button>
            <button onClick={() => setActiveModule(ModuleType.TASKS)} className={btnClass(ModuleType.TASKS)}><CheckSquare size={20}/> Tarefas</button>
            <button onClick={() => setActiveModule(ModuleType.LISTS)} className={btnClass(ModuleType.LISTS)}><List size={20}/> Listas & Compras</button>
            <button onClick={() => setActiveModule(ModuleType.TUTORIALS)} className={btnClass(ModuleType.TUTORIALS)}><BookOpen size={20}/> Tutoriais</button>
            <button onClick={() => setActiveModule(ModuleType.PROFILE)} className={btnClass(ModuleType.PROFILE)}><UserIcon size={20}/> Meu Perfil</button>
            
            {currentUser?.role === 'ADMIN' && (
                <div className="pt-4 mt-4 border-t border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase px-3 mb-2">Administração</p>
                    <button onClick={() => setActiveModule(ModuleType.ADMIN)} className={btnClass(ModuleType.ADMIN)}><Settings size={20}/> Painel Master</button>
                </div>
            )}
          </nav>
        </div>
        <button onClick={handleLogout} className="flex gap-3 p-3 text-slate-500 hover:text-red-400 transition-colors"><LogOut size={20}/> Sair</button>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {activeModule === ModuleType.FINANCE && <FinancialModule transactions={transactions} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} isDarkMode={isDarkMode} />}
        {activeModule === ModuleType.TASKS && <TaskModule tasks={tasks} onToggleStatus={handleToggleTask} onAddTask={handleAddTask} onDeleteTask={() => {}} onEditTask={() => {}} />}
        {activeModule === ModuleType.LISTS && <ListModule lists={lists} onAddList={handleAddList} onToggleItem={handleToggleItem} onDeleteItem={handleDeleteItem} onAddItem={handleAddItem} />}
        {activeModule === ModuleType.TUTORIALS && <TutorialModule tutorials={[]} isDarkMode={isDarkMode} />}
        {activeModule === ModuleType.PROFILE && currentUser && <UserProfile user={currentUser} isDarkMode={isDarkMode} onUpdateUser={handleUpdateUser} />}
        {activeModule === ModuleType.ADMIN && <AdminPanel users={users} plans={[]} tutorials={[]} isDarkMode={isDarkMode} onUpdateUser={() => {}} onAddUser={() => {}} onManagePlan={() => {}} onManageTutorial={() => {}} onAddAnnouncement={() => {}} />}
        
        <button onClick={() => setIsChatOpen(true)} className="fixed bottom-8 right-8 w-14 h-14 bg-gold-600 hover:bg-gold-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform z-50">
          <Bot className="text-slate-900 w-8 h-8" />
        </button>
        <AlfredChat appContext={{ transactions, tasks, lists }} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onAIAction={() => {}} />
      </main>
    </div>
  );
};

export default App;