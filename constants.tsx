
import { Category, Account } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  // --- LIBERDADE FINANCEIRA ---
  { id: 'cat-lib-fin', name: 'Liberdade Financeira', type: 'expense', icon: '🕊️', color: '#10b981' },
  { id: 'cat-inv', name: 'Investimentos', type: 'expense', icon: '📈', color: '#10b981', parentId: 'cat-lib-fin' },

  // --- EDUCAÇÃO ---
  { id: 'cat-edu', name: 'Educação', type: 'expense', icon: '🎓', color: '#3b82f6' },
  { id: 'cat-mens-esc', name: 'Mensalidade Escolar', type: 'expense', icon: '🏫', color: '#3b82f6', parentId: 'cat-edu' },
  { id: 'cat-curs', name: 'Cursos', type: 'expense', icon: '📚', color: '#3b82f6', parentId: 'cat-edu' },

  // --- NECESSIDADES ---
  { id: 'cat-nec', name: 'Necessidades', type: 'expense', icon: '🏠', color: '#6366f1' },
  { id: 'cat-cond', name: 'Condomínio', type: 'expense', icon: '🏢', color: '#6366f1', parentId: 'cat-nec' },
  { id: 'cat-consumo', name: 'Contas de Consumo', type: 'expense', icon: '💡', color: '#6366f1', parentId: 'cat-nec' },
  { id: 'cat-taxas', name: 'Taxas e Impostos', type: 'expense', icon: '📜', color: '#6366f1', parentId: 'cat-nec' },
  { id: 'cat-telef', name: 'Telefonia', type: 'expense', icon: '📱', color: '#6366f1', parentId: 'cat-nec' },
  { id: 'cat-alim', name: 'Alimentação', type: 'expense', icon: '🍎', color: '#6366f1', parentId: 'cat-nec' },
  { id: 'cat-transp', name: 'Transporte', type: 'expense', icon: '🚗', color: '#6366f1', parentId: 'cat-nec' },
  { id: 'cat-vest', name: 'Vestuário', type: 'expense', icon: '👕', color: '#6366f1', parentId: 'cat-nec' },
  { id: 'cat-pets', name: 'Animais de Estimação', type: 'expense', icon: '🐾', color: '#6366f1', parentId: 'cat-nec' },
  { id: 'cat-saude', name: 'Saúde', type: 'expense', icon: '🏥', color: '#6366f1', parentId: 'cat-nec' },
  { id: 'cat-aluguel', name: 'Aluguel', type: 'expense', icon: '🔑', color: '#6366f1', parentId: 'cat-nec' },
  { id: 'cat-manut', name: 'Manutenção', type: 'expense', icon: '🛠️', color: '#6366f1', parentId: 'cat-nec' },

  // --- DIVERSÃO ---
  { id: 'cat-div', name: 'Diversão', type: 'expense', icon: '🍿', color: '#ec4899' },
  { id: 'cat-viag', name: 'Viagens', type: 'expense', icon: '✈️', color: '#ec4899', parentId: 'cat-div' },
  { id: 'cat-rest', name: 'Restaurantes', type: 'expense', icon: '🍽️', color: '#ec4899', parentId: 'cat-div' },
  { id: 'cat-stream', name: 'Streaming', type: 'expense', icon: '📺', color: '#ec4899', parentId: 'cat-div' },
  { id: 'cat-cinema', name: 'Cinema', type: 'expense', icon: '🎬', color: '#ec4899', parentId: 'cat-div' },
  { id: 'cat-spa', name: 'Spa', type: 'expense', icon: '🧖', color: '#ec4899', parentId: 'cat-div' },
  { id: 'cat-pass', name: 'Passeios', type: 'expense', icon: '🎡', color: '#ec4899', parentId: 'cat-div' },

  // --- DOAÇÃO ---
  { id: 'cat-doa', name: 'Doação', type: 'expense', icon: '💝', color: '#f43f5e' },
  { id: 'cat-carid', name: 'Caridade', type: 'expense', icon: '🤝', color: '#f43f5e', parentId: 'cat-doa' },
  { id: 'cat-pres', name: 'Presentes', type: 'expense', icon: '🎁', color: '#f43f5e', parentId: 'cat-doa' },

  // --- GASTOS DE LONGO PRAZO ---
  { id: 'cat-lp', name: 'Gastos de Longo Prazo', type: 'expense', icon: '⏳', color: '#8b5cf6' },
  { id: 'cat-carro', name: 'Novo carro', type: 'expense', icon: '🚘', color: '#8b5cf6', parentId: 'cat-lp' },
  { id: 'cat-casa', name: 'Nova casa', type: 'expense', icon: '🏡', color: '#8b5cf6', parentId: 'cat-lp' },
  { id: 'cat-eletro', name: 'Novos eletrodomésticos', type: 'expense', icon: '🧊', color: '#8b5cf6', parentId: 'cat-lp' },
  { id: 'cat-eletron', name: 'Novos eletrônicos', type: 'expense', icon: '💻', color: '#8b5cf6', parentId: 'cat-lp' },

  // --- RECEITAS (PADRÃO) ---
  { id: 'cat-sal', name: 'Salário', type: 'income', icon: '💰', color: '#10b981' },
  { id: 'cat-free', name: 'Freelance', type: 'income', icon: '💻', color: '#8b5cf6' },
  { id: 'cat-inv-inc', name: 'Rendimentos', type: 'income', icon: '📈', color: '#10b981' },
];

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'NuBank Principal', type: 'bank', balance: 2500.50 },
  { id: 'acc-2', name: 'Cartão Inter', type: 'credit', balance: -450.00 },
];
