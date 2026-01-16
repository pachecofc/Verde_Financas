
export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  parentId?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'credit';
  balance: number;
  lastFour?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  type: TransactionType;
}

export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
  spent: number;
}

export interface Schedule {
  id: string;
  description: string;
  amount: number;
  date: string;
  frequency: 'once' | 'monthly' | 'weekly';
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  type: TransactionType;
}

export interface Investment {
  id: string;
  name: string;
  type: 'fixed' | 'stocks' | 'crypto' | 'fii' | 'other';
  amount: number;
  institution: string;
  color: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
  color: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

export interface FinanceState {
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  schedules: Schedule[];
  investments: Investment[];
  goals: Goal[];
  user: UserProfile | null;
}
