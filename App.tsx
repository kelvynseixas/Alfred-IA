
import React, { useState, useEffect } from 'react';
import { 
  ModuleType, Transaction, Task, TaskStatus, ListGroup, User, FinancialProject, Account, Investment, Plan, Tutorial, Announcement
} from './types';
import { FinancialModule } from './components/FinancialModule';
import { FinancialProjectsModule } from './components/FinancialProjectsModule';
import { InvestmentsModule } from './components/InvestmentsModule';
import { TaskModule } from './components/TaskModule';
import { ListModule } from './components/ListModule';
import { AlfredChat } from './components/AlfredChat';
import { LoginPage } from './components/LoginPage';
import { LayoutDashboard, CheckSquare, List, LogOut, Target, Briefcase, Menu } from 'lucide-react';

export const ALFRED_ICON_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%230f172a;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%231e293b;stop-opacity:1' /%3E%3C/linearGradient%E3%80%88/defs%3E%3Ccircle cx='100' cy='100' r='90' fill='url(%23grad1)' stroke='%23d97706' stroke-width='4'/%3E%3Cpath d='M65 80 Q 80 95 95 80' stroke='%2338bdf8' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3Cpath d='M105 80 Q 120 95 135 80' stroke='%2338bdf8' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3Crect x='50' y='60' width='100' height='20' rx='5' fill='%2338bdf8' opacity='0.2'/%3E%3Cpath d='M100 130 Q 130 130 140 110' stroke='%2338bdf8' stroke-width='2' fill='none' opacity='0.5'/%3E%3Cpath d='M100 130 Q 70 130 60 110' stroke='%2338bdf8' stroke-width='2' fill='none' opacity='0.5'/%3E%3Cpath d='M100 150 L 100 170' stroke='%23d97706' stroke-width='6'/%3E%3Cpath d='M70 170 L 130 170 L 115 190 L 85 190 Z' fill='%23d97706'/%3E%3Cpath d='M90 170 L 90 180 L 110 180 L 110 170' fill='%230f172a'/%3E%3Ccircle cx='100' cy='100' r='95' stroke='%23d97706' stroke-width='2' fill='none' opacity='0.5'/%3E%3C/svg%3E";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('alfred_token'));
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.FINANCE);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<ListGroup[]>([]);
  const [projects, setProjects] = useState<FinancialProject[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    if (isAuthenticated) fetchDashboardData();
  }, [isAuthenticated, activeModule]);

  const fetchDashboardData = async () => {
    try {
        const res = await fetch('/api/data/dashboard', { headers: { 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` } });
        const data = await res.json();
        if (res.ok) {
            setTransactions(data.transactions || []);
            setAccounts(data.accounts || []);
            setTasks(data.tasks || []);
            setLists(data.lists || []);
            setProjects(data.projects || []);
            setInvestments(data.investments || []);
        }
    } catch (e) { console.error("Erro ao buscar dados:", e); }
  };

  const handleAIAction = async (action: { type: string, payload: any }) => {
      const token = localStorage.getItem('alfred_token');
      if (!token) return;

      try {
          let url = '';
          let method = 'POST';

          switch (action.type) {
              case 'ADD_TRANSACTION': url = '/api/transactions'; break;
              case 'ADD_INVESTMENT': url = '/api/investments'; break;
              case 'ADD_TASK': url = '/api/tasks'; break;
              case 'ADD_PROJECT': url = '/api/projects'; break;
              case 'DELETE_TRANSACTION': url = `/api/transactions/${action.payload.id}`; method = 'DELETE'; break;
              default: console.warn("Ação desconhecida:", action.type); return;
          }

          if (url) {
              await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: method === 'POST' ? JSON.stringify(action.payload) : undefined });
              fetchDashboardData();
          }
      } catch (e) { console.error("Falha na ação da IA:", e); }
  };

  if (!isAuthenticated) return <LoginPage onLogin={() => setIsAuthenticated(true)} onRegister={()=>{}} plans={[]} isDarkMode={true} />;
  
  const btnClass = (mod: ModuleType) => `w-full text-left p-3 rounded-lg flex gap-3 transition-colors ${activeModule === mod ? 'bg-slate-800 text-gold-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`;

  const SidebarContent = () => (
    <>
        <div>
          <div className="flex items-center gap-3 mb-8">
            <img src={ALFRED_ICON_URL} alt="Alfred" className="w-8 h-8 rounded-full border border-gold-500" />
            <h1 className="text-2xl font-serif font-bold text-white">Alfred IA</h1>
          </div>
          <nav className="space-y-1">
            <button onClick={() => { setActiveModule(ModuleType.FINANCE); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.FINANCE)}><LayoutDashboard size={20}/> Financeiro</button>
            <button onClick={() => { setActiveModule(ModuleType.INVESTMENTS); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.INVESTMENTS)}><Briefcase size={20}/> Investimentos</button>
            <button onClick={() => { setActiveModule(ModuleType.PROJECTS); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.PROJECTS)}><Target size={20}/> Projetos & Metas</button>
            <button onClick={() => { setActiveModule(ModuleType.TASKS); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.TASKS)}><CheckSquare size={20}/> Agenda Executiva</button>
            <button onClick={() => { setActiveModule(ModuleType.LISTS); setIsMobileMenuOpen(false); }} className={btnClass(ModuleType.LISTS)}><List size={20}/> Inventário</button>
          </nav>
        </div>
        <button onClick={() => {localStorage.removeItem('alfred_token'); setIsAuthenticated(false)}} className="w-full flex gap-3 p-3 text-slate-500 hover:text-red-400 transition-colors border-t border-slate-800"><LogOut size={20}/> Sair</button>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-6 flex-col justify-between hidden md:flex"><SidebarContent /></aside>
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur flex items-center justify-between px-8">
           <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-white"><Menu size={24} /></button>
           <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
             Mordomo Digital <span className="text-gold-500">•</span> Eficiência Máxima
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {activeModule === ModuleType.FINANCE && <FinancialModule transactions={transactions} accounts={accounts} projects={projects} onAddTransaction={handleAIAction} onDeleteTransaction={(id)=>handleAIAction({type:'DELETE_TRANSACTION', payload:{id}})} onAddAccount={()=>{}} />}
            {activeModule === ModuleType.INVESTMENTS && <InvestmentsModule investments={investments} onAddInvestment={(inv)=>handleAIAction({type:'ADD_INVESTMENT', payload:inv})} onDeleteInvestment={()=>{}} />}
            {activeModule === ModuleType.PROJECTS && <FinancialProjectsModule projects={projects} isDarkMode={true} onAddProject={(p)=>handleAIAction({type:'ADD_PROJECT', payload:p})} onUpdateProject={()=>{}} onDeleteProject={()=>{}} />}
            {activeModule === ModuleType.TASKS && <TaskModule tasks={tasks} onToggleStatus={()=>{}} onAddTask={(t)=>handleAIAction({type:'ADD_TASK', payload:t})} onEditTask={()=>{}} onDeleteTask={()=>{}} />}
            {activeModule === ModuleType.LISTS && <ListModule lists={lists} onAddItem={()=>{}} onAddList={()=>{}} onDeleteItem={()=>{}} onDeleteList={()=>{}} onEditList={()=>{}} onToggleItem={()=>{}} />}
        </div>
        <button onClick={() => setIsChatOpen(true)} className="fixed bottom-8 right-8 w-14 h-14 bg-gold-600 hover:bg-gold-500 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 z-50">
          <img src={ALFRED_ICON_URL} className="w-8 h-8 rounded-full bg-slate-900" />
        </button>
        <AlfredChat appContext={{ tasks, transactions, lists, projects, accounts, investments }} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onAIAction={handleAIAction} />
      </main>
    </div>
  );
};
export default App;