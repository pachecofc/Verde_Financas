
import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../FinanceContext';
import { 
  Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Trash2, Edit2, CheckCircle2, AlertCircle, Clock, ArrowRightLeft, ChevronRight as ChevronRightSmall
} from 'lucide-react';
import { Schedule as ScheduleType, TransactionType } from '../types';

export const Schedule: React.FC = () => {
  const { 
    schedules, categories, accounts, 
    addSchedule, updateSchedule, deleteSchedule, addTransaction 
  } = useFinance();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    frequency: 'monthly' as 'monthly' | 'weekly' | 'once',
    categoryId: '',
    accountId: '',
    toAccountId: '',
    type: 'expense' as TransactionType
  });

  // Status logic
  const getStatus = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const itemDate = new Date(dateStr + 'T00:00:00');
    
    const diffTime = itemDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'near';
    return 'on-time';
  };

  const overdueCount = useMemo(() => 
    schedules.filter(s => getStatus(s.date) === 'overdue').length, 
  [schedules]);

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

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth(currentDate.getFullYear(), currentDate.getMonth()); i++) calendarDays.push(i);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleEdit = (s: ScheduleType) => {
    setEditingId(s.id);
    setFormData({
      description: s.description,
      amount: s.amount.toString(),
      date: s.date,
      frequency: s.frequency,
      categoryId: s.categoryId,
      accountId: s.accountId,
      toAccountId: s.toAccountId || '',
      type: s.type
    });
    setShowModal(true);
  };

  const handlePaySchedule = (s: ScheduleType) => {
    addTransaction({
      description: `PAGTO: ${s.description}`,
      amount: s.amount,
      date: new Date().toISOString().split('T')[0],
      categoryId: s.categoryId,
      accountId: s.accountId,
      toAccountId: s.toAccountId,
      type: s.type
    });

    if (s.frequency === 'once') {
      deleteSchedule(s.id);
    } else {
      const nextDate = new Date(s.date + 'T00:00:00');
      if (s.frequency === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (s.frequency === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      }
      updateSchedule(s.id, { date: nextDate.toISOString().split('T')[0] });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      frequency: 'monthly',
      categoryId: '',
      accountId: '',
      toAccountId: '',
      type: 'expense'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalCategoryId = (formData.type === 'transfer' || formData.type === 'adjustment')
      ? `sys-${formData.type}`
      : formData.categoryId;

    const data = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date,
      frequency: formData.frequency,
      categoryId: finalCategoryId,
      accountId: formData.accountId,
      toAccountId: formData.type === 'transfer' ? formData.toAccountId : undefined,
      type: formData.type
    };

    if (editingId) {
      updateSchedule(editingId, data);
    } else {
      addSchedule(data);
    }
    handleCloseModal();
  };

  const isScheduledOnDay = (day: number, sDate: string) => {
    const [y, m, d] = sDate.split('-').map(Number);
    return d === day && (m - 1) === currentDate.getMonth() && y === currentDate.getFullYear();
  };

  const getCategoryFullName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return '';
    if (!cat.parentId) return `${cat.icon} ${cat.name}`;
    const parent = categories.find(c => c.id === cat.parentId);
    return `${parent?.icon || ''} ${parent?.name || ''} > ${cat.icon} ${cat.name}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Programação</h1>
          <p className="text-slate-500">Agende pagamentos, recebimentos ou transferências.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setShowModal(true); }}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl transition-all font-semibold shadow-lg shadow-emerald-100"
        >
          <Plus className="w-5 h-5" />
          Agendar Lançamento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {overdueCount > 0 && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
              <AlertCircle className="w-6 h-6 text-rose-600" />
              <div>
                <p className="text-rose-900 font-bold text-sm">Atenção!</p>
                <p className="text-rose-700 text-xs">Você possui {overdueCount} lançamentos vencidos.</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Próximos Lançamentos</h3>
            </div>
            
            <div className="divide-y divide-slate-50">
              {schedules
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(s => {
                  const status = getStatus(s.date);
                  const cat = categories.find(c => c.id === s.categoryId);
                  const parent = cat?.parentId ? categories.find(c => c.id === cat.parentId) : null;
                  
                  return (
                    <div key={s.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-white
                          ${status === 'overdue' ? 'bg-rose-50 text-rose-600' : 
                            status === 'near' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}
                        >
                          {s.type === 'transfer' ? <ArrowRightLeft className="w-6 h-6" /> : (cat?.icon || <Clock className="w-6 h-6" />)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{s.description}</p>
                          <div className="flex flex-wrap items-center gap-y-0.5 gap-x-2 text-xs text-slate-500 mt-0.5">
                            <span>{new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                            <span>•</span>
                            <span className="capitalize">{s.frequency === 'monthly' ? 'Mensal' : s.frequency === 'weekly' ? 'Semanal' : 'Único'}</span>
                            {s.type === 'transfer' ? (
                              <span className="text-blue-500 font-bold text-[10px] uppercase">Transferência</span>
                            ) : parent && (
                              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-0.5">{parent.name} <ChevronRightSmall className="w-2 h-2" /> {cat?.name}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className={`font-bold text-lg ${s.type === 'income' ? 'text-emerald-600' : s.type === 'transfer' ? 'text-blue-600' : 'text-slate-900'}`}>
                            {formatCurrency(s.amount)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handlePaySchedule(s)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><CheckCircle2 className="w-5 h-5" /></button>
                           <button onClick={() => handleEdit(s)} className="p-3 text-slate-300 hover:text-slate-600"><Edit2 className="w-5 h-5" /></button>
                           <button onClick={() => deleteSchedule(s.id)} className="p-3 text-slate-300 hover:text-rose-600"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700 capitalize">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                <div className="flex gap-1">
                   <button onClick={prevMonth} className="p-1 hover:bg-slate-50 rounded transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                   <button onClick={nextMonth} className="p-1 hover:bg-slate-50 rounded transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>
             </div>
             <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  const hasItems = day && schedules.some(s => isScheduledOnDay(day, s.date));
                  const isToday = day && day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();
                  return (
                    <div key={idx} className={`aspect-square flex items-center justify-center text-xs rounded-lg transition-all ${!day ? '' : isToday ? 'bg-emerald-600 text-white font-bold' : hasItems ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                      {day}
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 p-6">
            <h3 className="text-xl font-bold mb-4">Agendar Lançamento</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                {['expense', 'income', 'transfer'].map(type => (
                  <button key={type} type="button" onClick={() => handleTypeChange(type as any)} className={`py-2 text-[10px] font-bold rounded-lg transition-all ${formData.type === type ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                    {type === 'expense' ? 'Despesa' : type === 'income' ? 'Receita' : 'Transf.'}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</label>
                <input type="text" required className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor R$</label>
                  <input type="number" step="0.01" required className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data</label>
                  <input type="date" required className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conta</label>
                  <select required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-emerald-500" value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})}>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                {formData.type === 'transfer' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conta Destino</label>
                    <select required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-emerald-500" value={formData.toAccountId} onChange={e => setFormData({...formData, toAccountId: e.target.value})}>
                      {accounts.filter(a => a.id !== formData.accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</label>
                    <select required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-emerald-500" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                      <option value="">Selecione...</option>
                      {categories
                        .filter(c => c.type === (formData.type === 'income' ? 'income' : 'expense'))
                        .sort((a, b) => getCategoryFullName(a.id).localeCompare(getCategoryFullName(b.id)))
                        .map(c => <option key={c.id} value={c.id}>{getCategoryFullName(c.id)}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Frequência</label>
                <select className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-emerald-500" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value as any})}>
                  <option value="monthly">Mensal</option>
                  <option value="weekly">Semanal</option>
                  <option value="once">Único</option>
                </select>
              </div>

              <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg mt-4 transition-all">
                Salvar Agendamento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
