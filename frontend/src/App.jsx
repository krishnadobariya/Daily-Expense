import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Insights from './pages/Insights';
import TransactionHistory from './pages/TransactionHistory';
import FamilyPortal from './pages/FamilyPortal';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {user && <Navbar />}
      <div className={user ? "container mx-auto px-4 py-8" : ""}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
          <Route path="/family" element={<ProtectedRoute><FamilyPortal /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
