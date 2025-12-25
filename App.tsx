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
  Plan
} from './types';
import { FinancialModule } from './components/FinancialModule';
import { TaskModule } from './components/TaskModule';
import { ListModule } from './components/ListModule';
import { AdminPanel } from './components/AdminPanel';
import { AlfredChat } from './components/AlfredChat';
import { UserProfile } from './components/UserProfile';
import { LoginPage } from './components/LoginPage';
import { LayoutDashboard, CheckSquare, List, Settings, LogOut, Bot, User as UserIcon, Bell, Moon, Sun, Shield } from 'lucide-react';

const App = () => {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // --- Global UI State ---
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.FINANCE);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // --- Database Mock Data (Postgres Ready Structure) ---
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 'n1', title: 'Conta a Vencer', message: 'Energia Elétrica vence amanhã.', type: 'FINANCE', read: false, date: new Date().toISOString() }
  ]);

  // Default Plans
  const [plans, setPlans] = useState<Plan[]>([
    { id: 'p1', name: 'Mensal Básico', type: SubscriptionType.MONTHLY, price: 39.90, trialDays: 15, active: true },
    { id: 'p2', name: 'Semestral Econômico', type: SubscriptionType.SEMIANNUAL, price: 199.50, trialDays: 15, active: true }, // ~33.25/mo
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
      dependents: [] 
    }
  ]);

  // --- Auth Handlers ---
  const handleLogin = (email: string, pass: string) => {
    if (email === 'maisalem.md@gmail.com' && pass === 'Alfred@1992') {
      setCurrentUser(users[0]);
      setIsAuthenticated(true);
      return;
    }
    const user = users.find(u => u.email === email);
    if (user) {
      if(!user.active) {
        alert("Acesso suspenso. Contate o administrador.");
        return;
      }
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
      trialEndsAt: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      modules: [ModuleType.FINANCE, ModuleType.TASKS, ModuleType.LISTS],
      since: new Date().getFullYear().toString(),
      dependents: []
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveModule(ModuleType.FINANCE);
  };

  // --- Data Handlers (Mapped to DB Actions) ---
  const handleToggleTask = (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === TaskStatus.DONE ? TaskStatus.PENDING : TaskStatus.DONE } : t));
  const handleToggleListItem = (lId: string, iId: string) => setLists(prev => prev.map(l => l.id === lId ? { ...l, items: l.items.map(i => i.id === iId ? { ...i, status: i.status === ItemStatus.DONE ? ItemStatus.PENDING : ItemStatus.DONE } : i) } : l));
  const handleDeleteListItem = (lId: string, iId: string) => setLists(prev => prev.map(l => l.id === lId ? { ...l, items: l.items.filter(i => i.id !== iId) } : l));
  
  const handleAddTransaction = (t: Omit<Transaction, 'id'>) => setTransactions(prev => [...prev, { ...t, id: Date.now().toString() }]);
  const handleDeleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  
  const handleAddTask = (t: Omit<Task, 'id'>) => setTasks(prev => [...prev, { ...t, id: Date.now().toString() }]);

  // --- Admin Actions Handlers ---
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
  };

  const handleAddUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const handleManagePlan = (plan: Plan, action: 'CREATE' | 'UPDATE' | 'DELETE') => {
      if (action === 'CREATE') setPlans(prev => [...prev, plan]);
      if (action === 'UPDATE') setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
      if (action === 'DELETE') setPlans(prev => prev.filter(p => p.id !== plan.id));
  };

  // --- AI Action Logic (Fixed) ---
  const handleAIAction = (action: { type: AIActionType, payload: any }) => {
    console.log("AI Action Received:", action);

    if (action.type === 'ADD_TRANSACTION') {
        handleAddTransaction({
            description: action.payload.description || 'Transação IA',
            amount: Number(action.payload.amount),
            type: action.payload.type || TransactionType.EXPENSE,
            category: action.payload.category || 'Geral',
            date: action.payload.date || new Date().toISOString()
        });
    }
    
    if (action.type === 'ADD_TASK') {
        handleAddTask({
            title: action.payload.title,
            date: action.payload.date || new Date().toISOString(),
            time: action.payload.time,
            priority: action.payload.priority || 'medium',
            status: TaskStatus.PENDING
        });
    }

    if (action.type === 'UPDATE_TASK') {
        // Simplified update logic (title match)
        setTasks(prev => prev.map(t => 
            t.title.toLowerCase().includes(action.payload.searchTitle?.toLowerCase()) 
            ? { ...t, ...action.payload.updates } 
            : t
        ));
    }

    if (action.type === 'ADD_LIST_ITEM') {
        const listName = action.payload.listName || 'Geral';
        const itemName = action.payload.itemName;
        
        setLists(prev => {
            const listExists = prev.find(l => l.name.toLowerCase() === listName.toLowerCase());
            
            if (listExists) {
                return prev.map(l => l.id === listExists.id ? {
                    ...l,
                    items: [...l.items, { id: Date.now().toString(), name: itemName, category: 'Geral', status: ItemStatus.PENDING }]
                } : l);
            } else {
                // Create new list if not exists
                return [...prev, {
                    id: Date.now().toString(),
                    name: listName,
                    items: [{ id: Date.now().toString(), name: itemName, category: 'Geral', status: ItemStatus.PENDING }]
                }];
            }
        });
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onRegister={handleRegister} isDarkMode={isDarkMode} />;
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
            <button onClick={() => setShowNotifications(!showNotifications)} className={`p-2 rounded-full relative ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                <Bell size={20} />
                {notifications.some(n => !n.read) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>}
            </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-20">
            {activeModule === ModuleType.FINANCE && <FinancialModule transactions={transactions} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} isDarkMode={isDarkMode} />}
            {activeModule === ModuleType.TASKS && <TaskModule tasks={tasks} onToggleStatus={handleToggleTask} onAddTask={handleAddTask} />}
            {activeModule === ModuleType.LISTS && <ListModule lists={lists} onToggleItem={handleToggleListItem} onDeleteItem={handleDeleteListItem} />}
            {activeModule === ModuleType.ADMIN && currentUser?.role === UserRole.ADMIN && (
                <AdminPanel 
                    users={users} 
                    plans={plans}
                    isDarkMode={isDarkMode} 
                    onUpdateUser={handleUpdateUser}
                    onAddUser={handleAddUser}
                    onManagePlan={handleManagePlan}
                />
            )}
            {activeModule === ModuleType.PROFILE && currentUser && <UserProfile user={currentUser} isDarkMode={isDarkMode} onUpdateUser={handleUpdateUser} />}
          </div>
        </div>

        {!isChatOpen && (
            <button onClick={() => setIsChatOpen(true)} className="absolute bottom-8 right-8 w-16 h-16 bg-slate-900 border-2 border-gold-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-30 group">
                <Bot className="w-8 h-8 text-gold-500 group-hover:animate-bounce" />
            </button>
        )}
        <AlfredChat appContext={{ transactions, tasks, lists }} onAIAction={handleAIAction} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </main>
    </div>
  );
};

export default App;