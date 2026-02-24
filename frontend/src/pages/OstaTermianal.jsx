import {
  ChevronRight,
  ClipboardList,
  Clock,
  Hammer,
  LayoutGrid,
  UserCheck,
  UserPlus,
  UserPlus2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const OstaTerminal = () => {
  const [loading, setLoading] = useState(true);
  const [sabis, setSabis] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [data, setData] = useState({
    totalSabis: 0,
    assignedSabis: 0,
    unassignedSabis: 0,
    workOrders: [],
  });

  const fetchWorkshopIntel = async () => {
    try {
      const [usersRes, ordersRes] = await Promise.all([
        api.get("/shops/staff/sabis/"),
        api.get("/shops/work-orders/"),
      ]);

      const workshopSabis = usersRes.data.results || usersRes.data;
      const allOrders = ordersRes.data.results || ordersRes.data;

      const assignedSabiIds = new Set(
        allOrders.map((o) => o.assigned_sabi_tech).filter((id) => id !== null),
      );

      setSabis(Array.isArray(workshopSabis) ? workshopSabis : []);

      setData({
        totalSabis: workshopSabis.length,
        assignedSabis: workshopSabis.filter((s) => assignedSabiIds.has(s.id))
          .length,
        unassignedSabis: workshopSabis.filter((s) => !assignedSabiIds.has(s.id))
          .length,
        workOrders: allOrders,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshopIntel();
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds || seconds < 1) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const calculateTotalTime = (order) => {
    if (!order?.sessions) return "0s";
    const totalSeconds = order.sessions.reduce(
      (acc, s) => acc + (parseFloat(s.duration_seconds) || 0),
      0,
    );
    return formatDuration(totalSeconds);
  };

  const handleQuickAssign = async (orderId, sabiId) => {
    if (!sabiId) return;
    try {
      await api.patch(`/shops/work-orders/${orderId}/assign-techs/`, {
        assigned_sabi_tech: sabiId,
      });
      fetchWorkshopIntel();
    } catch (err) {
      console.error(err);
    }
  };

  const getNameFromSabis = (id) => {
    if (!id) return "Awaiting Tech";
    const sabi = sabis.find((s) => String(s.id) === String(id));
    return sabi
      ? sabi.first_name
        ? `${sabi.first_name} ${sabi.last_name}`
        : sabi.username
      : `SABI_REF_${id}`;
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-[#c5a059] uppercase tracking-[0.4em] animate-pulse italic">
        Synchronizing Floor Intelligence...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f1115] p-8 font-serif text-slate-200 relative">
      <header className="mb-12 border-b border-[#2d3139] pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-[#c5a059] text-3xl tracking-[0.4em] uppercase font-bold">
            Osta Control
          </h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2 italic font-black">
            Workshop Floor Manifest
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            to="/work-orders"
            className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 text-slate-300 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-lg"
          >
            <LayoutGrid size={14} /> View All Orders
          </Link>
          <Link
            to="/invites"
            className="flex items-center gap-2 bg-[#c5a059] text-[#0f1115] px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(197,160,89,0.2)]"
          >
            <UserPlus2 size={14} /> Invite Customer
          </Link>
        </div>
      </header>

      {/* STAT CARDS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#1a1d23] border border-[#2d3139] p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <Users className="text-slate-500" size={20} />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">
              Total Sabis
            </span>
          </div>
          <p className="text-4xl font-bold text-slate-100">{data.totalSabis}</p>
        </div>
        <div className="bg-[#1a1d23] border border-emerald-500/10 p-6 rounded-2xl shadow-[inset_0_0_20px_rgba(16,185,129,0.02)]">
          <div className="flex justify-between items-center mb-4">
            <UserCheck className="text-emerald-500" size={20} />
            <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">
              Assigned
            </span>
          </div>
          <p className="text-4xl font-bold text-emerald-500">
            {data.assignedSabis}
          </p>
        </div>
        <div className="bg-[#1a1d23] border border-orange-500/10 p-6 rounded-2xl shadow-[inset_0_0_20px_rgba(249,115,22,0.02)]">
          <div className="flex justify-between items-center mb-4">
            <UserPlus className="text-orange-500" size={20} />
            <span className="text-[10px] text-orange-500 uppercase tracking-widest font-bold">
              Available
            </span>
          </div>
          <p className="text-4xl font-bold text-orange-500">
            {data.unassignedSabis}
          </p>
        </div>
      </div>

      <div className="bg-[#1a1d23] border border-[#2d3139] rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#2d3139] flex items-center justify-between bg-[#1f2329]">
          <div className="flex items-center gap-3">
            <ClipboardList size={18} className="text-[#c5a059]" />
            <h2 className="text-[#c5a059] text-xs uppercase tracking-[0.3em] font-bold">
              Live Floor Status
            </h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-[#2d3139] bg-[#1a1d23]">
                <th className="p-6">Asset Intelligence</th>
                <th className="p-6">Technician Deployment</th>
                <th className="p-6">Bench Time</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d3139]">
              {data.workOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="hover:bg-[#252930] transition-colors group cursor-pointer"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#0f1115] border border-[#2d3139] flex items-center justify-center text-[#c5a059] group-hover:border-[#c5a059]/50 transition-all">
                        <Hammer size={16} />
                      </div>
                      <div>
                        <p className="text-slate-100 font-bold text-sm italic tracking-wide group-hover:text-[#c5a059] transition-colors">
                          #{order.ticket_id || order.id}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase font-sans tracking-tight">
                          {order.item_name || "Diagnostic Pending"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6" onClick={(e) => e.stopPropagation()}>
                    {order.assigned_sabi_tech ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-300 text-xs font-mono">
                          {getNameFromSabis(order.assigned_sabi_tech)}
                        </span>
                      </div>
                    ) : (
                      <select
                        onChange={(e) =>
                          handleQuickAssign(order.id, e.target.value)
                        }
                        className="bg-[#0f1115] border border-orange-500/30 text-orange-500 text-[10px] uppercase font-bold p-2 rounded-lg outline-none cursor-pointer hover:border-orange-500 transition-all"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Deploy Tech...
                        </option>
                        {sabis.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.username}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
                      <Clock size={12} className="text-slate-500" />
                      {calculateTotalTime(order)}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase font-black tracking-widest ${
                          order.status === "completed"
                            ? "text-emerald-500"
                            : "text-blue-500"
                        }`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <div className="w-24 bg-[#0f1115] h-1 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 ${
                            order.status === "completed"
                              ? "w-full bg-emerald-500"
                              : "w-1/2 bg-blue-500"
                          }`}
                        />
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-slate-700 group-hover:text-[#c5a059]"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DRAWER REMAINS THE SAME... */}
    </div>
  );
};

export default OstaTerminal;
