import React, { useState } from 'react';
import { User, UserRole, SubscriptionType } from '../types';
import { User as UserIcon, Mail, Shield, Key, CreditCard, Phone, Users, Plus, Trash2, Smartphone, Camera, Lock, Eye, EyeOff } from 'lucide-react';

interface UserProfileProps {
  user: User;
  isDarkMode: boolean;
  onUpdateUser: (u: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, isDarkMode, onUpdateUser }) => {
  const [newDependent, setNewDependent] = useState({ name: '', relation: '', email: '', phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  
  // Dependent restriction
  const isDependent = user.role === UserRole.DEPENDENT;

  const handleAddDependent = () => {
      if(isDependent) return;
      if(!newDependent.name || !newDependent.email) return;
      const updatedUser = {
          ...user,
          dependents: [...(user.dependents || []), { 
              id: Date.now().toString(), 
              name: newDependent.name, 
              relation: newDependent.relation,
              email: newDependent.email,
              phone: newDependent.phone,
              accessLevel: 'VIEW' as any 
          }]
      };
      onUpdateUser(updatedUser);
      setNewDependent({ name: '', relation: '', email: '', phone: '', password: '' });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const url = URL.createObjectURL(e.target.files[0]);
        onUpdateUser({ ...user, avatarUrl: url });
    }
  };

  const cardClass = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const inputClass = isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <header className={`mb-8 border-b pb-6 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <h2 className={`text-3xl font-serif ${textPrimary}`}>Meu Perfil</h2>
        <p className="text-slate-400">Gerencie seus dados e acesso</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
            <div className={`rounded-xl border p-6 flex flex-col items-center text-center ${cardClass}`}>
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-slate-700 border-2 border-gold-500 flex items-center justify-center mb-4 overflow-hidden">
                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-4xl font-serif text-white">{user.name.charAt(0)}</span>}
                    </div>
                    <label className="absolute bottom-4 right-0 p-2 bg-gold-600 rounded-full cursor-pointer shadow-lg hover:bg-gold-500 transition-colors">
                        <Camera size={16} className="text-slate-900" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </label>
                </div>
                <h3 className={`text-xl font-medium ${textPrimary}`}>{user.name}</h3>
                <p className="text-slate-400 text-sm mb-4 uppercase font-bold tracking-widest">{user.role}</p>
                
                {user.trialEndsAt && (
                   <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold border border-emerald-500/20 uppercase">
                      Teste até {new Date(user.trialEndsAt).toLocaleDateString()}
                   </div>
                )}
            </div>

            {!isDependent && (
               <div className={`rounded-xl border p-6 ${cardClass}`}>
                <h4 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Assinatura</h4>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Ciclo</span>
                        <span className="text-gold-400 font-bold">{user.subscription || 'TRIAL'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Status</span>
                        <span className={user.active ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                            {user.active ? 'ATIVO' : 'SUSPENSO'}
                        </span>
                    </div>
                </div>
            </div>
            )}
        </div>

        <div className="md:col-span-2 space-y-6">
            <div className={`rounded-xl border p-8 ${cardClass}`}>
                <h3 className={`text-lg font-medium mb-6 flex items-center gap-2 ${textPrimary}`}>
                    <UserIcon className="w-5 h-5 text-gold-500" /> Dados Pessoais
                </h3>
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Nome Completo</label>
                        <input disabled={isDependent} type="text" defaultValue={user.name} className={`w-full border rounded p-2.5 focus:border-gold-500 focus:outline-none ${inputClass}`} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Email</label>
                            <input disabled={isDependent} type="email" defaultValue={user.email} className={`w-full border rounded p-2.5 focus:border-gold-500 focus:outline-none ${inputClass}`} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Telefone</label>
                            <input disabled={isDependent} type="tel" defaultValue={user.phone} className={`w-full border rounded p-2.5 focus:border-gold-500 focus:outline-none ${inputClass}`} />
                        </div>
                    </div>
                </div>
                {!isDependent && (
                  <div className="mt-6 flex justify-end">
                      <button className="bg-gold-600 hover:bg-gold-500 text-slate-900 px-6 py-2 rounded font-bold transition-colors">Salvar Alterações</button>
                  </div>
                )}
            </div>

            {/* Password Change - Accessible only for User/Admin */}
            {!isDependent && (
              <div className={`rounded-xl border p-8 ${cardClass}`}>
                  <h3 className={`text-lg font-medium mb-6 flex items-center gap-2 ${textPrimary}`}>
                      <Lock className="w-5 h-5 text-gold-500" /> Alterar Senha
                  </h3>
                  <div className="space-y-4">
                      <div className="relative">
                          <label className="block text-xs text-slate-400 mb-1">Nova Senha</label>
                          <input type={showPass ? "text" : "password"} className={`w-full border rounded p-2.5 focus:border-gold-500 focus:outline-none ${inputClass}`} />
                          <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-8 text-slate-500">
                              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                      </div>
                      <button className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded font-medium transition-colors">Atualizar Senha</button>
                  </div>
              </div>
            )}

            {/* Dependents - Restricted to USER/ADMIN */}
            {!isDependent && (
              <div className={`rounded-xl border p-8 ${cardClass}`}>
                  <h3 className={`text-lg font-medium mb-6 flex items-center gap-2 ${textPrimary}`}>
                      <Users className="w-5 h-5 text-gold-500" /> Controle Familiar
                  </h3>
                  
                  <div className="space-y-4 mb-6">
                      {user.dependents && user.dependents.length > 0 ? (
                          user.dependents.map(dep => (
                              <div key={dep.id} className={`flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                  <div>
                                      <p className={`font-medium ${textPrimary}`}>{dep.name} <span className="text-xs text-slate-500">({dep.relation})</span></p>
                                      <p className="text-xs text-slate-500">{dep.email} • {dep.phone}</p>
                                  </div>
                                  <button className="text-slate-500 hover:text-red-400 mt-2 md:mt-0"><Trash2 size={16} /></button>
                              </div>
                          ))
                      ) : <p className="text-sm text-slate-500 italic">Nenhum dependente cadastrado.</p>}
                  </div>

                  <div className={`p-4 rounded border border-dashed ${isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-300 bg-slate-50'}`}>
                      <p className="text-xs font-bold text-slate-400 mb-4 uppercase">Adicionar Dependente</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <input placeholder="Nome" className={`border rounded p-2 text-sm ${inputClass}`} value={newDependent.name} onChange={(e) => setNewDependent({...newDependent, name: e.target.value})} />
                          <input placeholder="Parentesco" className={`border rounded p-2 text-sm ${inputClass}`} value={newDependent.relation} onChange={(e) => setNewDependent({...newDependent, relation: e.target.value})} />
                          <input placeholder="Email" className={`border rounded p-2 text-sm ${inputClass}`} value={newDependent.email} onChange={(e) => setNewDependent({...newDependent, email: e.target.value})} />
                          <input placeholder="WhatsApp" className={`border rounded p-2 text-sm ${inputClass}`} value={newDependent.phone} onChange={(e) => setNewDependent({...newDependent, phone: e.target.value})} />
                          <input type="password" placeholder="Senha Provisória" className={`border rounded p-2 text-sm ${inputClass}`} value={newDependent.password} onChange={(e) => setNewDependent({...newDependent, password: e.target.value})} />
                      </div>
                      <div className="flex justify-end">
                          <button onClick={handleAddDependent} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2"><Plus size={14} /> Adicionar</button>
                      </div>
                  </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};