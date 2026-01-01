
import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, Loader2, Home, KeyRound, UserPlus, CheckCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onBack: () => void;
  onRegisterClick: () => void;
  urlResetToken?: string | null; // Novo prop
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack, onRegisterClick, urlResetToken }) => {
  const [view, setView] = useState<'LOGIN' | 'FORGOT' | 'RESET'>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // States para Reset
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Se receber token pela URL, vai direto para tela de Reset
  useEffect(() => {
    if (urlResetToken) {
        setResetToken(urlResetToken);
        setView('RESET');
    }
  }, [urlResetToken]);

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
              setSuccessMsg('Se o e-mail estiver cadastrado, enviamos um link para redefinir sua senha.');
              // NÃO MUDAMOS A VIEW AUTOMATICAMENTE. O usuário deve ir ao email e clicar no link.
          } else {
              setError(data.error || 'Erro ao solicitar redefinição.');
          }
      } catch (err) {
          setError('Erro de conexão com o servidor.');
      }
      setIsLoading(false);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
          setError('As senhas não coincidem.');
          return;
      }

      setIsLoading(true);
      try {
          const res = await fetch('/api/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: resetToken, newPassword })
          });
          
          if (res.ok) {
              setSuccessMsg('Senha alterada com sucesso! Você pode entrar agora.');
              setTimeout(() => {
                  setView('LOGIN');
                  setPassword(''); // Limpa o campo para o usuário digitar a nova
                  setSuccessMsg('Senha atualizada. Faça login.');
                  // Opcional: Limpar URL
              }, 2000);
          } else {
              const data = await res.json();
              setError(data.error || 'Link expirado ou inválido.');
          }
      } catch (e) {
          setError('Erro de conexão.');
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
                {view === 'LOGIN' ? 'Acesse sua propriedade, Senhor.' : view === 'FORGOT' ? 'Recuperação de Acesso' : 'Nova Senha'}
            </p>
        </div>

        {view === 'LOGIN' && (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
                {successMsg && <p className="text-emerald-500 text-xs text-center font-bold bg-emerald-500/10 p-2 rounded flex items-center justify-center gap-2"><CheckCircle size={14}/> {successMsg}</p>}

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
        )}

        {view === 'FORGOT' && (
            <form className="space-y-4" onSubmit={handleForgotPasswordSubmit}>
                <p className="text-sm text-slate-400 text-center mb-4">
                    Informe o e-mail. Se estiver em nossa base, enviaremos um link de recuperação.
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
                {successMsg && <p className="text-emerald-500 text-xs text-center font-bold bg-emerald-500/10 p-2 rounded animate-pulse">{successMsg}</p>}

                <button type="submit" disabled={isLoading || !!successMsg} className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Enviar Link'}
                    {!isLoading && <KeyRound size={18} />}
                </button>

                <button type="button" onClick={() => { setView('LOGIN'); setError(''); setSuccessMsg(''); }} className="w-full text-slate-400 hover:text-white py-2 text-sm">
                    Voltar ao Login
                </button>
            </form>
        )}

        {view === 'RESET' && (
            <form className="space-y-4" onSubmit={handleResetSubmit}>
                <p className="text-sm text-slate-400 text-center mb-4">
                    Crie uma nova senha segura para sua conta.
                </p>
                
                <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                    <input 
                    type="password" 
                    placeholder="Nova Senha" 
                    required 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    className="w-full p-3 pl-10 rounded-lg border bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-primary" />
                </div>

                <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                    <input 
                    type="password" 
                    placeholder="Confirmar Nova Senha" 
                    required 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="w-full p-3 pl-10 rounded-lg border bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-primary" />
                </div>

                {error && <p className="text-red-500 text-xs text-center font-bold bg-red-500/10 p-2 rounded">{error}</p>}
                {successMsg && <p className="text-emerald-500 text-xs text-center font-bold bg-emerald-500/10 p-2 rounded">{successMsg}</p>}

                <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Alterar Senha'}
                    {!isLoading && <CheckCircle size={18} />}
                </button>
            </form>
        )}
      </div>
    </div>
  );
};
