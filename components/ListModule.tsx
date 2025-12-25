import React, { useState } from 'react';
import { ListGroup, ItemStatus } from '../types';
import { CheckSquare, Plus, ShoppingCart, Trash2, X, Loader2 } from 'lucide-react';

interface ListModuleProps {
  lists: ListGroup[];
  onToggleItem: (listId: string, itemId: string) => void;
  onDeleteItem: (listId: string, itemId: string) => void;
  onAddList: (name: string) => void;
  onAddItem: (listId: string, name: string) => void;
}

export const ListModule: React.FC<ListModuleProps> = ({ lists, onToggleItem, onDeleteItem, onAddList, onAddItem }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newItemName, setNewItemName] = useState<{[key:string]: string}>({});
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  const handleCreateList = () => {
      if(!newListName) return;
      onAddList(newListName);
      setNewListName('');
      setIsModalOpen(false);
  };

  const handleAddItem = async (listId: string) => {
      const name = newItemName[listId];
      if (!name) return;
      setLoadingItem(listId);
      
      try {
        const res = await fetch(`/api/lists/${listId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('alfred_token')}` },
            body: JSON.stringify({ name })
        });
        if(res.ok) {
            onAddItem(listId, name); // Triggers refresh
            setNewItemName(prev => ({...prev, [listId]: ''}));
        }
      } finally {
        setLoadingItem(null);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-serif text-white">Inventário & Listas</h2>
            <p className="text-slate-400">Garantindo que a propriedade esteja bem abastecida.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova Lista
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map(list => (
                <div key={list.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 border-b border-slate-700 bg-slate-900/40 flex justify-between items-center">
                        <h3 className="font-serif text-lg text-white flex items-center gap-2 truncate max-w-[70%]">
                             {list.name.toLowerCase().includes('compra') ? <ShoppingCart className="w-4 h-4 text-gold-500" /> : <CheckSquare className="w-4 h-4 text-slate-400" />}
                            {list.name}
                        </h3>
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full shrink-0">
                            {list.items ? list.items.filter(i => i.status === ItemStatus.PENDING).length : 0} itens
                        </span>
                    </div>
                    
                    <div className="p-2 flex-1 overflow-y-auto custom-scrollbar">
                        {(!list.items || list.items.length === 0) ? (
                            <div className="h-full flex items-center justify-center p-8 text-slate-600 text-sm italic">
                                Lista vazia. Adicione itens abaixo.
                            </div>
                        ) : (
                            <ul className="space-y-1">
                                {list.items.map(item => (
                                    <li key={item.id} className="group flex items-center justify-between p-2 hover:bg-slate-700/30 rounded-lg transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <button 
                                                onClick={() => onToggleItem(list.id, item.id)}
                                                className={`w-5 h-5 rounded border flex shrink-0 items-center justify-center transition-colors
                                                ${item.status === ItemStatus.DONE 
                                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' 
                                                    : 'border-slate-500 hover:border-gold-500 text-transparent'}`}
                                            >
                                                <div className={`w-2.5 h-2.5 bg-current rounded-sm ${item.status === ItemStatus.DONE ? 'opacity-100' : 'opacity-0'}`} />
                                            </button>
                                            <span className={`text-sm truncate ${item.status === ItemStatus.DONE ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                                {item.name}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => onDeleteItem(list.id, item.id)}
                                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="p-3 bg-slate-900/20 border-t border-slate-700">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Adicionar item..." 
                                value={newItemName[list.id] || ''}
                                onChange={(e) => setNewItemName({...newItemName, [list.id]: e.target.value})}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddItem(list.id)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-gold-500/50"
                            />
                            <button 
                                onClick={() => handleAddItem(list.id)}
                                disabled={loadingItem === list.id}
                                className="bg-slate-700 hover:bg-gold-600 text-white rounded px-2 transition-colors disabled:opacity-50"
                            >
                                {loadingItem === list.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {isModalOpen && (
             <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-serif text-white">Nova Lista</h3>
                        <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                    </div>
                    <input 
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white mb-4"
                        placeholder="Nome da Lista (ex: Material Escolar)"
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                    />
                    <button onClick={handleCreateList} className="w-full bg-gold-600 hover:bg-gold-500 text-white font-bold py-2 rounded">Criar Lista</button>
                </div>
             </div>
        )}
    </div>
  );
};