
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FinanceState, Category, Account, Transaction, Budget, Schedule, UserProfile, Investment, Goal } from './types';
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
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FinanceState>(() => {
    const saved = localStorage.getItem('verde_financas_state');
    if (saved) return JSON.parse(saved);
    return {
      categories: INITIAL_CATEGORIES,
      accounts: INITIAL_ACCOUNTS,
      transactions: [],
      budgets: [],
      schedules: [],
      investments: [],
      goals: [],
      user: null,
    };
  });

  useEffect(() => {
    localStorage.setItem('verde_financas_state', JSON.stringify(state));
  }, [state]);

  const updateUserProfile = useCallback((u: UserProfile) => {
    setState(prev => ({ ...prev, user: u }));
  }, []);

  const logout = useCallback(() => {
    setState(prev => ({ ...prev, user: null }));
  }, []);

  const addCategory = useCallback((c: Omit<Category, 'id'>) => {
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, { ...c, id: `cat-${Date.now()}` }]
    }));
  }, []);

  const updateCategory = useCallback((id: string, c: Partial<Omit<Category, 'id'>>) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(cat => cat.id === id ? { ...cat, ...c } : cat)
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories
        .filter(c => c.id !== id)
        .map(c => c.parentId === id ? { ...c, parentId: undefined } : c)
    }));
  }, []);

  const addAccount = useCallback((a: Omit<Account, 'id'>) => {
    setState(prev => ({
      ...prev,
      accounts: [...prev.accounts, { ...a, id: `acc-${Date.now()}` }]
    }));
  }, []);

  const updateAccount = useCallback((id: string, a: Partial<Omit<Account, 'id'>>) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.map(acc => acc.id === id ? { ...acc, ...a } : acc)
    }));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== id)
    }));
  }, []);

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
          if (acc.id === t.accountId) {
            return { ...acc, balance: acc.balance + (t.type === 'income' ? t.amount : -t.amount) };
          }
        }
        return acc;
      });

      return {
        ...prev,
        accounts: updatedAccounts,
        transactions: [{ ...t, id: newId }, ...prev.transactions]
      };
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
          if (acc.id === oldTr.accountId) {
            return { ...acc, balance: acc.balance - (oldTr.type === 'income' ? oldTr.amount : -oldTr.amount) };
          }
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
          if (acc.id === finalTr.accountId) {
            return { ...acc, balance: acc.balance + (finalTr.type === 'income' ? finalTr.amount : -finalTr.amount) };
          }
        }
        return acc;
      });

      return {
        ...prev,
        accounts: finalAccounts,
        transactions: prev.transactions.map(t => t.id === id ? finalTr : t)
      };
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
          if (acc.id === tr.accountId) {
            return { ...acc, balance: acc.balance - (tr.type === 'income' ? tr.amount : -tr.amount) };
          }
        }
        return acc;
      });

      return {
        ...prev,
        accounts: updatedAccounts,
        transactions: prev.transactions.filter(t => t.id !== id)
      };
    });
  }, []);

  const addBudget = useCallback((b: Omit<Budget, 'id' | 'spent'>) => {
    setState(prev => ({
      ...prev,
      budgets: [...prev.budgets, { ...b, id: `bud-${Date.now()}`, spent: 0 }]
    }));
  }, []);

  const updateBudget = useCallback((id: string, b: Partial<Omit<Budget, 'id' | 'spent'>>) => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.map(bud => bud.id === id ? { ...bud, ...b } : bud)
    }));
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.filter(b => b.id !== id)
    }));
  }, []);

  const addSchedule = useCallback((s: Omit<Schedule, 'id'>) => {
    setState(prev => ({
      ...prev,
      schedules: [...prev.schedules, { ...s, id: `sch-${Date.now()}` }]
    }));
  }, []);

  const updateSchedule = useCallback((id: string, s: Partial<Omit<Schedule, 'id'>>) => {
    setState(prev => ({
      ...prev,
      schedules: prev.schedules.map(sch => sch.id === id ? { ...sch, ...s } : sch)
    }));
  }, []);

  const deleteSchedule = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      schedules: prev.schedules.filter(s => s.id !== id)
    }));
  }, []);

  const addInvestment = useCallback((i: Omit<Investment, 'id'>) => {
    setState(prev => ({
      ...prev,
      investments: [...prev.investments, { ...i, id: `inv-${Date.now()}` }]
    }));
  }, []);

  const updateInvestment = useCallback((id: string, i: Partial<Omit<Investment, 'id'>>) => {
    setState(prev => ({
      ...prev,
      investments: prev.investments.map(inv => inv.id === id ? { ...inv, ...i } : inv)
    }));
  }, []);

  const deleteInvestment = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      investments: prev.investments.filter(i => i.id !== id)
    }));
  }, []);

  const addGoal = useCallback((g: Omit<Goal, 'id'>) => {
    setState(prev => ({
      ...prev,
      goals: [...prev.goals, { ...g, id: `goal-${Date.now()}` }]
    }));
  }, []);

  const updateGoal = useCallback((id: string, g: Partial<Omit<Goal, 'id'>>) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(goal => goal.id === id ? { ...goal, ...g } : goal)
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id)
    }));
  }, []);

  const refreshState = useCallback(() => {
    setState(prev => {
      const updatedBudgets = prev.budgets.map(budget => {
        const spent = prev.transactions
          .filter(t => t.categoryId === budget.categoryId && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        return { ...budget, spent };
      });
      if (JSON.stringify(prev.budgets) === JSON.stringify(updatedBudgets)) return prev;
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
      refreshState, updateUserProfile, logout
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
