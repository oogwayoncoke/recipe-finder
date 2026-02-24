import { jwtDecode } from "jwt-decode";
import {
  Activity,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Package,
  Plus,
  ShieldCheck,
  Trash2,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";

const WorkOrderAssignment = () => {
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [allPersonnel, setAllPersonnel] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [myTechId, setMyTechId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ text: "", type: "" });
  const [pendingAssignments, setPendingAssignments] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [liveSeconds, setLiveSeconds] = useState(0);

  const [partForm, setPartForm] = useState({
    inventory_item: "",
    quantity_used: 1,
  });
  const [serviceToAdd, setServiceToAdd] = useState("");

  const token = localStorage.getItem("access");
  const authPayload = useMemo(() => {
    try {
      return token ? jwtDecode(token) : {};
    } catch (e) {
      return {};
    }
  }, [token]);

  const isOwner = authPayload.role === "OWNER";
  const techLevel = authPayload.tech_level || authPayload.techlevel;
  const currentUserId = authPayload.user_id;

  const refreshModalData = async (id) => {
    try {
      const res = await api.get(`/shops/work-orders/${id}/`);
      setSelectedOrder(res.data);
    } catch (err) {
      console.error("Sync Error");
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const dropdownEndpoint = isOwner
        ? "/shops/staff/ostas/"
        : "/shops/staff/sabis/";
      const [orderRes, dropdownRes, ostaRes, sabiRes, invRes, servRes] =
        await Promise.all([
          api.get("/shops/work-orders/"),
          api.get(dropdownEndpoint),
          api.get("/shops/staff/ostas/"),
          api.get("/shops/staff/sabis/"),
          api.get("/shops/inventory/"),
          api.get("/shops/services/"),
        ]);

      const rawOrders = orderRes.data?.results || orderRes.data || [];
      setOrders([...rawOrders].sort((a, b) => b.id - a.id));
      setStaff(dropdownRes.data?.results || dropdownRes.data || []);
      setInventory(invRes.data?.results || invRes.data || []);
      setAvailableServices(servRes.data?.results || servRes.data || []);

      const combinedStaff = [...(ostaRes.data || []), ...(sabiRes.data || [])];
      setAllPersonnel(combinedStaff);

      setSelectedOrder((prev) => {
        if (!prev) return null;
        const fresh = rawOrders.find((o) => o.id === prev.id);
        return fresh ? { ...fresh } : prev;
      });

      const me = combinedStaff.find(
        (p) => String(p.user) === String(currentUserId),
      );
      if (me) setMyTechId(parseInt(me.id));
    } catch (err) {
      showNotification("Sync failed.", "error");
    } finally {
      setLoading(false);
    }
  }, [isOwner, currentUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const checkActiveSession = async () => {
      if (!currentUserId) return;
      try {
        const res = await api.get("/shops/work-sessions/");
        const sessions = res.data?.results || res.data || [];
        const active = sessions.find(
          (s) =>
            s.is_active &&
            String(s.technician_user_id) === String(currentUserId),
        );
        setActiveSession(active || null);
      } catch (err) {
        console.error("Session sync failed");
      }
    };
    checkActiveSession();
  }, [currentUserId]);

  const isThisOrderActive = useMemo(
    () =>
      activeSession &&
      selectedOrder &&
      String(activeSession.work_order) === String(selectedOrder.id),
    [activeSession, selectedOrder],
  );

  useEffect(() => {
    let interval;
    if (isThisOrderActive && activeSession?.start_time) {
      const tick = () => {
        const start = new Date(activeSession.start_time).getTime();
        const now = new Date().getTime();
        setLiveSeconds(Math.max(0, Math.floor((now - start) / 1000)));
      };
      tick();
      interval = setInterval(tick, 1000);
    } else {
      setLiveSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isThisOrderActive, activeSession]);

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/shops/work-orders/${selectedOrder.id}/`, {
        status: newStatus,
      });
      await refreshModalData(selectedOrder.id);
      fetchData();
    } catch (err) {
      showNotification("Failed.", "error");
    }
  };

  const handleAddPart = async () => {
    if (!partForm.inventory_item) return;
    try {
      await api.post("/shops/part-usage/", {
        ...partForm,
        work_order: selectedOrder.id,
      });
      setPartForm({ inventory_item: "", quantity_used: 1 });
      await refreshModalData(selectedOrder.id);
      fetchData();
      showNotification("Asset deployment logged.", "success");
    } catch (err) {
      showNotification("Error.", "error");
    }
  };

  const handleUpdatePartQuantity = async (usageId, newQty) => {
    if (newQty < 1) return;
    try {
      await api.patch(`/shops/part-usage/${usageId}/`, {
        quantity_used: newQty,
      });
      await refreshModalData(selectedOrder.id);
      showNotification("Quantity updated.", "success");
    } catch (err) {
      showNotification("Update failed.", "error");
    }
  };

  const handleRemovePart = async (usageId) => {
    try {
      await api.delete(`/shops/part-usage/${usageId}/`);
      await refreshModalData(selectedOrder.id);
      fetchData();
      showNotification("Asset removed from manifest.", "info");
    } catch (err) {
      showNotification("Deletion failed.", "error");
    }
  };

  const handleAddService = async () => {
    if (!serviceToAdd || !selectedOrder) return;
    try {
      const currentIds = selectedOrder.services || [];
      const updatedIds = [...new Set([...currentIds, parseInt(serviceToAdd)])];

      await api.patch(`/shops/work-orders/${selectedOrder.id}/`, {
        services: updatedIds,
      });
      setServiceToAdd("");
      await refreshModalData(selectedOrder.id);
      fetchData();
      showNotification("Labor manifest updated.", "success");
    } catch (err) {
      showNotification("Error.", "error");
    }
  };

  const handleRemoveService = async (serviceId) => {
    try {
      const updatedIds = (selectedOrder.services || []).filter(
        (id) => id !== serviceId,
      );
      await api.patch(`/shops/work-orders/${selectedOrder.id}/`, {
        services: updatedIds,
      });
      await refreshModalData(selectedOrder.id);
      fetchData();
      showNotification("Labor item removed.", "info");
    } catch (err) {
      showNotification("Removal failed.", "error");
    }
  };

  const handleToggleDiagnosis = async (e) => {
    if (e) e.stopPropagation();
    const orderId = selectedOrder?.id;
    if (activeSession) {
      try {
        await api.post("/shops/work-sessions/stop_session/");
        setActiveSession(null);
        await refreshModalData(orderId);
        fetchData();
      } catch (err) {
        showNotification("Stop failed.", "error");
      }
    } else {
      try {
        const res = await api.post(
          `/shops/work-sessions/${orderId}/start_order/`,
        );
        if (res?.data) setActiveSession(res.data);
      } catch (err) {
        showNotification("Start failed.", "error");
      }
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      await api.post(
        `/shops/work-orders/${selectedOrder.id}/generate-invoice/`,
      );
      await refreshModalData(selectedOrder.id);
      fetchData();
    } catch (err) {
      showNotification("Error.", "error");
    }
  };

  const handleAssignment = async (e, orderId) => {
    e.stopPropagation();
    const staffId = pendingAssignments[orderId];
    try {
      const payload = isOwner
        ? { assigned_osta_tech: parseInt(staffId) }
        : { assigned_sabi_tech: parseInt(staffId) };
      await api.patch(`/shops/work-orders/${orderId}/assign-techs/`, payload);
      setPendingAssignments({ ...pendingAssignments, [orderId]: "" });
      fetchData();
    } catch (err) {
      showNotification("Error.", "error");
    }
  };

  const handleSelfClaim = async (e, orderId) => {
    e.stopPropagation();
    try {
      const payload =
        techLevel === "OSTA"
          ? { assigned_osta_tech: myTechId }
          : { assigned_sabi_tech: myTechId };
      await api.patch(`/shops/work-orders/${orderId}/assign-techs/`, payload);
      fetchData();
    } catch (err) {
      showNotification("Error.", "error");
    }
  };

  const totalTimeLogged = useMemo(() => {
    if (!selectedOrder) return "0s";
    const completedSeconds = (selectedOrder.sessions || []).reduce(
      (acc, s) => acc + (parseFloat(s.duration_seconds) || 0),
      0,
    );
    const total = completedSeconds + (isThisOrderActive ? liveSeconds : 0);
    const mins = Math.floor(total / 60);
    const secs = Math.floor(total % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }, [selectedOrder, isThisOrderActive, liveSeconds]);

  const showNotification = (text, type = "info") => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: "", type: "" }), 5000);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-[#c5a059] uppercase italic animate-pulse tracking-[0.4em]">
        Linking Terminal...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f1115] p-8 font-serif text-slate-200">
      {notification.text && (
        <div
          className={`fixed top-10 right-10 px-6 py-4 rounded-xl border z-50 transition-all ${notification.type === "error" ? "bg-red-500/10 border-red-500/50 text-red-500" : "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"}`}
        >
          <span className="text-[12px] uppercase font-bold tracking-widest italic">
            {notification.text}
          </span>
        </div>
      )}

      <header className="mb-12 border-b border-[#2d3139] pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-[#c5a059] text-3xl tracking-[0.4em] uppercase font-black">
            Workshop Distribution
          </h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2 italic font-bold">
            {isOwner ? "Owner View" : `${techLevel} Terminal`} // ID: {myTechId}
          </p>
        </div>
        <div className="text-emerald-500 flex items-center gap-2">
          <Activity size={14} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase italic">Live</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order) => {
          const isMeSenior =
            String(order.assigned_osta_tech) === String(myTechId);
          return (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-[#1a1d23] border border-[#2d3139] rounded-2xl p-6 hover:border-[#c5a059]/50 cursor-pointer shadow-xl group"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                    {order.ticket_id}
                  </span>
                  <h3 className="text-slate-100 text-lg mt-1 font-bold group-hover:text-[#c5a059]">
                    {order.item_name || "Repair Asset"}
                  </h3>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-[9px] uppercase font-black border tracking-widest ${order.status === "completed" ? "border-blue-500/30 text-blue-500 bg-blue-500/5" : "border-emerald-500/30 text-emerald-500 bg-emerald-500/5"}`}
                >
                  {order.status}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#c5a059]" /> Senior
                  </span>
                  {!order.assigned_osta_tech && techLevel === "OSTA" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelfClaim(e, order.id);
                      }}
                      className="text-[9px] bg-[#c5a059] text-[#0f1115] px-4 py-1.5 rounded-lg font-black uppercase hover:bg-white transition-all"
                    >
                      Claim
                    </button>
                  ) : (
                    <span className="text-xs text-slate-100 font-bold">
                      {allPersonnel.find(
                        (p) =>
                          String(p.id) === String(order.assigned_osta_tech),
                      )?.username || "---"}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-2">
                    <Wrench size={14} className="text-[#c5a059]" /> Junior
                  </span>
                  {!order.assigned_sabi_tech && techLevel === "SABI" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelfClaim(e, order.id);
                      }}
                      className="text-[9px] bg-[#c5a059] text-[#0f1115] px-4 py-1.5 rounded-lg font-black uppercase hover:bg-white transition-all"
                    >
                      Claim
                    </button>
                  ) : (
                    <span className="text-xs text-slate-100 font-bold">
                      {allPersonnel.find(
                        (p) =>
                          String(p.id) === String(order.assigned_sabi_tech),
                      )?.username || "---"}
                    </span>
                  )}
                </div>
              </div>

              {(isOwner || isMeSenior) && order.status !== "completed" && (
                <div
                  className="pt-6 border-t border-[#2d3139]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex gap-3 relative">
                    <select
                      value={pendingAssignments[order.id] || ""}
                      onChange={(e) =>
                        setPendingAssignments({
                          ...pendingAssignments,
                          [order.id]: e.target.value,
                        })
                      }
                      className="w-full bg-[#0f1115] border border-[#2d3139] text-[#c5a059] text-[10px] uppercase font-black rounded-xl py-3 px-5 appearance-none focus:border-[#c5a059] outline-none transition-all"
                    >
                      <option value="" disabled>
                        Deploy Personnel
                      </option>
                      {staff.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.username}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={(e) => handleAssignment(e, order.id)}
                      className="bg-[#c5a059] text-[#0f1115] p-3 rounded-xl hover:bg-white transition-all shadow-lg"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedOrder && (
        <div
          className="fixed inset-0 bg-[#0f1115]/98 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-[#1a1d23] border border-[#c5a059]/30 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-8 border-b border-[#2d3139] flex justify-between items-center bg-gradient-to-r from-[#c5a059]/10 to-transparent">
              <div>
                <span className="text-[10px] text-[#c5a059] tracking-[0.3em] uppercase font-black italic">
                  Technical Spec // {selectedOrder.ticket_id}
                </span>
                <h2 className="text-3xl text-slate-100 font-black mt-1 tracking-tighter uppercase">
                  {selectedOrder.item_name || "Repair Asset"}
                </h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="bg-[#0f1115] border border-[#c5a059]/50 text-[#c5a059] text-[10px] uppercase font-black pl-6 pr-10 py-3 rounded-xl appearance-none outline-none cursor-pointer hover:border-[#c5a059] transition-all shadow-inner"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5a059] pointer-events-none"
                    size={14}
                  />
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-slate-500 hover:text-white"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-[#0f1115] p-6 rounded-3xl border border-[#2d3139] flex items-center justify-between shadow-inner">
                  <div>
                    <h4 className="text-[10px] uppercase text-[#c5a059] font-black mb-1 tracking-widest">
                      Diagnostic Chrono
                    </h4>
                    <p className="text-3xl font-mono text-white font-black flex items-center gap-3">
                      <Clock
                        size={24}
                        className={
                          isThisOrderActive
                            ? "text-emerald-500 animate-spin"
                            : "text-slate-600"
                        }
                      />
                      {totalTimeLogged}
                    </p>
                  </div>
                  {!isOwner && (
                    <button
                      onClick={handleToggleDiagnosis}
                      className={`px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isThisOrderActive ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]" : "bg-[#c5a059] text-[#0f1115] hover:bg-white"}`}
                    >
                      {isThisOrderActive ? "Punch Out" : "Punch In"}
                    </button>
                  )}
                </section>
                {selectedOrder.status === "completed" && (
                  <section className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] uppercase text-emerald-500 font-black flex items-center gap-2">
                        <FileText size={16} /> Fiscal Finalization
                      </h4>
                      <p className="text-[11px] text-slate-400 font-bold italic">
                        Ready for deployment.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateInvoice}
                      className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black hover:bg-emerald-500 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    >
                      Invoice
                    </button>
                  </section>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Services Manifest (EDIT MODE) */}
                <section>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[11px] uppercase text-[#c5a059] font-black italic tracking-widest">
                      Labor Manifest
                    </h4>
                    <div className="flex gap-2">
                      <select
                        value={serviceToAdd}
                        onChange={(e) => setServiceToAdd(e.target.value)}
                        className="bg-[#0f1115] border border-[#2d3139] text-[10px] uppercase font-bold text-slate-400 px-4 py-2 rounded-xl outline-none"
                      >
                        <option value="">Add Service</option>
                        {availableServices.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.service_name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddService}
                        className="bg-[#c5a059] text-[#0f1115] p-2.5 rounded-xl hover:bg-white transition-all"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {(selectedOrder.service_details || []).map((s) => (
                      <div
                        key={s.id}
                        className="group flex justify-between items-center bg-[#1a1d23] p-5 rounded-2xl border border-[#2d3139] hover:border-[#c5a059]/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-[#c5a059]/10 rounded-lg text-[#c5a059]">
                            <Zap size={16} />
                          </div>
                          <p className="text-xs text-slate-100 uppercase font-black">
                            {s.service_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-mono text-slate-500 font-bold">
                            {s.standard_duration}m Benchmark
                          </span>
                          <button
                            onClick={() => handleRemoveService(s.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-white p-2 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Asset Consumption (EDIT MODE) */}
                <section>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[11px] uppercase text-[#c5a059] font-black italic tracking-widest">
                      Asset Consumption
                    </h4>
                    <div className="flex gap-2">
                      <select
                        value={partForm.inventory_item}
                        onChange={(e) =>
                          setPartForm({
                            ...partForm,
                            inventory_item: e.target.value,
                          })
                        }
                        className="bg-[#0f1115] border border-[#2d3139] text-[10px] uppercase font-bold text-slate-400 px-4 py-2 rounded-xl outline-none"
                      >
                        <option value="">Select Part</option>
                        {inventory.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.part_name || p.name} ({p.stock_count} Avail)
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={partForm.quantity_used}
                        onChange={(e) =>
                          setPartForm({
                            ...partForm,
                            quantity_used: e.target.value,
                          })
                        }
                        className="w-16 bg-[#0f1115] border border-[#2d3139] text-[10px] text-slate-100 font-bold px-3 py-2 rounded-xl outline-none text-center"
                      />
                      <button
                        onClick={handleAddPart}
                        className="bg-[#c5a059] text-[#0f1115] p-2.5 rounded-xl hover:bg-white transition-all"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {(selectedOrder.parts_used || []).map((p) => {
                      const invItem = inventory.find(
                        (i) => String(i.id) === String(p.inventory_item),
                      );
                      return (
                        <div
                          key={p.id}
                          className="group flex justify-between items-center bg-[#1a1d23] p-5 rounded-2xl border border-[#2d3139] hover:border-[#c5a059]/30 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-[#c5a059]/10 rounded-lg text-[#c5a059]">
                              <Package size={16} />
                            </div>
                            <div>
                              <p className="text-xs text-slate-100 uppercase font-black">
                                {p.part_name ||
                                  invItem?.name ||
                                  "Component Asset"}
                              </p>
                              <p className="text-[9px] text-slate-500 font-bold">
                                {p.price_at_use} EGP Unit
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <input
                              type="number"
                              value={p.quantity_used}
                              onChange={(e) =>
                                handleUpdatePartQuantity(
                                  p.id,
                                  parseInt(e.target.value),
                                )
                              }
                              className="w-12 bg-[#0f1115] border border-white/10 text-[#c5a059] text-[11px] font-black p-1 rounded text-center outline-none focus:border-[#c5a059]"
                            />
                            <button
                              onClick={() => handleRemovePart(p.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-white p-2 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>

            <div className="p-8 bg-[#0f1115]/50 border-t border-[#2d3139] flex justify-end">
              <button
                className="bg-slate-800 text-slate-300 px-14 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-[#0f1115] transition-all shadow-lg active:scale-95"
                onClick={() => setSelectedOrder(null)}
              >
                Dismiss Manifest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderAssignment;