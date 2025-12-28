import * as React from 'react';
import { User, Transaction, Account } from './types';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';

const App = () => {
  // Verifica token existente
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

  // --- LÓGICA ESTRITA DE LOGIN (APENAS ONLINE) ---
  const handleLogin = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      try {
          const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password: pass })
          });

          const contentType = res.headers.get("content-type");
          
          if (res.ok && contentType?.includes("application/json")) {
              const data = await res.json();
              localStorage.setItem('alfred_token', data.token);
              setIsAuthenticated(true);
              return { success: true };
          } else {
              const data = await res.json().catch(() => ({}));
              return { success: false, error: data.error || 'Credenciais inválidas ou erro no servidor.' };
          }
      } catch (error) {
          console.error("Erro de conexão:", error);
          return { success: false, error: 'Servidor indisponível. Verifique a conexão.' };
      }
  };

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('alfred_token');
    
    if (!token) {
        handleLogout();
        return;
    }

    try {
        const res = await fetch('/api/data/dashboard', { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setTransactions(data.transactions || []);
            setAccounts(data.accounts || []);
        } else {
            // Se o token for inválido ou expirado (401/403), faz logout forçado
            if (res.status === 401 || res.status === 403) {
                handleLogout();
            } else {
                console.error("Erro ao buscar dados do servidor:", res.statusText);
            }
        }
    } catch (e) { 
        console.error("Erro de rede ao buscar dados:", e);
        // Opcional: Mostrar um toast de erro aqui
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
        return (
            <Dashboard 
                user={user} 
                accounts={accounts} 
                transactions={transactions} 
                onLogout={handleLogout} 
                onRefreshData={fetchDashboardData} 
            />
        );
      case 'login':
        return <LoginPage onLogin={handleLogin} onBack={() => setActiveView('landing')} />;
      case 'landing':
      default:
        return <LandingPage onLoginClick={() => setActiveView('login')} />;
    }
  }

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen font-sans relative">
      {renderContent()}
    </div>
  );
};
export default App;