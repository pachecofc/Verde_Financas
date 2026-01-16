
import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  CalendarDays, 
  Settings, 
  CreditCard, 
  LogOut,
  Menu,
  X,
  Tags,
  Camera,
  User as UserIcon,
  Check,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useFinance } from '../FinanceContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const { user, updateUserProfile, logout: contextLogout } = useFinance();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transações', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Contas', path: '/accounts', icon: CreditCard },
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
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordSection(false);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação simples de senha se o usuário preencheu a nova senha
    if (profileForm.newPassword) {
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        alert("A nova senha e a confirmação não coincidem!");
        return;
      }
      if (!profileForm.currentPassword) {
        alert("Por favor, insira sua senha atual para realizar a alteração.");
        return;
      }
      // Aqui em um app real enviaríamos para o backend.
      console.log("Senha alterada com sucesso!");
    }

    updateUserProfile({
      name: profileForm.name,
      email: profileForm.email,
      avatar: profileForm.avatar
    });
    setIsProfileModalOpen(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-200">
              V
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">Verde<span className="text-emerald-600">Finanças</span></span>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                  ${isActive(item.path) 
                    ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <button onClick={() => setIsOpen(true)} className="md:hidden text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
          
          <div 
            className="flex items-center gap-4 ml-auto cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all group"
            onClick={handleAvatarClick}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-tight">Olá, {user?.name || 'Visitante'}</p>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Editar Perfil</p>
            </div>
            <div className="relative">
               {user?.avatar ? (
                 <img 
                  src={user.avatar} 
                  className="w-10 h-10 rounded-full border-2 border-emerald-100 object-cover shadow-sm group-hover:border-emerald-500 transition-all" 
                  alt="Avatar" 
                />
               ) : (
                 <div className="w-10 h-10 rounded-full border-2 border-emerald-100 bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:border-emerald-500 transition-all shadow-sm">
                    <UserIcon className="w-5 h-5" />
                 </div>
               )}
               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <Settings className="w-2.5 h-2.5 text-slate-400" />
               </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsProfileModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-900">Editar Perfil</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-emerald-100 shadow-lg relative bg-emerald-50 flex items-center justify-center">
                    {profileForm.avatar ? (
                      <img src={profileForm.avatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-emerald-300" />
                    )}
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageChange}
                  />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Foto de Perfil</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nome Completo</label>
                  <input 
                    type="text" required
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                    value={profileForm.name}
                    onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">E-mail</label>
                  <input 
                    type="email" required
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                    value={profileForm.email}
                    onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                  />
                </div>
              </div>

              {/* Password Change Section */}
              <div className="border-t border-slate-100 pt-4 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Alterar Senha</span>
                  </div>
                  {showPasswordSection ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {showPasswordSection && (
                  <div className="space-y-4 mt-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Senha Atual</label>
                      <input 
                        type="password"
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                        placeholder="••••••••"
                        value={profileForm.currentPassword}
                        onChange={e => setProfileForm({...profileForm, currentPassword: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nova Senha</label>
                      <input 
                        type="password"
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                        placeholder="••••••••"
                        value={profileForm.newPassword}
                        onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirmar Nova Senha</label>
                      <input 
                        type="password"
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                        placeholder="••••••••"
                        value={profileForm.confirmPassword}
                        onChange={e => setProfileForm({...profileForm, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-[0.98] mt-4"
              >
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
