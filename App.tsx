
import * as React from 'react';
import { User, Transaction, Account } from './types';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';

// MOCK DATA for fallback (Demo Mode)
const MOCK_DATA = {
    user: { id: '1', name: 'Admin User', email: 'admin@alfred.local', activeProfileId: '1', profiles: [] },
    accounts: [{ id: '1', name: 'Carteira Principal', type: 'CHECKING', balance: 5430.50 }],
    transactions: [
        { id: '1', description: 'Supermercado', amount: 450.00, type: 'EXPENSE', category: 'Alimentação', date: new Date().toISOString(), accountId: '1' },
        { id: '2', description: 'Salário', amount: 5000.00, type: 'INCOME', category: 'Trabalho', date: new Date().toISOString(), accountId: '1' },
        { id: '3', description: 'Netflix', amount: 55.90, type: 'EXPENSE', category: 'Lazer', date: new Date().toISOString(), accountId: '1' },
        { id: '4', description: 'Restaurante', amount: 120.00, type: 'EXPENSE', category: 'Lazer', date: new Date().toISOString(), accountId: '1' },
        { id: '5', description: 'Combustível', amount: 250.00, type: 'EXPENSE', category: 'Transporte', date: new Date().toISOString(), accountId: '1' },
    ]
};

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
      // 1. Try Backend
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
          if (res.status === 401) {
              return { success: false, error: 'Credenciais inválidas.' };
          }
      } catch (error) {
          console.warn("Backend unavailable, using mock login for demo.");
          // Fallback for Demo purposes if backend is down
          if (email === 'admin@alfred.local' && pass === 'alfred@1992') {
             localStorage.setItem('alfred_token', 'mock-token');
             setIsAuthenticated(true);
             return { success: true };
          }
      }
      return { success: false, error: 'Não foi possível conectar ao servidor (e credenciais de demo inválidas).' };
  };

  const fetchDashboardData = async () => {
    try {
        const token = localStorage.getItem('alfred_token');
        if (!token) {
            handleLogout();
            return;
        }

        // Check for mock token (Demo Mode)
        if (token === 'mock-token') {
             setUser(MOCK_DATA.user as any);
             setTransactions(MOCK_DATA.transactions as any[]);
             setAccounts(MOCK_DATA.accounts as any[]);
             return;
        }

        // Real Fetch
        const res = await fetch('/api/data/dashboard', { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        if (res.ok) {
            const data = await res.json();
            setUser(data.user || null);
            setTransactions(data.transactions || []);
            setAccounts(data.accounts || []);
        } else if (res.status === 401 || res.status === 403) {
            handleLogout();
        }
    } catch (e) { 
        console.error("Error fetching data:", e);
        // On error, also maybe fallback or just log
    }
  };
  
  const handleLogout = () => {
      localStorage.removeItem('alfred_token');
      setIsAuthenticated(false);
      setUser(null);
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
