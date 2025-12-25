import React, { useState, useEffect } from 'react';
import { User, Plan, Tutorial, Announcement, SystemConfig } from '../types';
import { LayoutGrid, Box, CreditCard, Link, PlayCircle, Megaphone, Globe, Cpu, Smartphone, Save, CheckCircle, Loader2, AlertCircle, User as UserIcon, Tag, Plus, Trash2, Edit } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  // Estado inicial robusto
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
    try {
        const res = await fetch('/api/data/dashboard', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }
        });
        const data = await res.json();
        
        if (data.config && Object.keys(data.config).length > 0) {
            setConfig(prev => ({
                ...prev,
                ...data.config,
                aiKeys: { ...prev.aiKeys, ...(data.config.aiKeys || {}) },
                paymentGateway: { ...prev.paymentGateway, ...(data.config.paymentGateway || {}) },
                evolutionApi: { ...prev.evolutionApi, ...(data.config.evolutionApi || {}) },
                branding: { ...prev.branding, ...(data.config.branding || {}) }
            }));
        }
    } catch (e) {
        console.error("Erro ao carregar configs:", e);
    }
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
  const labelClass = "block text-xs text-slate-400 mb-2 uppercase font-bold";

  return (
    <div className="animate-fade-in">
      <header className="mb-8 border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-serif font-bold text-white">Painel Master</h2>
            <div className="flex gap-4 mt-4 overflow-x-auto">
                <button onClick={() => setActiveTab('DASHBOARD')} className={tabClass('DASHBOARD')}>Dashboard</button>
                <button onClick={() => setActiveTab('USERS')} className={tabClass('USERS')}>Usuários</button>
                <button onClick={() => setActiveTab('PLANS')} className={tabClass('PLANS')}>Planos</button>
                <button onClick={() => setActiveTab('FINANCE')} className={tabClass('FINANCE')}>Financeiro</button>
                <button onClick={() => setActiveTab('INTEGRATIONS')} className={tabClass('INTEGRATIONS')}>Integrações</button>
            </div>
        </div>
        
        <button 
            onClick={handleSaveConfig}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg ${saveStatus === 'SUCCESS' ? 'bg-emerald-600' : 'bg-purple-600 hover:bg-purple-500'}`}
        >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : saveStatus === 'SUCCESS' ? <CheckCircle size={18} /> : <Save size={18} />}
            {saveStatus === 'SUCCESS' ? 'Salvo!' : 'Salvar Alterações'}
        </button>
      </header>

      {activeTab === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                  <h3 className="text-slate-400 text-sm font-bold uppercase mb-2">Total Usuários</h3>
                  <p className="text-3xl text-white font-serif">{users.length}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                  <h3 className="text-slate-400 text-sm font-bold uppercase mb-2">Assinantes Ativos</h3>
                  <p className="text-3xl text-emerald-400 font-serif">{users.filter(u => u.active && u.role === 'USER').length}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                  <h3 className="text-slate-400 text-sm font-bold uppercase mb-2">Receita Mensal Est.</h3>
                  <p className="text-3xl text-gold-400 font-serif">R$ 0,00</p>
              </div>
          </div>
      )}

      {activeTab === 'PLANS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
             <div className="flex justify-between mb-6">
                <h3 className="text-lg font-medium text-white flex items-center gap-2"><Box size={20} className="text-blue-400"/> Gestão de Planos</h3>
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm flex items-center gap-2"><Plus size={16}/> Novo Plano</button>
             </div>
             <p className="text-slate-500 italic text-center py-8">Funcionalidade de criação de planos em desenvolvimento.</p>
          </div>
      )}

      {activeTab === 'INTEGRATIONS' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GEMINI */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-6 flex items-center gap-2 text-white"><Cpu size={20} className="text-purple-500"/> Inteligência Artificial (Gemini)</h3>
                  <div>
                      <label className={labelClass}>Google Gemini API Key</label>
                      <input 
                        type="password" 
                        value={config.aiKeys?.gemini || ''} 
                        onChange={e => setConfig({...config, aiKeys: {...config.aiKeys, gemini: e.target.value}})}
                        className={inputClass}
                        placeholder="Insira sua chave da API do Google AI Studio"
                      />
                      <p className="text-xs text-slate-500 mt-2">Necessário para o Chat funcionar.</p>
                  </div>
              </div>

              {/* EVOLUTION API */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <h3 className="text-lg font-medium mb-6 flex items-center gap-2 text-white"><Smartphone size={20} className="text-emerald-500"/> Evolution API (WhatsApp)</h3>
                   <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <input 
                                type="checkbox" 
                                checked={config.evolutionApi?.enabled}
                                onChange={e => setConfig({...config, evolutionApi: {...config.evolutionApi, enabled: e.target.checked}})} 
                            />
                            <span className="text-white text-sm">Habilitar Integração</span>
                        </div>
                        <div>
                           <label className={labelClass}>Base URL</label>
                           <input value={config.evolutionApi?.baseUrl || ''} onChange={e => setConfig({...config, evolutionApi: {...config.evolutionApi, baseUrl: e.target.value}})} className={inputClass} placeholder="https://api.evolution..." />
                        </div>
                        <div>
                           <label className={labelClass}>Global API Key</label>
                           <input type="password" value={config.evolutionApi?.globalApiKey || ''} onChange={e => setConfig({...config, evolutionApi: {...config.evolutionApi, globalApiKey: e.target.value}})} className={inputClass} />
                        </div>
                        <div>
                           <label className={labelClass}>Instance Name</label>
                           <input value={config.evolutionApi?.instanceName || ''} onChange={e => setConfig({...config, evolutionApi: {...config.evolutionApi, instanceName: e.target.value}})} className={inputClass} />
                        </div>
                   </div>
              </div>

               {/* WEBHOOKS */}
               <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2">
                  <h3 className="text-lg font-medium mb-6 flex items-center gap-2 text-white"><Globe size={20} className="text-blue-500"/> Webhooks (n8n / Typebot)</h3>
                  <div>
                      <label className={labelClass}>Webhook URL Principal</label>
                      <input 
                        value={config.webhookUrl || ''} 
                        onChange={e => setConfig({...config, webhookUrl: e.target.value})}
                        className={inputClass}
                        placeholder="https://seu-n8n.com/webhook/..."
                      />
                      <p className="text-xs text-slate-500 mt-2">Eventos do sistema (novo usuário, pagamento, erro) serão enviados para cá.</p>
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
           </div>
      )}

      {activeTab === 'FINANCE' && (
          <div className="space-y-6">
            {/* PAGSEGURO */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-medium mb-6 flex items-center gap-2 text-white"><CreditCard size={20} className="text-emerald-500"/> Gateway PagSeguro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Email da Conta</label>
                        <input type="email" value={config.paymentGateway?.email || ''} onChange={e => setConfig({...config, paymentGateway: {...config.paymentGateway, email: e.target.value}})} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Token de Produção/Sandbox</label>
                        <input type="password" value={config.paymentGateway?.token || ''} onChange={e => setConfig({...config, paymentGateway: {...config.paymentGateway, token: e.target.value}})} className={inputClass} />
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                         <input type="checkbox" checked={config.paymentGateway?.sandbox} onChange={e => setConfig({...config, paymentGateway: {...config.paymentGateway, sandbox: e.target.checked}})} />
                         <span className="text-slate-300 text-sm">Modo Sandbox (Teste)</span>
                    </div>
                </div>
            </div>

            {/* CUPONS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                 <div className="flex justify-between mb-6">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2"><Tag size={20} className="text-gold-500"/> Cupons de Desconto</h3>
                    <button className="bg-gold-600 hover:bg-gold-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2"><Plus size={14}/> Criar Cupom</button>
                 </div>
                 <div className="text-center py-6 border border-dashed border-slate-700 rounded-lg">
                     <p className="text-slate-500 text-sm">Nenhum cupom ativo no momento.</p>
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