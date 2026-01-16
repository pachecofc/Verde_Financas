
export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  parentId?: string; // ID da categoria pai
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
  toAccountId?: string; // Para transferências
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
  toAccountId?: string; // Para transferências programadas
  type: TransactionType;
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
  user: UserProfile | null;
}
