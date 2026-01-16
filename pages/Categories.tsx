
import React, { useState } from 'react';
import { useFinance } from '../FinanceContext';
import { Plus, Trash2, Edit2, ChevronRight } from 'lucide-react';
import { Category } from '../types';

export const Categories: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    type: 'expense' as 'income' | 'expense', 
    icon: '📦', 
    color: '#10b981',
    parentId: ''
  });

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({ 
      name: cat.name, 
      type: cat.type, 
      icon: cat.icon, 
      color: cat.color,
      parentId: cat.parentId || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', type: 'expense', icon: '📦', color: '#10b981', parentId: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      parentId: formData.parentId === '' ? undefined : formData.parentId
    };

    if (editingId) {
      updateCategory(editingId, data);
    } else {
      addCategory(data);
    }
    handleCloseModal();
  };

  // Filtra as categorias que podem ser pais (do mesmo tipo e que não são elas mesmas subcategorias)
  const potentialParents = categories.filter(c => 
    c.type === formData.type && 
    !c.parentId && 
    c.id !== editingId
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Categorias</h1>
          <p className="text-slate-500">Organize seus lançamentos por tipo e hierarquia.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setShowModal(true); }}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Adicionar Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories
          .sort((a, b) => {
            // Ordenar por tipo e depois alfabeticamente (pais primeiro)
            if (a.type !== b.type) return a.type === 'income' ? -1 : 1;
            const aParent = a.parentId ? categories.find(c => c.id === a.parentId)?.name : '';
            const bParent = b.parentId ? categories.find(c => c.id === b.parentId)?.name : '';
            const aDisplay = a.parentId ? `${aParent} ${a.name}` : a.name;
            const bDisplay = b.parentId ? `${bParent} ${b.name}` : b.name;
            return aDisplay.localeCompare(bDisplay);
          })
          .map(cat => {
            const parent = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
            
            return (
              <div key={cat.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col group transition-all hover:border-emerald-200 relative overflow-hidden">
                {cat.parentId && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-slate-100" />
                )}
                
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  >
                    {cat.icon}
                  </div>
                  <div className="min-w-0">
                    {parent && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase truncate flex items-center gap-1">
                        {parent.name} <ChevronRight className="w-2 h-2" />
                      </p>
                    )}
                    <p className="font-bold text-slate-800 text-sm truncate">{cat.name}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-50">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${cat.type === 'income' ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {cat.type === 'income' ? 'Receita' : 'Despesa'}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEdit(cat)} className="text-slate-300 hover:text-emerald-500 p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteCategory(cat.id)} className="text-slate-300 hover:text-rose-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in duration-300">
            <h3 className="text-xl font-bold mb-4">{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome da Categoria</label>
                <input required placeholder="Ex: Alimentação, Lazer..." className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value as any, parentId: ''})}
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ícone (Emoji)</label>
                  <input placeholder="Ex: 🍎, 🏠" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-center outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subcategoria de (Opcional)</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  value={formData.parentId}
                  onChange={e => setFormData({...formData, parentId: e.target.value})}
                >
                  <option value="">Nenhuma (Categoria Principal)</option>
                  {potentialParents.map(p => (
                    <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cor Visual</label>
                <div className="flex gap-3 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <input type="color" className="w-12 h-10 border-none p-0 block cursor-pointer bg-transparent" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                  <span className="text-sm font-medium text-slate-600 uppercase">{formData.color}</span>
                </div>
              </div>

              <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all mt-4 active:scale-[0.98]">
                {editingId ? 'Salvar Alterações' : 'Criar Categoria'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
