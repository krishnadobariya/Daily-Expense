import React, { useState, useEffect } from 'react';
import api from '../api';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Plus, TrendingUp, TrendingDown, Wallet, AlertCircle, FileText } from 'lucide-react';
import AddExpenseModal from '../components/AddExpenseModal';
import { generateMonthlyReport } from '../utils/reportGenerator';
import { useAuth } from '../context/AuthContext';
import socket, { connectSocket, disconnectSocket } from '../utils/socket';

const COLORS = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ transactions: [], insights: [] });
  const [families, setFamilies] = useState([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState('personal');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [tRes, iRes, fRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/insights'),
        api.get('/family/my-families')
      ]);
      setData({ transactions: tRes.data, insights: iRes.data });
      setFamilies(fRes.data);
      
      // Real-time connection
      connectSocket(fRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    socket.on('new_transaction', (data) => {
      console.log('Real-time transaction received:', data);
      fetchData(); // Simple refresh for now
    });

    return () => {
      socket.off('new_transaction');
      disconnectSocket();
    };
  }, []);

  const filteredTransactions = data.transactions.filter(t => {
    if (selectedFamilyId === 'all') return true;
    if (selectedFamilyId === 'personal') return !t.familyId;
    return t.familyId === selectedFamilyId;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Pie Chart Data
  const categories = {};
  filteredTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
  
  const pieData = Object.keys(categories).map(name => ({ name, value: categories[name] }));

  // Line Chart Data (Last 7 days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const lineData = last7Days.map(date => {
    const amount = filteredTransactions
      .filter(t => t.type === 'expense' && t.date.split('T')[0] === date)
      .reduce((sum, t) => sum + t.amount, 0);
    return { date: date.slice(5), amount };
  });

  if (loading) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Financial Overview</h1>
          <div className="flex items-center gap-3">
            <select 
              value={selectedFamilyId}
              onChange={(e) => setSelectedFamilyId(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
            >
              <option value="all">All Wallets</option>
              <option value="personal">Personal only</option>
              {families.map(f => (
                <option key={f._id} value={f._id}>{f.name} (Family)</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button
            onClick={() => generateMonthlyReport(user, data)}
            className="flex-1 md:flex-none glass border-white/10 hover:border-primary-500/50 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all group"
          >
            <FileText size={20} className="text-primary-400 group-hover:scale-110 transition-transform" />
            Download Report
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl card-hover">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary-500/10 rounded-xl text-primary-500">
              <Wallet size={24} />
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-white/5 px-2 py-1 rounded">CURRENT BALANCE</span>
          </div>
          <h2 className="text-4xl font-bold">₹{balance.toLocaleString()}</h2>
        </div>

        <div className="glass p-6 rounded-2xl card-hover">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-white/5 px-2 py-1 rounded">TOTAL INCOME</span>
          </div>
          <h2 className="text-4xl font-bold text-emerald-400">₹{totalIncome.toLocaleString()}</h2>
        </div>

        <div className="glass p-6 rounded-2xl card-hover">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
              <TrendingDown size={24} />
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-white/5 px-2 py-1 rounded">TOTAL EXPENSE</span>
          </div>
          <h2 className="text-4xl font-bold text-rose-400">₹{totalExpense.toLocaleString()}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Charts */}
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-6">Spending Trend (7 Days)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="amount" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-6">Category Distribution</h3>
          <div className="h-[300px]">
             {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <span className="text-sm">No expense data yet</span>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Recent Insights Preview */}
      {data.insights.length > 0 && (
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-primary-400" />
            <h3 className="text-xl font-bold">Latest Leak Detections</h3>
          </div>
          <div className="space-y-4">
            {data.insights.slice(0, 2).map((insight) => (
              <div key={insight._id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center group">
                <p className="text-lg">{insight.message}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  insight.severity === 'high' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {insight.severity.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isModalOpen && (
        <AddExpenseModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default Dashboard;
