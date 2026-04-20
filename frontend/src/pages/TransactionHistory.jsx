import React, { useState, useEffect } from 'react';
import api from '../api';
import { Trash2, Search, Filter, ArrowUpRight, ArrowDownLeft, Calendar, FileText } from 'lucide-react';
import { generateMonthlyReport } from '../utils/reportGenerator';
import { useAuth } from '../context/AuthContext';

const TransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(transactions.filter(t => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTransactions = transactions
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t => {
      if (!startDate && !endDate) return true;
      const transDate = new Date(t.date).getTime();
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).getTime() : Infinity;
      return transDate >= start && transDate <= end;
    })
    .filter(t => 
      t.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleDownloadReport = () => {
    const periodLabel = startDate && endDate 
      ? `${startDate} to ${endDate}`
      : startDate ? `From ${startDate}`
      : endDate ? `Until ${endDate}`
      : 'All Time';
    
    generateMonthlyReport(user, { transactions: filteredTransactions, insights: [] }, periodLabel);
  };

  if (loading) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-200">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-slate-400">View and manage all your historical data.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative grow sm:grow-0 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Search..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 overflow-hidden">
            <Calendar size={16} className="text-slate-500" />
            <input 
              type="date" 
              className="bg-transparent border-none outline-none text-xs text-slate-300 w-28 appearance-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-slate-600 px-1">-</span>
            <input 
              type="date" 
              className="bg-transparent border-none outline-none text-xs text-slate-300 w-28 appearance-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <select 
              className="bg-slate-900 border border-white/10 rounded-xl py-2 pl-9 pr-10 outline-none focus:ring-2 focus:ring-primary-500 appearance-none text-sm text-slate-300 hover:border-white/20 transition-all cursor-pointer"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg active:scale-95"
          >
            <FileText size={18} />
            Report
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-slate-400 text-sm font-medium">
            <tr>
              <th className="px-6 py-4">Transaction</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredTransactions.map((t) => (
              <tr key={t._id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {t.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">{t.note || 'No description'}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">{t.type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-slate-300 border border-white/10">
                    {t.category.charAt(0).toUpperCase() + t.category.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 text-sm">
                  {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => handleDelete(t._id)}
                    className="p-2 text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                  No transactions found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;
