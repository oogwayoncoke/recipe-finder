import { Activity, Home, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";

const TrackOrder = () => {
  const { ticketId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!ticketId) return;
      try {
        const res = await api.get(`/shops/work-orders/?search=${ticketId}`);
        const data = res.data.results
          ? res.data.results[0]
          : Array.isArray(res.data)
            ? res.data[0]
            : res.data;
        if (data) setOrder(data);
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [ticketId]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-[#c5a059] uppercase tracking-widest animate-pulse">
        Accessing Vault...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f1115] p-6 font-serif text-slate-100 flex justify-center items-center">
      <div className="max-w-2xl w-full bg-[#1a1d23] border border-[#2d3139] rounded-xl p-10 shadow-2xl relative overflow-hidden">
        <h2 className="text-[#c5a059] text-xl uppercase tracking-widest mb-8 border-b border-[#2d3139] pb-6 flex items-center gap-3">
          <Activity size={24} /> Status Portal
        </h2>

        {order ? (
          <div className="space-y-8">
            <div className="bg-[#13151a] p-8 rounded-lg border border-[#c5a059]/20 text-center shadow-inner">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] mb-2">
                Phase
              </p>
              <p className="text-3xl font-bold uppercase tracking-widest text-slate-100">
                {order.status || "In Processing"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#13151a] p-5 rounded-lg border border-[#2d3139]">
                <p className="text-[#c5a059] text-[10px] uppercase font-bold tracking-widest mb-2 border-b border-[#2d3139] pb-2">
                  Device Info
                </p>
                <p className="text-slate-100 font-bold">
                  {order.item?.brand} {order.item?.model_name}
                </p>
                <p className="text-slate-600 text-[10px] mt-2 font-mono">
                  SN: {order.item?.serial_number}
                </p>
              </div>
              <div className="bg-[#13151a] p-5 rounded-lg border border-[#2d3139]">
                <p className="text-[#c5a059] text-[10px] uppercase font-bold tracking-widest mb-2 border-b border-[#2d3139] pb-2">
                  Specialist
                </p>
                <p className="text-slate-100 text-sm">
                  {order.assigned_osta_tech_name || "Awaiting Assignment"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <ShieldAlert className="text-red-500 mx-auto mb-4" size={48} />
            <p className="text-red-400 uppercase text-xs font-bold tracking-[0.2em]">
              Record Not Found
            </p>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-[#2d3139] flex justify-between items-center text-slate-500 text-[10px] uppercase font-bold tracking-widest">
          <Link
            to="/"
            className="hover:text-[#c5a059] transition-all flex items-center gap-2"
          >
            <Home size={14} /> Home
          </Link>
          <span>ID: {ticketId}</span>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
