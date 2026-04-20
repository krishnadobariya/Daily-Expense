import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, History, Lightbulb, LogOut, TrendingDown, Users } from 'lucide-react';

const Navbar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/history', label: 'History', icon: History },
    { path: '/family', label: 'Family', icon: Users },
    { path: '/insights', label: 'Insights', icon: Lightbulb },
  ];

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <TrendingDown className="text-primary-500 w-8 h-8" />
        <span className="font-bold text-xl bg-gradient-to-r from-primary-400 to-blue-500 bg-clip-text text-transparent">
          ExpenseLeak AI
        </span>
      </div>

      <div className="flex items-center gap-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 transition-colors ${
                isActive ? 'text-primary-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
        
        <div className="h-6 w-px bg-white/10 mx-2" />
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium hidden md:inline">{user?.name}</span>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
