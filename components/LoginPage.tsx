
import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2, Home, KeyRound, UserPlus } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onBack: () => void;
  onRegisterClick: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack, onRegisterClick }) => {
  const [view, setView] = useState<'LOGIN' | 'FORGOT'>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      setSuccessMsg('');

      try {
          const res = await fetch('/api/auth/forgot-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
          });
          const data = await res.json();
          
          if (res.ok) {
              setSuccessMsg('Um link de redefinição foi enviado para o seu e-mail.');
          } else {
              setError(data.error || 'Erro ao solicitar redefinição.');
          }
      } catch (err) {
          setError('Erro de conexão com o servidor.');
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
            <p className="text-slate-500 mt-2">
                {view === 'LOGIN' ? 'Acesse sua propriedade, Senhor.' : 'Recuperação de Acesso'}
            </p>
        </div>

        {view === 'LOGIN' ? (
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
                <div>
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
                    <div className="flex justify-end mt-1">
                        <button type="button" onClick={() => { setView('FORGOT'); setError(''); }} className="text-xs text-slate-400 hover:text-primary transition-colors">
                            Esqueci minha senha
                        </button>
                    </div>
                </div>
                
                {error && <p className="text-red-500 text-xs text-center font-bold bg-red-500/10 p-2 rounded">{error}</p>}

                <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Entrar na Propriedade'}
                    {!isLoading && <ArrowRight size={18} />}
                </button>

                <div className="mt-8 pt-6 border-t border-slate-800">
                    <p className="text-center text-slate-500 text-sm mb-3">Ainda não possui acesso?</p>
                    <button type="button" onClick={onRegisterClick} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-colors">
                        <UserPlus size={18} /> Criar Conta
                    </button>
                </div>
            </form>
        ) : (
            <form className="space-y-4" onSubmit={handleForgotPasswordSubmit}>
                <p className="text-sm text-slate-400 text-center mb-4">
                    Informe o e-mail associado à sua conta e enviaremos um link para redefinir sua senha.
                </p>
                
                <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                    <input 
                    type="email" 
                    placeholder="E-mail Cadastrado" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full p-3 pl-10 rounded-lg border bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-primary" />
                </div>

                {error && <p className="text-red-500 text-xs text-center font-bold bg-red-500/10 p-2 rounded">{error}</p>}
                {successMsg && <p className="text-emerald-500 text-xs text-center font-bold bg-emerald-500/10 p-2 rounded">{successMsg}</p>}

                <button type="submit" disabled={isLoading || !!successMsg} className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Enviar Link de Redefinição'}
                    {!isLoading && <KeyRound size={18} />}
                </button>

                <button type="button" onClick={() => { setView('LOGIN'); setError(''); setSuccessMsg(''); }} className="w-full text-slate-400 hover:text-white py-2 text-sm">
                    Voltar ao Login
                </button>
            </form>
        )}
      </div>
    </div>
  );
};
