
import React, { useState } from 'react';
import { ShoppingList, ListItem, ListType, TransactionType } from '../types';
import { Plus, Trash2, CheckCircle, Circle, ShoppingCart, Gift, X, DollarSign } from 'lucide-react';

interface ListModuleProps {
    lists: ShoppingList[];
    onRefreshData: () => void;
    onOpenTransactionModal: (data: any) => void;
}

export const ListModule: React.FC<ListModuleProps> = ({ lists, onRefreshData, onOpenTransactionModal }) => {
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [isCreateListOpen, setIsCreateListOpen] = useState(false);
    const [newListData, setNewListData] = useState({ name: '', type: ListType.SUPPLIES });
    const [newItemName, setNewItemName] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState(1);

    const selectedList = lists.find(l => l.id === selectedListId);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('alfred_token');
        try {
            await fetch('/api/lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newListData)
            });
            onRefreshData();
            setIsCreateListOpen(false);
            setNewListData({ name: '', type: ListType.SUPPLIES });
        } catch (e) { console.error(e); }
    };

    const handleDeleteList = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Excluir esta lista e todos os itens?")) return;
        const token = localStorage.getItem('alfred_token');
        try {
            await fetch(`/api/lists/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (selectedListId === id) setSelectedListId(null);
            onRefreshData();
        } catch (e) { console.error(e); }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedListId || !newItemName) return;
        const token = localStorage.getItem('alfred_token');
        try {
            await fetch(`/api/lists/${selectedListId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: newItemName, quantity: newItemQuantity })
            });
            onRefreshData();
            setNewItemName('');
            setNewItemQuantity(1);
        } catch (e) { console.error(e); }
    };

    const handleToggleItem = async (item: ListItem) => {
        const token = localStorage.getItem('alfred_token');
        try {
            await fetch(`/api/items/${item.id}/toggle`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
            onRefreshData();
            
            // Ponte Financeira: Se marcou como concluído, sugere lançar despesa
            if (!item.isCompleted) {
                // Pequeno delay para UX
                setTimeout(() => {
                    if (confirm(`Item "${item.name}" marcado como comprado. Deseja lançar o valor no financeiro?`)) {
                        onOpenTransactionModal({
                            description: `Compra: ${item.name}`,
                            category: selectedList?.type === 'SUPPLIES' ? 'Mercado' : 'Desejos',
                            type: TransactionType.EXPENSE,
                            date: new Date().toISOString().split('T')[0]
                        });
                    }
                }, 200);
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteItem = async (id: string) => {
        const token = localStorage.getItem('alfred_token');
        try {
            await fetch(`/api/items/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            onRefreshData();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
            {/* Sidebar de Listas */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-white">Minhas Listas</h3>
                    <button onClick={() => setIsCreateListOpen(true)} className="p-2 bg-primary/10 text-primary rounded hover:bg-primary/20"><Plus size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {lists.map(list => (
                        <div 
                            key={list.id} 
                            onClick={() => setSelectedListId(list.id)}
                            className={`p-4 rounded-xl cursor-pointer border transition-all flex justify-between items-center group ${selectedListId === list.id ? 'bg-slate-800 border-primary' : 'bg-slate-950/50 border-slate-800 hover:border-slate-600'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${list.type === 'SUPPLIES' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-pink-500/10 text-pink-500'}`}>
                                    {list.type === 'SUPPLIES' ? <ShoppingCart size={20} /> : <Gift size={20} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{list.name}</h4>
                                    <p className="text-xs text-slate-500">{list.items?.filter(i => !i.isCompleted).length || 0} pendentes</p>
                                </div>
                            </div>
                            <button onClick={(e) => handleDeleteList(e, list.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-500 transition-opacity"><Trash2 size={16} /></button>
                        </div>
                    ))}
                    {lists.length === 0 && <p className="text-center text-slate-500 text-sm py-4">Nenhuma lista criada.</p>}
                </div>
            </div>

            {/* Detalhes da Lista */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden h-full">
                {selectedList ? (
                    <>
                        <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${selectedList.type === 'SUPPLIES' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-pink-500/10 text-pink-500'}`}>
                                    {selectedList.type === 'SUPPLIES' ? <ShoppingCart size={20} /> : <Gift size={20} />}
                                </div>
                                <h3 className="font-bold text-white text-lg">{selectedList.name}</h3>
                            </div>
                        </div>
                        
                        {/* Add Item Form */}
                        <form onSubmit={handleAddItem} className="p-4 border-b border-slate-800 flex gap-2">
                            <input 
                                className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none" 
                                placeholder="Adicionar novo item..." 
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                            />
                            <input 
                                type="number" 
                                min="1" 
                                className="w-20 bg-slate-950 border border-slate-700 rounded p-2 text-white text-center focus:border-primary focus:outline-none"
                                value={newItemQuantity}
                                onChange={e => setNewItemQuantity(parseInt(e.target.value))}
                            />
                            <button type="submit" className="bg-primary hover:bg-primary-dark text-slate-900 px-4 rounded font-bold transition-colors"><Plus size={20} /></button>
                        </form>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                             {selectedList.items?.map(item => (
                                 <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${item.isCompleted ? 'bg-slate-950/30 border-slate-800 opacity-60' : 'bg-slate-950 border-slate-700'}`}>
                                     <div className="flex items-center gap-3">
                                         <button onClick={() => handleToggleItem(item)} className={`transition-colors ${item.isCompleted ? 'text-emerald-500' : 'text-slate-600 hover:text-emerald-500'}`}>
                                             {item.isCompleted ? <CheckCircle size={20} /> : <Circle size={20} />}
                                         </button>
                                         <span className={`text-sm ${item.isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>{item.name}</span>
                                         {item.quantity > 1 && <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">x{item.quantity}</span>}
                                     </div>
                                     <button onClick={() => handleDeleteItem(item.id)} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                 </div>
                             ))}
                             {selectedList.items?.length === 0 && <p className="text-center text-slate-500 mt-10">Lista vazia. Adicione itens acima.</p>}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <ShoppingCart size={48} className="mb-4 opacity-20" />
                        <p>Selecione uma lista para ver os itens.</p>
                    </div>
                )}
            </div>

            {/* Modal Criar Lista */}
            {isCreateListOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm p-6 shadow-2xl">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Nova Lista</h3>
                            <button onClick={() => setIsCreateListOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                        </div>
                        <form onSubmit={handleCreateList} className="space-y-4">
                            <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={newListData.name} onChange={e => setNewListData({...newListData, name: e.target.value})} placeholder="Nome da Lista (ex: Mercado)" required />
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Tipo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setNewListData({...newListData, type: ListType.SUPPLIES})} className={`p-2 rounded border text-xs font-bold flex flex-col items-center gap-1 ${newListData.type === 'SUPPLIES' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                        <ShoppingCart size={16} /> Suprimentos
                                    </button>
                                    <button type="button" onClick={() => setNewListData({...newListData, type: ListType.WISHES})} className={`p-2 rounded border text-xs font-bold flex flex-col items-center gap-1 ${newListData.type === 'WISHES' ? 'bg-pink-600 border-pink-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                        <Gift size={16} /> Desejos
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-slate-900 font-bold py-3 rounded-lg transition-colors">Criar Lista</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
