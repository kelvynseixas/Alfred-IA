
import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2, Home } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // Pre-fill credentials for easy access
  const [email, setEmail] = useState('admin@alfred.local');
  const [password, setPassword] = useState('alfred@1992');

  const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      const result = await onLogin(email, password);
      if (!result.success) {
          setError(result.error || 'Ocorreu um erro desconhecido.');
      }
      setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-sm p-8 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl relative">
        <button onClick={onBack} className="absolute top-4 left-4 text-slate-500 hover:text-primary transition-colors">
            <Home size={20} />
        </button>
        <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-white">Alfred IA</h1>
            <p className="text-slate-500 mt-2">Acesse sua propriedade, Senhor.</p>
        </div>

        <form className="space-y-4" onSubmit={handleLoginSubmit}>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <input 
              type="email" 
              placeholder="E-mail" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full p-3 pl-10 rounded-lg border bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-primary" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <input 
              type="password" 
              placeholder="Senha" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full p-3 pl-10 rounded-lg border bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-primary" />
          </div>
          
          {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}

          <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin" /> : 'Entrar na Propriedade'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 mb-1">Credenciais Padrão (Demo):</p>
            <code className="text-xs bg-slate-800 px-2 py-1 rounded text-primary">admin@alfred.local</code>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <a href="#" className="text-slate-400 hover:text-primary text-sm font-medium">
                Não possui uma conta? Solicite uma audiência.
            </a>
        </div>
      </div>
    </div>
  );
};
