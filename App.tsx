import React, { useState, useEffect } from 'react';
import { 
  ModuleType, 
  Transaction, 
  Task, 
  TaskStatus, 
  ListGroup, 
  User,
  AIActionType,
  FinancialProject,
  Announcement
} from './types';
import { FinancialModule } from './components/FinancialModule';
import { FinancialProjectsModule } from './components/FinancialProjectsModule';
import { TaskModule } from './components/TaskModule';
import { ListModule } from './components/ListModule';
import { AdminPanel } from './components/AdminPanel';
import { AlfredChat } from './components/AlfredChat';
import { UserProfile } from './components/UserProfile';
import { LoginPage } from './components/LoginPage';
import { TutorialModule } from './components/TutorialModule';
import { LayoutDashboard, CheckSquare, List, Settings, LogOut, Bot, User as UserIcon, BookOpen, Bell, Clock, Target, Info, Trash2, CheckCircle, Menu, X } from 'lucide-react';

// Avatar Vetorial Premium do Alfred
export const ALFRED_ICON_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%230f172a;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%231e293b;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='100' cy='100' r='90' fill='url(%23grad1)' stroke='%23d97706' stroke-width='4'/%3E%3Cpath d='M65 80 Q 80 95 95 80' stroke='%2338bdf8' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3Cpath d='M105 80 Q 120 95 135 80' stroke='%2338bdf8' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3Crect x='50' y='60' width='100' height='20' rx='5' fill='%2338bdf8' opacity='0.2'/%3E%3Cpath d='M100 130 Q 130 130 140 110' stroke='%2338bdf8' stroke-width='2' fill='none' opacity='0.5'/%3E%3Cpath d='M100 130 Q 70 130 60 110' stroke='%2338bdf8' stroke-width='2' fill='none' opacity='0.5'/%3E%3Cpath d='M100 150 L 100 170' stroke='%23d97706' stroke-width='6'/%3E%3Cpath d='M70 170 L 130 170 L 115 190 L 85 190 Z' fill='%23d97706'/%3E%3Cpath d='M90 170 L 90 180 L 110 180 L 110 170' fill='%230f172a'/%3E%3Ccircle cx='100' cy='100' r='95' stroke='%23d97706' stroke-width='2' fill='none' opacity='0.5'/%3E%3C/svg%3E";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('alfred_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.FINANCE);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile Menu State
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<ListGroup[]>([]);
  const [projects, setProjects] = useState<FinancialProject[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  
  const [readItems, setReadItems] = useState<string[]>([]);
  const [deletedItems, setDeletedItems] = useState<string[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    const savedState = localStorage.getItem('alfred_notifications_state');
    if (savedState) {
        const { read, deleted } = JSON.parse(savedState);
        setReadItems(read || []);
        setDeletedItems(deleted || []);
    }
    return () => clearInterval(timer);
  }, []);

  const saveNotificationState = (read: string[], deleted: string[]) => {
      localStorage.setItem('alfred_notifications_state', JSON.stringify({ read, deleted }));
  };

  const markAsRead = (id: string) => {
      if (!readItems.includes(id)) {
          const newRead = [...readItems, id];
          setReadItems(newRead);
          saveNotificationState(newRead, deletedItems);
      }
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!deletedItems.includes(id)) {
          const newDeleted = [...deletedItems, id];
          setDeletedItems(newDeleted);
          saveNotificationState(readItems, newDeleted);
      }
  };

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
            setProjects(data.projects || []);
            setAnnouncements(data.announcements || []);
            if(data.users) setUsers(data.users);
            if(data.plans) setPlans(data.plans);
            if(data.coupons) setCoupons(data.coupons);
            if(data.tutorials) setTutorials(data.tutorials);
            
            if (!currentUser && localStorage.getItem('alfred_user_data')) {
                 setCurrentUser(JSON.parse(localStorage.getItem('alfred_user_data')!));
            }
            if (data.config?.aiKeys?.gemini) {
                sessionStorage.setItem('VITE_GEMINI_KEY', data.config.aiKeys.gemini);
            }
        } else if (res.status === 401 || res.status === 403) {
            handleLogout();
        }
    } catch (e) { 
        handleLogout();
    }
  };

  const handleEditTask = async (id: string, updates: Partial<Task>) => {
      await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }, body: JSON.stringify(updates) });
      fetchDashboardData();
  };

  const handleEditTransaction = async (id: string, updates: Partial<Transaction>) => {
      await fetch(`/api/transactions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }, body: JSON.stringify(updates) });
      fetchDashboardData();
  };

  const handleUpdateUser = async (u: User) => {
      try {
        const res = await fetch('/api/users/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }, body: JSON.stringify(u) });
        if (res.ok) { setCurrentUser(u); localStorage.setItem('alfred_user_data', JSON.stringify(u)); return true; }
      } catch (e) { console.error(e); }
      return false;
  };

  const handleLogin = async (email: string, pass: string) => {
    try {
        const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) });
        const data = await res.json();
        if (res.ok) { localStorage.setItem('alfred_token', data.token); localStorage.setItem('alfred_user_data', JSON.stringify(data.user)); setCurrentUser(data.user); setIsAuthenticated(true); } else alert(data.error);
    } catch(e) { alert("Erro de conexão"); }
  };

  const handleLogout = () => { localStorage.removeItem('alfred_token'); localStorage.removeItem('alfred_user_data'); setIsAuthenticated(false); setCurrentUser(null); };

  // Helper para limpar números vindos da IA (ex: "20.000", "R$ 50")
  const sanitizeNumber = (val: any): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
          // Remove tudo que não é dígito ou ponto
          const clean = val.replace(/[^\d.]/g, '');
          return parseFloat(clean) || 0;
      }
      return 0;
  };

  const handleAIAction = async (action: { type: AIActionType, payload: any }) => {
      try {
        const token = localStorage.getItem('alfred_token');
        if (!token) return;

        // --- TRANSAÇÕES ---
        if (action.type === 'ADD_TRANSACTION') {
            const raw = action.payload || {};
            const payload = {
                description: raw.description || 'Despesa não identificada',
                amount: sanitizeNumber(raw.amount),
                type: raw.type || 'EXPENSE',
                category: raw.category || 'Geral',
                date: raw.date || new Date().toISOString(),
                recurrencePeriod: raw.recurrencePeriod || 'NONE',
                recurrenceInterval: raw.recurrenceInterval ? parseInt(raw.recurrenceInterval) : 1,
                recurrenceLimit: raw.recurrenceLimit ? parseInt(raw.recurrenceLimit) : 0
            };
            
            await fetch('/api/transactions', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
                body: JSON.stringify(payload) 
            });
            fetchDashboardData();
        } 
        
        // --- TAREFAS ---
        else if (action.type === 'ADD_TASK') {
            const raw = action.payload || {};
            const payload = {
                title: raw.title || 'Nova Tarefa',
                date: raw.date || new Date().toISOString().split('T')[0],
                time: raw.time || null,
                priority: raw.priority || 'medium',
                status: TaskStatus.PENDING,
                recurrencePeriod: raw.recurrencePeriod || 'NONE'
            };

            await fetch('/api/tasks', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
                body: JSON.stringify(payload) 
            });
            fetchDashboardData();
        } 
        
        // --- ATUALIZAR TAREFAS ---
        else if (action.type === 'UPDATE_TASK' && action.payload.id) {
            await handleEditTask(action.payload.id, action.payload.updates);
        } 
        
        // --- PROJETOS & METAS ---
        else if (action.type === 'ADD_PROJECT') {
            const raw = action.payload || {};
            const payload = {
                title: raw.title || 'Novo Projeto',
                description: raw.description || '',
                targetAmount: sanitizeNumber(raw.targetAmount),
                deadline: raw.deadline || null,
                category: raw.category || 'GOAL'
            };

            await fetch('/api/projects', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
                body: JSON.stringify(payload) 
            });
            setActiveModule(ModuleType.PROJECTS);
            fetchDashboardData();
        }

        // --- LISTAS ---
        else if (action.type === 'ADD_LIST_ITEM') {
            const raw = action.payload || {};
            if (raw.listId && raw.name) {
                 await fetch(`/api/lists/${raw.listId}/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ name: raw.name })
                });
                fetchDashboardData();
            }
        }

      } catch (error) {
          console.error("Falha ao executar ação da IA:", error);
      }
  };

  const getDueItems = () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
      return tasks.filter(t => t.status !== TaskStatus.DONE && (t.date === today || t.date === tomorrow));
  };
  
  const activeDueItems = getDueItems().filter(t => !deletedItems.includes(t.id));
  const activeAnnouncements = announcements.filter(a => !deletedItems.includes(a.id));
  const unreadCount = activeDueItems.filter(t => !readItems.includes(t.id)).length;
  const unreadAnnouncementsCount = activeAnnouncements.filter(a => !readItems.includes(a.id)).length;

  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} onRegister={() => {}} plans={[]} isDarkMode={isDarkMode} />;

  const btnClass = (mod: ModuleType) => `w-full text-left p-3 rounded-lg flex gap-3 transition-colors ${activeModule === mod ? 'bg-slate-800 text-gold-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`;

  const SidebarContent = () => (
    <>
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gold-500">
                <img src={ALFRED_ICON_URL} alt="Alfred" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-tight text-white">Alfred IA</h1>
          </div>
          <div className="mb-6 px-3 py-2 bg-slate-800/50 rounded-lg flex items-center gap-2 text-slate-300 text-sm">
             <Clock size={16} className="text-gold-500" />
             <span>{currentTime.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <nav className="space-y-1">
            <button onClick={() => { setActiveModule(ModuleType.FINANCE); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.FINANCE)}><LayoutDashboard size={20}/> Financeiro</button>
            <button onClick={() => { setActiveModule(ModuleType.PROJECTS); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.PROJECTS)}><Target size={20}/> Projetos</button>
            <button onClick={() => { setActiveModule(ModuleType.TASKS); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.TASKS)}><CheckSquare size={20}/> Tarefas</button>
            <button onClick={() => { setActiveModule(ModuleType.LISTS); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.LISTS)}><List size={20}/> Listas & Compras</button>
            <button onClick={() => { setActiveModule(ModuleType.TUTORIALS); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.TUTORIALS)}><BookOpen size={20}/> Tutoriais</button>
            <button onClick={() => { setActiveModule(ModuleType.PROFILE); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.PROFILE)}><UserIcon size={20}/> Meu Perfil</button>
            {currentUser?.role === 'ADMIN' && (
                <div className="pt-4 mt-4 border-t border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase px-3 mb-2">Administração</p>
                    <button onClick={() => { setActiveModule(ModuleType.ADMIN); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.ADMIN)}><Settings size={20}/> Painel Master</button>
                </div>
            )}
          </nav>
        </div>
        <div className="border-t border-slate-800 pt-4">
             <div className="flex items-center gap-3 px-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gold-600 flex items-center justify-center text-slate-900 font-bold">{currentUser?.name?.charAt(0) || 'U'}</div>
                <div className="overflow-hidden"><p className="text-sm font-medium text-white truncate">{currentUser?.name}</p><p className="text-xs text-slate-500 truncate">{currentUser?.email}</p></div>
             </div>
             <button onClick={handleLogout} className="w-full flex gap-3 p-3 text-slate-500 hover:text-red-400 transition-colors"><LogOut size={20}/> Sair</button>
        </div>
    </>
  );

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Sidebar Desktop */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-6 flex-col justify-between hidden md:flex">
         <SidebarContent />
      </aside>

      {/* Sidebar Mobile */}
      <div className={`fixed inset-0 z-50 bg-slate-900 p-6 flex flex-col justify-between transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
          <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 text-white"><X size={24} /></button>
          <SidebarContent />
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* TOP BAR - FIXED */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur flex items-center justify-between px-4 md:px-8 z-40 shrink-0">
             <div className="flex items-center gap-4">
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-white"><Menu size={24} /></button>
                <div className="md:hidden flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full overflow-hidden border border-gold-500">
                        <img src={ALFRED_ICON_URL} alt="Alfred" className="w-full h-full object-cover" />
                     </div>
                     <span className="font-serif font-bold text-white">Alfred</span>
                </div>
             </div>

             <div className="flex items-center gap-4">
                {/* ANNOUNCEMENTS ICON */}
                <div className="relative">
                    <button 
                        onClick={() => { setShowAnnouncements(!showAnnouncements); setShowNotifications(false); }} 
                        className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white relative hover:bg-slate-700 transition-colors"
                        title="Informativos"
                    >
                        <Info size={20} />
                        {unreadAnnouncementsCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse border-2 border-slate-900"></span>}
                    </button>
                    {showAnnouncements && (
                        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50">
                            <div className="p-3 bg-slate-800/80 font-bold text-gold-500 text-xs uppercase flex items-center justify-between">
                                <span className="flex items-center gap-2"><Info size={14} /> Informativos</span>
                                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-full">{unreadAnnouncementsCount} novos</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {activeAnnouncements.length === 0 ? (
                                    <p className="p-4 text-xs text-slate-500 text-center italic">Nenhum informativo.</p>
                                ) : (
                                    activeAnnouncements.map(ann => (
                                        <div 
                                            key={ann.id} 
                                            onClick={() => markAsRead(ann.id)}
                                            className={`p-3 border-b border-slate-800/50 cursor-pointer transition-all relative group
                                                ${readItems.includes(ann.id) ? 'bg-slate-900/50 opacity-60' : 'bg-slate-800 hover:bg-slate-700'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <p className={`text-sm font-bold mb-1 ${readItems.includes(ann.id) ? 'text-slate-400' : 'text-white'}`}>{ann.title}</p>
                                                <button onClick={(e) => deleteNotification(ann.id, e)} className="text-slate-600 hover:text-red-500 p-1"><Trash2 size={12} /></button>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">{ann.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* NOTIFICATIONS ICON */}
                <div className="relative">
                    <button 
                        onClick={() => { setShowNotifications(!showNotifications); setShowAnnouncements(false); }} 
                        className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white relative hover:bg-slate-700 transition-colors"
                        title="Notificações"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-slate-900"></span>}
                    </button>
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50">
                            <div className="p-3 bg-slate-800/80 font-bold text-white text-xs uppercase flex items-center justify-between">
                                <span className="flex items-center gap-2"><Clock size={14} /> Pendências</span>
                                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-full">{unreadCount} novos</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {activeDueItems.length === 0 ? (
                                    <p className="p-4 text-xs text-slate-500 text-center italic">Nenhuma pendência urgente.</p>
                                ) : (
                                    activeDueItems.map(t => (
                                        <div 
                                            key={t.id} 
                                            onClick={() => markAsRead(t.id)}
                                            className={`p-3 border-b border-slate-800/50 cursor-pointer transition-all relative group
                                                ${readItems.includes(t.id) ? 'bg-slate-900/50 opacity-60' : 'bg-slate-800 hover:bg-slate-700'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <p className={`text-sm mb-1 ${readItems.includes(t.id) ? 'text-slate-400' : 'text-slate-200'}`}>{t.title}</p>
                                                <button onClick={(e) => deleteNotification(t.id, e)} className="text-slate-600 hover:text-red-500 p-1"><Trash2 size={12} /></button>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-gold-500">Vence: {t.date.split('T')[0].split('-').reverse().join('/')}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
             </div>
        </header>

        {/* CONTENT SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            {activeModule === ModuleType.FINANCE && <FinancialModule transactions={transactions} onAddTransaction={async (t) => { await fetch('/api/transactions', {method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('alfred_token')}`},body:JSON.stringify(t)}); fetchDashboardData(); }} onEditTransaction={handleEditTransaction} onDeleteTransaction={async (id) => { await fetch(`/api/transactions/${id}`, {method:'DELETE',headers:{'Authorization':`Bearer ${localStorage.getItem('alfred_token')}`}}); fetchDashboardData(); }} isDarkMode={isDarkMode} />}
            
            {activeModule === ModuleType.PROJECTS && <FinancialProjectsModule projects={projects} isDarkMode={isDarkMode} onAddProject={async (p) => { await fetch('/api/projects', {method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('alfred_token')}`},body:JSON.stringify(p)}); fetchDashboardData(); }} onUpdateProject={async (id, u) => { await fetch(`/api/projects/${id}`, {method:'PATCH',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('alfred_token')}`},body:JSON.stringify(u)}); fetchDashboardData(); }} onDeleteProject={async (id) => { await fetch(`/api/projects/${id}`, {method:'DELETE',headers:{'Authorization':`Bearer ${localStorage.getItem('alfred_token')}`}}); fetchDashboardData(); }} />}
            
            {activeModule === ModuleType.TASKS && <TaskModule tasks={tasks} onToggleStatus={async (id) => { await handleEditTask(id, {status: tasks.find(t=>t.id===id)?.status===TaskStatus.DONE ? TaskStatus.PENDING : TaskStatus.DONE}); }} onAddTask={async (t) => { await fetch('/api/tasks', {method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('alfred_token')}`},body:JSON.stringify(t)}); fetchDashboardData(); }} onDeleteTask={() => {}} onEditTask={handleEditTask} />}
            
            {activeModule === ModuleType.LISTS && <ListModule lists={lists} onAddList={async (n) => { await fetch('/api/lists', {method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('alfred_token')}`},body:JSON.stringify({name:n})}); fetchDashboardData(); }} onEditList={async (id, name) => { await fetch(`/api/lists/${id}`, {method:'PATCH',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('alfred_token')}`},body:JSON.stringify({name})}); fetchDashboardData(); }} onDeleteList={async (id) => { await fetch(`/api/lists/${id}`, {method:'DELETE',headers:{'Authorization':`Bearer ${localStorage.getItem('alfred_token')}`}}); fetchDashboardData(); }} onToggleItem={async (l, i) => { const list=lists.find(g=>g.id===l); const item=list?.items.find(x=>x.id===i); if(item) { await fetch(`/api/lists/items/${i}`, {method:'PATCH',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('alfred_token')}`},body:JSON.stringify({status:item.status==='DONE'?'PENDING':'DONE'})}); fetchDashboardData(); }}} onDeleteItem={async (l,i) => { await fetch(`/api/lists/items/${i}`, {method:'DELETE',headers:{'Authorization':`Bearer ${localStorage.getItem('alfred_token')}`}}); fetchDashboardData(); }} onAddItem={() => fetchDashboardData()} />}
            
            {activeModule === ModuleType.TUTORIALS && <TutorialModule tutorials={tutorials} isDarkMode={isDarkMode} />}
            
            {activeModule === ModuleType.PROFILE && currentUser && <UserProfile user={currentUser} plans={plans} isDarkMode={isDarkMode} onUpdateUser={handleUpdateUser} />}
            
            {activeModule === ModuleType.ADMIN && currentUser?.role === 'ADMIN' && <AdminPanel users={users} plans={plans} coupons={coupons} tutorials={tutorials} isDarkMode={isDarkMode} onUpdateUser={() => fetchDashboardData()} onAddUser={() => fetchDashboardData()} onManagePlan={() => fetchDashboardData()} onManageTutorial={() => fetchDashboardData()} onAddAnnouncement={async (ann) => { await fetch('/api/admin/announcements', {method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('alfred_token')}`},body:JSON.stringify(ann)}); fetchDashboardData(); }} />}
        </div>
        
        <button onClick={() => setIsChatOpen(true)} className="fixed bottom-8 right-8 w-14 h-14 bg-gold-600 hover:bg-gold-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform z-50">
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
             <img src={ALFRED_ICON_URL} className="w-full h-full object-cover" />
          </div>
        </button>
        <AlfredChat appContext={{ tasks, transactions }} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onAIAction={handleAIAction} />
      </main>
    </div>
  );
};
export default App;