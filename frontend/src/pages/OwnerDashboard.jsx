import {
  Activity,
  AlertTriangle,
  ChevronRight,
  DollarSign,
  Package,
  TrendingUp,
  UserPlus,
  Wallet,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeOrders: 0,
    urgentOrders: 0,
    lowStock: 0,
    inventoryValue: 0,
    netProfit: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersRes, inventoryRes, financeRes] = await Promise.all([
          api.get("/shops/work-orders/"),
          api.get("/shops/inventory/"),
          api.get("/shops/finance/summary/"),
        ]);

        const orders = ordersRes.data.results || ordersRes.data;
        const inventory = inventoryRes.data;
        const finance = financeRes.data;

        setStats({
          activeOrders: orders.filter((o) => o.status !== "completed").length,
          urgentOrders: orders.filter((o) => o.status === "pending").length,
          lowStock: inventory.filter(
            (item) => item.stock_count <= (item.low_stock_threshold || 5),
          ).length,
          inventoryValue: inventory
            .reduce(
              (acc, item) =>
                acc +
                parseFloat(item.retail_price || item.price || 0) *
                  item.stock_count,
              0,
            )
            .toFixed(2),
          netProfit: finance.net_profit || 0,
          totalRevenue: finance.total_revenue || 0,
        });
      } catch (err) {
        console.error("Dashboard Sync Failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const NavCard = ({
    title,
    value,
    subValue,
    icon: Icon,
    colorClass,
    path,
    description,
  }) => (
    <div
      onClick={() => navigate(path)}
      className="bg-[#1a1d23] border border-[#2d3139] p-6 rounded-2xl hover:border-[#c5a059]/50 transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] text-slate-100 group-hover:scale-110 transition-transform">
        <Icon size={96} />
      </div>

      <div className="flex justify-between items-start mb-6">
        <div
          className={`p-3 rounded-xl bg-opacity-10 ${colorClass} bg-current`}
        >
          <Icon size={24} className={colorClass.replace("bg-", "text-")} />
        </div>
        <ChevronRight
          size={18}
          className="text-slate-600 group-hover:text-[#c5a059] transition-all"
        />
      </div>

      <h3 className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">
        {title}
      </h3>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl text-slate-100 font-bold tracking-tight">
          {value}
        </p>
        <span className="text-[10px] text-slate-500 uppercase font-mono">
          {subValue}
        </span>
      </div>
      <p className="mt-4 text-slate-500 text-[10px] italic leading-relaxed">
        {description}
      </p>
    </div>
  );

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-[#c5a059] text-xs uppercase tracking-[0.4em] animate-pulse italic">
          Establishing Control Link...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f1115] p-8 font-serif text-slate-200">
      <header className="mb-12 flex justify-between items-end border-b border-[#2d3139] pb-8">
        <div>
          <h1 className="text-[#c5a059] text-3xl tracking-[0.4em] uppercase">
            Operations Terminal
          </h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2 italic font-bold">
            Authenticated // {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-emerald-500 mb-1 justify-end">
            <Activity size={14} className="animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-widest">
              System Live
            </span>
          </div>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest italic font-bold">
            Capital Deployment: {stats.netProfit >= 0 ? "Surplus" : "Deficit"}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <NavCard
          title="Manifest Status"
          value={stats.activeOrders}
          subValue="Units"
          icon={Wrench}
          colorClass="text-blue-500"
          path="/work-orders"
          description={`${stats.urgentOrders} units are currently awaiting technician assignment.`}
        />
        <NavCard
          title="Vault Inventory"
          value={stats.lowStock}
          subValue="Alerts"
          icon={Package}
          colorClass="text-orange-500"
          path="/inventory"
          description={`Asset valuation currently holding at EGP ${stats.inventoryValue}.`}
        />
        <NavCard
          title="Personnel Access"
          value="Invites"
          subValue="Manage"
          icon={UserPlus}
          colorClass="text-purple-500"
          path="/invites"
          description="Dispatch or manage encrypted access credentials for new workshop personnel."
        />
        <NavCard
          title="Treasury Logic"
          value="Rates"
          subValue="Payroll"
          icon={DollarSign}
          colorClass="text-emerald-500"
          path="/treasury"
          description="Manage hourly labor valuation and payroll records for all personnel."
        />
        <NavCard
          title="Capital Flow"
          value={`${(stats.netProfit / 1000).toFixed(1)}K`}
          subValue="EGP"
          icon={Wallet}
          colorClass="text-[#c5a059]"
          path="/finance"
          description={`Total revenue from completed operations: EGP ${stats.totalRevenue}.`}
        />
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1d23]/50 border border-[#2d3139] rounded-3xl p-8">
          <h2 className="text-[#c5a059] text-[10px] uppercase tracking-[0.3em] font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={14} /> System Briefing
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-slate-400 leading-relaxed font-sans">
              System operations are stable.{" "}
              <span className="text-slate-100 font-bold">
                {stats.activeOrders} active repairs
              </span>{" "}
              detected. Total net profit is{" "}
              <span
                className={
                  stats.netProfit >= 0
                    ? "text-emerald-500 font-bold"
                    : "text-red-500 font-bold"
                }
              >
                EGP {stats.netProfit.toLocaleString()}
              </span>
              .
            </p>
            <div className="bg-[#0f1115] p-4 rounded-xl border border-[#2d3139]">
              <p className="text-[10px] text-slate-500 uppercase italic">
                Terminal Status // v2.1.0
              </p>
              <p className="text-[11px] text-slate-300 mt-1 font-mono">
                Treasury Node: Connected. Capital Flow Synced.
              </p>
            </div>
          </div>
        </div>

        {stats.lowStock > 0 && (
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-8 flex items-center gap-6">
            <div className="bg-orange-500/10 p-4 rounded-2xl text-orange-500">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="text-orange-500 text-xs uppercase font-bold tracking-widest mb-1">
                Threshold Breach
              </h3>
              <p className="text-slate-400 text-sm font-sans leading-tight">
                Critical assets have dropped below designated vault limits.
              </p>
              <button
                onClick={() => navigate("/inventory")}
                className="mt-4 text-[10px] text-orange-500 uppercase font-black tracking-widest hover:underline"
              >
                Resolve in Vault →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;