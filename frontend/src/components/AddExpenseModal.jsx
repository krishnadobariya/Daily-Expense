import React, { useState, useEffect } from 'react';
import { X, PlusCircle, MinusCircle, Camera, Loader2 } from 'lucide-react';
import api from '../api';

const AddExpenseModal = ({ isOpen, onClose, onSuccess }) => {
  const [families, setFamilies] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'food',
    type: 'expense',
    note: '',
    date: new Date().toISOString().split('T')[0],
    familyId: ''
  });
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    const formDataObj = new FormData();
    formDataObj.append('receipt', file);

    try {
      const res = await api.post('/transactions/scan', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { amount, category } = res.data;
      setFormData(prev => ({
        ...prev,
        amount: amount || prev.amount,
        category: category || prev.category
      }));
    } catch (err) {
      console.error('OCR Scanning failed:', err);
      alert('Could not read receipt correctly. Please enter manually.');
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const fetchFamilies = async () => {
        try {
          const res = await api.get('/family/my-families');
          setFamilies(res.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchFamilies();
    }
  }, [isOpen]);

  const categories = ['food', 'travel', 'shopping', 'bills', 'entertainment', 'health', 'income', 'other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/transactions', formData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="glass w-full max-w-lg rounded-2xl p-8 relative animate-in zoom-in duration-300">
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-white">
          <X size={24} />
        </button>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {formData.type === 'expense' ? <MinusCircle className="text-rose-500" /> : <PlusCircle className="text-emerald-500" />}
            Add {formData.type === 'expense' ? 'Expense' : 'Income'}
          </h2>
          
          <div className="relative">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              id="receipt-upload" 
              onChange={handleScan}
              disabled={isScanning}
            />
            <label 
              htmlFor="receipt-upload"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
                isScanning ? 'bg-slate-800 text-slate-500' : 'bg-primary-500/10 text-primary-400 hover:bg-primary-500/20'
              }`}
            >
              {isScanning ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Camera size={16} />
                  Scan Receipt
                </>
              )}
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <button
                type="button"
                onClick={() => setFormData({...formData, type: 'expense', category: 'food'})}
                className={`py-3 rounded-xl font-bold transition-all ${
                  formData.type === 'expense' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white/5 text-slate-400'
                }`}
             >
                Expense
             </button>
             <button
                type="button"
                onClick={() => setFormData({...formData, type: 'income', category: 'income'})}
                className={`py-3 rounded-xl font-bold transition-all ${
                  formData.type === 'income' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-400'
                }`}
             >
                Income
             </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Amount (₹)</label>
            <input
              type="number"
              required
              autoFocus
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-4 px-4 text-3xl font-bold text-center outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Category</label>
              <div className="relative">
                <select
                  className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-4 pr-10 outline-none focus:ring-2 focus:ring-primary-500 appearance-none text-slate-200 cursor-pointer"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Date</label>
              <input
                type="date"
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Note (Optional)</label>
            <textarea
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="What was this for?"
              rows={2}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Post To (Wallet)</label>
            <div className="relative">
              <select
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-4 pr-10 outline-none focus:ring-2 focus:ring-primary-500 appearance-none text-slate-200 cursor-pointer"
                value={formData.familyId}
                onChange={(e) => setFormData({ ...formData, familyId: e.target.value })}
              >
                <option value="">Personal Wallet</option>
                {families.map(f => (
                  <option key={f._id} value={f._id}>{f.name} (Family)</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-primary-600/20 active:scale-95"
          >
            {loading ? 'Saving...' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
