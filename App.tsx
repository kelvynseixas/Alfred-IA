
import * as React from 'react';
import { User, Transaction, Account, Investment, Goal, Task, ShoppingList, Notification } from './types';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('alfred_token'));
  const [userRole, setUserRole] = React.useState<string | null>(null);
  
  // Views: landing, login, register, dashboard, admin
  const [activeView, setActiveView] = React.useState('landing');

  // Data States
  const [user, setUser] = React.useState<User | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [investments, setInvestments] = React.useState<Investment[]>([]);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [lists, setLists] = React.useState<ShoppingList[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  React.useEffect(() => {
    const token = localStorage.getItem('alfred_token');
    if (token) {
        // Tenta decodificar token simples para role ou busca user
        fetchDashboardData();
    } else {
        setActiveView('landing');
    }
  }, [isAuthenticated]);

  const handleLogin = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      try {
          const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password: pass })
          });
          const data = await res.json();
          if (res.ok) {
              localStorage.setItem('alfred_token', data.token);
              setIsAuthenticated(true);
              setUserRole(data.role);
              return { success: true };
          } else {
              return { success: false, error: data.error };
          }
      } catch (error) {
          return { success: false, error: 'Erro de conexão.' };
      }
  };

  const handleRegister = async (formData: any): Promise<{ success: boolean; error?: string }> => {
      try {
          const res = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
          });
          const data = await res.json();
          if (res.ok) {
              localStorage.setItem('alfred_token', data.token);
              setIsAuthenticated(true);
              setUserRole('USER');
              return { success: true };
          }
          return { success: false, error: data.error };
      } catch (e) {
          return { success: false, error: 'Erro ao registrar.' };
      }
  };

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('alfred_token');
    if (!token) return handleLogout();

    // Se soubermos que é admin pelo login anterior, vai pro Admin Panel
    // Idealmente decodificaria o JWT aqui, mas vamos esperar a resposta da API
    try {
        const res = await fetch('/api/data/dashboard', { headers: { 'Authorization': `Bearer ${token}` } });
        
        if (res.ok) {
            const data = await res.json();
            
            if (data.user.role === 'ADMIN') {
                setActiveView('admin');
                setUserRole('ADMIN');
            } else {
                setActiveView('dashboard');
                setUserRole('USER');
                setUser(data.user);
                setTransactions(data.transactions || []);
                setAccounts(data.accounts || []);
                setInvestments(data.investments || []);
                setGoals(data.goals || []);
                setTasks(data.tasks || []);
                setLists(data.lists || []);
                setNotifications(data.notifications || []);
            }
        } else {
            // Se falhar dashboard mas token for válido, pode ser rota de admin exclusiva
            // Verifica API de admin stats para validar acesso
            if (res.status === 403) handleLogout();
        }
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
      localStorage.removeItem('alfred_token');
      setIsAuthenticated(false);
      setUser(null);
      setActiveView('landing');
  };
  
  const renderContent = () => {
    switch(activeView) {
      case 'admin':
        return <AdminPanel onLogout={handleLogout} />;
      case 'dashboard':
        return (
            <Dashboard 
                user={user} 
                accounts={accounts} 
                transactions={transactions}
                investments={investments}
                goals={goals}
                tasks={tasks}
                lists={lists}
                notifications={notifications}
                onLogout={handleLogout} 
                onRefreshData={fetchDashboardData} 
            />
        );
      case 'login':
        return <LoginPage onLogin={handleLogin} onBack={() => setActiveView('landing')} />;
      case 'register':
        return <RegisterPage onRegister={handleRegister} onBack={() => setActiveView('landing')} />;
      case 'landing':
      default:
        return <LandingPage onLoginClick={() => setActiveView('login')} />; // Add Register link logic in LandingPage if needed, or modify LandingPage to expose onRegisterClick
    }
  }

  // Modificação rápida para passar handler de registro para Landing Page se necessário, 
  // mas como LandingPage.tsx é um arquivo separado, assumimos que o Login tem link para criar conta que mudaria o estado aqui.
  // Vou modificar LandingPage para aceitar onRegisterClick? 
  // O prompt original LandingPage tinha apenas onLoginClick. Vamos manter simples: Login tem link para Registro.
  
  // Wrapper para injetar navegação para registro via Login Page (se eu tivesse modificado Login Page para aceitar callback)
  // Como LoginPage é estático no código anterior, assumimos que o usuário navega.
  // UPDATE: Vou injetar um botão de "Criar Conta" na Landing Page para facilitar.

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen font-sans relative">
        {/* Hack para navegação entre Login/Registro se os componentes não tiverem props explícitos */}
        {activeView === 'landing' && (
            <div className="fixed top-6 right-32 z-50">
                <button onClick={() => setActiveView('register')} className="text-sm font-bold text-slate-300 hover:text-primary mr-4">Criar Conta</button>
            </div>
        )}
      {renderContent()}
    </div>
  );
};
export default App;
