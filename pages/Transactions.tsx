
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFinance } from '../FinanceContext';
import { 
  Plus, Search, Trash2, Edit2, ArrowRightLeft, SlidersHorizontal, 
  ChevronRight, Filter, X, Calendar, Upload, FileText, Check, AlertCircle, 
  ChevronLeft, Camera, RefreshCw, Sparkles, Loader2, Crown, Zap, ShieldCheck
} from 'lucide-react';
import { TransactionType, Transaction, Category } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

export const Transactions: React.FC = () => {
  const { transactions, categories, accounts, user, addTransaction, updateTransaction, deleteTransaction, theme, updateUserProfile } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Câmera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const [filters, setFilters] = useState({ startDate: '', endDate: '', categoryId: '', accountId: '' });

  const [formData, setFormData] = useState({
    description: '', amount: '', targetBalance: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '', accountId: '', toAccountId: '', type: 'expense' as TransactionType,
  });

  useEffect(() => {
    if (showScanner && stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play().catch(e => console.error("Erro ao iniciar autoplay:", e));
      };
    }
  }, [showScanner, stream]);

  useEffect(() => {
    if (showModal && !editingId && !formData.description) {
      const firstExpenseCat = categories.find(c => c.type === 'expense')?.id || '';
      const firstAccount = accounts[0]?.id || '';
      setFormData(prev => ({
        ...prev,
        categoryId: firstExpenseCat,
        accountId: firstAccount,
        type: 'expense'
      }));
    }
  }, [showModal, editingId, categories, accounts]);

  const handleScannerClick = () => {
    if (user?.plan === 'premium') {
      startCamera();
    } else {
      setShowUpgradeModal(true);
    }
  };

  const getInitialFacingMode = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    return isMobile ? 'environment' : 'user';
  };

  const startCamera = async (mode?: 'user' | 'environment') => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    const modeToUse = mode || getInitialFacingMode();
    setFacingMode(modeToUse);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: modeToUse, width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      setShowScanner(true);
    } catch (err) {
      if (!mode) {
        startCamera(modeToUse === 'environment' ? 'user' : 'environment');
      } else {
        alert("Não foi possível acessar a câmera.");
        console.error(err);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowScanner(false);
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(newMode);
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsScanning(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') {
      ctx?.translate(canvas.width, 0);
      ctx?.scale(-1, 1);
    }
    ctx?.drawImage(video, 0, 0);
    const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: "Extraia os dados deste cupom fiscal. Retorne um JSON com: 'estabelecimento', 'data' (YYYY-MM-DD), 'valor_total' (number) e uma string curta 'resumo_itens' listando os principais itens." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estabelecimento: { type: Type.STRING },
              data: { type: Type.STRING },
              valor_total: { type: Type.NUMBER },
              resumo_itens: { type: Type.STRING }
            },
            required: ["estabelecimento", "data", "valor_total"]
          }
        }
      });
      const data = JSON.parse(response.text);
      setFormData({
        description: `${data.estabelecimento}${data.resumo_itens ? ' (' + data.resumo_itens + ')' : ''}`,
        amount: data.valor_total.toString(),
        targetBalance: '',
        date: data.data || new Date().toISOString().split('T')[0],
        categoryId: categories.find(c => c.type === 'expense')?.id || '',
        accountId: accounts[0]?.id || '',
        toAccountId: '',
        type: 'expense'
      });
      stopCamera();
      setShowModal(true);
    } catch (err) {
      alert("Erro ao ler a nota. Tente novamente.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalAmount = parseFloat(formData.amount);
    if (formData.type === 'adjustment') {
      const account = accounts.find(a => a.id === formData.accountId);
      if (account) finalAmount = parseFloat(formData.targetBalance) - account.balance;
    }
    const finalCategoryId = (formData.type === 'transfer' || formData.type === 'adjustment') ? `sys-${formData.type}` : formData.categoryId;
    const transactionData = {
      description: formData.description,
      amount: finalAmount,
      date: formData.date,
      categoryId: finalCategoryId,
      accountId: formData.accountId,
      toAccountId: formData.type === 'transfer' ? formData.toAccountId : undefined,
      type: formData.type,
    };
    if (editingId) updateTransaction(editingId, transactionData);
    else addTransaction(transactionData);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      description: '', amount: '', targetBalance: '',
      date: new Date().toISOString().split('T')[0],
      categoryId: '', accountId: '', toAccountId: '', type: 'expense',
    });
  };

  const getCategoryFullName = (catId: string) => {
    if (catId === 'sys-transfer') return '🔄 Transferência';
    if (catId === 'sys-adjustment') return '⚖️ Ajuste de Saldo';
    const cat = categories.find(c => c.id === catId);
    if (!cat) return '';
    if (!cat.parentId) return `${cat.icon} ${cat.name}`;
    const parent = categories.find(c => c.id === cat.parentId);
    return `${parent?.icon || ''} ${parent?.name || ''} > ${cat.icon} ${cat.name}`;
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStartDate = !filters.startDate || t.date >= filters.startDate;
      const matchEndDate = !filters.endDate || t.date <= filters.endDate;
      const matchCategory = !filters.categoryId || t.categoryId === filters.categoryId;
      const matchAccount = !filters.accountId || t.accountId === filters.accountId || t.toAccountId === filters.accountId;
      return matchSearch && matchStartDate && matchEndDate && matchCategory && matchAccount;
    });
  }, [transactions, searchTerm, filters]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Transações</h1>
          <p className="text-slate-500 dark:text-slate-400">Gerencie seus lançamentos e escaneie notas fiscais.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={handleScannerClick}
            className="flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-slate-800/50 px-5 py-3 rounded-xl transition-all font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-[0.98] relative"
          >
            <Camera className="w-5 h-5" />
            Scanner de Nota
            {user?.plan === 'basic' && <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 rounded-full p-1 shadow-sm"><Crown className="w-3 h-3" /></div>}
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-5 py-3 rounded-xl transition-all font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98]"
          >
            <Upload className="w-5 h-5" />
            Importar CSV
          </button>
          <button 
            onClick={() => { setEditingId(null); setShowModal(true); }}
            className="flex items-center justify-center gap-2 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 text-white px-6 py-3 rounded-xl transition-all font-semibold shadow-lg shadow-emerald-100 dark:shadow-none active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Novo Lançamento
          </button>
        </div>
      </div>

      {/* Tabela e Filtros seguem o mesmo padrão... */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-all">
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar por descrição..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
             <input type="date" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
             <input type="date" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
             <select className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 outline-none" value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
               <option value="">Todas Categorias</option>
               {categories.map(c => <option key={c.id} value={c.id}>{getCategoryFullName(c.id)}</option>)}
             </select>
             <select className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 outline-none" value={filters.accountId} onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}>
               <option value="">Todas as Contas</option>
               {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
             </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo/Cat</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Conta</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Valor</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredTransactions.map(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                const acc = accounts.find(a => a.id === t.accountId);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group text-sm">
                    <td className="px-6 py-4">
                       <p className="font-medium text-slate-900 dark:text-slate-100">{t.description}</p>
                       <p className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(t.date + 'T00:00:00').toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                       <span className="inline-flex items-center text-xs font-medium text-slate-800 dark:text-slate-200">
                         {cat?.icon} {cat?.name || 'Sistema'}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{acc?.name}</td>
                    <td className={`px-6 py-4 font-bold text-right ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(Math.abs(t.amount))}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                         <button onClick={() => { setEditingId(t.id); setShowModal(true); }} className="text-slate-400 hover:text-emerald-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                         <button onClick={() => deleteTransaction(t.id)} className="text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Scanner Inteligente */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          <div className="p-6 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
             <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                   <Sparkles className="w-5 h-5 text-emerald-400" />
                   Scanner PRO
                </h3>
             </div>
             <button onClick={stopCamera} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                <X className="w-6 h-6" />
             </button>
          </div>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
             <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[80%] aspect-[3/4] border-2 border-emerald-500/50 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] flex items-center justify-center">
                   {isScanning && (
                     <div className="absolute inset-0 bg-emerald-500/10 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                        <span className="text-emerald-400 font-bold tracking-widest text-xs uppercase animate-pulse">Inteligência Gemini Ativa...</span>
                     </div>
                   )}
                </div>
             </div>
          </div>
          <div className="p-10 flex items-center justify-center gap-8 bg-gradient-to-t from-black/80 to-transparent">
             <button onClick={toggleCamera} className="p-4 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"><RefreshCw className="w-6 h-6" /></button>
             <button disabled={isScanning} onClick={captureAndScan} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-90"><div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black"><Camera className="w-8 h-8" /></div></button>
             <div className="w-14" />
             <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}

      {/* Paywall Modal (Upgrade) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowUpgradeModal(false)} />
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="h-48 bg-gradient-to-br from-emerald-600 to-emerald-400 flex flex-col items-center justify-center text-white relative">
                 <button onClick={() => setShowUpgradeModal(false)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X className="w-5 h-5" /></button>
                 <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-sm"><Crown className="w-10 h-10 text-white" /></div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter">Verde PRO</h2>
              </div>
              <div className="p-8 space-y-6">
                 <p className="text-center text-slate-600 dark:text-slate-400 font-medium">Libere o poder total da sua gestão financeira com IA.</p>
                 <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                       <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                       <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">Scanner Inteligente</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Leitura de notas fiscais via IA Gemini.</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                       <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">Previsões Avançadas</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Análise profunda de fluxo de caixa futuro.</p>
                       </div>
                    </div>
                 </div>
                 <button 
                  onClick={() => {
                    updateUserProfile({ ...user!, plan: 'premium' });
                    setShowUpgradeModal(false);
                    alert("Parabéns! Você agora é um usuário PREMIUM.");
                  }}
                  className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 dark:shadow-none transition-all active:scale-[0.98]"
                 >
                    QUERO SER PRO
                 </button>
                 <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">Apenas R$ 19,90 / mês</p>
              </div>
           </div>
        </div>
      )}

      {/* Modal Cadastro/Edição Normal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {['expense', 'income', 'transfer', 'adjustment'].map(type => (
                  <button key={type} type="button" onClick={() => setFormData({...formData, type: type as any})} className={`py-2 text-[10px] font-bold rounded-lg transition-all ${formData.type === type ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                    {type === 'expense' ? 'Despesa' : type === 'income' ? 'Receita' : type === 'transfer' ? 'Transf.' : 'Ajuste'}
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descrição</label>
                <input type="text" required className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-emerald-500" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Valor (R$)</label>
                  <input type="number" step="0.01" required className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-emerald-500" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data</label>
                  <input type="date" required className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-lg outline-none focus:border-emerald-500" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Conta</label>
                  <select required className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-lg outline-none" value={formData.accountId} onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categoria</label>
                  <select required className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-100 rounded-lg outline-none" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
                    {categories.filter(c => c.type === (formData.type === 'income' ? 'income' : 'expense')).map(c => <option key={c.id} value={c.id}>{getCategoryFullName(c.id)}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 text-white font-bold rounded-xl transition-all active:scale-[0.98]">
                Salvar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
