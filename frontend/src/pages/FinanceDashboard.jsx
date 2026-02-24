import { DollarSign, Package, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api";

const FinanceDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const res = await api.get("/shops/finance/summary/");
        setData(res.data);
      } catch (err) {
        console.error("Treasury Sync Failed:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-[#c5a059] uppercase italic animate-pulse tracking-[0.4em]">
        Syncing Treasury Data...
      </div>
    );

  if (error || !data)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-red-500 uppercase italic tracking-[0.2em]">
        Critical Error: Financial Link Severed.
      </div>
    );

  const { total_revenue, total_expenses, net_profit, expense_breakdown } = data;

  return (
    <div className="min-h-screen bg-[#0f1115] p-8 font-serif text-slate-200">
      <header className="mb-12 border-b border-[#2d3139] pb-6">
        <h1 className="text-[#c5a059] text-3xl tracking-[0.4em] uppercase font-bold">
          Financial Oversight
        </h1>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2 italic">
          Real-time Revenue & Expense Manifest
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard
          title="Total Revenue"
          value={total_revenue}
          icon={<TrendingUp className="text-emerald-500" />}
          color="text-emerald-500"
        />
        <StatCard
          title="Total Expenses"
          value={total_expenses}
          icon={<TrendingDown className="text-red-500" />}
          color="text-red-500"
        />
        <StatCard
          title="Net Profit"
          value={net_profit}
          icon={<DollarSign className="text-[#c5a059]" />}
          color="text-[#c5a059]"
          highlight
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-[#1a1d23] border border-[#2d3139] rounded-3xl p-8">
          <h2 className="text-sm uppercase tracking-widest text-slate-400 mb-6 font-bold flex items-center gap-2 font-serif">
            <Package size={18} className="text-[#c5a059]" /> Category Allocation
          </h2>
          <div className="space-y-6">
            {Object.entries(expense_breakdown || {}).map(
              ([category, amount], i) => {
                const percentage =
                  total_expenses > 0 ? (amount / total_expenses) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] uppercase mb-2">
                      <span className="text-slate-300">{category}</span>
                      <span className="text-slate-500">{amount} EGP</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0f1115] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#c5a059]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, highlight }) => (
  <div
    className={`p-8 rounded-3xl border ${highlight ? "border-[#c5a059] bg-[#c5a059]/5" : "border-[#2d3139] bg-[#1a1d23]"} transition-all`}
  >
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
        {title}
      </span>
      {icon}
    </div>
    <div className="flex items-baseline gap-2">
      <h3 className={`text-3xl font-mono font-bold ${color}`}>
        {parseFloat(value).toLocaleString()}
      </h3>
      <span className="text-[10px] text-slate-500">EGP</span>
    </div>
  </div>
);

export default FinanceDashboard;
