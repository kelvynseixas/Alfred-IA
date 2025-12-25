import React, { useState } from 'react';
import { User, UserRole, SystemConfig, SubscriptionType, Coupon, Plan } from '../types';
import { Users, CreditCard, ShieldCheck, Activity, UserPlus, X, Cpu, Link, Palette, LayoutGrid, Save, DollarSign, MessageSquare, Plus, Trash2, Edit2, Check, Smartphone, Box, AlertTriangle } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  plans: Plan[];
  isDarkMode: boolean;
  onUpdateUser: (user: User) => void;
  onAddUser: (user: User) => void;
  onManagePlan: (plan: Plan, action: 'CREATE' | 'UPDATE' | 'DELETE') => void;
}

type AdminTab = 'DASHBOARD' | 'INTEGRATIONS' | 'PLANS' | 'BILLING';

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, plans, isDarkMode, onUpdateUser, onAddUser, onManagePlan }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  
  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [manageUser, setManageUser] = useState<User | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  // Forms State
  const [newUser, setNewUser] = useState<Partial<User>>({ name: '', email: '', active: true, role: UserRole.USER });
  const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({ name: '', price: 0, trialDays: 15, active: true, type: SubscriptionType.MONTHLY });

  // Config State
  const [config, setConfig] = useState<SystemConfig>({
      aiProvider: 'GEMINI',
      aiKeys: { gemini: '', openai: '', anthropic: '' },
      webhookUrl: '',
      evolutionApi: { enabled: true, baseUrl: '', globalApiKey: '', instanceName: '' },
      paymentGateway: 'ASAAS',
      paymentApiKey: '',
      branding: { primaryColor: '#d97706', secondaryColor: '#1e293b' }
  });

  const cardClass = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const inputClass = isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900';

  // --- Handlers ---
  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email) return;
    const user: User = {
        id: Date.now().toString(),
        name: newUser.name,
        email: newUser.email,
        phone: '',
        role: newUser.role || UserRole.USER,
        subscription: SubscriptionType.MONTHLY,
        active: true,
        modules: [],
        since: new Date().getFullYear().toString(),
        dependents: [],
        trialEndsAt: new Date(Date.now() + 15 * 86400000).toISOString()
    };
    onAddUser(user);
    setIsAddUserOpen(false);
    setNewUser({ name: '', email: '', active: true, role: UserRole.USER });
  };

  const handleUpdateUserStatus = () => {
      if (!manageUser) return;
      onUpdateUser({ ...manageUser, active: !manageUser.active });
      setManageUser(prev => prev ? ({ ...prev, active: !prev.active }) : null);
  };

  const handleChangeUserPlan = (sub: SubscriptionType) => {
      if (!manageUser) return;
      onUpdateUser({ ...manageUser, subscription: sub });
      setManageUser(prev => prev ? ({ ...prev, subscription: sub }) : null);
  };

  const handleSavePlan = () => {
      if (!currentPlan.name || !currentPlan.price) return;
      const planToSave: Plan = {
          id: currentPlan.id || Date.now().toString(),
          name: currentPlan.name,
          type: currentPlan.type || SubscriptionType.MONTHLY,
          price: Number(currentPlan.price),
          trialDays: Number(currentPlan.trialDays),
          active: currentPlan.active ?? true
      };
      onManagePlan(planToSave, currentPlan.id ? 'UPDATE' : 'CREATE');
      setIsPlanModalOpen(false);
      setCurrentPlan({ name: '', price: 0, trialDays: 15, active: true });
  };

  const handleDeletePlan = (p: Plan) => {
      if (confirm('Tem certeza que deseja excluir este plano?')) {
          onManagePlan(p, 'DELETE');
      }
  };

  const calculateMetrics = (type: SubscriptionType) => {
      const filtered = users.filter(u => u.subscription === type);
      const count = filtered.length;
      // Find current price for this type (approximate based on plans)
      const plan = plans.find(p => p.type === type);
      const price = plan ? plan.price : 0;
      return { count, total: count * price };
  };

  const metricsMonthly = calculateMetrics(SubscriptionType.MONTHLY);
  const metricsQuarterly = calculateMetrics(SubscriptionType.QUARTERLY);
  const metricsSemiannual = calculateMetrics(SubscriptionType.SEMIANNUAL);
  const metricsAnnual = calculateMetrics(SubscriptionType.ANNUAL);

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
        {/* Subscription Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border ${cardClass}`}>
                <p className="text-xs text-slate-500 uppercase mb-1">Mensal</p>
                <div className="flex justify-between items-end">
                    <span className={`text-2xl font-bold ${textPrimary}`}>{metricsMonthly.count}x</span>
                    <span className="text-emerald-500 font-bold">R$ {metricsMonthly.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
            </div>
            <div className={`p-4 rounded-lg border ${cardClass}`}>
                <p className="text-xs text-slate-500 uppercase mb-1">Trimestral</p>
                <div className="flex justify-between items-end">
                    <span className={`text-2xl font-bold ${textPrimary}`}>{metricsQuarterly.count}x</span>
                    <span className="text-emerald-500 font-bold">R$ {metricsQuarterly.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
            </div>
            <div className={`p-4 rounded-lg border ${cardClass}`}>
                <p className="text-xs text-slate-500 uppercase mb-1">Semestral</p>
                <div className="flex justify-between items-end">
                    <span className={`text-2xl font-bold ${textPrimary}`}>{metricsSemiannual.count}x</span>
                    <span className="text-emerald-500 font-bold">R$ {metricsSemiannual.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
            </div>
            <div className={`p-4 rounded-lg border ${cardClass}`}>
                <p className="text-xs text-slate-500 uppercase mb-1">Anual</p>
                <div className="flex justify-between items-end">
                    <span className={`text-2xl font-bold ${textPrimary}`}>{metricsAnnual.count}x</span>
                    <span className="text-emerald-500 font-bold">R$ {metricsAnnual.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
            </div>
        </div>

        <div className={`rounded-xl border overflow-hidden ${cardClass}`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <h3 className={`text-lg font-medium ${textPrimary}`}>Clientes Ativos</h3>
                <button onClick={() => setIsAddUserOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2"><Plus size={16} /> Novo Cliente</button>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className={`uppercase text-xs ${isDarkMode ? 'bg-slate-900/50 text-slate-200' : 'bg-slate-50 text-slate-600'}`}>
                <tr>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Assinatura</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-200'}`}>
                {users.map(user => (
                    <tr key={user.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-700/20' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4">
                            <div className={textPrimary}>{user.name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gold-500">{user.subscription || 'FREE TRIAL'}</td>
                        <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded text-[10px] font-bold ${user.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                 {user.active ? 'ATIVO' : 'SUSPENSO'}
                             </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button onClick={() => setManageUser(user)} className="text-purple-400 hover:text-purple-300 font-bold">GERENCIAR</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
    </div>
  );

  const renderIntegrations = () => (
      <div className="space-y-6 animate-fade-in">
          {/* AI Providers */}
          <div className={`rounded-xl border p-6 ${cardClass}`}>
              <h3 className={`text-lg font-medium mb-4 flex items-center gap-2 ${textPrimary}`}>
                  <Cpu className="text-purple-500" /> Inteligência Artificial (LLMs)
              </h3>
              <div className="space-y-4">
                  <div>
                      <label className="block text-xs text-slate-400 mb-1">Google Gemini API Key</label>
                      <input type="password" value={config.aiKeys.gemini} onChange={(e) => setConfig({...config, aiKeys: {...config.aiKeys, gemini: e.target.value}})} className={`w-full border rounded p-2 ${inputClass}`} />
                  </div>
                  <div>
                      <label className="block text-xs text-slate-400 mb-1">OpenAI API Key</label>
                      <input type="password" value={config.aiKeys.openai} onChange={(e) => setConfig({...config, aiKeys: {...config.aiKeys, openai: e.target.value}})} className={`w-full border rounded p-2 ${inputClass}`} />
                  </div>
                  <div>
                      <label className="block text-xs text-slate-400 mb-1">Anthropic API Key</label>
                      <input type="password" value={config.aiKeys.anthropic} onChange={(e) => setConfig({...config, aiKeys: {...config.aiKeys, anthropic: e.target.value}})} className={`w-full border rounded p-2 ${inputClass}`} />
                  </div>
              </div>
          </div>

          {/* Evolution API */}
          <div className={`rounded-xl border p-6 ${cardClass}`}>
              <h3 className={`text-lg font-medium mb-4 flex items-center gap-2 ${textPrimary}`}>
                  <Smartphone className="text-green-500" /> Evolution API (WhatsApp)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                      <label className="block text-xs text-slate-400 mb-1">Base URL</label>
                      <input type="text" placeholder="https://api.evolution.com" value={config.evolutionApi.baseUrl} className={`w-full border rounded p-2 ${inputClass}`} />
                  </div>
                  <div>
                      <label className="block text-xs text-slate-400 mb-1">Global API Key</label>
                      <input type="password" value={config.evolutionApi.globalApiKey} className={`w-full border rounded p-2 ${inputClass}`} />
                  </div>
                  <div>
                      <label className="block text-xs text-slate-400 mb-1">Nome da Instância</label>
                      <input type="text" value={config.evolutionApi.instanceName} placeholder="alfred-main" className={`w-full border rounded p-2 ${inputClass}`} />
                  </div>
              </div>
          </div>

          {/* N8N / Webhooks */}
          <div className={`rounded-xl border p-6 ${cardClass}`}>
              <h3 className={`text-lg font-medium mb-4 flex items-center gap-2 ${textPrimary}`}>
                  <Link className="text-blue-500" /> Automação (N8N / Webhook)
              </h3>
              <div>
                  <label className="block text-xs text-slate-400 mb-1">Webhook URL (Receber eventos)</label>
                  <input type="text" value={config.webhookUrl} placeholder="https://n8n.seu-server.com/webhook/..." className={`w-full border rounded p-2 ${inputClass}`} />
              </div>
              <div className="mt-4 flex justify-end">
                   <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-bold text-sm">Salvar Configurações</button>
              </div>
          </div>
      </div>
  );

  const renderPlans = () => (
    <div className="space-y-6 animate-fade-in">
        <div className={`rounded-xl border p-6 ${cardClass}`}>
             <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-medium ${textPrimary}`}>Gerenciar Planos</h3>
                <button onClick={() => { setCurrentPlan({active: true}); setIsPlanModalOpen(true); }} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2"><Plus size={16} /> Novo Plano</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map(plan => (
                    <div key={plan.id} className={`p-4 rounded border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h4 className={`font-bold ${textPrimary}`}>{plan.name}</h4>
                                <span className={`px-2 py-0.5 text-[10px] rounded uppercase ${plan.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>{plan.active ? 'Ativo' : 'Inativo'}</span>
                            </div>
                            <p className="text-gold-500 font-bold text-xl mb-1">R$ {plan.price.toFixed(2)} <span className="text-xs text-slate-500 font-normal">/ {plan.type}</span></p>
                            <p className="text-xs text-slate-400">{plan.trialDays} dias grátis</p>
                        </div>
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-700/50">
                             <button onClick={() => { setCurrentPlan(plan); setIsPlanModalOpen(true); }} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded hover:bg-slate-700"><Edit2 size={16} /></button>
                             <button onClick={() => handleDeletePlan(plan)} className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 rounded hover:bg-slate-700"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="mb-8 border-b border-slate-700 pb-2">
        <h2 className={`text-3xl font-serif ${textPrimary}`}>Gestão do Ecossistema</h2>
        <div className="flex gap-6 mt-6 overflow-x-auto">
            {[
                { id: 'DASHBOARD', icon: LayoutGrid, label: 'Dashboard' },
                { id: 'PLANS', icon: Box, label: 'Planos' },
                { id: 'INTEGRATIONS', icon: Link, label: 'Integrações & IA' },
                { id: 'BILLING', icon: CreditCard, label: 'Financeiro' },
            ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as AdminTab)} className={`pb-3 flex items-center gap-2 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id ? 'border-purple-500 text-purple-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                    <tab.icon size={16} /> {tab.label}
                </button>
            ))}
        </div>
      </header>

      {activeTab === 'DASHBOARD' && renderDashboard()}
      {activeTab === 'PLANS' && renderPlans()}
      {activeTab === 'INTEGRATIONS' && renderIntegrations()}
      {activeTab === 'BILLING' && <div className={`p-8 rounded-xl border text-center ${cardClass} text-slate-500`}>Configurações de Gateway e Cupons.</div>}

      {/* User Management Modal */}
      {manageUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`border rounded-2xl w-full max-w-lg p-8 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-2xl font-serif ${textPrimary}`}>Gestão de Cliente</h3>
                    <button onClick={() => setManageUser(null)}><X className="text-slate-400 hover:text-red-500" /></button>
                </div>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                         <div className={`p-3 rounded border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <p className="text-xs text-slate-500 uppercase">Status</p>
                            <p className={manageUser.active ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{manageUser.active ? 'ATIVO' : 'SUSPENSO'}</p>
                        </div>
                        <div className={`p-3 rounded border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <p className="text-xs text-slate-500 uppercase">Plano Atual</p>
                            <p className={textPrimary}>{manageUser.subscription}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                         <label className="block text-xs text-slate-500 uppercase">Alterar Plano</label>
                         <select 
                            value={manageUser.subscription} 
                            onChange={(e) => handleChangeUserPlan(e.target.value as SubscriptionType)}
                            className={`w-full p-3 rounded border outline-none ${inputClass}`}
                        >
                            <option value={SubscriptionType.MONTHLY}>Mensal</option>
                            <option value={SubscriptionType.QUARTERLY}>Trimestral</option>
                            <option value={SubscriptionType.SEMIANNUAL}>Semestral</option>
                            <option value={SubscriptionType.ANNUAL}>Anual</option>
                         </select>

                         <button 
                            onClick={handleUpdateUserStatus}
                            className={`w-full border py-3 rounded font-bold mt-4 transition-colors ${manageUser.active ? 'border-red-500/50 text-red-500 hover:bg-red-500/10' : 'border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10'}`}
                         >
                            {manageUser.active ? 'Suspender Acesso' : 'Reativar Acesso'}
                         </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`border rounded-xl w-full max-w-md p-6 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-serif ${textPrimary}`}>Novo Cliente</h3>
                    <button onClick={() => setIsAddUserOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                </div>
                <div className="space-y-4">
                    <input type="text" placeholder="Nome Completo" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className={`w-full p-2 border rounded ${inputClass}`} />
                    <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className={`w-full p-2 border rounded ${inputClass}`} />
                    <button onClick={handleCreateUser} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded">Criar Cliente</button>
                </div>
            </div>
        </div>
      )}

      {/* Plan Modal */}
      {isPlanModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`border rounded-xl w-full max-w-md p-6 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-serif ${textPrimary}`}>{currentPlan.id ? 'Editar Plano' : 'Novo Plano'}</h3>
                    <button onClick={() => setIsPlanModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                </div>
                <div className="space-y-4">
                    <input type="text" placeholder="Nome do Plano" value={currentPlan.name} onChange={e => setCurrentPlan({...currentPlan, name: e.target.value})} className={`w-full p-2 border rounded ${inputClass}`} />
                    <div className="grid grid-cols-2 gap-4">
                        <select value={currentPlan.type} onChange={e => setCurrentPlan({...currentPlan, type: e.target.value as any})} className={`w-full p-2 border rounded ${inputClass}`}>
                            <option value="MONTHLY">Mensal</option>
                            <option value="QUARTERLY">Trimestral</option>
                            <option value="SEMIANNUAL">Semestral</option>
                            <option value="ANNUAL">Anual</option>
                        </select>
                        <input type="number" placeholder="Preço (R$)" value={currentPlan.price} onChange={e => setCurrentPlan({...currentPlan, price: e.target.value as any})} className={`w-full p-2 border rounded ${inputClass}`} />
                    </div>
                    <input type="number" placeholder="Dias de Teste" value={currentPlan.trialDays} onChange={e => setCurrentPlan({...currentPlan, trialDays: e.target.value as any})} className={`w-full p-2 border rounded ${inputClass}`} />
                    
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={currentPlan.active} onChange={e => setCurrentPlan({...currentPlan, active: e.target.checked})} />
                        <span className={textSecondary}>Plano Ativo para venda</span>
                    </div>

                    <button onClick={handleSavePlan} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded">Salvar Plano</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};