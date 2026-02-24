import { jwtDecode } from "jwt-decode";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  Hammer,
  LayoutGrid,
  UserPlus2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const SabiTerminal = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access");
  const decoded = token ? jwtDecode(token) : {};

  // Use staff_id to match the ID stored in work order assignments
  const myStaffId = decoded.staff_id;

  const fetchMyTasks = async () => {
    try {
      const res = await api.get("/shops/work-orders/");
      const allOrders = res.data.results || res.data;

      const myTasks = allOrders.filter(
        (o) => String(o.assigned_sabi_tech) === String(myStaffId),
      );
      setOrders(myTasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (myStaffId) fetchMyTasks();
  }, [myStaffId]);

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

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-[#c5a059] text-xs uppercase tracking-[0.4em] animate-pulse italic">
          Loading Assigned Manifest...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f1115] p-8 font-serif text-slate-200">
      <header className="mb-12 border-b border-[#2d3139] pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-[#c5a059] text-3xl tracking-[0.4em] uppercase font-bold">
            Sabi Terminal
          </h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2 italic font-black">
            Personal Assigned Duties // STAFF_ID: {myStaffId}
          </p>
        </div>

        <div className="flex gap-4">
          <Link
            to="/work-orders"
            className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 text-slate-300 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          >
            <LayoutGrid size={14} /> All Orders
          </Link>
          <Link
            to="/invites"
            className="flex items-center gap-2 bg-[#c5a059] text-[#0f1115] px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(197,160,89,0.2)]"
          >
            <UserPlus2 size={14} /> Invite Customer
          </Link>
          <div className="ml-4 text-right border-l border-[#2d3139] pl-6">
            <p className="text-slate-100 text-2xl font-bold">
              {orders.filter((o) => o.status !== "completed").length}
            </p>
            <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black">
              Pending Tasks
            </p>
          </div>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="bg-[#1a1d23] border border-dashed border-[#2d3139] rounded-3xl p-20 text-center">
          <Hammer className="mx-auto text-slate-700 mb-4" size={48} />
          <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
            Your workbench is clear. Awaiting deployment from Osta.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-[#1a1d23] border border-[#2d3139] p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-[#c5a059]/30 transition-all group shadow-lg"
            >
              <div className="flex items-center gap-6">
                <div
                  className={`p-4 rounded-xl ${
                    order.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h3 className="text-slate-100 font-bold text-lg group-hover:text-[#c5a059] transition-colors">
                    #{order.ticket_id || order.id.toString().padStart(4, "0")}{" "}
                    // {order.item_name || "Repair Asset"}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                      {order.problem_description?.substring(0, 40) ||
                        "General Repair"}
                      ...
                    </span>
                    <span className="text-slate-700">•</span>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-[#c5a059]" />
                      <span className="text-[10px] text-[#c5a059] font-mono font-bold uppercase tracking-tighter">
                        Bench: {calculateTotalTime(order)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <div
                  className={`flex-1 md:flex-none px-4 py-2 rounded-xl border flex items-center justify-center gap-2 ${
                    order.status === "completed"
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                      : "border-blue-500/20 bg-blue-500/5 text-blue-500"
                  }`}
                >
                  {order.status === "completed" ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Hammer size={14} className="animate-pulse" />
                  )}
                  <span className="text-[10px] uppercase font-black tracking-widest">
                    {order.status.replace("_", " ")}
                  </span>
                </div>

                <Link
                  to={`/work-orders/`}
                  className="p-3 rounded-xl bg-[#252930] text-slate-400 hover:text-[#c5a059] hover:bg-[#c5a059]/10 transition-all border border-transparent hover:border-[#c5a059]/20"
                >
                  <ExternalLink size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SabiTerminal;
