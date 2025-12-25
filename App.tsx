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
import { LayoutDashboard, CheckSquare, List, Settings, LogOut, Bot, User as UserIcon, Bell, Moon, Sun, PlayCircle, Info, X, Check } from 'lucide-react';

const App = () => {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // --- Global UI State ---
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.FINANCE);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInformatics, setShowInformatics] = useState(false);
  const [activePopup, setActivePopup] = useState<Announcement | null>(null);

  // --- Mock Data ---
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

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', description: 'Salário Mensal', amount: 15000, type: TransactionType.INCOME, category: 'Salário', date: '2023-10-01' },
    { id: '2', description: 'Supermercado', amount: 845.50, type: TransactionType.EXPENSE, category: 'Alimentação', date: '2023-10-03' }
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Revisar Estratégia Q4', date: '2023-10-25', time: '10:00', status: TaskStatus.PENDING, priority: 'high' }
  ]);

  const [lists, setLists] = useState<ListGroup[]>([
    { id: '1', name: 'Compras Semanais', items: [{ id: '101', name: 'Leite', category: 'Laticínios', status: ItemStatus.PENDING }] }
  ]);

  const [users, setUsers] = useState<User[]>([
    { 
      id: 'admin', 
      name: 'Admin Alfred', 
      email: 'maisalem.md@gmail.com', 
      phone: '+55 00 00000-0000', 
      role: UserRole.ADMIN, 
      active: true, 
      modules: [ModuleType.FINANCE, ModuleType.TASKS, ModuleType.LISTS, ModuleType.ADMIN], 
      since: '2024', 
      paymentHistory: [],
      readAnnouncements: []
    }
  ]);

  // --- Effects ---
  useEffect(() => {
    // Check for popups when user logs in or announcements change
    if (isAuthenticated && currentUser) {
        const unreadPopups = announcements.filter(a => 
            a.isPopup && 
            !currentUser.readAnnouncements?.includes(a.id)
        );
        
        // Show the most recent unread popup
        if (unreadPopups.length > 0) {
            // Sort by date desc
            unreadPopups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setActivePopup(unreadPopups[0]);
        }
    }
  }, [isAuthenticated, currentUser, announcements]);


  // --- Handlers ---
  const handleLogin = (email: string, pass: string) => {
    if (email === 'maisalem.md@gmail.com' && pass === 'Alfred@1992') {
      setCurrentUser(users[0]);
      setIsAuthenticated(true);
      return;
    }
    const user = users.find(u => u.email === email);
    if (user) {
      if(!user.active) { alert("Acesso suspenso."); return; }
      setCurrentUser(user);
      setIsAuthenticated(true);
    } else {
      alert("Credenciais inválidas");
    }
  };

  const handleRegister = (name: string, email: string, phone: string, subscription: SubscriptionType) => {
    const selectedPlan = plans.find(p => p.type === subscription);
    const trialDays = selectedPlan ? selectedPlan.trialDays : 15;
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      role: UserRole.USER,
      subscription,
      trialEndsAt: new Date(Date.now() + trialDays * 86400000).toISOString(),
      active: true,
      modules: [ModuleType.FINANCE, ModuleType.TASKS, ModuleType.LISTS],
      since: new Date().getFullYear().toString(),
      paymentHistory: [],
      readAnnouncements: []
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveModule(ModuleType.FINANCE);
    setActivePopup(null);
  };

  // --- CRUD Handlers ---
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser);
  };
  const handleAddUser = (user: User) => setUsers(prev => [...prev, user]);
  
  const handleManagePlan = (plan: Plan, action: 'CREATE' | 'UPDATE' | 'DELETE') => {
      if (action === 'CREATE') setPlans(prev => [...prev, plan]);
      if (action === 'UPDATE') setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
      if (action === 'DELETE') setPlans(prev => prev.filter(p => p.id !== plan.id));
  };

  const handleManageTutorial = (tut: Tutorial, action: 'CREATE' | 'DELETE') => {
      if(action === 'CREATE') setTutorials(prev => [...prev, tut]);
      if(action === 'DELETE') setTutorials(prev => prev.filter(t => t.id !== tut.id));
  };

  const handleAddAnnouncement = (ann: Announcement) => setAnnouncements(prev => [ann, ...prev]);

  // Task Handlers
  const handleToggleTask = (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === TaskStatus.DONE ? TaskStatus.PENDING : TaskStatus.DONE } : t));
  const handleAddTask = (t: Omit<Task, 'id'>) => setTasks(prev => [...prev, { ...t, id: Date.now().toString() }]);
  const handleEditTask = (id: string, updates: Partial<Task>) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const handleDeleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const handleToggleListItem = (lId: string, iId: string) => setLists(prev => prev.map(l => l.id === lId ? { ...l, items: l.items.map(i => i.id === iId ? { ...i, status: i.status === ItemStatus.DONE ? ItemStatus.PENDING : ItemStatus.DONE } : i) } : l));
  const handleDeleteListItem = (lId: string, iId: string) => setLists(prev => prev.map(l => l.id === lId ? { ...l, items: l.items.filter(i => i.id !== iId) } : l));
  const handleAddList = (name: string) => setLists(prev => [...prev, { id: Date.now().toString(), name, items: [] }]);
  
  const handleAddTransaction = (t: Omit<Transaction, 'id'>) => setTransactions(prev => [...prev, { ...t, id: Date.now().toString() }]);
  const handleDeleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  
  // Notification & Announcement Read Logic
  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAnnouncementAsRead = (id: string) => {
    if (!currentUser) return;
    const currentRead = currentUser.readAnnouncements || [];
    if (!currentRead.includes(id)) {
        const updatedUser = { ...currentUser, readAnnouncements: [...currentRead, id] };
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
    return <LoginPage onLogin={handleLogin} onRegister={handleRegister} plans={plans} isDarkMode={isDarkMode} />;
  }

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
            {/* Informatics Dropdown */}
            <div className="relative">
                <button onClick={() => setShowInformatics(!showInformatics)} className={`p-2 rounded-full relative ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                    <Info size={20} />
                    {announcements.some(a => !currentUser?.readAnnouncements?.includes(a.id)) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-slate-900"></span>}
                </button>
                {showInformatics && (
                    <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border overflow-hidden z-50 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`p-3 border-b font-medium text-sm flex justify-between items-center ${isDarkMode ? 'border-slate-800 text-white' : 'border-slate-100 text-slate-800'}`}>
                            <span>Informativos</span>
                            <span className="text-[10px] text-slate-500">Clique para marcar lido</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {announcements.length === 0 ? <p className="p-4 text-center text-xs text-slate-500">Sem comunicados.</p> : announcements.map(a => {
                                const isRead = currentUser?.readAnnouncements?.includes(a.id);
                                return (
                                <div 
                                    key={a.id} 
                                    onClick={() => handleMarkAnnouncementAsRead(a.id)}
                                    className={`p-3 border-b text-sm last:border-0 cursor-pointer ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50'} ${!isRead ? 'bg-blue-500/10' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{a.title}</p>
                                        {!isRead && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
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
                                    className={`p-3 border-b text-sm last:border-0 cursor-pointer ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50'} ${!n.read ? 'bg-red-500/5' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{n.title}</p>
                                        {!n.read && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
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
            {activeModule === ModuleType.PROFILE && currentUser && <UserProfile user={currentUser} isDarkMode={isDarkMode} onUpdateUser={handleUpdateUser} />}
          </div>
        </div>

        {!isChatOpen && (
            <button onClick={() => setIsChatOpen(true)} className="absolute bottom-8 right-8 w-16 h-16 bg-slate-900 border-2 border-gold-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-30 group">
                <UserIcon className="w-8 h-8 text-gold-500 group-hover:animate-bounce" />
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