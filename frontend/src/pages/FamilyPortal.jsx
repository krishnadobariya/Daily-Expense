import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, Plus, UserPlus, LogOut, Copy, CheckCircle2 } from 'lucide-react';

const FamilyPortal = () => {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const fetchFamilies = async () => {
    try {
      const res = await api.get('/family/my-families');
      setFamilies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, []);

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    try {
      await api.post('/family/create', { name: newFamilyName });
      setNewFamilyName('');
      fetchFamilies();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating family');
    }
  };

  const handleJoinFamily = async (e) => {
    e.preventDefault();
    try {
      await api.post('/family/join', { inviteCode });
      setInviteCode('');
      fetchFamilies();
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid invite code');
    }
  };

  const handleLeaveFamily = async (id) => {
    if (!window.confirm('Are you sure you want to leave this family? You will no longer be able to edit transactions made while in this group.')) return;
    try {
      await api.post(`/family/leave/${id}`);
      fetchFamilies();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Family Portal</h1>
          <p className="text-slate-400">Manage your shared household wallets and groups.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Create Family */}
        <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-3 text-primary-400">
            <Plus size={24} />
            <h2 className="text-xl font-semibold text-white">Create New Group</h2>
          </div>
          <form onSubmit={handleCreateFamily} className="space-y-4">
            <input
              type="text"
              placeholder="e.g. My Home, Roommates"
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary-500 text-slate-200"
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              required
            />
            <button className="w-full bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-xl font-medium transition-all shadow-lg active:scale-95">
              Create Family
            </button>
          </form>
        </div>

        {/* Join Family */}
        <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <UserPlus size={24} />
            <h2 className="text-xl font-semibold text-white">Join Group</h2>
          </div>
          <form onSubmit={handleJoinFamily} className="space-y-4">
            <input
              type="text"
              placeholder="Enter 6-digit Invite Code"
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary-500 text-slate-200 uppercase"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
            />
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-medium transition-all shadow-lg active:scale-95">
              Join Group
            </button>
          </form>
        </div>
      </div>

      {/* Families List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users size={20} className="text-slate-400" />
          Your Active Groups ({families.length})
        </h2>
        
        <div className="grid gap-4">
          {families.map(family => (
            <div key={family._id} className="glass p-6 rounded-2xl border border-white/10 flex justify-between items-center group hover:border-white/20 transition-all">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">{family.name}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users size={14} />
                    {family.members.length} members
                  </span>
                  <button 
                    onClick={() => copyToClipboard(family.inviteCode)}
                    className="flex items-center gap-1.5 hover:text-primary-400 transition-colors"
                  >
                    {copiedId === family.inviteCode ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    Code: <span className="font-mono text-primary-400">{family.inviteCode}</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={() => handleLeaveFamily(family._id)}
                className="p-3 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                title="Leave Family"
              >
                <LogOut size={20} />
              </button>
            </div>
          ))}
          {families.length === 0 && (
            <div className="text-center py-12 glass rounded-2xl border border-dashed border-white/10">
              <Users size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-500">You are not a member of any group yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FamilyPortal;
