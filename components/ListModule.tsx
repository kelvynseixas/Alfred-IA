import React, { useState } from 'react';
import { ListGroup, ItemStatus } from '../types';
import { CheckSquare, Plus, ShoppingCart, Trash2, X, Loader2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [listNameInput, setListNameInput] = useState('');
  const [editingList, setEditingList] = useState<{id: string, name: string} | null>(null);
  const [newItemName, setNewItemName] = useState<{[key:string]: string}>({});
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
      setExpandedListId(expandedListId === id ? null : id);
  };

  const openNewListModal = () => {
      setEditingList(null);
      setListNameInput('');
      setIsModalOpen(true);
  };

  const handleSubmitList = () => {
      if(!listNameInput) return;
      if (editingList) onEditList(editingList.id, listNameInput);
      else onAddList(listNameInput);
      setIsModalOpen(false);
  };

  const handleAddItem = async (listId: string) => {
      const name = newItemName[listId];
      if (!name) return;
      setLoadingItem(listId);
      await onAddItem(listId, name);
      setNewItemName(prev => ({...prev, [listId]: ''}));
      setLoadingItem(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <header className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-serif text-white">Inventário & Listas</h2>
            <p className="text-slate-400">Garantindo que a propriedade esteja bem abastecida.</p>
          </div>
          <button onClick={openNewListModal} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova Lista
          </button>
        </header>

        <div className="space-y-4">
            {lists.map(list => {
                const isExpanded = expandedListId === list.id;
                const pendingCount = list.items ? list.items.filter(i => i.status === ItemStatus.PENDING).length : 0;
                
                return (
                    <div key={list.id} className={`bg-slate-800 rounded-xl border transition-all overflow-hidden ${isExpanded ? 'border-gold-500/50 shadow-lg' : 'border-slate-700 hover:border-slate-600'}`}>
                        {/* Header Sanfona */}
                        <div 
                            onClick={() => toggleExpand(list.id)}
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-700/30"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${list.name.toLowerCase().includes('compra') ? 'bg-gold-500/20 text-gold-500' : 'bg-slate-700 text-slate-400'}`}>
                                    {list.name.toLowerCase().includes('compra') ? <ShoppingCart size={20} /> : <CheckSquare size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-serif text-lg text-white font-medium">{list.name}</h3>
                                    <p className="text-xs text-slate-400">{pendingCount} itens pendentes</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }} className="p-2 text-slate-500 hover:text-red-400 rounded-full hover:bg-slate-700/50"><Trash2 size={16}/></button>
                                {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                            </div>
                        </div>

                        {/* Corpo Expandido */}
                        {isExpanded && (
                            <div className="p-4 border-t border-slate-700 bg-slate-900/30">
                                <ul className="space-y-2 mb-4">
                                    {list.items && list.items.map(item => (
                                        <li key={item.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-700/30">
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => onToggleItem(list.id, item.id)}
                                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                    ${item.status === ItemStatus.DONE ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'border-slate-500 hover:border-gold-500'}`}
                                                >
                                                    <div className={`w-2.5 h-2.5 bg-current rounded-sm ${item.status === ItemStatus.DONE ? 'opacity-100' : 'opacity-0'}`} />
                                                </button>
                                                <span className={`${item.status === ItemStatus.DONE ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{item.name}</span>
                                            </div>
                                            <button onClick={() => onDeleteItem(list.id, item.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={14}/></button>
                                        </li>
                                    ))}
                                    {(!list.items || list.items.length === 0) && <p className="text-sm text-slate-500 italic text-center py-2">Lista vazia.</p>}
                                </ul>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Novo item..." 
                                        value={newItemName[list.id] || ''}
                                        onChange={(e) => setNewItemName({...newItemName, [list.id]: e.target.value})}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem(list.id)}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500"
                                    />
                                    <button onClick={() => handleAddItem(list.id)} disabled={loadingItem === list.id} className="bg-gold-600 hover:bg-gold-500 text-white px-4 rounded transition-colors disabled:opacity-50">
                                        {loadingItem === list.id ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16}/>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        {isModalOpen && (
             <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm p-6 shadow-2xl">
                    <h3 className="text-xl font-serif text-white mb-4">Nova Lista</h3>
                    <input 
                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white mb-4"
                        placeholder="Nome da Lista"
                        value={listNameInput}
                        onChange={e => setListNameInput(e.target.value)}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setIsModalOpen(false)} className="flex-1 text-slate-400 hover:text-white py-2">Cancelar</button>
                        <button onClick={handleSubmitList} className="flex-1 bg-gold-600 hover:bg-gold-500 text-white font-bold py-2 rounded">Criar</button>
                    </div>
                </div>
             </div>
        )}
    </div>
  );
};