
import React, { useState, useEffect } from 'react';
import { useFinance } from '../FinanceContext';
import { Plus, Target, Trash2, Edit2 } from 'lucide-react';
import { Budget } from '../types';

export const Budgets: React.FC = () => {
  const { budgets, categories, addBudget, updateBudget, deleteBudget, refreshState } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    limit: '',
  });

  useEffect(() => {
    refreshState();
    if (categories.length > 0 && !formData.categoryId) {
      setFormData(prev => ({ ...prev, categoryId: categories.find(c => c.type === 'expense')?.id || '' }));
    }
  }, [categories, refreshState]);

  const handleEdit = (b: Budget) => {
    setEditingId(b.id);
    setFormData({ categoryId: b.categoryId, limit: b.limit.toString() });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ categoryId: categories.find(c => c.type === 'expense')?.id || '', limit: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.limit) return;
    
    const data = {
      categoryId: formData.categoryId,
      limit: parseFloat(formData.limit)
    };

    if (editingId) {
      updateBudget(editingId, data);
    } else {
      addBudget(data);
    }
    handleCloseModal();
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getCategoryFullName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return '';
    if (!cat.parentId) return `${cat.icon} ${cat.name}`;
    const parent = categories.find(c => c.id === cat.parentId);
    return `${parent?.icon || ''} ${parent?.name || ''} > ${cat.icon} ${cat.name}`;
  };

  return (
    <div className="space-y-6 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Meus Orçamentos</h1>
          <p className="text-slate-500 dark:text-slate-400">Planeje seus gastos e controle suas categorias.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setShowModal(true); }}
          className="flex items-center justify-center gap-2 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 text-white px-6 py-3 rounded-xl transition-all font-semibold shadow-lg shadow-emerald-100 dark:shadow-none active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Definir Orçamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map(b => {
          const cat = categories.find(c => c.id === b.categoryId);
          const parent = cat?.parentId ? categories.find(c => c.id === cat.parentId) : null;
          const percent = Math.min((b.spent / b.limit) * 100, 100);
          const isOver = b.spent > b.limit;

          return (
            <div key={b.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 group transition-all hover:border-emerald-200 dark:hover:border-emerald-500/30">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl">
                    {cat?.icon || '📦'}
                  </div>
                  <div>
                    {parent && <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{parent.name}</p>}
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 leading-tight">{cat?.name}</h4>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => handleEdit(b)} className="p-1 text-slate-300 dark:text-slate-600 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => deleteBudget(b.id)} className="p-1 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Progresso</span>
                  <span className={`font-bold ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-200'}`}>{percent.toFixed(0)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${isOver ? 'bg-rose-500 dark:bg-rose-400' : 'bg-emerald-500 dark:bg-emerald-400'}`} style={{ width: `${percent}%` }} />
                </div>
                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Gasto: {formatCurrency(b.spent)}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(b.limit)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 animate-in zoom-in">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">{editingId ? 'Editar Orçamento' : 'Novo Orçamento'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categoria</label>
                <select 
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg outline-none focus:border-emerald-500"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {categories
                    .filter(c => c.type === 'expense')
                    .sort((a, b) => getCategoryFullName(a.id).localeCompare(getCategoryFullName(b.id)))
                    .map(c => (
                      <option key={c.id} value={c.id}>{getCategoryFullName(c.id)}</option>
                    ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Limite Mensal (R$)</label>
                <input type="number" step="0.01" required className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg outline-none focus:border-emerald-500" value={formData.limit} onChange={(e) => setFormData({ ...formData, limit: e.target.value })} />
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg dark:shadow-none transition-all mt-4 active:scale-[0.98]">Confirmar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
