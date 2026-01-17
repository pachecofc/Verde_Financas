
import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ArrowLeftRight, PieChart, CalendarDays, Settings, CreditCard, LogOut,
  Menu, X, Tags, Camera, User as UserIcon, Check, Lock, ChevronDown, ChevronUp, TrendingUp,
  Moon, Sun, Crown, Shield, Eye, EyeOff, Sparkles, BrainCircuit, HeartPulse
} from 'lucide-react';
import { useFinance } from '../FinanceContext';
import { UserPlan } from '../types';
import { AiAssistant } from './AiAssistant';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  
  const { user, theme, toggleTheme, updateUserProfile, logout: contextLogout } = useFinance();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
    plan: user?.plan || 'basic' as UserPlan,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transações', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Contas', path: '/accounts', icon: CreditCard },
    { name: 'Saúde Financeira', path: '/health', icon: HeartPulse },
    { name: 'Investimentos', path: '/investments', icon: TrendingUp },
    { name: 'Orçamentos', path: '/budgets', icon: PieChart },
    { name: 'Programação', path: '/schedule', icon: CalendarDays },
    { name: 'Categorias', path: '/categories', icon: Tags },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    contextLogout();
    navigate('/login');
  };

  const handleAvatarClick = () => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      avatar: user?.avatar || '',
      plan: user?.plan || 'basic',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      ...user!,
      name: profileForm.name,
      email: profileForm.email,
      avatar: profileForm.avatar,
      plan: profileForm.plan
    });
    setIsProfileModalOpen(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileForm(prev => ({ ...prev, avatar: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 dark:bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">V</div>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Verde<span className="text-emerald-600 dark:text-emerald-400">Finanças</span></span>
          </div>
          <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
            {menuItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.path) ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </button>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all">
              <LogOut className="w-5 h-5" /> Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-30 transition-colors">
          <button onClick={() => setIsOpen(true)} className="md:hidden text-slate-600 dark:text-slate-300"><Menu className="w-6 h-6" /></button>
          <div className="flex items-center gap-4 ml-auto cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl transition-all group" onClick={handleAvatarClick}>
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-1.5">
                 <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{user?.name || 'Visitante'}</p>
              </div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                 <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{user?.score} Score</p>
              </div>
            </div>
            <div className="relative">
               {user?.avatar ? (
                 <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-emerald-100 dark:border-emerald-900/30 object-cover shadow-sm group-hover:border-emerald-500 transition-all" alt="Avatar" />
               ) : (
                 <div className="w-10 h-10 rounded-full border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:border-emerald-500 transition-all shadow-sm"><UserIcon className="w-5 h-5" /></div>
               )}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">{children}</div>
        </div>

        {/* Floating AI Button */}
        <button 
          onClick={() => setIsAiOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group z-40"
          title="Assistente Financeiro IA"
        >
          <BrainCircuit className="w-7 h-7 group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-amber-900" />
          </div>
        </button>

        <AiAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      </main>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsProfileModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Meu Perfil</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-emerald-50 dark:border-emerald-900/30 shadow-xl relative bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center transition-transform group-hover:scale-105">
                    {profileForm.avatar ? <img src={profileForm.avatar} alt="Preview" className="w-full h-full object-cover" /> : <UserIcon className="w-12 h-12 text-emerald-300" />}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all"><Camera className="w-6 h-6" /></div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input type="text" required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-slate-100 font-bold" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                  <input type="email" required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-slate-100 font-bold" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Minha Assinatura</label>
                  <select className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-slate-100 font-bold" value={profileForm.plan} onChange={e => setProfileForm({...profileForm, plan: e.target.value as UserPlan})}>
                    <option value="basic">Plano Básico (Gratuito)</option>
                    <option value="premium">Plano PRO (Premium)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 dark:shadow-none transition-all active:scale-[0.98] mt-4">
                Confirmar Alterações
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
