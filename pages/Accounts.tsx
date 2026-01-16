
import React, { useState } from 'react';
import { useFinance } from '../FinanceContext';
import { Plus, CreditCard, Building2, Trash2, Edit2 } from 'lucide-react';
import { Account } from '../types';

export const Accounts: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', balance: '', type: 'bank' as 'bank' | 'credit' });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleEdit = (acc: Account) => {
    setEditingId(acc.id);
    setFormData({ name: acc.name, balance: acc.balance.toString(), type: acc.type });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', balance: '', type: 'bank' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      balance: parseFloat(formData.balance),
      type: formData.type
    };

    if (editingId) {
      updateAccount(editingId, data);
    } else {
      addAccount(data);
    }
    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Minhas Contas</h1>
          <p className="text-slate-500">Bancos e cartões de crédito conectados.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" /> Adicionar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 group transition-all hover:border-emerald-200">
            <div className="flex justify-between items-start">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${acc.type === 'bank' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
                {acc.type === 'bank' ? <Building2 className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => handleEdit(acc)}
                  className="p-1 text-slate-400 hover:text-emerald-600 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteAccount(acc.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{acc.name}</h3>
              <p className="text-sm text-slate-500 uppercase tracking-widest">{acc.type === 'bank' ? 'Banco' : 'Cartão'}</p>
            </div>
            <div className="pt-2">
              <p className="text-xs text-slate-400">Saldo Disponível</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(acc.balance)}</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in">
             <h3 className="text-xl font-bold mb-4">{editingId ? 'Editar Conta' : 'Nova Conta ou Cartão'}</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-1">
                 <label className="text-sm font-medium text-slate-700">Nome da Instituição</label>
                 <input 
                   required placeholder="Ex: NuBank, Inter..."
                   className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-sm font-medium text-slate-700">Saldo Inicial (R$)</label>
                 <input 
                   required type="number" step="0.01" placeholder="0,00"
                   className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                   value={formData.balance}
                   onChange={e => setFormData({...formData, balance: e.target.value})}
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-sm font-medium text-slate-700">Tipo de Conta</label>
                 <select 
                   className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-emerald-500"
                   value={formData.type}
                   onChange={e => setFormData({...formData, type: e.target.value as any})}
                 >
                   <option value="bank">Banco / Conta Corrente</option>
                   <option value="credit">Cartão de Crédito</option>
                 </select>
               </div>
               <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl mt-4 shadow-lg transition-all">
                 {editingId ? 'Salvar Alterações' : 'Salvar'}
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
