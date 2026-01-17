
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFinance } from '../FinanceContext';
import { 
  Plus, Search, Trash2, Edit2, ArrowRightLeft, SlidersHorizontal, 
  ChevronRight, Filter, X, Calendar, Upload, FileText, Check, AlertCircle, 
  ChevronLeft, Camera, RefreshCw, Sparkles, Loader2, Crown, Zap, ShieldCheck,
  BrainCircuit, Wand2, FileSpreadsheet, ArrowRight, Settings2, CreditCard, ChevronDown
} from 'lucide-react';
import { TransactionType, Transaction, Category } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

type ImportStep = 'upload' | 'mapping' | 'review';

export const Transactions: React.FC = () => {
  const { 
    transactions, categories, accounts, user, theme,
    addTransaction, updateTransaction, deleteTransaction, updateUserProfile 
  } = useFinance();
  
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  const [isDetectingColumns, setIsDetectingColumns] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Importação CSV States
  const [importStep, setImportStep] = useState<ImportStep>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRawRows, setCsvRawRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState({ date: '', description: '', amount: '' });
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [importAccountId, setImportAccountId] = useState('');

  // Refs e outros states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [filters, setFilters] = useState({ startDate: '', endDate: '', categoryId: '', accountId: '' });

  const [formData, setFormData] = useState({
    description: '', amount: '', targetBalance: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '', accountId: '', toAccountId: '', type: 'expense' as TransactionType,
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getCategoryFullName = (catId: string) => {
    if (catId === 'sys-transfer') return '🔄 Transferência';
    if (catId === 'sys-adjustment') return '⚖️ Ajuste de Saldo';
    const cat = categories.find(c => c.id === catId);
    if (!cat) return 'Sem Categoria';
    if (!cat.parentId) return `${cat.icon} ${cat.name}`;
    const parent = categories.find(c => c.id === cat.parentId);
    return `${parent?.icon || ''} ${parent?.name || ''} > ${cat.icon} ${cat.name}`;
  };

  // --- LÓGICA DE IMPORTAÇÃO CSV MELHORADA ---
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        alert("O arquivo CSV parece estar vazio ou sem dados suficientes.");
        return;
      }

      const firstLine = lines[0];
      const separator = firstLine.includes(';') ? ';' : ',';
      
      const headers = firstLine.split(separator).map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1).map(line => line.split(separator).map(c => c.trim().replace(/^"|"$/g, '')));
      
      setCsvHeaders(headers);
      setCsvRawRows(rows);
      setImportStep('mapping');
      
      // Se for Premium, dispara a detecção automática
      if (user?.plan === 'premium') {
        detectColumns(headers, rows.slice(0, 2));
      } else {
        // Se for Basic, tenta uma heurística simples apenas para não deixar vazio se encontrar nomes óbvios
        const findHeader = (keywords: string[]) => 
          headers.find(h => keywords.some(k => h.toLowerCase().includes(k))) || '';
        
        setColumnMapping({
          date: findHeader(['data', 'date']),
          description: findHeader(['desc', 'hist']),
          amount: findHeader(['valor', 'val', 'quant', 'amount'])
        });
      }
    };
    reader.readAsText(file);
  };

  const detectColumns = async (headers: string[], samples: string[][]) => {
    setIsDetectingColumns(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [{
            text: `Analise estes cabeçalhos de CSV e amostras de dados. Identifique qual coluna corresponde a 'date', 'description' e 'amount'.
            Cabeçalhos: ${JSON.stringify(headers)}
            Amostra: ${JSON.stringify(samples)}
            Retorne APENAS um JSON com as chaves 'date', 'description', 'amount' contendo o NOME EXATO do cabeçalho correspondente.`
          }]
        },
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              description: { type: Type.STRING },
              amount: { type: Type.STRING }
            }
          }
        }
      });
      
      const mapping = JSON.parse(response.text);
      setColumnMapping({
        date: mapping.date || '',
        description: mapping.description || '',
        amount: mapping.amount || ''
      });
    } catch (err) {
      console.error("Erro na detecção de colunas:", err);
    } finally {
      setIsDetectingColumns(false);
    }
  };

  const processMapping = () => {
    if (!columnMapping.date || !columnMapping.description || !columnMapping.amount) {
      alert("Por favor, selecione todas as colunas obrigatórias.");
      return;
    }

    const dateIdx = csvHeaders.indexOf(columnMapping.date);
    const descIdx = csvHeaders.indexOf(columnMapping.description);
    const valIdx = csvHeaders.indexOf(columnMapping.amount);

    const parsed = csvRawRows.map(row => {
      const rawAmount = row[valIdx]?.replace(/[^\d.,-]/g, '').replace(',', '.') || '0';
      const amount = parseFloat(rawAmount);
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        date: row[dateIdx] || new Date().toISOString().split('T')[0],
        description: row[descIdx] || 'Sem descrição',
        amount: Math.abs(amount),
        type: amount < 0 ? 'expense' : 'income',
        categoryId: '',
        isAiSuggested: false
      };
    });

    setImportedRows(parsed);
    setImportAccountId(accounts[0]?.id || '');
    setImportStep('review');
  };

  const handleAiCategorize = async () => {
    if (user?.plan !== 'premium') {
      setShowUpgradeModal(true);
      return;
    }
    if (importedRows.length === 0 || isAiCategorizing) return;

    setIsAiCategorizing(true);
    try {
      const descriptions = Array.from(new Set(importedRows.map(r => r.description)));
      const expenseCats = categories.filter(c => c.type === 'expense').map(c => ({ id: c.id, name: c.name }));
      const history = transactions.slice(0, 40).map(t => ({ desc: t.description, catId: t.categoryId }));

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [{
            text: `Categorize estas transações. Use o histórico como referência de estilo.
            CATEGORIAS: ${JSON.stringify(expenseCats)}
            HISTÓRICO: ${JSON.stringify(history)}
            PARA CATEGORIZAR: ${JSON.stringify(descriptions)}
            Retorne um JSON { "descrição": "categoryId" }.`
          }]
        },
        config: { responseMimeType: "application/json" }
      });

      const mapping = JSON.parse(response.text);
      setImportedRows(prev => prev.map(row => ({
        ...row,
        categoryId: mapping[row.description] || row.categoryId,
        isAiSuggested: !!mapping[row.description]
      })));
    } catch (err) {
      alert("Erro na categorização inteligente.");
    } finally {
      setIsAiCategorizing(false);
    }
  };

  const finalizeImport = () => {
    if (!importAccountId) return;
    importedRows.forEach(row => {
      addTransaction({
        description: row.description,
        amount: row.amount,
        date: row.date,
        categoryId: row.categoryId || (row.type === 'income' ? categories.find(c => c.type === 'income')?.id : categories.find(c => c.type === 'expense')?.id) || '',
        accountId: importAccountId,
        type: row.type as TransactionType
      });
    });
    setShowImportModal(false);
    resetImport();
    alert("Transações importadas com sucesso!");
  };

  const resetImport = () => {
    setImportStep('upload');
    setCsvHeaders([]);
    setCsvRawRows([]);
    setImportedRows([]);
    setColumnMapping({ date: '', description: '', amount: '' });
  };

  // --- CÂMERA E OUTROS ---

  const handleScannerClick = () => {
    if (user?.plan === 'premium') startCamera();
    else setShowUpgradeModal(true);
  };

  const startCamera = async (mode?: 'user' | 'environment') => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    const modeToUse = mode || 'environment';
    setFacingMode(modeToUse);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: modeToUse, width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      setShowScanner(true);
    } catch (err) {
      alert("Não foi possível acessar a câmera.");
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
    setShowScanner(false);
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsScanning(true);
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: "Extraia: estabelecimento, data, valor_total." }
          ]
        },
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text);
      setFormData({
        ...formData,
        description: data.estabelecimento || 'Nova Nota',
        amount: (data.valor_total || 0).toString(),
        date: data.data || new Date().toISOString().split('T')[0],
      });
      stopCamera();
      setShowModal(true);
    } catch (err) {
      alert("Erro ao ler nota.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalAmount = parseFloat(formData.amount);
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

  return (
    <div className="space-y-6 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Transações</h1>
          <p className="text-slate-500 dark:text-slate-400">Gerencie seus lançamentos e automatize com IA.</p>
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
            <FileSpreadsheet className="w-5 h-5" />
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
                         {cat?.icon || '📦'} {cat?.name || 'Sistema'}
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

      {/* --- MODAL DE IMPORTAÇÃO CSV EM ETAPAS --- */}
      {showImportModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => !isAiCategorizing && setShowImportModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col transition-all">
            
            {/* Header com Stepper */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white"><FileSpreadsheet className="w-6 h-6" /></div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Importação Assistida</h3>
                  </div>
                  <div className="hidden md:flex items-center gap-4 ml-4">
                    <div className={`flex items-center gap-2 ${importStep === 'upload' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold border-current">1</span>
                      <span className="text-xs font-bold uppercase tracking-widest">Arquivo</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                    <div className={`flex items-center gap-2 ${importStep === 'mapping' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold border-current">2</span>
                      <span className="text-xs font-bold uppercase tracking-widest">Colunas</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                    <div className={`flex items-center gap-2 ${importStep === 'review' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold border-current">3</span>
                      <span className="text-xs font-bold uppercase tracking-widest">Revisão</span>
                    </div>
                  </div>
               </div>
               <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
               
               {/* ETAPA 1: UPLOAD */}
               {importStep === 'upload' && (
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] p-20 flex flex-col items-center justify-center gap-4 hover:border-emerald-500/30 hover:bg-emerald-50/10 transition-all cursor-pointer group animate-in fade-in duration-500"
                 >
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-300 group-hover:text-emerald-500 transition-all shadow-sm">
                       <Upload className="w-12 h-12" />
                    </div>
                    <div className="text-center">
                       <p className="text-lg font-black text-slate-700 dark:text-slate-200">Arraste seu CSV ou clique para selecionar</p>
                       <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Suportamos arquivos exportados de qualquer banco ou planilha.</p>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                 </div>
               )}

               {/* ETAPA 2: MAPEAMENTO INTELIGENTE / MANUAL */}
               {importStep === 'mapping' && (
                 <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Banner Informativo PRO / Basic */}
                    {user?.plan === 'premium' ? (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800/50 flex gap-5">
                        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200 dark:shadow-none animate-pulse">
                            <BrainCircuit className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-emerald-900 dark:text-emerald-200">Mapeamento Inteligente PRO Ativo</p>
                            <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                              {isDetectingColumns ? "O Gemini está analisando seus dados..." : "Suas colunas foram identificadas automaticamente. Verifique se está tudo correto."}
                            </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/50 flex flex-col sm:flex-row items-center gap-5 justify-between">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200 dark:shadow-none">
                              <Crown className="w-6 h-6" />
                          </div>
                          <div>
                              <p className="font-bold text-blue-900 dark:text-blue-200">Mapeamento Manual (Plano Básico)</p>
                              <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-1">
                                Membros PRO têm suas colunas mapeadas instantaneamente por IA.
                              </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowUpgradeModal(true)}
                          className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-blue-700 transition-all flex items-center gap-1.5"
                        >
                          Tentar IA <Sparkles className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Campos do Sistema <Settings2 className="w-3 h-3" /></h4>
                          <div className="space-y-5">
                             {[
                               { id: 'date', label: 'Coluna de Data', icon: Calendar },
                               { id: 'description', label: 'Coluna de Descrição', icon: FileText },
                               { id: 'amount', label: 'Coluna de Valor', icon: CreditCard }
                             ].map(field => (
                               <div key={field.id} className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                                  <div className="relative">
                                     <field.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                     <select 
                                       className="w-full pl-11 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                       value={columnMapping[field.id as keyof typeof columnMapping]}
                                       onChange={e => setColumnMapping({...columnMapping, [field.id]: e.target.value})}
                                     >
                                        <option value="">Selecione a coluna...</option>
                                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                     </select>
                                     {isDetectingColumns && <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl animate-pulse cursor-wait" />}
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                       
                       <div className="space-y-6">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Amostra do CSV <Search className="w-3 h-3" /></h4>
                          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                             <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-900/50">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Valores Encontrados</p>
                             </div>
                             <div className="p-4 max-h-[300px] overflow-y-auto space-y-2">
                                {csvHeaders.map((h, i) => (
                                  <div key={i} className="flex items-center justify-between text-[11px] p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                                     <span className="font-bold text-slate-500 truncate pr-2">{h}</span>
                                     <span className="text-slate-400 italic">Ex: {csvRawRows[0]?.[i] || '---'}</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="pt-6 flex gap-4">
                       <button onClick={resetImport} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-all">Cancelar</button>
                       <button 
                        onClick={processMapping}
                        disabled={!columnMapping.date || !columnMapping.description || !columnMapping.amount}
                        className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                       >
                          Continuar para Revisão <ArrowRight className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
               )}

               {/* ETAPA 3: REVISÃO E CATEGORIZAÇÃO INTELIGENTE */}
               {importStep === 'review' && (
                 <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex flex-col sm:flex-row gap-4 items-end justify-between bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                       <div className="flex-1 space-y-1 w-full max-w-xs">
                          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Importar para a Conta</label>
                          <select 
                            className="w-full px-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-700 dark:text-slate-200 shadow-sm"
                            value={importAccountId}
                            onChange={(e) => setImportAccountId(e.target.value)}
                          >
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                       </div>
                       <div className="flex gap-3 w-full sm:w-auto">
                          <button 
                            onClick={handleAiCategorize}
                            disabled={isAiCategorizing}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-slate-800/50 px-8 py-3.5 rounded-2xl transition-all font-bold hover:bg-emerald-100 disabled:opacity-50 relative group"
                          >
                             {isAiCategorizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-emerald-500" />}
                             Categorização Mágica PRO
                             {user?.plan === 'basic' && <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 rounded-full p-1 shadow-sm"><Crown className="w-3.5 h-3.5" /></div>}
                          </button>
                          <button onClick={() => setImportStep('mapping')} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all shadow-sm" title="Ajustar Mapeamento"><Settings2 className="w-6 h-6" /></button>
                       </div>
                    </div>

                    <div className="border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                       <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 dark:bg-slate-800/50">
                             <tr>
                                <th className="px-6 py-4 font-black uppercase text-slate-400 tracking-wider">Transação</th>
                                <th className="px-6 py-4 font-black uppercase text-slate-400 tracking-wider">Valor</th>
                                <th className="px-6 py-4 font-black uppercase text-slate-400 tracking-wider">Categoria</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                             {importedRows.map((row, idx) => (
                               <tr key={row.id} className="group hover:bg-slate-50/30 transition-colors">
                                  <td className="px-6 py-4">
                                     <p className="font-bold text-slate-900 dark:text-slate-100">{row.description}</p>
                                     <p className="text-[10px] text-slate-400 mt-0.5">{row.date}</p>
                                  </td>
                                  <td className={`px-6 py-4 font-black text-sm ${row.type === 'income' ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100'}`}>
                                     {row.type === 'income' ? '+' : '-'} {formatCurrency(row.amount)}
                                  </td>
                                  <td className="px-6 py-4">
                                     <div className="relative group">
                                        <select 
                                          className={`w-full px-4 py-2.5 rounded-xl border appearance-none transition-all pr-10 font-bold ${row.isAiSuggested ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-500/30 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
                                          value={row.categoryId}
                                          onChange={(e) => {
                                            const newRows = [...importedRows];
                                            newRows[idx].categoryId = e.target.value;
                                            newRows[idx].isAiSuggested = false;
                                            setImportedRows(newRows);
                                          }}
                                        >
                                           <option value="">Selecionar...</option>
                                           {categories
                                            .filter(c => c.type === row.type)
                                            .sort((a,b) => a.name.localeCompare(b.name))
                                            .map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                           {row.isAiSuggested ? <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                     </div>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>

                    <div className="pt-4 flex gap-4">
                       <button onClick={resetImport} className="px-8 py-5 text-slate-400 font-bold hover:text-slate-600 transition-colors">Cancelar Tudo</button>
                       <button 
                        disabled={importedRows.length === 0 || !importAccountId}
                        onClick={finalizeImport}
                        className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-[2rem] shadow-2xl shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                       >
                          Concluir Importação de {importedRows.length} Itens <ArrowRight className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAIS DE SCANNER E UPGRADE (MANTIDOS) --- */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          <div className="p-6 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
             <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-400" /> Scanner PRO</h3>
             <button onClick={stopCamera} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
             <video ref={videoRef} autoPlay playsInline style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} className="w-full h-full object-cover" />
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[80%] aspect-[3/4] border-2 border-emerald-500/50 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]" />
                {isScanning && <div className="absolute inset-0 bg-emerald-500/10 flex flex-col items-center justify-center gap-4 animate-pulse"><Loader2 className="w-12 h-12 text-emerald-400 animate-spin" /><span className="text-emerald-400 font-bold tracking-widest text-xs uppercase">IA Ativa...</span></div>}
             </div>
          </div>
          <div className="p-10 flex items-center justify-center gap-8 bg-gradient-to-t from-black/80 to-transparent">
             <button onClick={() => startCamera(facingMode === 'user' ? 'environment' : 'user')} className="p-4 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"><RefreshCw className="w-6 h-6" /></button>
             <button disabled={isScanning} onClick={captureAndScan} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-90"><div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black"><Camera className="w-8 h-8" /></div></button>
             <div className="w-14" /><canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}

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
                       <BrainCircuit className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                       <div><p className="font-bold text-slate-800 dark:text-slate-200">Importação com IA</p><p className="text-xs text-slate-500 dark:text-slate-400">Detecção automática de qualquer CSV.</p></div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                       <div><p className="font-bold text-slate-800 dark:text-slate-200">Scanner de Notas PRO</p><p className="text-xs text-slate-500 dark:text-slate-400">Leitura instantânea via Gemini.</p></div>
                    </div>
                 </div>
                 <button onClick={() => { updateUserProfile({ ...user!, plan: 'premium' }); setShowUpgradeModal(false); alert("Parabéns! Você agora é um PREMIUM."); }} className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 dark:shadow-none transition-all active:scale-[0.98]">QUERO SER PRO</button>
                 <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">Apenas R$ 19,90 / mês</p>
              </div>
           </div>
        </div>
      )}

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
              <button type="submit" className="w-full py-4 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 text-white font-bold rounded-xl transition-all active:scale-[0.98]">Salvar Lançamento</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
