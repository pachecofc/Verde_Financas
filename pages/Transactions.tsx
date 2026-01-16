
import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../FinanceContext';
import { Plus, Search, Trash2, Edit2, ArrowRightLeft, SlidersHorizontal, ChevronRight, Filter, X, Calendar } from 'lucide-react';
import { TransactionType, Transaction, Category } from '../types';

export const Transactions: React.FC = () => {
  const { transactions, categories, accounts, addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // States para Filtros de Coluna (Melhorado com Período)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    categoryId: '',
    accountId: '',
  });

  // Form State para Modal
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    targetBalance: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    accountId: '',
    toAccountId: '',
    type: 'expense' as TransactionType,
  });

  useEffect(() => {
    if (showModal && !editingId) {
      const firstExpenseCat = categories.find(c => c.type === 'expense')?.id || '';
      const firstAccount = accounts[0]?.id || '';
      setFormData(prev => ({
        ...prev,
        categoryId: firstExpenseCat,
        accountId: firstAccount,
        type: 'expense'
      }));
    }
  }, [showModal, editingId, categories, accounts]);

  const handleTypeChange = (newType: TransactionType) => {
    const firstCatOfType = (newType === 'income' || newType === 'expense') 
      ? (categories.find(c => c.type === newType)?.id || '')
      : '';

    setFormData(prev => ({
      ...prev,
      type: newType,
      categoryId: firstCatOfType,
      toAccountId: newType === 'transfer' ? (accounts.find(a => a.id !== prev.accountId)?.id || '') : ''
    }));
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setFormData({
      description: t.description,
      amount: Math.abs(t.amount).toString(),
      targetBalance: '',
      date: t.date,
      categoryId: t.categoryId,
      accountId: t.accountId,
      toAccountId: t.toAccountId || '',
      type: t.type,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalAmount = parseFloat(formData.amount);

    if (formData.type === 'adjustment') {
      const account = accounts.find(a => a.id === formData.accountId);
      if (account) finalAmount = parseFloat(formData.targetBalance) - account.balance;
    }

    const finalCategoryId = (formData.type === 'transfer' || formData.type === 'adjustment')
      ? `sys-${formData.type}`
      : formData.categoryId;

    const transactionData = {
      description: formData.description || (formData.type === 'transfer' ? 'Transferência' : formData.type === 'adjustment' ? 'Ajuste de Saldo' : ''),
      amount: finalAmount,
      date: formData.date,
      categoryId: finalCategoryId,
      accountId: formData.accountId,
      toAccountId: formData.type === 'transfer' ? formData.toAccountId : undefined,
      type: formData.type,
    };

    if (editingId) {
      updateTransaction(editingId, transactionData);
    } else {
      addTransaction(transactionData);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      description: '', amount: '', targetBalance: '',
      date: new Date().toISOString().split('T')[0],
      categoryId: '', accountId: '', toAccountId: '', type: 'expense',
    });
  };

  const getCategoryFullName = (catId: string) => {
    if (catId === 'sys-transfer') return '🔄 Transferência';
    if (catId === 'sys-adjustment') return '⚖️ Ajuste de Saldo';
    const cat = categories.find(c => c.id === catId);
    if (!cat) return '';
    if (!cat.parentId) return `${cat.icon} ${cat.name}`;
    const parent = categories.find(c => c.id === cat.parentId);
    return `${parent?.icon || ''} ${parent?.name || ''} > ${cat.icon} ${cat.name}`;
  };

  // Lógica de filtragem combinada (Inclusivo de Período)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Lógica de período
      const trDate = t.date;
      const matchStartDate = !filters.startDate || trDate >= filters.startDate;
      const matchEndDate = !filters.endDate || trDate <= filters.endDate;
      
      const matchCategory = !filters.categoryId || t.categoryId === filters.categoryId;
      const matchAccount = !filters.accountId || t.accountId === filters.accountId || t.toAccountId === filters.accountId;
      
      return matchSearch && matchStartDate && matchEndDate && matchCategory && matchAccount;
    });
  }, [transactions, searchTerm, filters]);

  const hasActiveFilters = filters.startDate || filters.endDate || filters.categoryId || filters.accountId || searchTerm;

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', categoryId: '', accountId: '' });
    setSearchTerm('');
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transações</h1>
          <p className="text-slate-500">Gerencie e filtre seus lançamentos por período e categoria.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setShowModal(true); }}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl transition-all font-semibold shadow-lg shadow-emerald-100 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Novo Lançamento
        </button>
      </div>

      {/* Barra de Filtros Melhorada com Período */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row gap-4">
          {/* Busca Global */}
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar por descrição..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
            {/* Filtro Período - Início */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 group focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">De</span>
              <input 
                type="date"
                className="bg-transparent text-xs outline-none w-full text-slate-700"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            {/* Filtro Período - Fim */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 group focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Até</span>
              <input 
                type="date"
                className="bg-transparent text-xs outline-none w-full text-slate-700"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            {/* Filtro de Categoria */}
            <select 
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            >
              <option value="">Todas Categorias</option>
              <optgroup label="Sistema">
                <option value="sys-transfer">🔄 Transferência</option>
                <option value="sys-adjustment">⚖️ Ajuste de Saldo</option>
              </optgroup>
              <optgroup label="Suas Categorias">
                {categories
                  .sort((a, b) => getCategoryFullName(a.id).localeCompare(getCategoryFullName(b.id)))
                  .map(c => (
                    <option key={c.id} value={c.id}>{getCategoryFullName(c.id)}</option>
                  ))}
              </optgroup>
            </select>

            {/* Filtro de Conta */}
            <select 
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={filters.accountId}
              onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
            >
              <option value="">Todas as Contas</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs font-bold whitespace-nowrap"
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo/Cat</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Conta</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Valor</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                const parent = cat?.parentId ? categories.find(c => c.id === cat.parentId) : null;
                const acc = accounts.find(a => a.id === t.accountId);
                const toAcc = t.toAccountId ? accounts.find(a => a.id === t.toAccountId) : null;
                
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         {t.type === 'transfer' && <ArrowRightLeft className="w-4 h-4 text-blue-500" />}
                         {t.type === 'adjustment' && <SlidersHorizontal className="w-4 h-4 text-purple-500" />}
                         <div>
                            <p className="font-medium text-slate-900">{t.description}</p>
                            <p className="text-xs text-slate-400">{new Date(t.date + 'T00:00:00').toLocaleDateString()}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {t.type === 'transfer' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase tracking-wider">Transferência</span>
                      ) : t.type === 'adjustment' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 uppercase tracking-wider">Ajuste</span>
                      ) : (
                        <div className="flex flex-col">
                          {parent && <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-0.5">{parent.name} <ChevronRight className="w-2 h-2" /></span>}
                          <span className="inline-flex items-center text-xs font-medium text-slate-800">
                            {cat?.icon} {cat?.name}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {t.type === 'transfer' ? (
                        <div className="flex items-center gap-2">
                           <span className="font-medium text-slate-700">{acc?.name}</span> 
                           <ArrowRightLeft className="w-3 h-3 text-slate-400" /> 
                           <span className="font-medium text-slate-700">{toAcc?.name}</span>
                        </div>
                      ) : acc?.name}
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${
                      t.type === 'income' ? 'text-emerald-600' : 
                      t.type === 'expense' ? 'text-slate-900' :
                      t.type === 'adjustment' ? (t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600') : 'text-blue-600'
                    }`}>
                      {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : t.amount >= 0 ? '+' : '-'} {formatCurrency(Math.abs(t.amount))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(t)} className="text-slate-400 hover:text-emerald-600 transition-colors p-1"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteTransaction(t.id)} className="text-slate-400 hover:text-rose-600 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Calendar className="w-8 h-8 opacity-20" />
                      <p className="text-sm">Nenhum lançamento no período selecionado.</p>
                      <button onClick={clearFilters} className="text-emerald-600 text-xs font-bold hover:underline">Ver tudo</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'expense', label: 'Despesa' },
                  { id: 'income', label: 'Receita' },
                  { id: 'transfer', label: 'Transf.' },
                  { id: 'adjustment', label: 'Ajuste' }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeChange(type.id as TransactionType)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${formData.type === type.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-all"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor (R$)</label>
                  <input 
                    type="number" step="0.01" required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    value={formData.type === 'adjustment' ? formData.targetBalance : formData.amount}
                    onChange={(e) => setFormData({ ...formData, [formData.type === 'adjustment' ? 'targetBalance' : 'amount']: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data</label>
                  <input type="date" required className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conta</label>
                  <select required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-emerald-500" value={formData.accountId} onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}>
                    <option value="">Selecione...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                {formData.type === 'transfer' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conta Destino</label>
                    <select required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-emerald-500" value={formData.toAccountId} onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}>
                      <option value="">Selecione...</option>
                      {accounts.filter(a => a.id !== formData.accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                ) : formData.type === 'adjustment' ? null : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</label>
                    <select required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-emerald-500" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
                      <option value="">Selecione...</option>
                      {categories
                        .filter(c => c.type === (formData.type === 'income' ? 'income' : 'expense'))
                        .sort((a, b) => getCategoryFullName(a.id).localeCompare(getCategoryFullName(b.id)))
                        .map(c => (
                          <option key={c.id} value={c.id}>{getCategoryFullName(c.id)}</option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all mt-4 active:scale-[0.98]">
                {editingId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
