
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
  const [resetTokenFromUrl, setResetTokenFromUrl] = React.useState<string | null>(null);

  // Data States
  const [user, setUser] = React.useState<User | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [investments, setInvestments] = React.useState<Investment[]>([]);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [lists, setLists] = React.useState<ShoppingList[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  // Verificação inicial de URL (Para Reset de Senha) e Token
  React.useEffect(() => {
    // Verifica se há token de reset na URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken');
    if (token) {
        setResetTokenFromUrl(token);
        setActiveView('login');
        // Limpa a URL para ficar bonita
        window.history.replaceState({}, document.title, "/");
        return;
    }

    const storedToken = localStorage.getItem('alfred_token');
    if (storedToken) {
        fetchDashboardData();
    } else {
        if (!token) setActiveView('landing');
    }
  }, [isAuthenticated]);

  const handleLogin = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      try {
          const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password: pass })
          });
          
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
              const data = await res.json();
              if (res.ok) {
                  localStorage.setItem('alfred_token', data.token);
                  setIsAuthenticated(true);
                  setUserRole(data.role);
                  return { success: true };
              } else {
                  return { success: false, error: data.error };
              }
          } else {
              const text = await res.text();
              console.error("Erro Backend não-JSON:", text);
              return { success: false, error: 'Erro no servidor.' };
          }
      } catch (error) {
          console.error("Erro de conexão no login:", error);
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

    try {
        const res = await fetch('/api/data/dashboard', { headers: { 'Authorization': `Bearer ${token}` } });
        
        if (res.ok) {
            const data = await res.json();
            
            // Alteração: Admin agora vai para o Dashboard normal inicialmente
            setUserRole(data.user.role);
            setActiveView('dashboard');
            
            setUser(data.user);
            setTransactions(data.transactions || []);
            setAccounts(data.accounts || []);
            setInvestments(data.investments || []);
            setGoals(data.goals || []);
            setTasks(data.tasks || []);
            setLists(data.lists || []);
            setNotifications(data.notifications || []);
        } else {
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
        return <AdminPanel onLogout={handleLogout} onBackToDashboard={() => setActiveView('dashboard')} />;
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
                onNavigateToAdmin={() => setActiveView('admin')} // Passa função para ir ao Admin Panel
            />
        );
      case 'login':
        return (
            <LoginPage 
                onLogin={handleLogin} 
                onBack={() => setActiveView('landing')} 
                onRegisterClick={() => setActiveView('register')} 
                urlResetToken={resetTokenFromUrl} // Passa o token da URL se existir
            />
        );
      case 'register':
        return <RegisterPage onRegister={handleRegister} onBack={() => setActiveView('landing')} />;
      case 'landing':
      default:
        return <LandingPage onLoginClick={() => setActiveView('login')} />;
    }
  }

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen font-sans relative">
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
