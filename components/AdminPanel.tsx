import React, { useState, useEffect } from 'react';
import { User, Plan, Tutorial, Announcement, SystemConfig, Coupon, SubscriptionType } from '../types';
import { LayoutGrid, Box, CreditCard, PlayCircle, Globe, Cpu, Smartphone, Save, CheckCircle, Loader2, AlertCircle, User as UserIcon, Tag, Plus, Trash2, Edit, Search, UserPlus, Lock } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  plans: Plan[];
  coupons?: Coupon[];
  tutorials?: Tutorial[];
  isDarkMode: boolean;
  onUpdateUser: () => void;
  onAddUser: () => void;
  onManagePlan: () => void;
  onManageTutorial: () => void;
  onAddAnnouncement: (ann: Announcement) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, plans, coupons, tutorials, isDarkMode, onUpdateUser, onAddUser, onManagePlan, onManageTutorial }) => {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  
  // Config State
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

  // Forms States
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', isTestUser: false });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userEditForm, setUserEditForm] = useState({ password: '', trialDaysToAdd: 0 });
  const [newCoupon, setNewCoupon] = useState<{ code: string, value: number, type: 'PERCENTAGE' | 'FIXED', appliesTo: SubscriptionType[] }>({ 
      code: '', value: 0, type: 'PERCENTAGE', appliesTo: [] 
  });
  const [newTutorial, setNewTutorial] = useState({ title: '', description: '', videoUrl: '' });
  
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
        const res = await fetch('/api/data/dashboard', { headers: { 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` } });
        const data = await res.json();
        if (data.config && Object.keys(data.config).length > 0) {
            setConfig(prev => ({
                ...prev, ...data.config,
                aiKeys: { ...prev.aiKeys, ...(data.config.aiKeys || {}) },
                paymentGateway: { ...prev.paymentGateway, ...(data.config.paymentGateway || {}) },
                evolutionApi: { ...prev.evolutionApi, ...(data.config.evolutionApi || {}) },
            }));
        }
    } catch (e) { console.error(e); }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveStatus('IDLE');
    try {
        const res = await fetch('/api/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` },
            body: JSON.stringify(config)
        });
        if (res.ok) {
            setSaveStatus('SUCCESS');
            if (config.aiKeys?.gemini) sessionStorage.setItem('VITE_GEMINI_KEY', config.aiKeys.gemini);
        } else setSaveStatus('ERROR');
    } catch (e) { setSaveStatus('ERROR'); } finally { setIsSaving(false); setTimeout(() => setSaveStatus('IDLE'), 3000); }
  };

  // --- Handlers ---
  const handleCreateUser = async () => {
      setLoading(true);
      await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }, body: JSON.stringify(newUser) });
      setNewUser({ name: '', email: '', password: '', isTestUser: false });
      onAddUser();
      setLoading(false);
  };

  const handleUpdateUser = async (id: string, active?: boolean) => {
      const body: any = {};
      if (active !== undefined) body.active = active;
      if (userEditForm.password) body.password = userEditForm.password;
      if (userEditForm.trialDaysToAdd) body.trialDaysToAdd = userEditForm.trialDaysToAdd;
      await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }, body: JSON.stringify(body) });
      setEditingUser(null);
      setUserEditForm({ password: '', trialDaysToAdd: 0 });
      onUpdateUser();
  };

  const handleUpdatePlan = async (id: string, price: number, trialDays: number) => {
      await fetch('/api/admin/plans', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }, body: JSON.stringify({ id, price, trialDays }) });
      onManagePlan();
  };

  const handleCreateCoupon = async () => {
      await fetch('/api/admin/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }, body: JSON.stringify(newCoupon) });
      onManagePlan();
  };

  const handleCreateTutorial = async () => {
      await fetch('/api/admin/tutorials', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` }, body: JSON.stringify(newTutorial) });
      onManageTutorial();
  };
  
  const toggleCouponPlan = (planId: SubscriptionType) => {
      setNewCoupon(prev => {
          const current = prev.appliesTo;
          if (current.includes(planId)) {
              return { ...prev, appliesTo: current.filter(p => p !== planId) };
          } else {
              return { ...prev, appliesTo: [...current, planId] };
          }
      });
  };

  const tabClass = (tab: string) => `pb-2 px-1 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`;
  const inputClass = `w-full border rounded p-2 text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`;
  const labelClass = "block text-xs text-slate-400 mb-2 uppercase font-bold";

  // Dashboard calculations
  const planStats = plans.map(plan => {
     const count = users.filter(u => u.subscription === plan.id || u.planId === plan.id).length;
     const revenue = count * plan.price;
     return { name: plan.name, count, revenue };
  });

  return (
    <div className="animate-fade-in pb-12">
      <header className="mb-8 border-b border-slate-800 pb-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-serif font-bold text-white">Painel Master</h2>
                <button 
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-lg text-sm ${saveStatus === 'SUCCESS' ? 'bg-emerald-600' : 'bg-purple-600 hover:bg-purple-500'}`}
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : saveStatus === 'SUCCESS' ? <CheckCircle size={16} /> : <Save size={16} />}
                    {saveStatus === 'SUCCESS' ? 'Salvo!' : 'Salvar Configs'}
                </button>
            </div>
            <div className="flex gap-4 overflow-x-auto">
                <button onClick={() => setActiveTab('DASHBOARD')} className={tabClass('DASHBOARD')}>Dashboard & Clientes</button>
                <button onClick={() => setActiveTab('PLANS')} className={tabClass('PLANS')}>Planos</button>
                <button onClick={() => setActiveTab('COUPONS')} className={tabClass('COUPONS')}>Cupons</button>
                <button onClick={() => setActiveTab('FINANCE')} className={tabClass('FINANCE')}>Financeiro</button>
                <button onClick={() => setActiveTab('INTEGRATIONS')} className={tabClass('INTEGRATIONS')}>Integrações</button>
                <button onClick={() => setActiveTab('TUTORIALS')} className={tabClass('TUTORIALS')}>Tutoriais</button>
            </div>
      </header>

      {/* DASHBOARD & CLIENTS TAB */}
      {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                      <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Total Usuários</h3>
                      <p className="text-3xl text-white font-serif">{users.length}</p>
                  </div>
                  {planStats.map(stat => (
                      <div key={stat.name} className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                          <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">{stat.name}</h3>
                          <div className="flex justify-between items-end">
                             <p className="text-2xl text-emerald-400 font-serif">{stat.count} <span className="text-xs text-slate-500 font-sans">clientes</span></p>
                             <p className="text-sm text-gold-500 font-bold">R$ {stat.revenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                          </div>
                      </div>
                  ))}
              </div>

              {/* Clients Table & Actions */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><UserPlus size={20} className="text-emerald-500" /> Gestão de Clientes</h3>
                   
                   {/* Create Client Form */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                       <input placeholder="Nome" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className={inputClass} />
                       <input placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className={inputClass} />
                       <input placeholder="Senha" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className={inputClass} />
                       <div className="flex items-center gap-2 h-10"><input type="checkbox" checked={newUser.isTestUser} onChange={e => setNewUser({...newUser, isTestUser: e.target.checked})} /><span className="text-slate-300 text-sm">Cliente Teste</span></div>
                       <button onClick={handleCreateUser} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded text-sm font-bold">{loading ? <Loader2 className="animate-spin mx-auto"/> : 'Criar Cliente'}</button>
                   </div>
                   
                   {/* Table */}
                   <div className="overflow-hidden rounded-lg border border-slate-800">
                       <table className="w-full text-left text-sm text-slate-400">
                           <thead className="text-xs uppercase bg-slate-800 text-slate-300"><tr><th className="p-3">Cliente</th><th className="p-3">Plano</th><th className="p-3">Vencimento</th><th className="p-3">Status</th><th className="p-3 text-right">Ações</th></tr></thead>
                           <tbody>
                               {users.map(u => (
                                   <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                                       <td className="p-3"><p className="text-white font-medium">{u.name} {u.isTestUser && <span className="text-xs bg-blue-600 px-1 rounded ml-2">TESTE</span>}</p><p className="text-xs">{u.email}</p></td>
                                       <td className="p-3">{u.subscription}</td>
                                       <td className="p-3 text-gold-500">{u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleDateString() : '-'}</td>
                                       <td className="p-3"><button onClick={() => handleUpdateUser(u.id, !u.active)} className={`px-2 py-1 rounded text-xs font-bold ${u.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{u.active ? 'ATIVO' : 'SUSPENSO'}</button></td>
                                       <td className="p-3 text-right"><button onClick={() => setEditingUser(u)} className="text-slate-400 hover:text-white p-1 bg-slate-800 rounded"><Edit size={16}/></button></td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               </div>

               {/* Edit Modal */}
               {editingUser && (
                   <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                       <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                           <h3 className="text-white text-lg font-bold mb-4">Gerenciar: {editingUser.name}</h3>
                           <div className="space-y-4">
                               <div><label className="text-xs text-slate-400">Alterar Senha</label><input type="text" placeholder="Nova senha..." value={userEditForm.password} onChange={e => setUserEditForm({...userEditForm, password: e.target.value})} className={inputClass} /></div>
                               <div><label className="text-xs text-slate-400">Adicionar Dias</label><div className="flex gap-2"><button onClick={() => setUserEditForm({...userEditForm, trialDaysToAdd: 30})} className="bg-slate-800 text-white px-3 py-1 rounded text-xs">+30d</button><button onClick={() => setUserEditForm({...userEditForm, trialDaysToAdd: 365})} className="bg-slate-800 text-white px-3 py-1 rounded text-xs">+1 Ano</button></div></div>
                               <button onClick={() => handleUpdateUser(editingUser.id)} className="w-full bg-gold-600 text-white font-bold py-2 rounded">Salvar</button>
                               <button onClick={() => setEditingUser(null)} className="w-full text-slate-400 text-sm py-2">Cancelar</button>
                           </div>
                       </div>
                   </div>
               )}
          </div>
      )}

      {/* PLANS TAB */}
      {activeTab === 'PLANS' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['MONTHLY', 'SEMIANNUAL', 'ANNUAL'].map(type => {
                  const plan = plans.find(p => p.id === type) || { id: type, price: 0, trialDays: 0 };
                  return (
                    <div key={type} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4">{type === 'MONTHLY' ? 'Mensal' : type === 'SEMIANNUAL' ? 'Semestral' : 'Anual'}</h3>
                        <div className="space-y-4">
                            <div><label className="text-xs text-slate-400">Preço (R$)</label><input type="number" step="0.01" defaultValue={plan.price} onBlur={(e) => handleUpdatePlan(plan.id, Number(e.target.value), plan.trialDays)} className={inputClass} /></div>
                            <div><label className="text-xs text-slate-400">Dias Grátis</label><input type="number" defaultValue={plan.trialDays} onBlur={(e) => handleUpdatePlan(plan.id, plan.price, Number(e.target.value))} className={inputClass} /></div>
                        </div>
                    </div>
                  );
              })}
          </div>
      )}

      {/* COUPONS TAB */}
      {activeTab === 'COUPONS' && (
          <div className="space-y-6">
               <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><Tag size={20} className="text-gold-500" /> Criar Cupom</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                       <input placeholder="CÓDIGO" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} className={inputClass} />
                       <select value={newCoupon.type} onChange={e => setNewCoupon({...newCoupon, type: e.target.value as any})} className={inputClass}><option value="PERCENTAGE">%</option><option value="FIXED">R$</option></select>
                       <input type="number" placeholder="Valor" value={newCoupon.value} onChange={e => setNewCoupon({...newCoupon, value: Number(e.target.value)})} className={inputClass} />
                   </div>
                   <div className="mb-4">
                       <label className="text-xs text-slate-400 block mb-2 font-bold">Válido para:</label>
                       <div className="flex flex-wrap gap-4">
                           {['MONTHLY', 'SEMIANNUAL', 'ANNUAL'].map(type => (
                               <label key={type} className="flex items-center gap-2 cursor-pointer">
                                   <input type="checkbox" checked={newCoupon.appliesTo.includes(type as any)} onChange={() => toggleCouponPlan(type as any)} className="rounded border-slate-600 bg-slate-800 text-gold-500 focus:ring-gold-500" />
                                   <span className="text-slate-300 text-sm">{type === 'MONTHLY' ? 'Mensal' : type === 'SEMIANNUAL' ? 'Semestral' : 'Anual'}</span>
                               </label>
                           ))}
                       </div>
                   </div>
                   <button onClick={handleCreateCoupon} className="bg-gold-600 hover:bg-gold-500 text-white px-6 py-2 rounded text-sm font-bold">Criar Cupom</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {coupons?.map(c => (
                       <div key={c.id} className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
                           <div className="flex justify-between items-center mb-2">
                               <div><p className="text-white font-bold">{c.code}</p><p className="text-xs text-slate-400">{c.type === 'PERCENTAGE' ? `${c.value}%` : `R$ ${c.value}`} OFF</p></div>
                               <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded">ATIVO</span>
                           </div>
                           <div className="flex gap-1 flex-wrap">
                               {c.appliesTo?.map((p:any) => <span key={p} className="text-[10px] bg-slate-700 text-slate-300 px-1 rounded">{p}</span>)}
                           </div>
                       </div>
                   ))}
               </div>
          </div>
      )}

      {/* INTEGRATIONS TAB */}
      {activeTab === 'INTEGRATIONS' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-6 flex items-center gap-2 text-white"><Cpu size={20} className="text-purple-500"/> Inteligência Artificial (Gemini)</h3>
                  <div>
                      <label className={labelClass}>Google Gemini API Key</label>
                      <input type="password" value={config.aiKeys?.gemini || ''} onChange={e => setConfig({...config, aiKeys: {...config.aiKeys, gemini: e.target.value}})} className={inputClass} placeholder="Insira sua chave da API do Google AI Studio" />
                      <p className="text-xs text-slate-500 mt-2">Necessário para o Chat funcionar.</p>
                  </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <h3 className="text-lg font-medium mb-6 flex items-center gap-2 text-white"><Smartphone size={20} className="text-emerald-500"/> Evolution API (WhatsApp)</h3>
                   <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <input type="checkbox" checked={config.evolutionApi?.enabled} onChange={e => setConfig({...config, evolutionApi: {...config.evolutionApi, enabled: e.target.checked}})} />
                            <span className="text-white text-sm">Habilitar Integração</span>
                        </div>
                        <div><label className={labelClass}>Base URL</label><input value={config.evolutionApi?.baseUrl || ''} onChange={e => setConfig({...config, evolutionApi: {...config.evolutionApi, baseUrl: e.target.value}})} className={inputClass} /></div>
                        <div><label className={labelClass}>Global API Key</label><input type="password" value={config.evolutionApi?.globalApiKey || ''} onChange={e => setConfig({...config, evolutionApi: {...config.evolutionApi, globalApiKey: e.target.value}})} className={inputClass} /></div>
                        <div><label className={labelClass}>Nome da Instância</label><input value={config.evolutionApi?.instanceName || ''} onChange={e => setConfig({...config, evolutionApi: {...config.evolutionApi, instanceName: e.target.value}})} className={inputClass} /></div>
                   </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2">
                  <h3 className="text-lg font-medium mb-6 flex items-center gap-2 text-white"><Globe size={20} className="text-blue-500"/> Webhooks</h3>
                  <div><label className={labelClass}>Webhook URL Principal</label><input value={config.webhookUrl || ''} onChange={e => setConfig({...config, webhookUrl: e.target.value})} className={inputClass} /></div>
              </div>
          </div>
      )}

      {/* FINANCE CONFIG TAB */}
      {activeTab === 'FINANCE' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-medium mb-6 flex items-center gap-2 text-white"><CreditCard size={20} className="text-emerald-500"/> Gateway PagSeguro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClass}>Email da Conta</label><input type="email" value={config.paymentGateway?.email || ''} onChange={e => setConfig({...config, paymentGateway: {...config.paymentGateway, email: e.target.value}})} className={inputClass} /></div>
                    <div><label className={labelClass}>Token de Produção/Sandbox</label><input type="password" value={config.paymentGateway?.token || ''} onChange={e => setConfig({...config, paymentGateway: {...config.paymentGateway, token: e.target.value}})} className={inputClass} /></div>
                    <div className="flex items-center gap-2 mt-4"><input type="checkbox" checked={config.paymentGateway?.sandbox} onChange={e => setConfig({...config, paymentGateway: {...config.paymentGateway, sandbox: e.target.checked}})} /><span className="text-slate-300 text-sm">Modo Sandbox (Teste)</span></div>
                </div>
            </div>
          </div>
      )}

       {/* TUTORIALS TAB */}
       {activeTab === 'TUTORIALS' && (
          <div className="space-y-6">
               <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><PlayCircle size={20} className="text-blue-500" /> Adicionar Tutorial</h3>
                   <div className="space-y-4">
                       <input placeholder="Título" value={newTutorial.title} onChange={e => setNewTutorial({...newTutorial, title: e.target.value})} className={inputClass} />
                       <input placeholder="URL Vídeo" value={newTutorial.videoUrl} onChange={e => setNewTutorial({...newTutorial, videoUrl: e.target.value})} className={inputClass} />
                       <button onClick={handleCreateTutorial} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded text-sm font-bold w-full">Adicionar</button>
                   </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {tutorials?.map(t => (
                       <div key={t.id} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                           <div className="p-3"><p className="text-white font-medium truncate">{t.title}</p></div>
                       </div>
                   ))}
               </div>
          </div>
      )}
    </div>
  );
};