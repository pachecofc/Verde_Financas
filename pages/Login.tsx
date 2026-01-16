
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../FinanceContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { updateUserProfile } = useFinance();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: formData.name,
      email: formData.email,
      avatar: undefined
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-emerald-200 mx-auto mb-4">
            V
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bem-vindo de volta!</h1>
          <p className="text-slate-500">Entre para gerenciar suas finanças com facilidade.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 ml-1">Seu Nome</label>
            <input 
              type="text" 
              placeholder="Como quer ser chamado?" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 ml-1">E-mail</label>
            <input 
              type="email" 
              placeholder="seu@email.com" 
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-sm font-semibold text-slate-700 ml-1">Senha</label>
              <button type="button" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Esqueceu a senha?</button>
            </div>
            <input 
              type="password" 
              placeholder="••••••••" 
              required
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
          >
            Entrar no VerdeFinanças
          </button>
        </form>

        <div className="text-center">
          <p className="text-slate-500 text-sm">
            Ainda não tem conta? <button className="text-emerald-600 font-bold hover:underline">Crie agora gratuitamente</button>
          </p>
        </div>
      </div>
    </div>
  );
};
