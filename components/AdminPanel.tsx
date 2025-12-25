import React, { useState, useEffect } from 'react';
import { User, Plan, Tutorial, Announcement, SystemConfig } from '../types';
import { LayoutGrid, Box, CreditCard, Link, PlayCircle, Megaphone, Globe, Cpu, Smartphone, Save, CheckCircle, Loader2, AlertCircle, User as UserIcon } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  plans: Plan[];
  tutorials: Tutorial[];
  isDarkMode: boolean;
  onUpdateUser: (user: User) => void;
  onAddUser: (user: User) => void;
  onManagePlan: (plan: Plan, action: 'CREATE' | 'UPDATE' | 'DELETE') => void;
  onManageTutorial: (tut: Tutorial, action: 'CREATE' | 'DELETE') => void;
  onAddAnnouncement: (ann: Announcement) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState('INTEGRATIONS');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  const [config, setConfig] = useState<SystemConfig>({
      timezone: 'America/Sao_Paulo',
      aiProvider: 'GEMINI',
      aiKeys: { gemini: '' },
      webhookUrl: '',
      evolutionApi: { enabled: false, baseUrl: '', globalApiKey: '', instanceName: '' },
      paymentGateway: {
          provider: 'PAGSEGURO',
          email: '',
          token: '',
          sandbox: true,
          rates: { creditCard: 4.99, creditCardInstallment: 2.99, pix: 0.99, boleto: 3.50 }
      },
      branding: { primaryColor: '#d97706', secondaryColor: '#1e293b' }
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const res = await fetch('/api/data/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }
    });
    const data = await res.json();
    if (data.config) setConfig(data.config);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveStatus('IDLE');
    try {
        const res = await fetch('/api/admin/config', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('alfred_token')}`
            },
            body: JSON.stringify(config)
        });
        if (res.ok) {
            setSaveStatus('SUCCESS');
            if (config.aiKeys?.gemini) sessionStorage.setItem('VITE_GEMINI_KEY', config.aiKeys.gemini);
        } else setSaveStatus('ERROR');
    } catch (e) {
        setSaveStatus('ERROR');
    } finally {
        setIsSaving(false);
        setTimeout(() => setSaveStatus('IDLE'), 3000);
    }
  };

  const tabClass = (tab: string) => `pb-2 px-1 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`;
  const inputClass = `w-full border rounded p-2.5 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`;

  return (
    <div className="animate-fade-in">
      <header className="mb-8 border-b border-slate-800 pb-4 flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-serif font-bold text-white">Painel Master</h2>
            <div className="flex gap-4 mt-4">
                <button onClick={() => setActiveTab('INTEGRATIONS')} className={tabClass('INTEGRATIONS')}>Integrações</button>
                <button onClick={() => setActiveTab('USERS')} className={tabClass('USERS')}>Usuários</button>
                <button onClick={() => setActiveTab('FINANCE')} className={tabClass('FINANCE')}>Financeiro</button>
            </div>
        </div>
        
        {activeTab !== 'USERS' && (
            <button 
                onClick={handleSaveConfig}
                disabled={isSaving}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg ${saveStatus === 'SUCCESS' ? 'bg-emerald-600' : 'bg-purple-600 hover:bg-purple-500'}`}
            >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : saveStatus === 'SUCCESS' ? <CheckCircle size={18} /> : <Save size={18} />}
                {saveStatus === 'SUCCESS' ? 'Salvo!' : 'Salvar Alterações'}
            </button>
        )}
      </header>

      {activeTab === 'INTEGRATIONS' && (
          <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-6 flex items-center gap-2 text-white"><Cpu size={20} className="text-purple-500"/> Inteligência Artificial (Gemini)</h3>
                  <div>
                      <label className="block text-xs text-slate-400 mb-2 uppercase font-bold">Google Gemini API Key</label>
                      <input 
                        type="password" 
                        value={config.aiKeys.gemini} 
                        onChange={e => setConfig({...config, aiKeys: {...config.aiKeys, gemini: e.target.value}})}
                        className={inputClass}
                        placeholder="Insira sua chave da API do Google AI Studio"
                      />
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'USERS' && (
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-hidden">
               <h3 className="text-lg font-medium mb-6 flex items-center gap-2 text-white"><UserIcon size={20} className="text-blue-500"/> Gestão de Usuários</h3>
               <table className="w-full text-left text-sm text-slate-400">
                   <thead className="text-xs uppercase bg-slate-800 text-slate-300">
                       <tr>
                           <th className="p-3">Nome</th>
                           <th className="p-3">Email</th>
                           <th className="p-3">Role</th>
                           <th className="p-3">Status</th>
                       </tr>
                   </thead>
                   <tbody>
                       {users.map(u => (
                           <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                               <td className="p-3 text-white font-medium">{u.name}</td>
                               <td className="p-3">{u.email}</td>
                               <td className="p-3"><span className="bg-slate-700 px-2 py-1 rounded text-xs">{u.role}</span></td>
                               <td className="p-3"><span className={u.active ? 'text-emerald-400' : 'text-red-400'}>{u.active ? 'Ativo' : 'Inativo'}</span></td>
                           </tr>
                       ))}
                   </tbody>
               </table>
               {users.length === 0 && <p className="text-center py-8 italic">Carregando usuários...</p>}
           </div>
      )}

      {activeTab === 'FINANCE' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-6 flex items-center gap-2 text-white"><CreditCard size={20} className="text-emerald-500"/> Gateway PagSeguro</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs text-slate-400 mb-2 uppercase font-bold">Email</label>
                      <input type="email" value={config.paymentGateway.email} onChange={e => setConfig({...config, paymentGateway: {...config.paymentGateway, email: e.target.value}})} className={inputClass} />
                  </div>
                  <div>
                      <label className="block text-xs text-slate-400 mb-2 uppercase font-bold">Token</label>
                      <input type="password" value={config.paymentGateway.token} onChange={e => setConfig({...config, paymentGateway: {...config.paymentGateway, token: e.target.value}})} className={inputClass} />
                  </div>
              </div>
          </div>
      )}

      {saveStatus === 'ERROR' && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-center gap-3 text-red-500">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">Erro ao salvar. Verifique se o servidor está online.</p>
          </div>
      )}
    </div>
  );
};