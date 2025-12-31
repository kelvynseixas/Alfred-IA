
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, CreditCard, Settings, Video, LogOut, Save, ShieldCheck } from 'lucide-react';

interface AdminPanelProps {
    onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
    const [view, setView] = useState('DASHBOARD');
    const [stats, setStats] = useState<any>(null);
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const token = localStorage.getItem('alfred_token');
        const res = await fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setStats(await res.json());
    };

    const fetchSettings = async () => {
        const token = localStorage.getItem('alfred_token');
        const res = await fetch('/api/admin/settings', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setSettings(await res.json());
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('alfred_token');
        await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(settings)
        });
        setLoading(false);
        alert('Configurações salvas com sucesso!');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                <div className="p-6 border-b border-slate-800 flex items-center gap-2">
                    <ShieldCheck className="text-primary" />
                    <h1 className="font-bold text-white">Master Admin</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setView('DASHBOARD')} className={`w-full flex items-center gap-3 px-4 py-3 rounded hover:bg-slate-800 ${view === 'DASHBOARD' ? 'bg-slate-800 text-primary' : ''}`}><LayoutDashboard size={20} /> Dashboard</button>
                    <button onClick={() => setView('USERS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded hover:bg-slate-800 ${view === 'USERS' ? 'bg-slate-800 text-primary' : ''}`}><Users size={20} /> Usuários</button>
                    <button onClick={() => { setView('SETTINGS'); fetchSettings(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded hover:bg-slate-800 ${view === 'SETTINGS' ? 'bg-slate-800 text-primary' : ''}`}><Settings size={20} /> Configurações</button>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded"><LogOut size={20} /> Sair</button>
                </div>
            </aside>

            {/* Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {view === 'DASHBOARD' && stats && (
                    <>
                        <h2 className="text-3xl font-bold text-white mb-8">Visão Geral do SaaS</h2>
                        <div className="grid grid-cols-3 gap-6 mb-8">
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                                <h3 className="text-slate-500 text-sm font-bold uppercase">Usuários Totais</h3>
                                <p className="text-4xl font-bold text-white mt-2">{stats.totalUsers}</p>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                                <h3 className="text-slate-500 text-sm font-bold uppercase">Assinaturas Ativas</h3>
                                <p className="text-4xl font-bold text-emerald-500 mt-2">{stats.activeSubscriptions}</p>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                                <h3 className="text-slate-500 text-sm font-bold uppercase">Faturamento Mensal (Est.)</h3>
                                <p className="text-4xl font-bold text-primary mt-2">R$ {stats.monthlyRevenue}</p>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-800"><h3 className="font-bold text-white">Últimos Cadastros</h3></div>
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-800 text-slate-200">
                                    <tr>
                                        <th className="p-4">Nome</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recentUsers.map((u: any) => (
                                        <tr key={u.id} className="border-b border-slate-800">
                                            <td className="p-4 font-bold text-white">{u.name}</td>
                                            <td className="p-4">{u.email}</td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs ${u.plan_status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{u.plan_status}</span></td>
                                            <td className="p-4">{new Date(u.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {view === 'SETTINGS' && (
                    <div className="max-w-2xl">
                        <h2 className="text-3xl font-bold text-white mb-8">Configurações do Sistema</h2>
                        <form onSubmit={handleSaveSettings} className="space-y-6">
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
                                <h3 className="font-bold text-primary mb-4 border-b border-slate-700 pb-2">Integração IA (Gemini & OpenAI)</h3>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Google Gemini API Key</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" type="password" value={settings.gemini_api_key || ''} onChange={e => setSettings({...settings, gemini_api_key: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">OpenAI API Key (Opcional)</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" type="password" value={settings.openai_api_key || ''} onChange={e => setSettings({...settings, openai_api_key: e.target.value})} />
                                </div>
                            </div>

                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
                                <h3 className="font-bold text-emerald-500 mb-4 border-b border-slate-700 pb-2">Integração WhatsApp (Evolution API)</h3>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">URL da Instância</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" placeholder="https://api.evolution..." value={settings.evolution_api_url || ''} onChange={e => setSettings({...settings, evolution_api_url: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">API Key Global</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" type="password" value={settings.evolution_api_key || ''} onChange={e => setSettings({...settings, evolution_api_key: e.target.value})} />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="bg-primary hover:bg-primary-dark text-slate-900 font-bold px-6 py-3 rounded-lg flex items-center gap-2">
                                <Save size={20} /> Salvar Configurações
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
};
