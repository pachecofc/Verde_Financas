
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend, AreaChart, Area, ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Calendar, Info } from 'lucide-react';
import { useFinance } from '../FinanceContext';

export const Dashboard: React.FC = () => {
  const { transactions, accounts, categories, schedules, theme } = useFinance();
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
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const cashFlowData = useMemo(() => {
    const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const data = [];
    for (let i = -3; i <= 2; i++) {
      const d = new Date(currentYear, currentMonth + i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      const isFuture = d > now || (y === currentYear && m === currentMonth);

      let realizedIncome = 0;
      let realizedExpense = 0;
      let predictedIncome = 0;
      let predictedExpense = 0;

      transactions.forEach(t => {
        if (t.date.startsWith(monthKey)) {
          if (t.type === 'income') realizedIncome += t.amount;
          else if (t.type === 'expense') realizedExpense += t.amount;
        }
      });

      if (isFuture) {
        schedules.forEach(s => {
          const sDate = new Date(s.date + 'T00:00:00');
          if (sDate <= new Date(y, m + 1, 0)) {
            let occurrences = 0;
            if (s.frequency === 'once') {
              if (s.date.startsWith(monthKey)) occurrences = 1;
            } else if (s.frequency === 'monthly') {
              occurrences = 1;
            } else if (s.frequency === 'weekly') {
              occurrences = 4;
            }

            if (s.type === 'income') predictedIncome += s.amount * occurrences;
            else if (s.type === 'expense') predictedExpense += s.amount * occurrences;
          }
        });
      }

      data.push({
        name: monthsShort[m],
        monthKey,
        realizedIncome,
        realizedExpense,
        predictedIncome,
        predictedExpense,
        totalIncome: realizedIncome + predictedIncome,
        totalExpense: realizedExpense + predictedExpense,
        isFuture
      });
    }

    return data.map(item => ({
      ...item,
      netFlow: item.totalIncome - item.totalExpense
    }));
  }, [transactions, schedules, totalBalance]);

  const expenseByCategory = useMemo(() => {
    return categories
      .filter(c => c.type === 'expense')
      .map(cat => ({
        name: cat.name,
        value: transactions
          .filter(t => t.categoryId === cat.id && t.date.startsWith(selectedMonth))
          .reduce((sum, t) => sum + t.amount, 0),
        color: cat.color
      }))
      .filter(item => item.value > 0);
  }, [categories, transactions, selectedMonth]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    const now = new Date();
    monthSet.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    transactions.forEach(t => monthSet.add(t.date.substring(0, 7)));
    return Array.from(monthSet).sort().reverse();
  }, [transactions]);

  // Cores dinâmicas para o Recharts baseadas no tema
  const chartStyles = {
    grid: theme === 'dark' ? '#1e293b' : '#f1f5f9',
    text: theme === 'dark' ? '#94a3b8' : '#64748b',
    tooltipBg: theme === 'dark' ? '#0f172a' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#1e293b' : '#f1f5f9',
    areaFlowFill: theme === 'dark' ? '#1e293b' : '#f8fafc',
    areaFlowStroke: theme === 'dark' ? '#334155' : '#cbd5e1'
  };

  return (
    <div className="space-y-8 pb-10 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Seu Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Acompanhe seu desempenho passado e previsões futuras.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Saldo Hoje</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalBalance)}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Receitas</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalIncome)}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Despesas</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalExpense)}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Fluxo de Caixa: Realizado vs Previsto</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Projeção baseada em seus agendamentos recorrentes.</p>
          </div>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5 dark:text-slate-400"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Receita</div>
            <div className="flex items-center gap-1.5 dark:text-slate-400"><div className="w-2 h-2 bg-rose-500 rounded-full" /> Despesa</div>
            <div className="flex items-center gap-1.5 dark:text-slate-400"><div className="w-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full" /> Previsto</div>
          </div>
        </div>
        
        <div className="h-[350px] w-full min-w-0">
          {isMounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartStyles.grid} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={({ x, y, payload }) => {
                    const item = cashFlowData[payload.index];
                    return (
                      <text x={x} y={y + 15} fill={item.isFuture ? (theme === 'dark' ? '#34d399' : '#10b981') : chartStyles.text} fontSize={11} fontWeight={item.isFuture ? 'bold' : 'normal'} textAnchor="middle">
                        {payload.value} {item.isFuture ? '*' : ''}
                      </text>
                    );
                  }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: chartStyles.text, fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: chartStyles.tooltipBg,
                    borderRadius: '16px', 
                    border: `1px solid ${chartStyles.tooltipBorder}`, 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
                    padding: '16px',
                    color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
                  }} 
                  cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc' }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                />
                <Bar name="Receita Realizada" dataKey="realizedIncome" stackId="a" fill="#10b981" />
                <Bar name="Receita Prevista" dataKey="predictedIncome" stackId="a" fill="#10b981" opacity={0.3} radius={[4, 4, 0, 0]} />
                
                <Bar name="Despesa Realizada" dataKey="realizedExpense" stackId="b" fill="#f43f5e" />
                <Bar name="Despesa Prevista" dataKey="predictedExpense" stackId="b" fill="#f43f5e" opacity={0.3} radius={[4, 4, 0, 0]} />
                
                <Area 
                  name="Saldo Mensal" 
                  type="monotone" 
                  dataKey="netFlow" 
                  fill={chartStyles.areaFlowFill} 
                  stroke={chartStyles.areaFlowStroke} 
                  strokeWidth={2}
                  dot={{ fill: chartStyles.areaFlowStroke, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-4 flex items-start gap-2 text-slate-400 dark:text-slate-500">
           <Info className="w-4 h-4 mt-0.5 shrink-0" />
           <p className="text-[10px]">Os meses marcados com (*) contêm projeções baseadas em seus lançamentos agendados na tela de Programação. O "Saldo Mensal" indica a diferença entre o que entra e o que sai em cada período.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Distribuição de Gastos</h3>
            <div className="relative inline-flex items-center">
              <Calendar className="absolute left-3 w-4 h-4 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{formatMonthLabel(m)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-[300px] w-full min-h-[300px] min-w-0">
            {isMounted && expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <RePieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartStyles.tooltipBg, 
                      borderRadius: '12px', 
                      border: `1px solid ${chartStyles.tooltipBorder}`, 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px', color: chartStyles.text }} />
                </RePieChart>
              </ResponsiveContainer>
            ) : isMounted ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 space-y-2">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                   <TrendingDown className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-sm">Nenhuma despesa para este mês.</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
           <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Alertas de Orçamento</h3>
           <div className="space-y-6">
              {useFinance().budgets.slice(0, 4).map(b => {
                const cat = categories.find(c => c.id === b.categoryId);
                const percent = Math.min((b.spent / b.limit) * 100, 100);
                return (
                  <div key={b.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat?.icon}</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{cat?.name}</span>
                      </div>
                      <span className={`text-xs font-bold ${percent >= 90 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {percent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div 
                        className={`h-full transition-all duration-1000 ${percent >= 90 ? 'bg-rose-500 dark:bg-rose-400' : 'bg-emerald-500 dark:bg-emerald-400'}`} 
                        style={{ width: `${percent}%` }} 
                       />
                    </div>
                  </div>
                );
              })}
              {useFinance().budgets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-600">
                  <p className="text-sm">Nenhum orçamento definido.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
