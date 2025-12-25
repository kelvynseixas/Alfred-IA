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
  AIActionType,
  Notification,
  Plan,
  Tutorial,
  Announcement
} from './types';
import { FinancialModule } from './components/FinancialModule';
import { TaskModule } from './components/TaskModule';
import { ListModule } from './components/ListModule';
import { AdminPanel } from './components/AdminPanel';
import { AlfredChat } from './components/AlfredChat';
import { UserProfile } from './components/UserProfile';
import { LoginPage } from './components/LoginPage';
import { TutorialModule } from './components/TutorialModule';
import { LayoutDashboard, CheckSquare, List, Settings, LogOut, Bot, User as UserIcon, Bell, Moon, Sun, PlayCircle, Info, X, Check, CreditCard, Trash2, Clock, Loader2 } from 'lucide-react';

export const ALFRED_ICON_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%230f172a' stroke='%23d97706' stroke-width='2'/%3E%3Cpath d='M50 25C40 25 32 33 32 43C32 55 42 60 50 60C58 60 68 55 68 43C68 33 60 25 50 25Z' fill='%23f1f5f9'/%3E%3Cpath d='M35 40C35 40 38 42 42 42' stroke='%230f172a' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M65 40C65 40 62 42 58 42' stroke='%230f172a' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M50 70L30 90H70L50 70Z' fill='%23d97706'/%3E%3Cpath d='M50 60V70' stroke='%23d97706' stroke-width='2'/%3E%3Cpath d='M42 50C45 52 55 52 58 50' stroke='%230f172a' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('alfred_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.FINANCE);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<ListGroup[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // --- Fetch Initial Data ---
  useEffect(() => {
    if (isAuthenticated) {
        fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
        const res = await fetch('/api/data/dashboard', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }
        });
        const data = await res.json();
        if (res.ok) {
            setTransactions(data.transactions);
            setTasks(data.tasks);
            // Armazena a API key globalmente se necessário (via contexto ou ref)
            if (data.config?.aiKeys?.gemini) {
                sessionStorage.setItem('VITE_GEMINI_KEY', data.config.aiKeys.gemini);
            }
        }
    } catch (e) { console.error("Erro ao carregar dados"); }
  };

  // --- Handlers com API ---
  const handleAddTransaction = async (t: Omit<Transaction, 'id'>) => {
    const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('alfred_token')}`
        },
        body: JSON.stringify(t)
    });
    if (res.ok) {
        const saved = await res.json();
        setTransactions(prev => [saved, ...prev]);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }
    });
    if (res.ok) setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTask = async (t: Omit<Task, 'id'>) => {
    const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('alfred_token')}`
        },
        body: JSON.stringify(t)
    });
    if (res.ok) {
        const saved = await res.json();
        setTasks(prev => [...prev, saved]);
    }
  };

  const handleToggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === TaskStatus.DONE ? TaskStatus.PENDING : TaskStatus.DONE;
    const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('alfred_token')}`
        },
        body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  // --- Auth Handlers ---
  const handleLogin = async (email: string, pass: string) => {
    setAuthLoading(true);
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
    } finally { setAuthLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('alfred_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} onRegister={() => {}} plans={[]} isDarkMode={isDarkMode} />;

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Bot className="text-gold-500" />
            <h1 className="text-xl font-serif font-bold">Alfred IA</h1>
          </div>
          <nav className="space-y-2">
            <button onClick={() => setActiveModule(ModuleType.FINANCE)} className={`w-full text-left p-3 rounded-lg flex gap-3 ${activeModule === ModuleType.FINANCE ? 'bg-slate-800 text-gold-400' : ''}`}><LayoutDashboard size={20}/> Financeiro</button>
            <button onClick={() => setActiveModule(ModuleType.TASKS)} className={`w-full text-left p-3 rounded-lg flex gap-3 ${activeModule === ModuleType.TASKS ? 'bg-slate-800 text-gold-400' : ''}`}><CheckSquare size={20}/> Tarefas</button>
            {currentUser?.role === 'ADMIN' && (
                <button onClick={() => setActiveModule(ModuleType.ADMIN)} className={`w-full text-left p-3 rounded-lg flex gap-3 ${activeModule === ModuleType.ADMIN ? 'bg-slate-800 text-purple-400' : ''}`}><Settings size={20}/> Painel Master</button>
            )}
          </nav>
        </div>
        <button onClick={handleLogout} className="flex gap-3 p-3 text-slate-500 hover:text-red-400"><LogOut size={20}/> Sair</button>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative">
        {activeModule === ModuleType.FINANCE && <FinancialModule transactions={transactions} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} isDarkMode={isDarkMode} />}
        {activeModule === ModuleType.TASKS && <TaskModule tasks={tasks} onToggleStatus={handleToggleTask} onAddTask={handleAddTask} onDeleteTask={() => {}} onEditTask={() => {}} />}
        {activeModule === ModuleType.ADMIN && <AdminPanel users={[]} plans={[]} tutorials={[]} isDarkMode={isDarkMode} onUpdateUser={() => {}} onAddUser={() => {}} onManagePlan={() => {}} onManageTutorial={() => {}} onAddAnnouncement={() => {}} />}
        
        <button onClick={() => setIsChatOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-gold-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform">
          <Bot className="text-slate-900" />
        </button>
        <AlfredChat appContext={{ transactions, tasks }} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onAIAction={() => {}} />
      </main>
    </div>
  );
};

export default App;