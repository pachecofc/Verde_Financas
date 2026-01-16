
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { useFinance } from '../FinanceContext';

export const Dashboard: React.FC = () => {
  const { transactions, accounts, categories } = useFinance();
  const [isMounted, setIsMounted] = useState(false);

  // Garante que o gráfico só renderize após a montagem do componente para evitar erros de medição
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Estado para o filtro de mês (Formato: YYYY-MM)
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

  // Dados para o gráfico de barras (Histórico Geral)
  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const aggregation: Record<string, { name: string; income: number; expense: number; sortKey: number }> = {};

    transactions.forEach(t => {
      const date = new Date(t.date + 'T00:00:00');
      const monthIdx = date.getMonth();
      const year = date.getFullYear();
      const yearShort = year.toString().slice(-2);
      const label = `${months[monthIdx]}/${yearShort}`;
      const sortKey = year * 100 + monthIdx;

      if (!aggregation[label]) {
        aggregation[label] = { name: label, income: 0, expense: 0, sortKey };
      }

      if (t.type === 'income') {
        aggregation[label].income += t.amount;
      } else {
        aggregation[label].expense += t.amount;
      }
    });

    const sortedData = Object.values(aggregation).sort((a, b) => a.sortKey - b.sortKey);
    return sortedData.length > 0 ? sortedData.slice(-6) : [{ name: 'Sem Dados', income: 0, expense: 0 }];
  }, [transactions]);

  // Lista de meses disponíveis para o filtro (baseado nas transações + mês atual)
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    const now = new Date();
    monthSet.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    
    transactions.forEach(t => {
      monthSet.add(t.date.substring(0, 7));
    });

    return Array.from(monthSet).sort().reverse();
  }, [transactions]);

  // Gráfico de Pizza: Filtrado por Categoria e Mês Selecionado
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

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Seu Dashboard</h1>
          <p className="text-slate-500">Resumo geral das suas finanças baseado no histórico real.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Saldo Geral</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalBalance)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Receitas</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalIncome)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Despesas</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalExpense)}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Cash Flow Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Receitas vs Despesas (Histórico Mensal)</h3>
          <div className="h-[300px] w-full min-h-[300px]">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar name="Receita" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar name="Despesa" dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expenses by Category with Month Filter */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-slate-800">Distribuição de Gastos</h3>
            
            <div className="relative inline-flex items-center">
              <Calendar className="absolute left-3 w-4 h-4 text-emerald-600 pointer-events-none" />
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-[300px] w-full min-h-[300px]">
            {isMounted && expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
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
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </RePieChart>
              </ResponsiveContainer>
            ) : isMounted ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                   <TrendingDown className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-sm">Nenhuma despesa para este mês.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Recent Activity Mini List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Últimas Transações</h3>
        <div className="divide-y divide-slate-50">
          {transactions.slice(0, 5).map(t => {
            const cat = categories.find(c => c.id === t.categoryId);
            return (
              <div key={t.id} className="py-4 flex items-center justify-between group hover:bg-slate-50/50 transition-all rounded-lg px-2 -mx-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-xl border border-white shadow-sm">
                    {cat?.icon || '📦'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{t.description}</p>
                    <p className="text-xs text-slate-500">{new Date(t.date + 'T00:00:00').toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                </div>
              </div>
            );
          })}
          {transactions.length === 0 && (
            <p className="text-center py-8 text-slate-400">Nenhuma transação registrada no sistema.</p>
          )}
        </div>
      </div>
    </div>
  );
};
