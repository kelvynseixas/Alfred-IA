import React, { useState, useEffect } from 'react';
import { User, Plan, Tutorial, Announcement, SystemConfig } from '../types';
import { LayoutGrid, Box, CreditCard, Link, PlayCircle, Megaphone, Globe, Cpu, Smartphone, Save, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

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

export const AdminPanel: React.FC<AdminPanelProps> = ({ isDarkMode }) => {
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

  const inputClass = `w-full border rounded p-2.5 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`;

  return (
    <div className="animate-fade-in">
      <header className="mb-8 border-b border-slate-800 pb-4 flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-serif font-bold text-white">Painel Master</h2>
            <div className="flex gap-4 mt-4">
                <button onClick={() => setActiveTab('INTEGRATIONS')} className={`pb-2 px-1 text-sm font-bold border-b-2 transition-all ${activeTab === 'INTEGRATIONS' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500'}`}>Integrações</button>
                <button onClick={() => setActiveTab('FINANCE')} className={`pb-2 px-1 text-sm font-bold border-b-2 transition-all ${activeTab === 'FINANCE' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500'}`}>Financeiro</button>
            </div>
        </div>
        
        <button 
            onClick={handleSaveConfig}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg ${saveStatus === 'SUCCESS' ? 'bg-emerald-600' : 'bg-purple-600 hover:bg-purple-500'}`}
        >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : saveStatus === 'SUCCESS' ? <CheckCircle size={18} /> : <Save size={18} />}
            {saveStatus === 'SUCCESS' ? 'Configurações Salvas!' : saveStatus === 'ERROR' ? 'Erro ao Salvar' : 'Salvar Alterações'}
        </button>
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
                      <p className="mt-2 text-[10px] text-slate-500 italic">* Esta chave é necessária para o funcionamento do chat do Alfred.</p>
                  </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-6 flex items-center gap-2 text-white"><Smartphone size={20} className="text-green-500"/> Evolution API (WhatsApp)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                          <label className="block text-xs text-slate-400 mb-2 uppercase font-bold">Base URL</label>
                          <input type="text" value={config.evolutionApi.baseUrl} onChange={e => setConfig({...config, evolutionApi: {...config.evolutionApi, baseUrl: e.target.value}})} className={inputClass} placeholder="https://api.seuserver.com" />
                      </div>
                      <div>
                          <label className="block text-xs text-slate-400 mb-2 uppercase font-bold">API Key Global</label>
                          <input type="password" value={config.evolutionApi.globalApiKey} onChange={e => setConfig({...config, evolutionApi: {...config.evolutionApi, globalApiKey: e.target.value}})} className={inputClass} />
                      </div>
                      <div>
                          <label className="block text-xs text-slate-400 mb-2 uppercase font-bold">Instância</label>
                          <input type="text" value={config.evolutionApi.instanceName} onChange={e => setConfig({...config, evolutionApi: {...config.evolutionApi, instanceName: e.target.value}})} className={inputClass} />
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'FINANCE' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-6 flex items-center gap-2 text-white"><CreditCard size={20} className="text-emerald-500"/> Gateway PagSeguro</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs text-slate-400 mb-2 uppercase font-bold">Email da Conta</label>
                      <input type="email" value={config.paymentGateway.email} onChange={e => setConfig({...config, paymentGateway: {...config.paymentGateway, email: e.target.value}})} className={inputClass} />
                  </div>
                  <div>
                      <label className="block text-xs text-slate-400 mb-2 uppercase font-bold">Token de Acesso</label>
                      <input type="password" value={config.paymentGateway.token} onChange={e => setConfig({...config, paymentGateway: {...config.paymentGateway, token: e.target.value}})} className={inputClass} />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg border border-slate-700 md:col-span-2">
                      <input type="checkbox" checked={config.paymentGateway.sandbox} onChange={e => setConfig({...config, paymentGateway: {...config.paymentGateway, sandbox: e.target.checked}})} className="w-5 h-5" />
                      <div>
                          <p className="text-sm font-bold text-white">Modo Sandbox (Testes)</p>
                          <p className="text-xs text-slate-400">Ative para realizar pagamentos de teste sem cobrança real.</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {saveStatus === 'ERROR' && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-center gap-3 text-red-500">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">Não foi possível salvar as configurações. Verifique a conexão com o banco de dados.</p>
          </div>
      )}
    </div>
  );
};