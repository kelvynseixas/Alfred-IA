import React, { useState } from 'react';
import { ListGroup, ItemStatus } from '../types';
import { CheckSquare, Plus, ShoppingCart, Trash2, X, Loader2, Edit2 } from 'lucide-react';

interface ListModuleProps {
  lists: ListGroup[];
  onToggleItem: (listId: string, itemId: string) => void;
  onDeleteItem: (listId: string, itemId: string) => void;
  onAddList: (name: string) => void;
  onEditList: (id: string, name: string) => void;
  onDeleteList: (id: string) => void;
  onAddItem: (listId: string, name: string) => void;
}

export const ListModule: React.FC<ListModuleProps> = ({ lists, onToggleItem, onDeleteItem, onAddList, onEditList, onDeleteList, onAddItem }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listNameInput, setListNameInput] = useState('');
  const [editingList, setEditingList] = useState<{id: string, name: string} | null>(null);
  
  const [newItemName, setNewItemName] = useState<{[key:string]: string}>({});
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  const openNewListModal = () => {
      setEditingList(null);
      setListNameInput('');
      setIsModalOpen(true);
  };

  const openEditListModal = (list: ListGroup) => {
      setEditingList({ id: list.id, name: list.name });
      setListNameInput(list.name);
      setIsModalOpen(true);
  };

  const handleSubmitList = () => {
      if(!listNameInput) return;
      
      if (editingList) {
          onEditList(editingList.id, listNameInput);
      } else {
          onAddList(listNameInput);
      }
      
      setListNameInput('');
      setEditingList(null);
      setIsModalOpen(false);
  };

  const handleDeleteList = (list: ListGroup) => {
      if (confirm(`Tem certeza que deseja excluir a lista "${list.name}" e todos os seus itens?`)) {
          onDeleteList(list.id);
      }
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
          <button onClick={openNewListModal} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova Lista
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map(list => (
                <div key={list.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 border-b border-slate-700 bg-slate-900/40 flex justify-between items-start group/header">
                        <div className="flex-1 min-w-0 mr-2">
                             <div className="flex items-center gap-2 mb-1">
                                {list.name.toLowerCase().includes('compra') ? <ShoppingCart className="w-4 h-4 text-gold-500 shrink-0" /> : <CheckSquare className="w-4 h-4 text-slate-400 shrink-0" />}
                                <h3 className="font-serif text-lg text-white truncate" title={list.name}>
                                    {list.name}
                                </h3>
                             </div>
                             <span className="text-xs text-slate-500 px-1 rounded-full shrink-0">
                                {list.items ? list.items.filter(i => i.status === ItemStatus.PENDING).length : 0} itens pendentes
                            </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/header:opacity-100 transition-opacity">
                            <button onClick={() => openEditListModal(list)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Renomear Lista">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteList(list)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors" title="Excluir Lista">
                                <Trash2 size={14} />
                            </button>
                        </div>
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
                        <h3 className="text-xl font-serif text-white">{editingList ? 'Renomear Lista' : 'Nova Lista'}</h3>
                        <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                    </div>
                    <input 
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white mb-4"
                        placeholder="Nome da Lista (ex: Material Escolar)"
                        value={listNameInput}
                        onChange={e => setListNameInput(e.target.value)}
                        autoFocus
                    />
                    <button onClick={handleSubmitList} className="w-full bg-gold-600 hover:bg-gold-500 text-white font-bold py-2 rounded">
                        {editingList ? 'Salvar Alteração' : 'Criar Lista'}
                    </button>
                </div>
             </div>
        )}
    </div>
  );
};