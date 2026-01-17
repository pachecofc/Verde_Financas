
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { FinanceState, Category, Account, Transaction, Budget, Schedule, UserProfile, Investment, Goal, Theme, Achievement } from './types';
import { INITIAL_CATEGORIES, INITIAL_ACCOUNTS } from './constants';

interface FinanceContextType extends FinanceState {
  addCategory: (c: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, c: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (id: string) => void;
  addAccount: (a: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, a: Partial<Omit<Account, 'id'>>) => void;
  deleteAccount: (id: string) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, t: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;
  addBudget: (b: Omit<Budget, 'id' | 'spent'>) => void;
  updateBudget: (id: string, b: Partial<Omit<Budget, 'id' | 'spent'>>) => void;
  deleteBudget: (id: string) => void;
  addSchedule: (s: Omit<Schedule, 'id'>) => void;
  updateSchedule: (id: string, s: Partial<Omit<Schedule, 'id'>>) => void;
  deleteSchedule: (id: string) => void;
  addInvestment: (i: Omit<Investment, 'id'>) => void;
  updateInvestment: (id: string, i: Partial<Omit<Investment, 'id'>>) => void;
  deleteInvestment: (id: string) => void;
  addGoal: (g: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, g: Partial<Omit<Goal, 'id'>>) => void;
  deleteGoal: (id: string) => void;
  refreshState: () => void;
  updateUserProfile: (u: UserProfile) => void;
  logout: () => void;
  toggleTheme: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-1', name: 'Primeiro Passo', description: 'Realizou seu primeiro lançamento.', icon: '🌱', requirement: '1_transaction' },
  { id: 'ach-2', name: 'Mestre do Orçamento', description: 'Manteve orçamentos no azul por 3 meses.', icon: '🛡️', requirement: '3_months_blue' },
  { id: 'ach-3', name: 'Investidor Verde', description: 'Possui mais de 5 ativos cadastrados.', icon: '💎', requirement: '5_investments' },
  { id: 'ach-4', name: 'Poupador Fiel', description: 'Economizou mais de 30% da renda no mês.', icon: '🏦', requirement: '30_percent_saving' },
];

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FinanceState>(() => {
    const saved = localStorage.getItem('verde_financas_state');
    const parsed = saved ? JSON.parse(saved) : null;
    return {
      categories: parsed?.categories || INITIAL_CATEGORIES,
      accounts: parsed?.accounts || INITIAL_ACCOUNTS,
      transactions: parsed?.transactions || [],
      budgets: parsed?.budgets || [],
      schedules: parsed?.schedules || [],
      investments: parsed?.investments || [],
      goals: parsed?.goals || [],
      user: parsed?.user || { name: 'Visitante', email: '', plan: 'basic', score: 450, achievements: [] },
      theme: parsed?.theme || 'light',
    };
  });

  useEffect(() => {
    localStorage.setItem('verde_financas_state', JSON.stringify(state));
    if (state.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [state]);

  const calculateGreenScore = useCallback(() => {
    if (!state.user) return 450;
    
    let score = 500; // Base score
    
    // Fator 1: Orçamentos (Azul vs Vermelho)
    const overBudgetCount = state.budgets.filter(b => b.spent > b.limit).length;
    score -= overBudgetCount * 50;
    
    // Fator 2: Taxa de Poupança (Último mês)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyIncome = state.transactions.filter(t => t.date.startsWith(currentMonth) && t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const monthlyExpense = state.transactions.filter(t => t.date.startsWith(currentMonth) && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    
    if (monthlyIncome > 0) {
      const savingRate = (monthlyIncome - monthlyExpense) / monthlyIncome;
      if (savingRate > 0.2) score += 100;
      if (savingRate > 0.5) score += 100;
      if (savingRate < 0) score -= 100;
    }

    // Fator 3: Metas
    const goalsDone = state.goals.filter(g => g.currentAmount >= g.targetAmount).length;
    score += goalsDone * 40;

    return Math.max(0, Math.min(1000, score));
  }, [state.budgets, state.transactions, state.goals, state.user]);

  const checkAchievements = useCallback(() => {
    if (!state.user) return [];
    const unlocked = [...state.user.achievements];
    const now = new Date().toISOString();

    // Regra 1: 1 Transaction
    if (state.transactions.length >= 1 && !unlocked.find(a => a.id === 'ach-1')) {
      unlocked.push({ ...ACHIEVEMENTS[0], unlockedAt: now });
    }

    // Regra 3: 5 Investments
    if (state.investments.length >= 5 && !unlocked.find(a => a.id === 'ach-3')) {
      unlocked.push({ ...ACHIEVEMENTS[2], unlockedAt: now });
    }

    // Nota: Regra '3_months_blue' exigiria histórico complexo, simulamos baseada no score atual alto
    if (calculateGreenScore() > 800 && state.transactions.length > 20 && !unlocked.find(a => a.id === 'ach-2')) {
      unlocked.push({ ...ACHIEVEMENTS[1], unlockedAt: now });
    }

    return unlocked;
  }, [state.transactions, state.investments, state.user, calculateGreenScore]);

  useEffect(() => {
    const newScore = calculateGreenScore();
    const newAchievements = checkAchievements();
    
    if (state.user && (state.user.score !== newScore || state.user.achievements.length !== newAchievements.length)) {
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, score: newScore, achievements: newAchievements } : null
      }));
    }
  }, [state.transactions, state.budgets, state.investments, state.goals]);

  // ... (Resto das funções de CRUD mantidas iguais)
  const toggleTheme = useCallback(() => setState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' })), []);
  const updateUserProfile = useCallback((u: UserProfile) => setState(prev => ({ ...prev, user: u })), []);
  const logout = useCallback(() => setState(prev => ({ ...prev, user: null })), []);
  const addCategory = useCallback((c: Omit<Category, 'id'>) => setState(prev => ({ ...prev, categories: [...prev.categories, { ...c, id: `cat-${Date.now()}` }] })), []);
  const updateCategory = useCallback((id: string, c: Partial<Omit<Category, 'id'>>) => setState(prev => ({ ...prev, categories: prev.categories.map(cat => cat.id === id ? { ...cat, ...c } : cat) })), []);
  const deleteCategory = useCallback((id: string) => setState(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id).map(c => c.parentId === id ? { ...c, parentId: undefined } : c) })), []);
  const addAccount = useCallback((a: Omit<Account, 'id'>) => setState(prev => ({ ...prev, accounts: [...prev.accounts, { ...a, id: `acc-${Date.now()}` }] })), []);
  const updateAccount = useCallback((id: string, a: Partial<Omit<Account, 'id'>>) => setState(prev => ({ ...prev, accounts: prev.accounts.map(acc => acc.id === id ? { ...acc, ...a } : acc) })), []);
  const deleteAccount = useCallback((id: string) => setState(prev => ({ ...prev, accounts: prev.accounts.filter(a => a.id !== id) })), []);
  
  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const newId = `tr-${Date.now()}`;
    setState(prev => {
      const updatedAccounts = prev.accounts.map(acc => {
        if (t.type === 'transfer') {
          if (acc.id === t.accountId) return { ...acc, balance: acc.balance - t.amount };
          if (acc.id === t.toAccountId) return { ...acc, balance: acc.balance + t.amount };
        } else if (t.type === 'adjustment') {
           if (acc.id === t.accountId) return { ...acc, balance: acc.balance + t.amount };
        } else {
          if (acc.id === t.accountId) return { ...acc, balance: acc.balance + (t.type === 'income' ? t.amount : -t.amount) };
        }
        return acc;
      });
      return { ...prev, accounts: updatedAccounts, transactions: [{ ...t, id: newId }, ...prev.transactions] };
    });
  }, []);

  const updateTransaction = useCallback((id: string, updatedData: Partial<Omit<Transaction, 'id'>>) => {
    setState(prev => {
      const oldTr = prev.transactions.find(t => t.id === id);
      if (!oldTr) return prev;
      let revertedAccounts = prev.accounts.map(acc => {
        if (oldTr.type === 'transfer') {
          if (acc.id === oldTr.accountId) return { ...acc, balance: acc.balance + oldTr.amount };
          if (acc.id === oldTr.toAccountId) return { ...acc, balance: acc.balance - oldTr.amount };
        } else if (oldTr.type === 'adjustment') {
          if (acc.id === oldTr.accountId) return { ...acc, balance: acc.balance - oldTr.amount };
        } else {
          if (acc.id === oldTr.accountId) return { ...acc, balance: acc.balance - (oldTr.type === 'income' ? oldTr.amount : -oldTr.amount) };
        }
        return acc;
      });
      const finalTr = { ...oldTr, ...updatedData };
      const finalAccounts = revertedAccounts.map(acc => {
        if (finalTr.type === 'transfer') {
          if (acc.id === finalTr.accountId) return { ...acc, balance: acc.balance - finalTr.amount };
          if (acc.id === finalTr.toAccountId) return { ...acc, balance: acc.balance + finalTr.amount };
        } else if (finalTr.type === 'adjustment') {
          if (acc.id === finalTr.accountId) return { ...acc, balance: finalTr.amount };
        } else {
          if (acc.id === finalTr.accountId) return { ...acc, balance: acc.balance + (finalTr.type === 'income' ? finalTr.amount : -finalTr.amount) };
        }
        return acc;
      });
      return { ...prev, accounts: finalAccounts, transactions: prev.transactions.map(t => t.id === id ? finalTr : t) };
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setState(prev => {
      const tr = prev.transactions.find(t => t.id === id);
      if (!tr) return prev;
      const updatedAccounts = prev.accounts.map(acc => {
        if (tr.type === 'transfer') {
          if (acc.id === tr.accountId) return { ...acc, balance: acc.balance + tr.amount };
          if (acc.id === tr.toAccountId) return { ...acc, balance: acc.balance - tr.amount };
        } else if (tr.type === 'adjustment') {
          if (acc.id === tr.accountId) return { ...acc, balance: acc.balance - tr.amount };
        } else {
          if (acc.id === tr.accountId) return { ...acc, balance: acc.balance - (tr.type === 'income' ? tr.amount : -tr.amount) };
        }
        return acc;
      });
      return { ...prev, accounts: updatedAccounts, transactions: prev.transactions.filter(t => t.id !== id) };
    });
  }, []);

  const addBudget = useCallback((b: Omit<Budget, 'id' | 'spent'>) => setState(prev => ({ ...prev, budgets: [...prev.budgets, { ...b, id: `bud-${Date.now()}`, spent: 0 }] })), []);
  const updateBudget = useCallback((id: string, b: Partial<Omit<Budget, 'id' | 'spent'>>) => setState(prev => ({ ...prev, budgets: prev.budgets.map(bud => bud.id === id ? { ...bud, ...b } : bud) })), []);
  const deleteBudget = useCallback((id: string) => setState(prev => ({ ...prev, budgets: prev.budgets.filter(b => b.id !== id) })), []);
  const addSchedule = useCallback((s: Omit<Schedule, 'id'>) => setState(prev => ({ ...prev, schedules: [...prev.schedules, { ...s, id: `sch-${Date.now()}` }] })), []);
  const updateSchedule = useCallback((id: string, s: Partial<Omit<Schedule, 'id'>>) => setState(prev => ({ ...prev, schedules: prev.schedules.map(sch => sch.id === id ? { ...sch, ...s } : sch) })), []);
  const deleteSchedule = useCallback((id: string) => setState(prev => ({ ...prev, schedules: prev.schedules.filter(s => s.id !== id) })), []);
  const addInvestment = useCallback((i: Omit<Investment, 'id'>) => setState(prev => ({ ...prev, investments: [...prev.investments, { ...i, id: `inv-${Date.now()}` }] })), []);
  const updateInvestment = useCallback((id: string, i: Partial<Omit<Investment, 'id'>>) => setState(prev => ({ ...prev, investments: prev.investments.map(inv => inv.id === id ? { ...inv, ...i } : inv) })), []);
  const deleteInvestment = useCallback((id: string) => setState(prev => ({ ...prev, investments: prev.investments.filter(i => i.id !== id) })), []);
  const addGoal = useCallback((g: Omit<Goal, 'id'>) => setState(prev => ({ ...prev, goals: [...prev.goals, { ...g, id: `goal-${Date.now()}` }] })), []);
  const updateGoal = useCallback((id: string, g: Partial<Omit<Goal, 'id'>>) => setState(prev => ({ ...prev, goals: prev.goals.map(goal => goal.id === id ? { ...goal, ...g } : goal) })), []);
  const deleteGoal = useCallback((id: string) => setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) })), []);
  
  const refreshState = useCallback(() => {
    setState(prev => {
      const updatedBudgets = prev.budgets.map(budget => {
        const spent = prev.transactions.filter(t => t.categoryId === budget.categoryId && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { ...budget, spent };
      });
      return { ...prev, budgets: updatedBudgets };
    });
  }, []);

  return (
    <FinanceContext.Provider value={{ 
      ...state, 
      addCategory, updateCategory, deleteCategory, 
      addAccount, updateAccount, deleteAccount, 
      addTransaction, updateTransaction, deleteTransaction,
      addBudget, updateBudget, deleteBudget,
      addSchedule, updateSchedule, deleteSchedule,
      addInvestment, updateInvestment, deleteInvestment,
      addGoal, updateGoal, deleteGoal,
      refreshState, updateUserProfile, logout, toggleTheme
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};
