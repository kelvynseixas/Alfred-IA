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

// Alfred Butler Icon (SVG Base64 for consistency)
export const ALFRED_ICON_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%230f172a' stroke='%23d97706' stroke-width='2'/%3E%3Cpath d='M50 25C40 25 32 33 32 43C32 55 42 60 50 60C58 60 68 55 68 43C68 33 60 25 50 25Z' fill='%23f1f5f9'/%3E%3Cpath d='M35 40C35 40 38 42 42 42' stroke='%230f172a' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M65 40C65 40 62 42 58 42' stroke='%230f172a' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M50 70L30 90H70L50 70Z' fill='%23d97706'/%3E%3Cpath d='M50 60V70' stroke='%23d97706' stroke-width='2'/%3E%3Cpath d='M42 50C45 52 55 52 58 50' stroke='%230f172a' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E";

const App = () => {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // --- Global UI State ---
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.FINANCE);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInformatics, setShowInformatics] = useState(false);
  const [activePopup, setActivePopup] = useState<Announcement | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // --- Mock Data (Kept for UI State until fully replaced by API hooks) ---
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 'n1', title: 'Conta a Vencer', message: 'Energia Elétrica vence amanhã.', type: 'FINANCE', read: false, date: new Date().toISOString() }
  ]);

  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { id: 'a1', title: 'Manutenção Programada', message: 'O sistema passará por atualização na madrugada de domingo.', date: new Date().toISOString(), isPopup: false }
  ]);

  const [tutorials, setTutorials] = useState<Tutorial[]>([
    { id: 't1', title: 'Primeiros Passos', description: 'Como configurar sua conta e adicionar tarefas.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
  ]);

  const [plans, setPlans] = useState<Plan[]>([
    { id: 'p1', name: 'Mensal Básico', type: SubscriptionType.MONTHLY, price: 39.90, trialDays: 15, active: true },
    { id: 'p2', name: 'Semestral Econômico', type: SubscriptionType.SEMIANNUAL, price: 199.50, trialDays: 15, active: true },
    { id: 'p3', name: 'Trimestral Flex', type: SubscriptionType.QUARTERLY, price: 119.70, trialDays: 7, active: true },
    { id: 'p4', name: 'Anual Premium', type: SubscriptionType.ANNUAL, price: 399.00, trialDays: 30, active: true }
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<ListGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Admin View

  // --- API Handlers ---
  const handleLogin = async (email: string, pass: string) => {
    setAuthLoading(true);
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('alfred_token', data.token);
            setCurrentUser(data.user);
            setIsAuthenticated(true);
            // In a full implementation, we would fetch data here
            // loadUserData(data.token);
        } else {
            alert(data.error || "Erro ao fazer login");
        }
    } catch (error) {
        console.error("Login error", error);
        alert("Erro de conexão com o servidor.");
    } finally {
        setAuthLoading(false);
    }
  };

  const handleRegister = async (name: string, email: string, phone: string, subscription: SubscriptionType) => {
    setAuthLoading(true);
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, subscription, password: '123' }) // Default pass for now, usually user sets it
        });
        const data = await response.json();
        
        if (response.ok) {
             localStorage.setItem('alfred_token', data.token);
             setCurrentUser(data.user);
             setIsAuthenticated(true);
        } else {
            alert(data.error || "Erro ao registrar");
        }
    } catch (error) {
        alert("Erro de conexão.");
    } finally {
        setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('alfred_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveModule(ModuleType.FINANCE);
    setActivePopup(null);
  };

  // --- Effects ---
  // 1. Popup Check
  useEffect(() => {
    if (isAuthenticated && currentUser) {
        const unreadPopups = announcements.filter(a => 
            a.isPopup && 
            !currentUser.readAnnouncements?.includes(a.id) &&
            !currentUser.dismissedAnnouncements?.includes(a.id)
        );
        
        if (unreadPopups.length > 0) {
            unreadPopups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setActivePopup(unreadPopups[0]);
        }
    }
  }, [isAuthenticated, currentUser, announcements]);

  // 2. Task Notification Checker & Clock
  useEffect(() => {
      const timer = setInterval(() => {
          const now = new Date();
          setCurrentDateTime(now); // Update Clock

          if (!isAuthenticated) return;

          // Check tasks
          const nowStr = now.toISOString().split('T')[0];
          const currentTimeStr = now.toTimeString().slice(0, 5); // HH:MM

          const dueTasks = tasks.filter(t => 
              t.status === TaskStatus.PENDING && 
              !t.notified &&
              t.date === nowStr &&
              (!t.time || t.time <= currentTimeStr)
          );

          if (dueTasks.length > 0) {
               const newNotifs: Notification[] = dueTasks.map(t => ({
                   id: `notif-task-${t.id}`,
                   title: 'Tarefa Pendente',
                   message: `Lembrete: "${t.title}" está agendada para hoje.`,
                   type: 'TASK',
                   read: false,
                   date: new Date().toISOString()
               }));

               setNotifications(prev => [...newNotifs, ...prev]);
               
               // Mark as notified
               setTasks(prev => prev.map(t => dueTasks.find(dt => dt.id === t.id) ? { ...t, notified: true } : t));
          }

      }, 10000); // Check every 10 seconds

      return () => clearInterval(timer);
  }, [tasks, isAuthenticated]);


  // --- Helper: Days Remaining ---
  const getDaysRemaining = () => {
      if (!currentUser?.trialEndsAt) return 999;
      const end = new Date(currentUser.trialEndsAt);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      return Math.ceil(diff / (1000 * 3600 * 24)); 
  };
  const daysRemaining = getDaysRemaining();

  // --- CRUD Handlers (Currently Local State updated - ideally move to API) ---
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser);
  };
  const handleAddUser = (user: User) => setUsers(prev => [...prev, user]);
  
  const handleManagePlan = (plan: Plan, action: 'CREATE' | 'UPDATE' | 'DELETE') => {
      if (action === 'CREATE') setPlans(prev => [...prev, plan]);
      if (action === 'UPDATE') setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
      if (action === 'DELETE') {
          setPlans(prev => prev.filter(p => p.id !== plan.id));
      }
  };

  const handleManageTutorial = (tut: Tutorial, action: 'CREATE' | 'DELETE') => {
      if(action === 'CREATE') setTutorials(prev => [...prev, tut]);
      if(action === 'DELETE') setTutorials(prev => prev.filter(t => t.id !== tut.id));
  };

  const handleAddAnnouncement = (ann: Announcement) => setAnnouncements(prev => [ann, ...prev]);

  // Task Handlers
  const handleToggleTask = (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === TaskStatus.DONE ? TaskStatus.PENDING : TaskStatus.DONE } : t));
  const handleAddTask = (t: Omit<Task, 'id'>) => setTasks(prev => [...prev, { ...t, id: Date.now().toString(), notified: false }]);
  const handleEditTask = (id: string, updates: Partial<Task>) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const handleDeleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const handleToggleListItem = (lId: string, iId: string) => setLists(prev => prev.map(l => l.id === lId ? { ...l, items: l.items.map(i => i.id === iId ? { ...i, status: i.status === ItemStatus.DONE ? ItemStatus.PENDING : ItemStatus.DONE } : i) } : l));
  const handleDeleteListItem = (lId: string, iId: string) => setLists(prev => prev.map(l => l.id === lId ? { ...l, items: l.items.filter(i => i.id !== iId) } : l));
  const handleAddList = (name: string) => setLists(prev => [...prev, { id: Date.now().toString(), name, items: [] }]);
  
  const handleAddTransaction = (t: Omit<Transaction, 'id'>) => setTransactions(prev => [...prev, { ...t, id: Date.now().toString() }]);
  const handleDeleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  
  // Notification & Announcement Read/Delete Logic
  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAnnouncementAsRead = (id: string) => {
    if (!currentUser) return;
    const currentRead = currentUser.readAnnouncements || [];
    if (!currentRead.includes(id)) {
        const updatedUser = { ...currentUser, readAnnouncements: [...currentRead, id] };
        handleUpdateUser(updatedUser);
    }
  };

  const handleDismissAnnouncement = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentUser) return;
      const currentDismissed = currentUser.dismissedAnnouncements || [];
      if (!currentDismissed.includes(id)) {
          const updatedUser = { ...currentUser, dismissedAnnouncements: [...currentDismissed, id] };
          handleUpdateUser(updatedUser);
      }
  };

  const handleAIAction = (action: { type: AIActionType, payload: any }) => {
    if (action.type === 'ADD_TRANSACTION') handleAddTransaction({ ...action.payload, id: Date.now().toString() });
    if (action.type === 'ADD_TASK') handleAddTask({ ...action.payload, status: TaskStatus.PENDING });
    if (action.type === 'ADD_LIST_ITEM') {
        const { listName, itemName } = action.payload;
        setLists(prev => {
            const exists = prev.find(l => l.name.toLowerCase() === listName.toLowerCase());
            if (exists) {
                return prev.map(l => l.id === exists.id ? { ...l, items: [...l.items, { id: Date.now().toString(), name: itemName, category: 'Geral', status: ItemStatus.PENDING }] } : l);
            }
            return [...prev, { id: Date.now().toString(), name: listName, items: [{ id: Date.now().toString(), name: itemName, category: 'Geral', status: ItemStatus.PENDING }] }];
        });
    }
  };

  if (!isAuthenticated) {
    if (authLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2" /> Acessando Sistema...</div>;
    return <LoginPage onLogin={handleLogin} onRegister={handleRegister} plans={plans} isDarkMode={isDarkMode} />;
  }

  // Filter visible announcements
  const visibleAnnouncements = announcements.filter(a => !currentUser?.dismissedAnnouncements?.includes(a.id));

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      <aside className={`w-20 lg:w-64 border-r flex flex-col justify-between z-20 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div>
          <div className="p-6">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gold-600 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="font-serif font-bold text-xl text-slate-900">A</span>
                </div>
                <span className={`font-serif text-xl font-medium hidden lg:block ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Alfred IA</span>
             </div>
             
             <div className={`hidden lg:flex items-center gap-3 p-3 rounded-lg ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                 <div className="w-8 h-8 rounded-full overflow-hidden border border-gold-500 bg-slate-500 flex items-center justify-center text-white text-sm font-serif">
                    {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover" /> : currentUser?.name.charAt(0)}
                 </div>
                 <div className="overflow-hidden">
                     <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{currentUser?.name}</p>
                     <p className={`text-xs truncate text-slate-500 uppercase font-bold tracking-tighter`}>{currentUser?.role}</p>
                 </div>
             </div>

             {/* CLOCK */}
             <div className={`mt-4 hidden lg:flex items-center gap-2 text-xs font-mono p-2 rounded ${isDarkMode ? 'bg-slate-950 text-emerald-400 border border-slate-800' : 'bg-slate-100 text-emerald-600 border border-slate-200'}`}>
                 <Clock size={14} />
                 <span>{currentDateTime.toLocaleDateString()} {currentDateTime.toLocaleTimeString().slice(0,5)}</span>
             </div>
          </div>

          <nav className="mt-4 px-4 space-y-2">
             {[
               { id: ModuleType.FINANCE, icon: LayoutDashboard, label: 'Financeiro' },
               { id: ModuleType.TASKS, icon: CheckSquare, label: 'Tarefas' },
               { id: ModuleType.LISTS, icon: List, label: 'Listas' },
               { id: ModuleType.TUTORIALS, icon: PlayCircle, label: 'Tutoriais' },
               { id: ModuleType.PROFILE, icon: UserIcon, label: 'Meu Perfil' },
             ].map((item) => (
                <button key={item.id} onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeModule === item.id ? (isDarkMode ? 'bg-slate-800 text-gold-400 border border-slate-700' : 'bg-slate-100 text-gold-600 border border-slate-200') : (isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')}`}
                >
                  <item.icon size={20} />
                  <span className="hidden lg:block font-medium">{item.label}</span>
                </button>
             ))}

             {currentUser?.role === UserRole.ADMIN && (
               <>
                 <div className="pt-8 pb-4">
                    <p className={`px-4 text-xs font-bold uppercase tracking-wider hidden lg:block ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Sistema</p>
                 </div>
                 <button onClick={() => setActiveModule(ModuleType.ADMIN)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeModule === ModuleType.ADMIN ? (isDarkMode ? 'bg-slate-800 text-purple-400 border border-slate-700' : 'bg-purple-50 text-purple-600 border-purple-100') : (isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')}`}
                 >
                  <Settings size={20} />
                  <span className="hidden lg:block font-medium">Painel Master</span>
                </button>
               </>
             )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
           <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="hidden lg:block font-medium">{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
           </button>
           <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isDarkMode ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/10' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'}`}>
              <LogOut size={20} />
              <span className="hidden lg:block font-medium">Sair</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className={`h-16 border-b flex items-center justify-end px-8 gap-4 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white/50 border-slate-200'}`}>
            
            {/* PAYMENT ALERT BUTTON */}
            {daysRemaining <= 5 && (
                <button 
                  onClick={() => setActiveModule(ModuleType.PROFILE)} 
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold animate-pulse flex items-center gap-2 shadow-lg shadow-red-900/20"
                >
                    <CreditCard size={16} />
                    Renovar Assinatura
                </button>
            )}

            {/* Informatics Dropdown */}
            <div className="relative">
                <button onClick={() => setShowInformatics(!showInformatics)} className={`p-2 rounded-full relative ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                    <Info size={20} />
                    {visibleAnnouncements.some(a => !currentUser?.readAnnouncements?.includes(a.id)) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-slate-900"></span>}
                </button>
                {showInformatics && (
                    <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border overflow-hidden z-50 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`p-3 border-b font-medium text-sm flex justify-between items-center ${isDarkMode ? 'border-slate-800 text-white' : 'border-slate-100 text-slate-800'}`}>
                            <span>Informativos</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {visibleAnnouncements.length === 0 ? <p className="p-4 text-center text-xs text-slate-500">Sem comunicados.</p> : visibleAnnouncements.map(a => {
                                const isRead = currentUser?.readAnnouncements?.includes(a.id);
                                return (
                                <div 
                                    key={a.id} 
                                    onClick={() => handleMarkAnnouncementAsRead(a.id)}
                                    className={`p-3 border-b text-sm last:border-0 cursor-pointer relative group ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50'} ${!isRead ? 'bg-blue-500/10' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className={`font-medium pr-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{a.title}</p>
                                        {!isRead && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                                        {isRead && (
                                            <button 
                                                onClick={(e) => handleDismissAnnouncement(a.id, e)}
                                                className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Ocultar Informativo"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400">{a.message}</p>
                                    <p className="text-[10px] text-slate-600 mt-2 text-right">{new Date(a.date).toLocaleDateString()}</p>
                                </div>
                            )})}
                        </div>
                    </div>
                )}
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className={`p-2 rounded-full relative ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                    <Bell size={20} />
                    {notifications.some(n => !n.read) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>}
                </button>
                {showNotifications && (
                    <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border overflow-hidden z-50 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`p-3 border-b font-medium text-sm ${isDarkMode ? 'border-slate-800 text-white' : 'border-slate-100 text-slate-800'}`}>Notificações</div>
                         <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? <p className="p-4 text-center text-xs text-slate-500">Tudo limpo.</p> : notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    onClick={() => handleMarkNotificationAsRead(n.id)}
                                    className={`p-3 border-b text-sm last:border-0 cursor-pointer relative group ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50'} ${!n.read ? 'bg-red-500/5' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className={`font-medium pr-6 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{n.title}</p>
                                        {!n.read && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                        {n.read && (
                                            <button 
                                                onClick={(e) => handleDeleteNotification(n.id, e)}
                                                className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Excluir Notificação"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400">{n.message}</p>
                                    <p className="text-[10px] text-slate-600 mt-1 text-right">{new Date(n.date).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-20">
            {activeModule === ModuleType.FINANCE && <FinancialModule transactions={transactions} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} isDarkMode={isDarkMode} />}
            {activeModule === ModuleType.TASKS && <TaskModule tasks={tasks} onToggleStatus={handleToggleTask} onAddTask={handleAddTask} onEditTask={handleEditTask} onDeleteTask={handleDeleteTask} />}
            {activeModule === ModuleType.LISTS && <ListModule lists={lists} onToggleItem={handleToggleListItem} onDeleteItem={handleDeleteListItem} onAddList={handleAddList} />}
            {activeModule === ModuleType.TUTORIALS && <TutorialModule tutorials={tutorials} isDarkMode={isDarkMode} />}
            {activeModule === ModuleType.ADMIN && currentUser?.role === UserRole.ADMIN && (
                <AdminPanel 
                    users={users} plans={plans} tutorials={tutorials} isDarkMode={isDarkMode} 
                    onUpdateUser={handleUpdateUser} onAddUser={handleAddUser} onManagePlan={handleManagePlan}
                    onManageTutorial={handleManageTutorial} onAddAnnouncement={handleAddAnnouncement}
                />
            )}
            {activeModule === ModuleType.PROFILE && currentUser && <UserProfile user={currentUser} plans={plans} isDarkMode={isDarkMode} onUpdateUser={handleUpdateUser} />}
          </div>
        </div>

        {!isChatOpen && (
            <button onClick={() => setIsChatOpen(true)} className="absolute bottom-8 right-8 w-20 h-20 bg-slate-900 border-2 border-gold-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-30 group overflow-hidden">
                <img src={ALFRED_ICON_URL} alt="Alfred" className="w-full h-full object-cover" />
            </button>
        )}
        <AlfredChat appContext={{ transactions, tasks, lists }} onAIAction={handleAIAction} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </main>

      {/* POPUP Announcement */}
      {activePopup && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
             <div className={`w-full max-w-lg rounded-xl overflow-hidden shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                 <div className="flex justify-between items-center p-4 border-b border-slate-700/50">
                     <h3 className={`text-xl font-serif font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{activePopup.title}</h3>
                     <button onClick={() => setActivePopup(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                 </div>
                 
                 <div className="p-0">
                    {activePopup.videoUrl ? (
                         <div className="aspect-video bg-black">
                            <iframe src={activePopup.videoUrl} className="w-full h-full" allowFullScreen title="Popup Video"></iframe>
                         </div>
                    ) : activePopup.imageUrl ? (
                        <div className="aspect-video bg-slate-800">
                             <img src={activePopup.imageUrl} alt="Announcement" className="w-full h-full object-cover" />
                        </div>
                    ) : null}
                    <div className="p-6 max-h-60 overflow-y-auto">
                        <p className={`text-sm whitespace-pre-wrap ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{activePopup.message}</p>
                    </div>
                 </div>
                 
                 <div className="p-4 border-t border-slate-700/50 flex justify-end gap-3 bg-slate-900/50">
                     <button onClick={() => setActivePopup(null)} className="px-4 py-2 rounded text-sm text-slate-400 hover:text-white transition-colors">Fechar</button>
                     <button 
                        onClick={() => {
                            handleMarkAnnouncementAsRead(activePopup.id);
                            handleDismissAnnouncement(activePopup.id, {} as any); // Also hide from further popups
                            setActivePopup(null);
                        }} 
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2"
                    >
                         <Check size={16} /> Marcar como Lido
                     </button>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
};

export default App;