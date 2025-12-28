import * as React from 'react';
import { User, Transaction, Account, TransactionType, AccountType, ProfileType } from './types';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';

// --- DADOS DE FALLBACK (MODO LOCAL/DEMO) ---
const MOCK_USER: User = {
    id: '1',
    name: 'Bruce Wayne',
    email: 'admin@alfred.local',
    activeProfileId: 'p1',
    profiles: []
};

const MOCK_ACCOUNTS: Account[] = [
    { id: '1', name: 'Carteira Principal', type: AccountType.WALLET, balance: 1540.00, color: '#10b981' },
    { id: '2', name: 'Banco Inter', type: AccountType.CHECKING, balance: 12450.50, color: '#f59e0b' },
    { id: '3', name: 'Investimentos XP', type: AccountType.INVESTMENT, balance: 45000.00, color: '#000000' }
];

const MOCK_TRANSACTIONS: Transaction[] = [
    { id: '1', description: 'Desenvolvimento Web', amount: 8500, type: TransactionType.INCOME, category: 'Serviços', date: new Date().toISOString(), accountId: '2' },
    { id: '2', description: 'Servidor VPS', amount: 150, type: TransactionType.EXPENSE, category: 'Tecnologia', date: new Date().toISOString(), accountId: '2' },
    { id: '3', description: 'Supermercado', amount: 850.40, type: TransactionType.EXPENSE, category: 'Casa', date: new Date(Date.now() - 86400000).toISOString(), accountId: '1' },
    { id: '4', description: 'Dividendos FIIs', amount: 320.15, type: TransactionType.INCOME, category: 'Investimentos', date: new Date(Date.now() - 172800000).toISOString(), accountId: '3' },
    { id: '5', description: 'Jantar de Negócios', amount: 420.00, type: TransactionType.EXPENSE, category: 'Lazer', date: new Date(Date.now() - 259200000).toISOString(), accountId: '1' },
];

const App = () => {
  // Verifica token existente
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('alfred_token'));
  const [activeView, setActiveView] = React.useState<'landing' | 'login' | 'dashboard'>(
    !!localStorage.getItem('alfred_token') ? 'dashboard' : 'landing'
  );
  const [isOfflineMode, setIsOfflineMode] = React.useState(false);

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

  // --- LÓGICA HÍBRIDA DE LOGIN ---
  const handleLogin = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      let serverError = false;

      // 1. Tenta Login no Backend Real
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
              setIsOfflineMode(false);
              return { success: true };
          } 
          
          // Se for erro 500 (Banco quebrado) ou erro de HTML (Proxy/Network), marcamos como erro de servidor
          if (res.status >= 500 || !contentType?.includes("application/json")) {
              serverError = true;
          } else if (res.status === 401 || res.status === 404) {
              // Se o servidor respondeu CLARAMENTE que a senha está errada, 
              // só permitimos fallback se for o admin padrão.
              if (email !== 'admin@alfred.local') {
                  const data = await res.json();
                  return { success: false, error: data.error || 'Credenciais inválidas.' };
              }
              // Se for admin@alfred.local mas o banco não tem o user (404), cai no fallback abaixo
          }
      } catch (error) {
          console.warn("Backend indisponível:", error);
          serverError = true;
      }

      // 2. Fallback para Modo Local (Demo)
      // Ativa se: Houve erro no servidor (500/Network) OU Credenciais Admin Padrão
      if (serverError || (email === 'admin@alfred.local')) {
          console.log("⚠️ Ativando Modo Local (Demo)");
          localStorage.setItem('alfred_token', 'demo_token_offline');
          setIsAuthenticated(true);
          setIsOfflineMode(true);
          return { success: true };
      }

      return { success: false, error: 'Erro desconhecido.' };
  };

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('alfred_token');
    
    // Se estivermos em modo offline explícito ou token for de demo
    if (token === 'demo_token_offline' || isOfflineMode) {
        loadMockData();
        return;
    }

    try {
        const res = await fetch('/api/data/dashboard', { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        if (res.ok) {
            const data = await res.json();
            setUser(data.user || MOCK_USER);
            setTransactions(data.transactions || []);
            setAccounts(data.accounts || []);
            setIsOfflineMode(false);
        } else {
            // Se der erro 401, desloga. Se der 500, vai pro mock.
            if (res.status === 401) {
                handleLogout();
            } else {
                console.warn("Erro API (500), carregando dados locais.");
                loadMockData();
            }
        }
    } catch (e) { 
        console.warn("Backend offline ao buscar dados. Usando dados locais.");
        loadMockData();
    }
  };

  const loadMockData = () => {
      setUser(MOCK_USER);
      setAccounts(MOCK_ACCOUNTS);
      setTransactions(MOCK_TRANSACTIONS);
      setIsOfflineMode(true);
  };
  
  const handleLogout = () => {
      localStorage.removeItem('alfred_token');
      setIsAuthenticated(false);
      setUser(null);
      setTransactions([]);
      setAccounts([]);
      setActiveView('landing');
      setIsOfflineMode(false);
  };
  
  const renderContent = () => {
    switch(activeView) {
      case 'dashboard':
        return (
            <>
                {isOfflineMode && (
                    <div className="bg-amber-600/90 text-white text-xs text-center py-1 absolute top-0 w-full z-50 font-bold backdrop-blur-sm">
                        ⚠️ MODO LOCAL ATIVO (Servidor Offline ou Erro de Banco)
                    </div>
                )}
                <Dashboard user={user} accounts={accounts} transactions={transactions} onLogout={handleLogout} onRefreshData={fetchDashboardData} />
            </>
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