import React, { useState } from 'react';
import { User, UserRole, SystemConfig, SubscriptionType, Coupon } from '../types';
import { Users, CreditCard, ShieldCheck, Activity, UserPlus, X, Cpu, Link, Palette, LayoutGrid, Save, DollarSign, MessageSquare, Plus, Trash2, Edit2, Check } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  isDarkMode: boolean;
}

type AdminTab = 'DASHBOARD' | 'INTEGRATIONS' | 'BILLING' | 'CUSTOMIZATION';

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [manageUser, setManageUser] = useState<User | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  // Advanced Coupon State
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
      code: '', type: 'PERCENTAGE', value: 0, appliesTo: [SubscriptionType.MONTHLY], active: true
  });

  const [config, setConfig] = useState<SystemConfig>({
      aiProvider: 'GEMINI',
      aiApiKey: 'sk-........................',
      webhookUrl: 'https://n8n.my-server.com/webhook/alfred',
      evolutionApi: { enabled: true, baseUrl: 'https://api.evolution.com', globalApiKey: 'global-key-123', instanceName: 'alfred-main' },
      paymentGateway: 'ASAAS',
      paymentApiKey: '........',
      branding: { primaryColor: '#d97706', secondaryColor: '#1e293b' }
  });

  const cardClass = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const inputClass = isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900';

  const toggleAppliesTo = (sub: SubscriptionType) => {
    const current = newCoupon.appliesTo || [];
    if (current.includes(sub)) setNewCoupon({ ...newCoupon, appliesTo: current.filter(s => s !== sub) });
    else setNewCoupon({ ...newCoupon, appliesTo: [...current, sub] });
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border flex items-center gap-4 ${cardClass}`}>
                <div className="p-3 bg-blue-500/10 rounded-full text-blue-400"><Users size={20} /></div>
                <div><p className="text-xs text-slate-400">Usuários</p><p className={`text-xl font-bold ${textPrimary}`}>{users.length}</p></div>
            </div>
            <div className={`p-4 rounded-lg border flex items-center gap-4 ${cardClass}`}>
                <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400"><DollarSign size={20} /></div>
                <div><p className="text-xs text-slate-400">MRR</p><p className={`text-xl font-bold ${textPrimary}`}>R$ 4.250</p></div>
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

  const renderBilling = () => (
      <div className="space-y-6 animate-fade-in">
          <div className={`rounded-xl border p-6 ${cardClass}`}>
              <h3 className={`text-lg font-medium mb-4 flex items-center gap-2 ${textPrimary}`}><DollarSign className="text-emerald-500" /> Gateway</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <select className={`border rounded p-2 ${inputClass}`}><option>Asaas</option></select>
                  <input type="password" placeholder="API Key" className={`border rounded p-2 ${inputClass}`} />
              </div>
          </div>

          <div className={`rounded-xl border p-6 ${cardClass}`}>
              <h3 className={`text-lg font-medium mb-4 ${textPrimary}`}>Cupons Disponíveis</h3>
              <div className="space-y-4">
                  <button onClick={() => setIsCouponModalOpen(true)} className="bg-gold-600 text-slate-900 px-4 py-2 rounded font-bold text-sm flex items-center gap-2"><Plus size={16} /> Criar Novo Cupom</button>
                  <div className={`p-4 border rounded ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                      <p className={textPrimary}>WELCOME20 (20% OFF)</p>
                      <p className="text-xs text-slate-500">Válido para: Mensal, Anual</p>
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
            {['DASHBOARD', 'INTEGRATIONS', 'BILLING', 'CUSTOMIZATION'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as AdminTab)} className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-purple-500 text-purple-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{tab}</button>
            ))}
        </div>
      </header>

      {activeTab === 'DASHBOARD' && renderDashboard()}
      {activeTab === 'BILLING' && renderBilling()}
      {activeTab === 'INTEGRATIONS' && <div className="p-8 text-center text-slate-500">Configurações de IA e Evolution API disponíveis em produção.</div>}
      {activeTab === 'CUSTOMIZATION' && <div className="p-8 text-center text-slate-500">Temas e Logos disponíveis em produção.</div>}

      {/* Manage User Modal - FIXED */}
      {manageUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`border rounded-2xl w-full max-w-lg p-8 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-2xl font-serif ${textPrimary}`}>Gestão de Cliente</h3>
                    <button onClick={() => setManageUser(null)}><X className="text-slate-400 hover:text-red-500" /></button>
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <p className="text-xs text-slate-500 uppercase">Status</p>
                            <p className={manageUser.active ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{manageUser.active ? 'ATIVO' : 'INATIVO'}</p>
                        </div>
                        <div className={`p-4 rounded border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <p className="text-xs text-slate-500 uppercase">Role</p>
                            <p className={textPrimary}>{manageUser.role}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <button className="w-full bg-slate-700 py-3 rounded font-bold text-white hover:bg-slate-600">Alterar Plano</button>
                        <button className="w-full border border-red-500/50 text-red-500 py-3 rounded font-bold hover:bg-red-500/10">Suspender Acesso</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Coupon Modal - FIXED ADVANCED */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`border rounded-2xl w-full max-w-md p-8 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-serif ${textPrimary}`}>Configurar Cupom</h3>
                    <button onClick={() => setIsCouponModalOpen(false)}><X className="text-slate-400 hover:text-red-500" /></button>
                </div>
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs text-slate-500 uppercase mb-1">Código</label>
                        <input type="text" placeholder="EX: NATAL20" className={`w-full p-3 rounded border uppercase focus:border-gold-500 outline-none ${inputClass}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Tipo</label>
                            <select value={newCoupon.type} onChange={e => setNewCoupon({...newCoupon, type: e.target.value as any})} className={`w-full p-3 rounded border outline-none ${inputClass}`}>
                                <option value="PERCENTAGE">Porcentagem (%)</option>
                                <option value="FIXED">Valor Fixo (R$)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase mb-1">Valor</label>
                            <input type="number" className={`w-full p-3 rounded border outline-none ${inputClass}`} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 uppercase mb-3">Aplicar em:</label>
                        <div className="space-y-2">
                            {[SubscriptionType.MONTHLY, SubscriptionType.SEMIANNUAL, SubscriptionType.ANNUAL].map(sub => (
                                <button key={sub} onClick={() => toggleAppliesTo(sub)} className={`w-full p-3 rounded border flex justify-between items-center ${newCoupon.appliesTo?.includes(sub) ? 'border-gold-500 bg-gold-500/10' : 'border-slate-700'}`}>
                                    <span className={textPrimary}>{sub}</span>
                                    {newCoupon.appliesTo?.includes(sub) && <Check size={16} className="text-gold-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => setIsCouponModalOpen(false)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg mt-4">Ativar Cupom</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};