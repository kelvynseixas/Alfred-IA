import * as React from 'react';
import { User, Transaction, Account } from './types';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('alfred_token'));
  const [activeView, setActiveView] = React.useState<'landing' | 'login' | 'dashboard'>(
    !!localStorage.getItem('alfred_token') ? 'dashboard' : 'landing'
  );

  const [user, setUser] = React.useState<User | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);

  React.useEffect(() => {
    if (isAuthenticated) {
        fetchDashboardData();
        setActiveView('dashboard');
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
              const { token } = data;
              localStorage.setItem('alfred_token', token);
              setIsAuthenticated(true);
              return { success: true };
          } else {
              // Retorna o erro exato do backend (ex: "Senha inválida", "Usuário não encontrado")
              return { success: false, error: data.error || 'Falha na autenticação.' };
          }
      } catch (error) {
          console.error("Erro de conexão:", error);
          return { success: false, error: 'Erro de conexão com o servidor. Verifique se o backend está rodando.' };
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
            setTransactions(data.transactions || []);
            setAccounts(data.accounts || []);
        } else if (res.status === 401 || res.status === 403) {
            // Token expirado ou inválido
            handleLogout();
        } else {
            console.error("Erro ao buscar dados:", res.statusText);
        }
    } catch (e) { 
        console.error("Erro de rede ao buscar dashboard:", e);
    }
  };
  
  const handleLogout = () => {
      localStorage.removeItem('alfred_token');
      setIsAuthenticated(false);
      setUser(null);
      setTransactions([]);
      setAccounts([]);
      setActiveView('landing');
  };
  
  const renderContent = () => {
    switch(activeView) {
      case 'dashboard':
        return <Dashboard user={user} accounts={accounts} transactions={transactions} onLogout={handleLogout} onRefreshData={fetchDashboardData} />;
      case 'login':
        return <LoginPage onLogin={handleLogin} onBack={() => setActiveView('landing')} />;
      case 'landing':
      default:
        return <LandingPage onLoginClick={() => setActiveView('login')} />;
    }
  }

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen font-sans">
      {renderContent()}
    </div>
  );
};
export default App;