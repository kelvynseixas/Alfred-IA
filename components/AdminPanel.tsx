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
  
  // Forms States
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', isTestUser: false });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userEditForm, setUserEditForm] = useState({ password: '', trialDaysToAdd: 0 });
  const [newCoupon, setNewCoupon] = useState({ code: '', value: 0, type: 'PERCENTAGE', appliesTo: [] as string[] });
  const [newTutorial, setNewTutorial] = useState({ title: '', description: '', videoUrl: '' });
  
  // Feedback
  const [loading, setLoading] = useState(false);

  // --- Handlers ---
  const handleCreateUser = async () => {
      setLoading(true);
      await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` },
          body: JSON.stringify(newUser)
      });
      setNewUser({ name: '', email: '', password: '', isTestUser: false });
      onAddUser();
      setLoading(false);
  };

  const handleUpdateUser = async (id: string, active?: boolean) => {
      const body: any = {};
      if (active !== undefined) body.active = active;
      if (userEditForm.password) body.password = userEditForm.password;
      if (userEditForm.trialDaysToAdd) body.trialDaysToAdd = userEditForm.trialDaysToAdd;

      await fetch(`/api/admin/users/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` },
          body: JSON.stringify(body)
      });
      setEditingUser(null);
      setUserEditForm({ password: '', trialDaysToAdd: 0 });
      onUpdateUser();
  };

  const handleUpdatePlan = async (id: string, price: number, trialDays: number) => {
      await fetch('/api/admin/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` },
          body: JSON.stringify({ id, price, trialDays })
      });
      onManagePlan();
  };

  const handleCreateCoupon = async () => {
      await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` },
          body: JSON.stringify(newCoupon)
      });
      onManagePlan(); // Refresh data
  };

  const handleCreateTutorial = async () => {
      await fetch('/api/admin/tutorials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` },
          body: JSON.stringify(newTutorial)
      });
      onManageTutorial();
  };

  const tabClass = (tab: string) => `pb-2 px-1 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`;
  const inputClass = `w-full border rounded p-2 text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`;

  return (
    <div className="animate-fade-in pb-12">
      <header className="mb-8 border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-serif font-bold text-white mb-4">Painel Master</h2>
            <div className="flex gap-4 overflow-x-auto">
                <button onClick={() => setActiveTab('DASHBOARD')} className={tabClass('DASHBOARD')}>Dashboard</button>
                <button onClick={() => setActiveTab('USERS')} className={tabClass('USERS')}>Clientes</button>
                <button onClick={() => setActiveTab('PLANS')} className={tabClass('PLANS')}>Planos</button>
                <button onClick={() => setActiveTab('COUPONS')} className={tabClass('COUPONS')}>Cupons</button>
                <button onClick={() => setActiveTab('TUTORIALS')} className={tabClass('TUTORIALS')}>Tutoriais</button>
            </div>
      </header>

      {/* USERS TAB */}
      {activeTab === 'USERS' && (
           <div className="space-y-6">
               {/* Create User Box */}
               <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><UserPlus size={20} className="text-emerald-500" /> Criar Novo Cliente</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                       <input placeholder="Nome" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className={inputClass} />
                       <input placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className={inputClass} />
                       <input placeholder="Senha" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className={inputClass} />
                       <div className="flex items-center gap-2 h-10">
                           <input type="checkbox" checked={newUser.isTestUser} onChange={e => setNewUser({...newUser, isTestUser: e.target.checked})} />
                           <span className="text-slate-300 text-sm">Cliente Teste (Grátis)</span>
                       </div>
                       <button onClick={handleCreateUser} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded text-sm font-bold">
                           {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Criar Cliente'}
                       </button>
                   </div>
               </div>

               {/* Users List */}
               <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                   <table className="w-full text-left text-sm text-slate-400">
                       <thead className="text-xs uppercase bg-slate-800 text-slate-300">
                           <tr>
                               <th className="p-3">Cliente</th>
                               <th className="p-3">Plano</th>
                               <th className="p-3">Vencimento</th>
                               <th className="p-3">Status</th>
                               <th className="p-3 text-right">Ações</th>
                           </tr>
                       </thead>
                       <tbody>
                           {users.map(u => (
                               <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                                   <td className="p-3">
                                       <p className="text-white font-medium">{u.name} {u.isTestUser && <span className="text-xs bg-blue-600 px-1 rounded ml-2">TESTE</span>}</p>
                                       <p className="text-xs">{u.email}</p>
                                   </td>
                                   <td className="p-3">{u.subscription}</td>
                                   <td className="p-3 text-gold-500">{u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleDateString() : '-'}</td>
                                   <td className="p-3">
                                       <button 
                                            onClick={() => handleUpdateUser(u.id, !u.active)}
                                            className={`px-2 py-1 rounded text-xs font-bold ${u.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}
                                       >
                                           {u.active ? 'ATIVO' : 'SUSPENSO'}
                                       </button>
                                   </td>
                                   <td className="p-3 text-right">
                                       <button onClick={() => setEditingUser(u)} className="text-slate-400 hover:text-white p-1 bg-slate-800 rounded"><Edit size={16}/></button>
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
               
               {/* Edit Modal */}
               {editingUser && (
                   <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                       <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                           <h3 className="text-white text-lg font-bold mb-4">Gerenciar: {editingUser.name}</h3>
                           <div className="space-y-4">
                               <div>
                                   <label className="text-xs text-slate-400">Alterar Senha</label>
                                   <input type="text" placeholder="Nova senha..." value={userEditForm.password} onChange={e => setUserEditForm({...userEditForm, password: e.target.value})} className={inputClass} />
                               </div>
                               <div>
                                   <label className="text-xs text-slate-400">Adicionar Dias de Acesso</label>
                                   <div className="flex gap-2">
                                       <button onClick={() => setUserEditForm({...userEditForm, trialDaysToAdd: 7})} className="bg-slate-800 text-white px-3 py-1 rounded text-xs">+7d</button>
                                       <button onClick={() => setUserEditForm({...userEditForm, trialDaysToAdd: 30})} className="bg-slate-800 text-white px-3 py-1 rounded text-xs">+30d</button>
                                       <input type="number" placeholder="Custom" onChange={e => setUserEditForm({...userEditForm, trialDaysToAdd: Number(e.target.value)})} className="w-20 bg-slate-800 border-none text-white text-xs px-2 rounded" />
                                   </div>
                               </div>
                               <button onClick={() => handleUpdateUser(editingUser.id)} className="w-full bg-gold-600 text-white font-bold py-2 rounded">Salvar Alterações</button>
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
                  const label = type === 'MONTHLY' ? 'Mensal' : type === 'SEMIANNUAL' ? 'Semestral' : 'Anual';
                  
                  return (
                    <div key={type} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4">{label}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400">Preço (R$)</label>
                                <input 
                                    type="number" step="0.01"
                                    defaultValue={plan.price}
                                    onBlur={(e) => handleUpdatePlan(plan.id, Number(e.target.value), plan.trialDays)}
                                    className={inputClass} 
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Dias de Teste Grátis</label>
                                <input 
                                    type="number"
                                    defaultValue={plan.trialDays}
                                    onBlur={(e) => handleUpdatePlan(plan.id, plan.price, Number(e.target.value))}
                                    className={inputClass} 
                                />
                            </div>
                            <p className="text-xs text-emerald-500">Alterações salvas ao sair do campo.</p>
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
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                       <input placeholder="CÓDIGO (ex: ALFRED10)" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} className={inputClass} />
                       <select value={newCoupon.type} onChange={e => setNewCoupon({...newCoupon, type: e.target.value as any})} className={inputClass}>
                           <option value="PERCENTAGE">Porcentagem (%)</option>
                           <option value="FIXED">Valor Fixo (R$)</option>
                       </select>
                       <input type="number" placeholder="Valor" value={newCoupon.value} onChange={e => setNewCoupon({...newCoupon, value: Number(e.target.value)})} className={inputClass} />
                       <button onClick={handleCreateCoupon} className="bg-gold-600 hover:bg-gold-500 text-white p-2 rounded text-sm font-bold">Criar</button>
                   </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {coupons?.map(c => (
                       <div key={c.id} className="bg-slate-800 border border-slate-700 p-4 rounded-lg flex justify-between items-center">
                           <div>
                               <p className="text-white font-bold">{c.code}</p>
                               <p className="text-xs text-slate-400">{c.type === 'PERCENTAGE' ? `${c.value}% OFF` : `R$ ${c.value} OFF`}</p>
                           </div>
                           <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded">ATIVO</span>
                       </div>
                   ))}
               </div>
          </div>
      )}

       {/* TUTORIALS TAB */}
       {activeTab === 'TUTORIALS' && (
          <div className="space-y-6">
               <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><PlayCircle size={20} className="text-blue-500" /> Adicionar Tutorial</h3>
                   <div className="space-y-4">
                       <input placeholder="Título do Vídeo" value={newTutorial.title} onChange={e => setNewTutorial({...newTutorial, title: e.target.value})} className={inputClass} />
                       <input placeholder="Descrição Curta" value={newTutorial.description} onChange={e => setNewTutorial({...newTutorial, description: e.target.value})} className={inputClass} />
                       <input placeholder="URL de Embed (YouTube/Vimeo)" value={newTutorial.videoUrl} onChange={e => setNewTutorial({...newTutorial, videoUrl: e.target.value})} className={inputClass} />
                       <button onClick={handleCreateTutorial} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded text-sm font-bold w-full">Adicionar</button>
                   </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {tutorials?.map(t => (
                       <div key={t.id} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                           <div className="aspect-video bg-black">
                               <iframe src={t.videoUrl} className="w-full h-full" />
                           </div>
                           <div className="p-3">
                               <p className="text-white font-medium truncate">{t.title}</p>
                           </div>
                       </div>
                   ))}
               </div>
          </div>
      )}
    </div>
  );
};