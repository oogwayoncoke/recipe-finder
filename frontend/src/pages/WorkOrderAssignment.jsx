import { jwtDecode } from "jwt-decode";
import {
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api";

const WorkOrderAssignment = () => {
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [allPersonnel, setAllPersonnel] = useState([]);
  const [myTechId, setMyTechId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ text: "", type: "" });
  const [pendingAssignments, setPendingAssignments] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const token = localStorage.getItem("access");
  const decoded = token ? jwtDecode(token) : {};

  const isOwner = decoded.role === "OWNER";
  const techLevel = decoded.tech_level;
  const currentUserId = decoded.user_id;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const dropdownEndpoint = isOwner
        ? "/shops/staff/ostas/"
        : "/shops/staff/sabis/";

      const [orderRes, dropdownRes, ostaRes, sabiRes] = await Promise.all([
        api.get("/shops/work-orders/"),
        api.get(dropdownEndpoint),
        api.get("/shops/staff/ostas/"),
        api.get("/shops/staff/sabis/"),
      ]);

      const rawOrders = orderRes.data.results || orderRes.data;
      const sortedOrders = [...rawOrders].sort((a, b) => b.id - a.id);
      const combined = [...ostaRes.data, ...sabiRes.data];

      setOrders(sortedOrders);
      setStaff(dropdownRes.data);
      setAllPersonnel(combined);

      const me = combined.find((p) => String(p.user) === String(currentUserId));
      if (me) setMyTechId(parseInt(me.id));
    } catch (err) {
      showNotification("Sync failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignment = async (e, orderId) => {
    e.stopPropagation();
    const staffId = pendingAssignments[orderId];
    if (!staffId) return showNotification("Select tech.", "error");

    try {
      const payload = isOwner
        ? { assigned_osta_tech: parseInt(staffId) }
        : { assigned_sabi_tech: parseInt(staffId) };

      await api.patch(`/shops/work-orders/${orderId}/assign-techs/`, payload);
      showNotification("Technician Linked.", "success");
      setPendingAssignments((prev) => ({ ...prev, [orderId]: "" }));
      fetchData();
    } catch (err) {
      showNotification("Assignment failed.", "error");
    }
  };

  const handleSelfClaim = async (e, orderId) => {
    e.stopPropagation();
    if (!myTechId) return showNotification("Identity link missing.", "error");

    try {
      const payload =
        techLevel === "OSTA"
          ? { assigned_osta_tech: myTechId }
          : { assigned_sabi_tech: myTechId };

      await api.patch(`/shops/work-orders/${orderId}/assign-techs/`, payload);
      showNotification("Ticket claimed.", "success");
      fetchData();
    } catch (err) {
      showNotification("Claim rejected.", "error");
    }
  };

  const getNameFromMasterList = (id) => {
    if (!id) return null;
    const member = allPersonnel.find((s) => String(s.id) === String(id));
    return member ? member.username : null;
  };

  const showNotification = (text, type = "info") => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: "", type: "" }), 5000);
  };

  const handleDeleteOrder = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/shops/work-orders/${deleteConfirmId}/`);
      setOrders(orders.filter((o) => o.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      showNotification("Order Purged.", "success");
      fetchData();
    } catch (err) {
      showNotification("Purge failed.", "error");
    }
  };

  const handleStatusUpdate = async (e, orderId, newStatus) => {
    e.stopPropagation();
    try {
      await api.patch(`/shops/work-orders/${orderId}/`, { status: newStatus });
      showNotification(`Status: ${newStatus}`, "success");
      fetchData();
      if (selectedOrder)
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      showNotification("Transition failed.", "error");
    }
  };

  const handleHandover = async (orderId) => {
    try {
      await api.patch(`/shops/work-orders/${orderId}/`, {
        status: "completed",
      });
      showNotification("Order Finalized.", "success");
      setSelectedOrder(null);
      fetchData();
    } catch (err) {
      showNotification("Finalization failed.", "error");
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await api.get("/shops/inventory/");
      const parts = res.data.filter(
        (item) => item.product_type === "PART" && item.stock_count > 0,
      );
      setInventory(parts);
    } catch (err) {
      showNotification("Vault link unstable.", "error");
    }
  };

  const handleDeployPart = async (e) => {
    e.preventDefault();
    if (!selectedPartId || !selectedOrder?.id) return;
    const payload = {
      work_order: parseInt(selectedOrder.id),
      inventory_item: parseInt(selectedPartId),
      quantity_used: 1,
      technician: myTechId ? parseInt(myTechId) : null,
    };
    try {
      await api.patch(`/shops/work-orders/${selectedOrder.id}/`, {
        status: "parts",
      });
      await api.post("/shops/part-usage/", payload);
      showNotification("Requisition Successful", "success");
      setIsPartModalOpen(false);
      setSelectedPartId("");
      setSelectedOrder(null);
      fetchData();
    } catch (err) {
      showNotification("Requisition Denied", "error");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-[#c5a059] uppercase tracking-widest font-serif text-sm">
        Establishing Identity Link...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f1115] p-8 font-serif text-slate-200 relative">
      {notification.text && (
        <div
          className={`fixed top-10 right-10 flex items-center gap-3 px-6 py-4 rounded-xl border z-50 ${notification.type === "error" ? "bg-red-500/10 border-red-500/50 text-red-500" : "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"}`}
        >
          <span className="text-[12px] uppercase font-bold italic tracking-widest">
            {notification.text}
          </span>
        </div>
      )}

      <header className="mb-12 border-b border-[#2d3139] pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-[#c5a059] text-3xl tracking-[0.4em] uppercase">
            Workshop Distribution
          </h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2 italic">
            {isOwner ? "Owner View" : `${techLevel} Terminal`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[#c5a059] text-[10px] uppercase font-bold tracking-widest">
            Active Manifest
          </p>
          <p className="text-slate-400 text-xs font-mono">
            {orders.length} Records
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order) => {
          const ostaId = order.assigned_osta_tech
            ? String(order.assigned_osta_tech)
            : null;
          const sabiId = order.assigned_sabi_tech
            ? String(order.assigned_sabi_tech)
            : null;
          const isMeSenior = String(ostaId) === String(myTechId);
          const isMeJunior = String(sabiId) === String(myTechId);

          return (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-[#1a1d23] border border-[#2d3139] rounded-2xl p-6 hover:border-[#c5a059]/50 transition-all cursor-pointer group relative"
            >
              {isOwner && order.status === "pending" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(order.id);
                  }}
                  className="absolute top-4 right-4 text-slate-600 hover:text-red-500 transition-colors z-10"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] text-slate-500 tracking-widest uppercase">
                    {order.ticket_id}
                  </span>
                  <h3 className="text-slate-100 text-lg mt-1 font-bold tracking-tight group-hover:text-[#c5a059] transition-colors">
                    {order.item_name || "Repair Asset"}
                  </h3>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-[9px] uppercase font-bold border ${order.status === "completed" ? "border-blue-500/30 text-blue-500" : "border-emerald-500/30 text-emerald-500"}`}
                >
                  {order.status}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={16} className="text-[#c5a059]" />
                    <span className="text-xs uppercase tracking-wide">
                      <span className="text-[#c5a059] font-bold mr-2">
                        Senior:
                      </span>
                      {isMeSenior ? (
                        <span className="text-emerald-500 font-bold italic">
                          You
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          {getNameFromMasterList(ostaId) || "Unclaimed"}
                        </span>
                      )}
                    </span>
                  </div>
                  {!isOwner && !ostaId && techLevel === "OSTA" && (
                    <button
                      onClick={(e) => handleSelfClaim(e, order.id)}
                      className="text-[9px] bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 px-3 py-1 rounded-lg uppercase font-bold hover:bg-[#c5a059] transition-all"
                    >
                      Claim
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wrench size={16} className="text-[#c5a059]" />
                    <span className="text-xs uppercase tracking-wide">
                      <span className="text-[#c5a059] font-bold mr-2">
                        Junior:
                      </span>
                      {isMeJunior ? (
                        <span className="text-emerald-500 font-bold italic">
                          You
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          {getNameFromMasterList(sabiId) || "Awaiting"}
                        </span>
                      )}
                    </span>
                  </div>
                  {!isOwner && !sabiId && techLevel === "SABI" && (
                    <button
                      onClick={(e) => handleSelfClaim(e, order.id)}
                      className="text-[9px] bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 px-3 py-1 rounded-lg uppercase font-bold hover:bg-[#c5a059] transition-all"
                    >
                      Claim
                    </button>
                  )}
                </div>
              </div>

              {(isOwner || isMeSenior) && order.status !== "completed" && (
                <div
                  className="pt-6 border-t border-[#2d3139]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex gap-3 items-center">
                    <select
                      value={pendingAssignments[order.id] || ""}
                      onChange={(e) =>
                        setPendingAssignments({
                          ...pendingAssignments,
                          [order.id]: e.target.value,
                        })
                      }
                      className="w-full bg-[#0f1115] border border-[#c5a059]/30 text-[#c5a059] text-[11px] rounded-xl py-3 px-5 outline-none appearance-none font-serif"
                    >
                      <option value="" disabled className="bg-[#1a1d23]">
                        Select {isOwner ? "Senior" : "Junior"}
                      </option>
                      {staff.map((m) => (
                        <option
                          key={m.id}
                          value={m.id}
                          className="bg-[#1a1d23]"
                        >
                          {m.username}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={(e) => handleAssignment(e, order.id)}
                      className="bg-[#c5a059] text-[#0f1115] p-3 rounded-xl hover:bg-[#d4b475] active:scale-95 transition-all"
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
        <div className="fixed inset-0 bg-[#0f1115]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d23] border border-[#c5a059]/30 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-[#2d3139] flex justify-between items-center bg-linear-to-r from-[#c5a059]/10 to-transparent">
              <div>
                <span className="text-[10px] text-[#c5a059] tracking-[0.3em] uppercase font-bold">
                  Technical Spec // {selectedOrder.ticket_id}
                </span>
                <h2 className="text-2xl text-slate-100 font-bold tracking-tight mt-1">
                  {selectedOrder.item_name || "Repair Asset"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-500 hover:text-[#c5a059] p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] uppercase text-slate-500 tracking-widest mb-3 italic font-bold">
                      Personnel
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-[#c5a059]" />
                        <p className="text-xs">
                          <span className="text-[#c5a059] font-bold">
                            OSTA:
                          </span>{" "}
                          {getNameFromMasterList(
                            selectedOrder.assigned_osta_tech,
                          ) || "None"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench size={14} className="text-[#c5a059]" />
                        <p className="text-xs">
                          <span className="text-[#c5a059] font-bold">
                            SABI:
                          </span>{" "}
                          {getNameFromMasterList(
                            selectedOrder.assigned_sabi_tech,
                          ) || "None"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase text-slate-500 tracking-widest mb-3 italic font-bold">
                      Engine
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedOrder.status !== "completed" && (
                        <>
                          {(selectedOrder.status === "diagnosing" ||
                            selectedOrder.status === "parts") && (
                            <button
                              onClick={() => {
                                fetchInventory();
                                setIsPartModalOpen(true);
                              }}
                              className="px-4 py-2 rounded-xl text-[10px] uppercase font-black border border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059] transition-all"
                            >
                              Deploy Parts
                            </button>
                          )}
                          {selectedOrder.status === "working" && (
                            <button
                              onClick={(e) =>
                                handleStatusUpdate(e, selectedOrder.id, "ready")
                              }
                              className="px-4 py-2 rounded-xl text-[10px] uppercase font-black border border-emerald-500 text-emerald-500 hover:bg-emerald-500 transition-all"
                            >
                              Mark Ready
                            </button>
                          )}
                          {selectedOrder.status === "ready" && (
                            <button
                              onClick={() => handleHandover(selectedOrder.id)}
                              className="px-4 py-2 rounded-xl text-[10px] uppercase font-black border border-[#c5a059] bg-[#c5a059] text-[#0f1115] hover:opacity-90 transition-all"
                            >
                              Finalize
                            </button>
                          )}
                        </>
                      )}
                      <span className="px-4 py-2 rounded-xl text-[10px] uppercase font-black border border-slate-700 bg-slate-800/30 text-slate-400">
                        Phase: {selectedOrder.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase text-slate-500 tracking-widest mb-3 italic font-bold">
                    Description
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed font-sans bg-[#0f1115] p-4 rounded-xl border border-[#2d3139] min-h-24">
                    {selectedOrder.description ||
                      "No supplemental manifest provided."}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-[#0f1115]/50 border-t border-[#2d3139] flex justify-between gap-4">
              {isOwner && selectedOrder.status === "pending" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(selectedOrder.id);
                  }}
                  className="px-6 py-3 rounded-xl text-[10px] uppercase font-black border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                >
                  Terminate Order
                </button>
              )}
              <button
                className="bg-[#c5a059] text-[#0f1115] px-10 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-[#d4b475] transition-all active:scale-95 ml-auto"
                onClick={() => setSelectedOrder(null)}
              >
                Return
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-[#0f1115]/95 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
          <div className="bg-[#1a1d23] border border-red-500/30 w-full max-w-sm rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h3 className="text-white text-lg font-bold uppercase tracking-widest mb-2">
              Purge Request
            </h3>
            <p className="text-slate-500 text-xs mb-8 leading-relaxed italic">
              Are you sure you want to permanently remove this pending record?
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDeleteOrder}
                className="flex-1 bg-red-500 text-white py-4 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-red-600 transition-all"
              >
                Confirm Purge
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 border border-slate-700 text-slate-500 py-4 rounded-xl text-[10px] uppercase font-bold hover:bg-slate-800 transition-all"
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      )}

      {isPartModalOpen && (
        <div className="fixed inset-0 bg-[#0f1115]/95 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
          <div className="bg-[#1a1d23] border border-[#c5a059]/30 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h2 className="text-[#c5a059] text-xl tracking-widest uppercase font-bold mb-8">
              Vault Requisition
            </h2>
            <div className="space-y-6">
              <select
                className="w-full bg-[#0f1115] border border-[#2d3139] p-4 rounded-xl text-xs text-[#c5a059] outline-none"
                onChange={(e) => setSelectedPartId(e.target.value)}
                value={selectedPartId}
              >
                <option value="">-- Browse Parts --</option>
                {inventory.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    className="bg-[#1a1d23]"
                  >
                    {item.name} ({item.stock_count} units)
                  </option>
                ))}
              </select>
              <div className="flex gap-4">
                <button
                  onClick={handleDeployPart}
                  className="flex-1 bg-[#c5a059] text-[#0f1115] py-4 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-[#d4b475] active:scale-95"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setIsPartModalOpen(false)}
                  className="px-6 py-4 rounded-xl text-[10px] uppercase font-bold border border-slate-700 text-slate-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderAssignment;