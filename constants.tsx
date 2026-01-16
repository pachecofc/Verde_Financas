
import { Category, Account } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Salário', type: 'income', icon: '💰', color: '#10b981' },
  { id: 'cat-2', name: 'Alimentação', type: 'expense', icon: '🍎', color: '#f59e0b' },
  { id: 'cat-3', name: 'Moradia', type: 'expense', icon: '🏠', color: '#3b82f6' },
  { id: 'cat-4', name: 'Transporte', type: 'expense', icon: '🚗', color: '#6366f1' },
  { id: 'cat-5', name: 'Lazer', type: 'expense', icon: '🎨', color: '#ec4899' },
  { id: 'cat-6', name: 'Freelance', type: 'income', icon: '💻', color: '#8b5cf6' },
];

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'NuBank Principal', type: 'bank', balance: 2500.50 },
  { id: 'acc-2', name: 'Cartão Inter', type: 'credit', balance: -450.00 },
];
