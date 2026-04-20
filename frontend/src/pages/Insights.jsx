import React, { useState, useEffect } from 'react';
import api from '../api';
import { AlertTriangle, TrendingUp, ShoppingBag, Lightbulb, CheckCircle2 } from 'lucide-react';

const Insights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await api.get('/insights');
        setInsights(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'high': return 'bg-rose-500/10 border-rose-500/30 text-rose-500';
      case 'medium': return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
      default: return 'bg-blue-500/10 border-blue-500/30 text-blue-500';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'spike': return <TrendingUp size={24} />;
      case 'leak': return <ShoppingBag size={24} />;
      default: return <AlertTriangle size={24} />;
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-primary-500/10 rounded-2xl text-primary-500">
          <Lightbulb size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Smart Insights</h1>
          <p className="text-slate-400">AI-powered analysis of your spending habits.</p>
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="glass p-12 rounded-3xl text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold">Direct Leak Not Found!</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Great job! Our leak detection engine hasn't found any unusual spending patterns in your accounts yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight) => (
            <div 
              key={insight._id} 
              className={`glass p-6 rounded-2xl border flex gap-6 items-start card-hover ${getSeverityStyles(insight.severity)}`}
            >
              <div className="shrink-0 p-3 bg-white/10 rounded-xl">
                {getIcon(insight.type)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 uppercase">
                    {insight.severity} Priority
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(insight.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-lg font-medium leading-relaxed text-slate-200">
                   {insight.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Static recommendations if insights exist */}
      {insights.length > 0 && (
          <div className="p-8 border border-white/5 rounded-3xl bg-white/[0.02]">
            <h3 className="text-xl font-bold mb-6">Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                "Try following the 50/30/20 rule to optimize savings.",
                "Review your recurring subscriptions this weekend.",
                "Consider a 'No spend day' once a week to boost your streak."
              ].map((tip, i) => (
                <div key={i} className="flex gap-3 text-slate-400 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                  {tip}
                </div>
              ))}
            </div>
          </div>
      )}
    </div>
  );
};

export default Insights;
