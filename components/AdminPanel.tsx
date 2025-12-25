import React, { useState } from 'react';
import { User, UserRole, SystemConfig, SubscriptionType, Plan, Tutorial, Announcement } from '../types';
import { Users, CreditCard, UserPlus, X, Cpu, Link, Palette, LayoutGrid, Save, DollarSign, Plus, Trash2, Edit2, PlayCircle, Megaphone, Smartphone, Box, Percent, QrCode, FileText, Globe, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

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

type AdminTab = 'DASHBOARD' | 'INTEGRATIONS' | 'PLANS' | 'BILLING' | 'TUTORIALS' | 'INFORMATICS';
type SortField = 'expiry' | 'value' | 'status' | 'name';

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, plans, tutorials, isDarkMode, onUpdateUser, onAddUser, onManagePlan, onManageTutorial, onAddAnnouncement }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  
  // User Table State
  const [sortField, setSortField] = useState<SortField>('expiry');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [manageUser, setManageUser] = useState<User | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [isInformaticsModalOpen, setIsInformaticsModalOpen] = useState(false);

  // Forms
  const [newUser, setNewUser] = useState<Partial<User>>({ name: '', email: '', active: true, role: UserRole.USER });
  const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({ name: '', price: 0, trialDays: 15, active: true, type: SubscriptionType.MONTHLY });
  const [newTutorial, setNewTutorial] = useState<Partial<Tutorial>>({ title: '', videoUrl: '', description: '' });
  const [newAnnouncement, setNewAnnouncement] = useState<Partial<Announcement>>({ title: '', message: '', isPopup: false, imageUrl: '', videoUrl: '' });

  // Config State
  const [config, setConfig] = useState<SystemConfig>({
      timezone: 'America/Sao_Paulo',
      aiProvider: 'GEMINI',
      aiKeys: { gemini: '', openai: '', anthropic: '' },
      webhookUrl: '',
      evolutionApi: { enabled: true, baseUrl: '', globalApiKey: '', instanceName: '' },
      paymentGateway: {
          provider: 'PAGSEGURO',
          email: '',
          token: '',
          sandbox: true,
          rates: { creditCard: 4.99, creditCardInstallment: 2.99, pix: 0.99, boleto: 3.50 }
      },
      paymentApiKey: '',
      branding: { primaryColor: '#d97706', secondaryColor: '#1e293b' }
  });

  const cardClass = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const inputClass = isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900';

  // --- Handlers ---
  const handleSort = (field: SortField) => {
      if (sortField === field) {
          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
          setSortField(field);
          setSortOrder('asc');
      }
  };

  const getSortedUsers = () => {
      return [...users].sort((a, b) => {
          let valA: any = a[fieldToKey(sortField)];
          let valB: any = b[fieldToKey(sortField)];

          // Custom Logic for 'value' (plan price)
          if (sortField === 'value') {
               const planA = plans.find(p => p.type === a.subscription);
               const planB = plans.find(p => p.type === b.subscription);
               valA = planA ? planA.price : 0;
               valB = planB ? planB.price : 0;
          }
          // Custom Logic for 'expiry'
          if (sortField === 'expiry') {
              valA = a.trialEndsAt ? new Date(a.trialEndsAt).getTime() : 0;
              valB = b.trialEndsAt ? new Date(b.trialEndsAt).getTime() : 0;
          }

          if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
      });
  };

  const fieldToKey = (field: SortField): keyof User | string => {
      switch(field) {
          case 'name': return 'name';
          case 'status': return 'active';
          default: return 'name';
      }
  };

  const handleSavePlan = () => {
      if (!currentPlan.name || !currentPlan.price) return;
      onManagePlan({
          id: currentPlan.id || Date.now().toString(),
          name: currentPlan.name,
          type: currentPlan.type || SubscriptionType.MONTHLY,
          price: Number(currentPlan.price),
          trialDays: Number(currentPlan.trialDays),
          active: currentPlan.active ?? true
      }, currentPlan.id ? 'UPDATE' : 'CREATE');
      setIsPlanModalOpen(false);
      setCurrentPlan({ name: '', price: 0, trialDays: 15, active: true });
  };

  const handleDeletePlan = (plan: Plan) => {
      if(window.confirm(`Tem certeza que deseja excluir o plano ${plan.name}?`)) {
          onManagePlan(plan, 'DELETE');
      }
  };

  const handleCreateTutorial = () => {
      if(!newTutorial.title || !newTutorial.videoUrl) return;
      onManageTutorial({
          id: Date.now().toString(),
          title: newTutorial.title,
          videoUrl: newTutorial.videoUrl,
          description: newTutorial.description || ''
      }, 'CREATE');
      setIsTutorialModalOpen(false);
      setNewTutorial({title: '', videoUrl: '', description: ''});
  };

  const handleCreateAnnouncement = () => {
      if(!newAnnouncement.title || !newAnnouncement.message) return;
      onAddAnnouncement({
          id: Date.now().toString(),
          title: newAnnouncement.title,
          message: newAnnouncement.message,
          imageUrl: newAnnouncement.imageUrl,
          videoUrl: newAnnouncement.videoUrl,
          isPopup: newAnnouncement.isPopup || false,
          date: new Date().toISOString()
      });
      setIsInformaticsModalOpen(false);
      setNewAnnouncement({title: '', message: '', isPopup: false, imageUrl: '', videoUrl: ''});
  };

  const calculateMetrics = (type: SubscriptionType) => {
      const filtered = users.filter(u => u.subscription === type);
      const count = filtered.length;
      const plan = plans.find(p => p.type === type);
      const price = plan ? plan.price : 0;
      return { count, total: count * price };
  };

  const metricsMonthly = calculateMetrics(SubscriptionType.MONTHLY);
  const metricsQuarterly = calculateMetrics(SubscriptionType.QUARTERLY);
  const metricsSemiannual = calculateMetrics(SubscriptionType.SEMIANNUAL);
  const metricsAnnual = calculateMetrics(SubscriptionType.ANNUAL);

  // Pagination Logic
  const sortedUsers = getSortedUsers();
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
        {/* Subscription Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[metricsMonthly, metricsQuarterly, metricsSemiannual, metricsAnnual].map((m, i) => (
                <div key={i} className={`p-4 rounded-lg border ${cardClass}`}>
                    <p className="text-xs text-slate-500 uppercase mb-1">{i === 0 ? 'Mensal' : i === 1 ? 'Trimestral' : i === 2 ? 'Semestral' : 'Anual'}</p>
                    <div className="flex justify-between items-end">
                        <span className={`text-2xl font-bold ${textPrimary}`}>{m.count}x</span>
                        <span className="text-emerald-500 font-bold">R$ {m.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                </div>
            ))}
        </div>

        <div className={`rounded-xl border overflow-hidden ${cardClass}`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <h3 className={`text-lg font-medium ${textPrimary}`}>Clientes Ativos ({users.length})</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Ordenar por:</span>
                        <select 
                            value={sortField} 
                            onChange={(e) => handleSort(e.target.value as SortField)}
                            className={`bg-transparent border rounded p-1 ${isDarkMode ? 'border-slate-600 text-white' : 'border-slate-300'}`}
                        >
                            <option value="expiry">Vencimento</option>
                            <option value="value">Valor Plano</option>
                            <option value="status">Status</option>
                            <option value="name">Nome</option>
                        </select>
                        <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="p-1 hover:text-white"><ArrowUpDown size={14} /></button>
                    </div>
                    <button onClick={() => setIsAddUserOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2"><Plus size={16} /> Novo Cliente</button>
                </div>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className={`uppercase text-xs ${isDarkMode ? 'bg-slate-900/50 text-slate-200' : 'bg-slate-50 text-slate-600'}`}>
                <tr>
                    <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>Cliente</th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('value')}>Plano</th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('expiry')}>Vencimento</th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-200'}`}>
                {paginatedUsers.map(user => {
                    const daysLeft = user.trialEndsAt ? Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 3600 * 24)) : 0;
                    return (
                    <tr key={user.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-700/20' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4">
                            <div className={textPrimary}>{user.name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gold-500">{user.subscription}</td>
                        <td className="px-6 py-4">
                            <span className={`${daysLeft <= 5 ? 'text-red-500 font-bold' : ''}`}>
                                {new Date(user.trialEndsAt || '').toLocaleDateString()}
                                {daysLeft <= 5 && <span className="text-[10px] ml-1 bg-red-500/10 px-1 rounded">VENCE LOGO</span>}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded text-[10px] font-bold ${user.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                 {user.active ? 'ATIVO' : 'SUSPENSO'}
                             </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button onClick={() => setManageUser(user)} className="text-purple-400 hover:text-purple-300 font-bold">GERENCIAR</button>
                        </td>
                    </tr>
                )})}
                </tbody>
            </table>
            </div>
            {totalPages > 1 && (
                <div className={`p-4 border-t flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 disabled:opacity-50 hover:text-white"><ChevronLeft /></button>
                    <span className="text-sm">Página {currentPage} de {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 disabled:opacity-50 hover:text-white"><ChevronRight /></button>
                </div>
            )}
        </div>
    </div>
  );

  const renderIntegrations = () => (
      <div className="space-y-6 animate-fade-in">
          {/* General System Config */}
          <div className={`rounded-xl border p-6 ${cardClass}`}>
              <h3 className={`text-lg font-medium mb-4 flex items-center gap-2 ${textPrimary}`}>
                  <Globe className="text-blue-500" /> Configurações Gerais
              </h3>
              <div>
                  <label className="block text-xs text-slate-400 mb-1">Timezone do Sistema</label>
                  <select 
                    value={config.timezone} 
                    onChange={e => setConfig({...config, timezone: e.target.value})}
                    className={`w-full border rounded p-2 ${inputClass}`}
                  >
                      <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                      <option value="America/Manaus">Manaus (GMT-4)</option>
                      <option value="America/Noronha">Fernando de Noronha (GMT-2)</option>
                      <option value="UTC">UTC</option>
                  </select>
              </div>
          </div>

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
                { id: 'BILLING', icon: CreditCard, label: 'Financeiro' },
                { id: 'INTEGRATIONS', icon: Link, label: 'Integrações & Config' },
                { id: 'TUTORIALS', icon: PlayCircle, label: 'Tutoriais' },
                { id: 'INFORMATICS', icon: Megaphone, label: 'Informativos' },
            ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as AdminTab)} className={`pb-3 flex items-center gap-2 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id ? 'border-purple-500 text-purple-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                    <tab.icon size={16} /> {tab.label}
                </button>
            ))}
        </div>
      </header>

      {activeTab === 'DASHBOARD' && renderDashboard()}
      {activeTab === 'PLANS' && <div className="space-y-6 animate-fade-in"><div className={`rounded-xl border p-6 ${cardClass}`}> <div className="flex justify-between items-center mb-6"><h3 className={`text-lg font-medium ${textPrimary}`}>Gerenciar Planos</h3><button onClick={() => { setCurrentPlan({active: true}); setIsPlanModalOpen(true); }} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2"><Plus size={16} /> Novo Plano</button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{plans.map(plan => (<div key={plan.id} className={`p-4 rounded border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}><div><div className="flex justify-between items-start mb-2"><h4 className={`font-bold ${textPrimary}`}>{plan.name}</h4><span className={`px-2 py-0.5 text-[10px] rounded uppercase ${plan.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>{plan.active ? 'Ativo' : 'Inativo'}</span></div><p className="text-gold-500 font-bold text-xl mb-1">R$ {plan.price.toFixed(2)} <span className="text-xs text-slate-500 font-normal">/ {plan.type}</span></p><p className="text-xs text-slate-400">{plan.trialDays} dias grátis</p></div><div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-700/50"><button onClick={() => { setCurrentPlan(plan); setIsPlanModalOpen(true); }} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded hover:bg-slate-700"><Edit2 size={16} /></button><button onClick={() => handleDeletePlan(plan)} className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 rounded hover:bg-slate-700"><Trash2 size={16} /></button></div></div>))}</div></div></div>}
      {activeTab === 'BILLING' && <div className="space-y-6 animate-fade-in"><div className={`rounded-xl border p-6 ${cardClass}`}><h3 className={`text-lg font-medium mb-4 flex items-center gap-2 ${textPrimary}`}><DollarSign className="text-emerald-500" /> Configuração PagSeguro</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs text-slate-400 mb-1">Email da Conta</label><input type="email" value={config.paymentGateway.email} onChange={e => setConfig({...config, paymentGateway: {...config.paymentGateway, email: e.target.value}})} className={`w-full border rounded p-2 ${inputClass}`} /></div><div><label className="block text-xs text-slate-400 mb-1">Token de Acesso</label><input type="password" value={config.paymentGateway.token} onChange={e => setConfig({...config, paymentGateway: {...config.paymentGateway, token: e.target.value}})} className={`w-full border rounded p-2 ${inputClass}`} /></div></div><div className="mt-4 flex items-center gap-2"><input type="checkbox" checked={config.paymentGateway.sandbox} onChange={e => setConfig({...config, paymentGateway: {...config.paymentGateway, sandbox: e.target.checked}})} /><span className={textPrimary}>Modo Sandbox (Testes)</span></div></div></div>}
      {activeTab === 'INTEGRATIONS' && renderIntegrations()}
      {activeTab === 'TUTORIALS' && <div className="space-y-6 animate-fade-in"><div className={`rounded-xl border p-6 ${cardClass}`}><div className="flex justify-between items-center mb-6"><h3 className={`text-lg font-medium ${textPrimary}`}>Vídeos Tutoriais</h3><button onClick={() => setIsTutorialModalOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2"><Plus size={16} /> Novo Vídeo</button></div><div className="space-y-4">{tutorials.map(tut => (<div key={tut.id} className={`p-4 rounded border flex items-center justify-between ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}><div className="flex items-center gap-4"><PlayCircle size={32} className="text-purple-500" /><div><p className={`font-medium ${textPrimary}`}>{tut.title}</p><p className="text-xs text-slate-500 truncate max-w-md">{tut.videoUrl}</p></div></div><button onClick={() => onManageTutorial(tut, 'DELETE')} className="text-slate-500 hover:text-red-400"><Trash2 size={18} /></button></div>))}</div></div></div>}
      
      {activeTab === 'INFORMATICS' && (
           <div className="space-y-6 animate-fade-in">
              <div className={`rounded-xl border p-6 ${cardClass}`}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-lg font-medium ${textPrimary}`}>Informativos Globais</h3>
                      <button onClick={() => setIsInformaticsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2"><Plus size={16} /> Criar Comunicado</button>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">Gerencie os comunicados que aparecem para todos os usuários.</p>
                  
                  {/* List of current announcements would go here (omitted for brevity based on context, focusing on creation) */}
              </div>
          </div>
      )}

      {/* Tutorial Modal */}
      {isTutorialModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className={`border rounded-xl w-full max-w-md p-6 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-xl font-serif ${textPrimary}`}>Novo Tutorial</h3>
                      <button onClick={() => setIsTutorialModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                  </div>
                  <div className="space-y-4">
                      <input type="text" placeholder="Título do Vídeo" value={newTutorial.title} onChange={e => setNewTutorial({...newTutorial, title: e.target.value})} className={`w-full p-2 border rounded ${inputClass}`} />
                      <input type="text" placeholder="URL do Vídeo (YouTube Embed)" value={newTutorial.videoUrl} onChange={e => setNewTutorial({...newTutorial, videoUrl: e.target.value})} className={`w-full p-2 border rounded ${inputClass}`} />
                      <textarea placeholder="Descrição" value={newTutorial.description} onChange={e => setNewTutorial({...newTutorial, description: e.target.value})} className={`w-full p-2 border rounded ${inputClass}`} />
                      <button onClick={handleCreateTutorial} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded">Cadastrar</button>
                  </div>
              </div>
          </div>
      )}

      {/* Announcement Modal */}
      {isInformaticsModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className={`border rounded-xl w-full max-w-md p-6 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-xl font-serif ${textPrimary}`}>Novo Informativo</h3>
                      <button onClick={() => setIsInformaticsModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                  </div>
                  <div className="space-y-4">
                      <input type="text" placeholder="Título" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} className={`w-full p-2 border rounded ${inputClass}`} />
                      <textarea placeholder="Mensagem" value={newAnnouncement.message} onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})} className={`w-full p-2 border rounded h-32 ${inputClass}`} />
                      
                      <div>
                          <label className="block text-xs text-slate-400 mb-1">URL da Imagem (Opcional)</label>
                          <input type="text" placeholder="https://..." value={newAnnouncement.imageUrl} onChange={e => setNewAnnouncement({...newAnnouncement, imageUrl: e.target.value})} className={`w-full p-2 border rounded ${inputClass}`} />
                      </div>
                      
                      <div>
                          <label className="block text-xs text-slate-400 mb-1">URL do Vídeo YouTube (Opcional)</label>
                          <input type="text" placeholder="https://youtube.com/embed/..." value={newAnnouncement.videoUrl} onChange={e => setNewAnnouncement({...newAnnouncement, videoUrl: e.target.value})} className={`w-full p-2 border rounded ${inputClass}`} />
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded border border-slate-700 bg-slate-800/50">
                          <input 
                            type="checkbox" 
                            checked={newAnnouncement.isPopup} 
                            onChange={e => setNewAnnouncement({...newAnnouncement, isPopup: e.target.checked})} 
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                              <span className={`block text-sm font-medium ${textPrimary}`}>Exibir como Pop-up</span>
                              <span className="text-xs text-slate-400">Aparecerá automaticamente ao entrar.</span>
                          </div>
                      </div>

                      <button onClick={handleCreateAnnouncement} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded">Enviar para Todos</button>
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