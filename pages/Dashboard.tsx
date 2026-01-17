
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Calendar, Info, ShieldCheck, HeartPulse, Trophy, Crown, Sparkles, ChevronRight, AlertTriangle } from 'lucide-react';
import { useFinance } from '../FinanceContext';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { transactions, accounts, categories, schedules, budgets, theme, user } = useFinance();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  
  const currentMonthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  const totalIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  const budgetAlerts = useMemo(() => {
    return budgets.map(b => {
      const cat = categories.find(c => c.id === b.categoryId);
      const percent = (b.spent / b.limit) * 100;
      return { ...b, categoryName: cat?.name, percent };
    }).filter(b => b.percent >= 80).sort((a, b) => b.percent - a.percent);
  }, [budgets, categories]);

  const expenseByCategory = useMemo(() => {
    return categories
      .filter(c => c.type === 'expense')
      .map(cat => ({
        name: cat.name,
        value: currentMonthTransactions
          .filter(t => t.categoryId === cat.id)
          .reduce((sum, t) => sum + t.amount, 0),
        color: cat.color
      }))
      .filter(item => item.value > 0);
  }, [categories, currentMonthTransactions]);

  const cashFlowData = useMemo(() => {
    const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const data = [];
    for (let i = -3; i <= 2; i++) {
      const d = new Date(currentYear, currentMonth + i, 1);
      const m = d.getMonth();
      const monthKey = `${d.getFullYear()}-${String(m + 1).padStart(2, '0')}`;
      
      let income = 0;
      let expense = 0;
      transactions.forEach(t => {
        if (t.date.startsWith(monthKey)) {
          if (t.type === 'income') income += t.amount;
          else if (t.type === 'expense') expense += t.amount;
        }
      });

      data.push({
        name: monthsShort[m],
        netFlow: income - expense
      });
    }
    return data;
  }, [transactions]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const chartStyles = {
    grid: theme === 'dark' ? '#1e293b' : '#f1f5f9',
    text: theme === 'dark' ? '#94a3b8' : '#64748b',
    tooltipBg: theme === 'dark' ? '#0f172a' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#1e293b' : '#f1f5f9',
  };

  return (
    <div className="space-y-8 pb-10 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Painel de Controle</h1>
          <p className="text-slate-500 dark:text-slate-400">Resumo financeiro de {selectedMonth}.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <Trophy className="w-5 h-5 text-amber-500" />
           <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{user?.achievements.length} Conquistas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/health" className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <ShieldCheck className="w-24 h-24 text-emerald-600" />
          </div>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
               <HeartPulse className="w-5 h-5" />
             </div>
             <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Score Verde</p>
          </div>
          <h3 className="text-3xl font-black text-emerald-600">{user?.score}</h3>
          <div className="mt-4 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500" style={{ width: `${(user?.score || 0) / 10}%` }} />
          </div>
        </Link>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Saldo Líquido</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(totalBalance)}</h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Entradas</p>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIncome)}</h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Saídas</p>
          <h3 className="text-2xl font-black text-rose-500 dark:text-rose-400">{formatCurrency(totalExpense)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fluxo de Caixa */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-8">Fluxo Mensal</h3>
          <div className="h-[300px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData}>
                  <defs>
                    <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartStyles.grid} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartStyles.text, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: chartStyles.text, fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '16px' }} formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="netFlow" stroke="#10b981" strokeWidth={3} fill="url(#colorFlow)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Alertas de Orçamento */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Alertas
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            {budgetAlerts.map(b => (
              <div key={b.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{b.categoryName}</span>
                  <span className={`text-xs font-black ${b.percent >= 100 ? 'text-rose-600' : 'text-amber-600'}`}>{b.percent.toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${b.percent >= 100 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(b.percent, 100)}%` }} />
                </div>
              </div>
            ))}
            {budgetAlerts.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-40">
                <ShieldCheck className="w-10 h-10 mb-2" />
                <p className="text-xs font-medium">Todos os orçamentos estão sob controle!</p>
              </div>
            )}
          </div>
          <Link to="/budgets" className="mt-6 text-center text-xs font-black text-emerald-600 uppercase hover:underline">Ver todos os orçamentos</Link>
        </div>

        {/* Despesas por Categoria */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6">Gastos por Categoria</h3>
          <div className="h-[250px] w-full">
            {isMounted && expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={80}
                    paddingAngle={5} dataKey="value"
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">Nenhum gasto este mês.</div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {expenseByCategory.slice(0, 4).map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate uppercase">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conquistas (Resumo) */}
        <div className="bg-emerald-600 dark:bg-emerald-500 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between overflow-hidden relative group">
           <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Trophy className="w-40 h-40" />
           </div>
           <div>
              <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Status Gamer</p>
              <h3 className="text-2xl font-black leading-tight">Você desbloqueou {user?.achievements.length} selos!</h3>
           </div>
           <Link to="/health" className="mt-6 w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-center text-xs font-black uppercase transition-all">Ver Minha Saúde</Link>
        </div>
      </div>
    </div>
  );
};
