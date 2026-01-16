
import React, { useState, useMemo } from 'react';
import { useFinance } from '../FinanceContext';
import { 
  TrendingUp, Landmark, Target, Plus, Trash2, 
  ChevronRight, ArrowUpRight, Award, Wallet, X, Smile
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Investment, Goal } from '../types';

export const Investments: React.FC = () => {
  const { investments, goals, addInvestment, deleteInvestment, addGoal, deleteGoal, updateGoal } = useFinance();
  const [showInvModal, setShowInvModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const [invForm, setInvForm] = useState({
    name: '',
    type: 'fixed' as Investment['type'],
    amount: '',
    institution: '',
    color: '#10b981'
  });

  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    icon: '🎯',
    color: '#10b981'
  });

  const totalInvested = useMemo(() => 
    investments.reduce((sum, inv) => sum + inv.amount, 0), 
  [investments]);

  const investmentDistribution = useMemo(() => {
    const types = {
      fixed: { name: 'Renda Fixa', value: 0, color: '#10b981' },
      stocks: { name: 'Ações', value: 0, color: '#3b82f6' },
      crypto: { name: 'Cripto', value: 0, color: '#f59e0b' },
      fii: { name: 'FIIs', value: 0, color: '#8b5cf6' },
      other: { name: 'Outros', value: 0, color: '#64748b' }
    };
    
    investments.forEach(inv => {
      if (types[inv.type]) types[inv.type].value += inv.amount;
    });

    return Object.values(types).filter(t => t.value > 0);
  }, [investments]);

  // Dados fictícios para o gráfico de evolução (já que o app é offline/local)
  const evolutionData = [
    { name: 'Jan', value: totalInvested * 0.8 },
    { name: 'Fev', value: totalInvested * 0.85 },
    { name: 'Mar', value: totalInvested * 0.92 },
    { name: 'Abr', value: totalInvested * 0.98 },
    { name: 'Mai', value: totalInvested },
  ];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleAddInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    addInvestment({
      ...invForm,
      amount: parseFloat(invForm.amount)
    });
    setShowInvModal(false);
    setInvForm({ name: '', type: 'fixed', amount: '', institution: '', color: '#10b981' });
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    addGoal({
      ...goalForm,
      targetAmount: parseFloat(goalForm.targetAmount),
      currentAmount: parseFloat(goalForm.currentAmount)
    });
    setShowGoalModal(false);
    setGoalForm({ name: '', targetAmount: '', currentAmount: '', icon: '🎯', color: '#10b981' });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Investimentos & Metas</h1>
          <p className="text-slate-500">Construa seu patrimônio e realize seus sonhos.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => setShowGoalModal(true)}
            className="flex items-center gap-2 bg-white text-emerald-600 border border-emerald-100 px-5 py-3 rounded-xl hover:bg-emerald-50 transition-all font-semibold"
          >
            <Target className="w-4 h-4" /> Nova Meta
          </button>
          <button 
            onClick={() => setShowInvModal(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl hover:bg-emerald-700 transition-all font-semibold shadow-lg shadow-emerald-100"
          >
            <Plus className="w-5 h-5" /> Adicionar Ativo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Patrimônio e Gráfico */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Landmark className="w-32 h-32" />
             </div>
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Patrimônio Investido</p>
             <h2 className="text-4xl font-black text-slate-900 mb-6">{formatCurrency(totalInvested)}</h2>
             
             <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionData}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                      formatter={(val: number) => formatCurrency(val)}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div>
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" /> Metas de Vida
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map(goal => {
                  const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                  const isDone = percent >= 100;
                  return (
                    <div key={goal.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all">
                       <div className="flex justify-between items-start mb-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${isDone ? 'bg-amber-50 animate-bounce' : 'bg-slate-50'}`}>
                             {isDone ? '👑' : goal.icon}
                          </div>
                          <button onClick={() => deleteGoal(goal.id)} className="text-slate-200 hover:text-rose-500 p-1"><X className="w-4 h-4" /></button>
                       </div>
                       <h4 className="font-bold text-slate-800 mb-1">{goal.name}</h4>
                       <div className="flex justify-between text-xs font-bold mb-2">
                          <span className="text-slate-400">{formatCurrency(goal.currentAmount)}</span>
                          <span className={isDone ? 'text-amber-600' : 'text-emerald-600'}>{percent.toFixed(0)}%</span>
                       </div>
                       <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                          <div 
                            className={`h-full transition-all duration-1000 ${isDone ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${percent}%` }} 
                          />
                       </div>
                       <p className="text-[10px] text-slate-400 text-right">Objetivo: {formatCurrency(goal.targetAmount)}</p>
                    </div>
                  );
                })}
                {goals.length === 0 && (
                  <div className="col-span-full border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-400">
                    <Award className="w-12 h-12 opacity-20 mb-2" />
                    <p className="text-sm">Nenhuma meta definida. Que tal começar a planejar uma viagem?</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Lado Direito: Distribuição e Ativos */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Alocação de Ativos</h3>
             <div className="h-[200px] w-full">
                {investmentDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={investmentDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {investmentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-300 text-xs text-center p-4 italic">
                    Adicione ativos para ver sua distribuição.
                  </div>
                )}
             </div>
             <div className="mt-4 space-y-2">
                {investmentDistribution.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600">{item.name}</span>
                     </div>
                     <span className="font-bold text-slate-800">{((item.value / totalInvested) * 100).toFixed(1)}%</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Meus Ativos</h3>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
             </div>
             <div className="divide-y divide-slate-50">
                {investments.map(inv => (
                  <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: inv.color }}>
                           <Landmark className="w-4 h-4" />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-800">{inv.name}</p>
                           <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{inv.institution}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(inv.amount)}</p>
                        <button onClick={() => deleteInvestment(inv.id)} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                     </div>
                  </div>
                ))}
                {investments.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs italic">
                    Nenhum ativo cadastrado.
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      {showInvModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowInvModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-300">
             <h3 className="text-xl font-bold mb-6">Novo Ativo Financeiro</h3>
             <form onSubmit={handleAddInvestment} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome do Ativo</label>
                  <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" value={invForm.name} onChange={e => setInvForm({...invForm, name: e.target.value})} placeholder="Ex: Tesouro Selic 2029" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Atual (R$)</label>
                    <input type="number" step="0.01" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" value={invForm.amount} onChange={e => setInvForm({...invForm, amount: e.target.value})} placeholder="0,00" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" value={invForm.type} onChange={e => setInvForm({...invForm, type: e.target.value as any})}>
                      <option value="fixed">Renda Fixa</option>
                      <option value="stocks">Ações / ETFs</option>
                      <option value="fii">FIIs</option>
                      <option value="crypto">Cripto</option>
                      <option value="other">Outros</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instituição</label>
                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" value={invForm.institution} onChange={e => setInvForm({...invForm, institution: e.target.value})} placeholder="Ex: XP, NuInvest, Binance" />
                </div>
                <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg mt-4 active:scale-95 transition-all">Salvar Ativo</button>
             </form>
          </div>
        </div>
      )}

      {showGoalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowGoalModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-300">
             <h3 className="text-xl font-bold mb-6">Nova Meta Financeira</h3>
             <form onSubmit={handleAddGoal} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Título da Meta</label>
                  <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} placeholder="Ex: Viagem à Disney" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Alvo (R$)</label>
                    <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" value={goalForm.targetAmount} onChange={e => setGoalForm({...goalForm, targetAmount: e.target.value})} placeholder="20000" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Já Tenho (R$)</label>
                    <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" value={goalForm.currentAmount} onChange={e => setGoalForm({...goalForm, currentAmount: e.target.value})} placeholder="500" />
                  </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ícone Representativo</label>
                   <div className="grid grid-cols-6 gap-2 p-2 bg-slate-50 rounded-xl">
                      {['✈️', '🏠', '🚗', '🎓', '💍', '👶', '🏖️', '💻', '🚲', '🏥', '🎉', '💰'].map(emoji => (
                        <button 
                          key={emoji}
                          type="button"
                          onClick={() => setGoalForm({...goalForm, icon: emoji})}
                          className={`w-full aspect-square flex items-center justify-center text-xl rounded-lg hover:bg-white transition-all ${goalForm.icon === emoji ? 'bg-white shadow-sm scale-110 border border-emerald-100' : ''}`}
                        >
                          {emoji}
                        </button>
                      ))}
                   </div>
                </div>
                <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg mt-4 active:scale-95 transition-all">Criar Meta</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
