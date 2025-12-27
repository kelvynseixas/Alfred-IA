
import * as React from 'react';
import { 
  ModuleType, Transaction, Task, TaskStatus, ListGroup, User, FinancialProject, Account, Investment, Plan, Tutorial, Announcement
} from './types';
import { FinancialModule } from './components/FinancialModule';
import { FinancialProjectsModule } from './components/FinancialProjectsModule';
import { InvestmentsModule } from './components/InvestmentsModule';
import { TaskModule } from './components/TaskModule';
import { ListModule } from './components/ListModule';
import { AdminPanel } from './components/AdminPanel';
import { AlfredChat } from './components/AlfredChat';
import { LoginPage } from './components/LoginPage';
import { UserProfile } from './components/UserProfile';
import { TutorialModule } from './components/TutorialModule';
import { LayoutDashboard, CheckSquare, List, LogOut, Target, Briefcase, Menu, X, Settings, User as UserIcon, BookOpen } from 'lucide-react';

export const ALFRED_ICON_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%230f172a;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%231e293b;stop-opacity:1' /%3E%3C/linearGradient%E3%80%88/defs%3E%3Ccircle cx='100' cy='100' r='90' fill='url(%23grad1)' stroke='%23d97706' stroke-width='4'/%3E%3Cpath d='M65 80 Q 80 95 95 80' stroke='%2338bdf8' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3Cpath d='M105 80 Q 120 95 135 80' stroke='%2338bdf8' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3Crect x='50' y='60' width='100' height='20' rx='5' fill='%2338bdf8' opacity='0.2'/%3E%3Cpath d='M100 130 Q 130 130 140 110' stroke='%2338bdf8' stroke-width='2' fill='none' opacity='0.5'/%3E%3Cpath d='M100 130 Q 70 130 60 110' stroke='%2338bdf8' stroke-width='2' fill='none' opacity='0.5'/%3E%3Cpath d='M100 150 L 100 170' stroke='%23d97706' stroke-width='6'/%3E%3Cpath d='M70 170 L 130 170 L 115 190 L 85 190 Z' fill='%23d97706'/%3E%3Cpath d='M90 170 L 90 180 L 110 180 L 110 170' fill='%230f172a'/%3E%3Ccircle cx='100' cy='100' r='95' stroke='%23d97706' stroke-width='2' fill='none' opacity='0.5'/%3E%3C/svg%3E";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('alfred_token'));
  const [activeModule, setActiveModule] = React.useState<ModuleType>(ModuleType.FINANCE);
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  const [user, setUser] = React.useState<User | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [lists, setLists] = React.useState<ListGroup[]>([]);
  const [projects, setProjects] = React.useState<FinancialProject[]>([]);
  const [investments, setInvestments] = React.useState<Investment[]>([]);
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [tutorials, setTutorials] = React.useState<Tutorial[]>([]);
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);

  React.useEffect(() => {
    if (isAuthenticated) {
        fetchDashboardData();
    }
  }, [isAuthenticated]);

  const handleLogin = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      try {
          const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password: pass })
          });
          if (res.ok) {
              const { token } = await res.json();
              localStorage.setItem('alfred_token', token);
              setIsAuthenticated(true);
              return { success: true };
          }
          const errorData = await res.json();
          return { success: false, error: errorData.error || 'Erro desconhecido.' };
      } catch (error) {
          console.error("Login failed:", error);
          return { success: false, error: 'Não foi possível conectar ao servidor.' };
      }
  };

  const fetchDashboardData = async () => {
    try {
        const token = localStorage.getItem('alfred_token');
        if (!token) {
            handleLogout();
            return;
        }
        const res = await fetch('/api/data/dashboard', { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        if (res.ok) {
            const data = await res.json();
            setUser(data.user || null);
            setUsers(data.users || []);
            setTransactions(data.transactions || []);
            setAccounts(data.accounts || []);
            setTasks(data.tasks || []);
            setLists(data.lists || []);
            setProjects(data.projects || []);
            setInvestments(data.investments || []);
            setPlans(data.plans || []);
            setTutorials(data.tutorials || []);
            setAnnouncements(data.announcements || []);
            if (data.config?.aiKeys?.gemini) {
                sessionStorage.setItem('VITE_GEMINI_KEY', data.config.aiKeys.gemini);
            }
        } else if (res.status === 401 || res.status === 403) {
            // Token is invalid or expired, force logout
            handleLogout();
        } else {
            // Handle other server errors without logging out
            console.error("Failed to fetch dashboard data:", res.statusText);
        }
    } catch (e) { 
        console.error("Error fetching data:", e);
        // Do not logout on network errors, allow user to stay on page
    }
  };

  const handleAIAction = (action: { type: string, payload: any }) => {
      fetchDashboardData();
  };
  
  const handleLogout = () => {
      localStorage.removeItem('alfred_token');
      sessionStorage.removeItem('VITE_GEMINI_KEY');
      setIsAuthenticated(false);
      setUser(null);
  };

  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} onRegister={()=>{}} plans={[]} isDarkMode={true} />;
  
  const btnClass = (mod: ModuleType) => `w-full text-left p-3 rounded-lg flex gap-3 transition-colors ${activeModule === mod ? 'bg-slate-800 text-gold-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`;

  const SidebarContent = () => (
    <>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-8">
            <img src={ALFRED_ICON_URL} alt="Alfred" className="w-8 h-8 rounded-full border border-gold-500" />
            <h1 className="text-2xl font-serif font-bold text-white">Alfred IA</h1>
          </div>
          <nav className="space-y-1">
            <h2 className="text-xs text-slate-500 uppercase font-bold tracking-wider px-3 pt-4 pb-2">Principal</h2>
            <button onClick={() => { setActiveModule(ModuleType.FINANCE); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.FINANCE)}><LayoutDashboard size={20}/> Financeiro</button>
            <button onClick={() => { setActiveModule(ModuleType.INVESTMENTS); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.INVESTMENTS)}><Briefcase size={20}/> Investimentos</button>
            <button onClick={() => { setActiveModule(ModuleType.PROJECTS); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.PROJECTS)}><Target size={20}/> Projetos & Metas</button>
            <button onClick={() => { setActiveModule(ModuleType.TASKS); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.TASKS)}><CheckSquare size={20}/> Agenda</button>
            <button onClick={() => { setActiveModule(ModuleType.LISTS); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.LISTS)}><List size={20}/> Inventário</button>
            
            <h2 className="text-xs text-slate-500 uppercase font-bold tracking-wider px-3 pt-4 pb-2">Sistema</h2>
            <button onClick={() => { setActiveModule(ModuleType.PROFILE); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.PROFILE)}><UserIcon size={20}/> Meu Perfil</button>
            <button onClick={() => { setActiveModule(ModuleType.TUTORIALS); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.TUTORIALS)}><BookOpen size={20}/> Tutoriais</button>
            {user?.role === 'ADMIN' && (
              <button onClick={() => { setActiveModule(ModuleType.ADMIN); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.ADMIN)}><Settings size={20}/> Painel Master</button>
            )}
          </nav>
        </div>
        <button onClick={handleLogout} className="w-full flex gap-3 p-3 text-slate-500 hover:text-red-400 transition-colors border-t border-slate-800"><LogOut size={20}/> Sair</button>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}
      <aside className={`fixed top-0 left-0 h-full w-64 border-r border-slate-800 bg-slate-900 p-6 flex flex-col justify-between z-40 transition-transform transform md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur flex items-center justify-between px-8">
           <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-white"><Menu size={24} /></button>
           <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
             Mordomo Digital <span className="text-gold-500">•</span> Ativo
           </div>
           <div className="text-right text-sm">
              <p className="font-bold text-white">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {activeModule === ModuleType.FINANCE && <FinancialModule transactions={transactions} accounts={accounts} projects={projects} onAddTransaction={fetchDashboardData} onDeleteTransaction={fetchDashboardData} onAddAccount={fetchDashboardData} />}
            {activeModule === ModuleType.INVESTMENTS && <InvestmentsModule investments={investments} onAddInvestment={fetchDashboardData} onDeleteInvestment={fetchDashboardData} />}
            {activeModule === ModuleType.PROJECTS && <FinancialProjectsModule projects={projects} isDarkMode={true} onAddProject={fetchDashboardData} onUpdateProject={fetchDashboardData} onDeleteProject={fetchDashboardData} />}
            {activeModule === ModuleType.TASKS && <TaskModule tasks={tasks} onToggleStatus={fetchDashboardData} onAddTask={fetchDashboardData} onEditTask={fetchDashboardData} onDeleteTask={fetchDashboardData} />}
            {activeModule === ModuleType.LISTS && <ListModule lists={lists} onAddItem={fetchDashboardData} onAddList={fetchDashboardData} onDeleteItem={fetchDashboardData} onDeleteList={fetchDashboardData} onEditList={fetchDashboardData} onToggleItem={fetchDashboardData} />}
            {activeModule === ModuleType.ADMIN && user?.role === 'ADMIN' && <AdminPanel users={users} plans={plans} tutorials={tutorials} isDarkMode={true} onAddUser={fetchDashboardData} onManagePlan={fetchDashboardData} onUpdateUser={fetchDashboardData} onManageTutorial={fetchDashboardData} onAddAnnouncement={(ann) => setAnnouncements(prev => [...prev, ann])} />}
            {activeModule === ModuleType.PROFILE && user && <UserProfile user={user} plans={plans} isDarkMode={true} onUpdateUser={async (u) => { setUser(u); return true; }} />}
            {activeModule === ModuleType.TUTORIALS && <TutorialModule tutorials={tutorials} isDarkMode={true} />}
        </div>
        <button onClick={() => setIsChatOpen(true)} className="fixed bottom-8 right-8 w-14 h-14 bg-gold-600 hover:bg-gold-500 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 z-20">
          <img src={ALFRED_ICON_URL} className="w-8 h-8 rounded-full bg-slate-900" />
        </button>
        <AlfredChat appContext={{ tasks, transactions, lists, projects, accounts, investments }} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onAIAction={handleAIAction} />
      </main>
    </div>
  );
};
export default App;
