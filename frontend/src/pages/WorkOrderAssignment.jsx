import { jwtDecode } from "jwt-decode";
import {
  ChevronRight,
  PackageCheck,
  ShieldCheck,
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
  const [handoverConfirmId, setHandoverConfirmId] = useState(null);

  const token = localStorage.getItem("access");
  const decoded = token ? jwtDecode(token) : {};
  const isOwner = decoded.role === "OWNER";
  const currentUserId = decoded.user_id;
  const currentUsername = decoded.username || decoded.name;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const dropdownEndpoint = isOwner
        ? "/shops/staff/ostas/"
        : "/shops/staff/sabis/";

      const [orderRes, dropdownRes, ostaRes, sabiRes] = await Promise.all([
        api.get("/shops/work-order/"),
        api.get(dropdownEndpoint),
        api.get("/shops/staff/ostas/"),
        api.get("/shops/staff/sabis/"),
      ]);

      const combined = [...ostaRes.data, ...sabiRes.data];
      setOrders(orderRes.data);
      setStaff(dropdownRes.data);
      setAllPersonnel(combined);

      if (!isOwner) {
        const me = combined.find(
          (p) =>
            String(p.user) === String(currentUserId) ||
            p.username === currentUsername,
        );
        if (me) setMyTechId(String(me.id));
      }
    } catch (err) {
      showNotification("Sync failed.", "error");
    } finally {
      setLoading(false);
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

  const getNameFromMasterList = (id) => {
    if (!id) return null;
    const member = allPersonnel.find((s) => String(s.id) === String(id));
    return member ? member.username : null;
  };

  const showNotification = (text, type = "info") => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: "", type: "" }), 5000);
  };

  const handleAssignment = async (e, orderId) => {
    e.stopPropagation(); // CRITICAL: Prevents the card's onClick from firing

    const staffId = pendingAssignments[orderId];
    if (!staffId) return showNotification("Select tech.", "error");

    try {
      const payload = isOwner
        ? { assigned_osta_tech: staffId }
        : { assigned_sabi_tech: staffId };
      await api.patch(`/shops/work-order/${orderId}/assign-techs/`, payload);

      showNotification("Technician Linked.", "success");
      setPendingAssignments((prev) => ({ ...prev, [orderId]: "" }));
      fetchData(); // Refresh to see the new assignment
    } catch (err) {
      showNotification("Assignment failed.", "error");
    }
  };

  const handleStatusUpdate = async (e, orderId, newStatus) => {
    e.stopPropagation();
    try {
      await api.patch(`/shops/work-order/${orderId}/`, { status: newStatus });
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
      await api.patch(`/shops/work-order/${orderId}/`, { status: "completed" });
      showNotification("Order Finalized. Archives Updated.", "success");
      setHandoverConfirmId(null);
      setSelectedOrder(null);
      fetchData();
    } catch (err) {
      showNotification("Finalization failed.", "error");
    }
  };

  const handleDeployPart = async (e) => {
    e.preventDefault();
    if (!selectedPartId || !selectedOrder?.id) return;

    const payload = {
      work_order: parseInt(selectedOrder.id),
      inventory_item: parseInt(selectedPartId),
      quantity_used: 1,
      technician: null,
    };

    try {
      await api.patch(`/shops/work-order/${selectedOrder.id}/`, {
        status: "parts",
      });
      await api.post("/shops/part-usage/", payload);

      showNotification("Vault Requisition Successful", "success");
      setIsPartModalOpen(false);
      setSelectedPartId("");
      setSelectedOrder(null);
      fetchData();
    } catch (err) {
      console.error(err.response?.data);
      showNotification("Requisition Denied", "error");
    }
  };

  const handleSelfClaim = async (e, orderId) => {
    e.stopPropagation();
    let claimId = myTechId;
    if (!claimId) {
      const manual = allPersonnel.find((p) => p.username === currentUsername);
      if (manual) claimId = manual.id;
    }
    if (!claimId) return showNotification("Identity link missing.", "error");
    try {
      await api.patch(`/shops/work-order/${orderId}/assign-techs/`, {
        assigned_osta_tech: claimId,
      });
      showNotification("Ticket claimed.", "success");
      fetchData();
    } catch (err) {
      showNotification("Claim rejected.", "error");
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
          className={`fixed top-10 right-10 flex items-center gap-3 px-6 py-4 rounded-xl border z-100 ${
            notification.type === "error"
              ? "bg-red-500/10 border-red-500/50 text-red-500"
              : "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
          }`}
        >
          <span className="text-[12px] uppercase font-bold italic tracking-widest">
            {notification.text}
          </span>
        </div>
      )}

      <header className="mb-12 border-b border-[#2d3139] pb-6">
        <h1 className="text-[#c5a059] text-3xl tracking-[0.4em] uppercase">
          Workshop Distribution
        </h1>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2 italic">
          {isOwner ? "Owner View" : "Senior Tech Terminal"}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order) => {
          const ostaId = order.assigned_osta_tech
            ? String(order.assigned_osta_tech)
            : null;
          const sabiId = order.assigned_sabi_tech
            ? String(order.assigned_sabi_tech)
            : null;
          const localMyTechId =
            myTechId ||
            allPersonnel.find((p) => p.username === currentUsername)?.id;
          const isMeSenior =
            !isOwner && String(ostaId) === String(localMyTechId);

          return (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-[#1a1d23] border border-[#2d3139] rounded-2xl p-6 hover:border-[#c5a059]/50 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] text-slate-500 tracking-widest uppercase">
                    {order.ticket_id}
                  </span>
                  <h3 className="text-slate-100 text-lg mt-1 font-bold tracking-tight group-hover:text-[#c5a059] transition-colors">
                    {order.item_name}
                  </h3>
                </div>
                <div className="px-3 py-1 rounded-full text-[9px] uppercase font-bold border border-emerald-500/30 text-emerald-500">
                  {order.status}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={16} className="text-[#c5a059]" />
                    <span className="text-xs uppercase tracking-wide">
                      <span className="text-[#c5a059] font-bold mr-2">
                        Senior Tech:
                      </span>
                      {isMeSenior ? (
                        <span className="text-emerald-500 font-bold italic">
                          Assigned to You
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          {getNameFromMasterList(ostaId) || "Unclaimed"}
                        </span>
                      )}
                    </span>
                  </div>
                  {!isOwner && !ostaId && (
                    <button
                      onClick={(e) => handleSelfClaim(e, order.id)}
                      className="text-[9px] bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 px-3 py-1 rounded-lg uppercase font-bold hover:bg-[#c5a059] hover:text-[#0f1115] transition-all"
                    >
                      Claim
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Wrench size={16} className="text-[#c5a059]" />
                  <span className="text-xs uppercase tracking-wide">
                    <span className="text-[#c5a059] font-bold mr-2">
                      Junior Tech:
                    </span>
                    <span className="text-slate-400">
                      {getNameFromMasterList(sabiId) || "Awaiting Bench"}
                    </span>
                  </span>
                </div>
              </div>

              {(isOwner || isMeSenior) && (
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
                        Select {isOwner ? "Senior Tech" : "Junior Tech"}
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
                  {selectedOrder.item_name}
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
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#0f1115] p-4 rounded-2xl border border-[#2d3139] text-center">
                  <h4 className="text-[9px] uppercase text-slate-500 tracking-widest mb-1 italic">
                    Brand
                  </h4>
                  <p className="text-sm text-[#c5a059] font-bold">
                    {selectedOrder.brand || "N/A"}
                  </p>
                </div>
                <div className="bg-[#0f1115] p-4 rounded-2xl border border-[#2d3139] text-center">
                  <h4 className="text-[9px] uppercase text-slate-500 tracking-widest mb-1 italic">
                    Model
                  </h4>
                  <p className="text-sm text-slate-100 font-bold">
                    {selectedOrder.model || "N/A"}
                  </p>
                </div>
                <div className="bg-[#0f1115] p-4 rounded-2xl border border-[#2d3139] text-center">
                  <h4 className="text-[9px] uppercase text-slate-500 tracking-widest mb-1 italic">
                    Asset Type
                  </h4>
                  <p className="text-sm text-slate-100 font-bold">
                    {selectedOrder.item_type || "General"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] uppercase text-slate-500 tracking-widest mb-3 italic font-bold">
                      Personnel Assigned
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-[#c5a059]" />
                        <p className="text-xs tracking-wide">
                          <span className="text-[#c5a059] font-bold">
                            OSTA:
                          </span>{" "}
                          {getNameFromMasterList(
                            selectedOrder.assigned_osta_tech,
                          ) || "Awaiting Allocation"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench size={14} className="text-[#c5a059]" />
                        <p className="text-xs tracking-wide">
                          <span className="text-[#c5a059] font-bold">
                            SABI:
                          </span>{" "}
                          {getNameFromMasterList(
                            selectedOrder.assigned_sabi_tech,
                          ) || "Bench Reserved"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase text-slate-500 tracking-widest mb-3 italic font-bold">
                      Workflow Engine
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {(selectedOrder.status === "diagnosing" ||
                        selectedOrder.status === "parts") && (
                        <button
                          onClick={() => {
                            fetchInventory();
                            setIsPartModalOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl text-[10px] uppercase font-black border border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059] hover:text-[#0f1115] transition-all"
                        >
                          Deploy Parts
                        </button>
                      )}

                      {selectedOrder.status === "working" && (
                        <button
                          onClick={(e) =>
                            handleStatusUpdate(e, selectedOrder.id, "ready")
                          }
                          className="px-4 py-2 rounded-xl text-[10px] uppercase font-black border border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-[#0f1115] transition-all"
                        >
                          Mark Ready
                        </button>
                      )}

                      {/* ADD THE NEW BUTTON HERE */}
                      {selectedOrder.status === "ready" && (
                        <button
                          onClick={() => handleHandover(selectedOrder.id)}
                          className="px-4 py-2 rounded-xl text-[10px] uppercase font-black border border-[#c5a059] bg-[#c5a059] text-[#0f1115] hover:opacity-90 transition-all"
                        >
                          Finalize Handover
                        </button>
                      )}

                      <span className="px-4 py-2 rounded-xl text-[10px] uppercase font-black border border-slate-700 bg-slate-800/30 text-slate-400">
                        Phase: {selectedOrder.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase text-slate-500 tracking-widest mb-3 italic font-bold">
                    System Description
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed font-sans bg-[#0f1115] p-4 rounded-xl border border-[#2d3139] min-h-24">
                    {selectedOrder.description ||
                      "No supplemental manifest provided."}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#0f1115]/50 border-t border-[#2d3139] flex justify-end">
              <button
                className="bg-[#c5a059] text-[#0f1115] px-10 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-[#d4b475] transition-all active:scale-95"
                onClick={() => setSelectedOrder(null)}
              >
                Return to Command
              </button>
            </div>
          </div>
        </div>
      )}

      {isPartModalOpen && (
        <div className="fixed inset-0 bg-[#0f1115]/95 backdrop-blur-xl z-60 flex items-center justify-center p-4">
          <div className="bg-[#1a1d23] border border-[#c5a059]/30 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h2 className="text-[#c5a059] text-xl tracking-widest uppercase font-bold">
                  Vault Requisition
                </h2>
                <p className="text-slate-500 text-[10px] uppercase italic tracking-tighter">
                  Requesting component for ticket {selectedOrder?.ticket_id}
                </p>
              </div>
              <PackageCheck className="text-[#c5a059]/20" size={40} />
            </div>

            <div className="space-y-6">
              <select
                className="w-full bg-[#0f1115] border border-[#2d3139] p-4 rounded-xl text-xs text-[#c5a059] outline-none appearance-none"
                onChange={(e) => setSelectedPartId(e.target.value)}
                value={selectedPartId}
              >
                <option value="">-- Browse Available Parts --</option>
                {inventory.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    className="bg-[#1a1d23]"
                  >
                    {item.specifications?.brand} {item.specifications?.model} -{" "}
                    {item.name} ({item.stock_count} units)
                  </option>
                ))}
              </select>

              <div className="flex gap-4">
                <button
                  onClick={handleDeployPart}
                  className="flex-1 bg-[#c5a059] text-[#0f1115] py-4 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-[#d4b475] transition-all active:scale-95"
                >
                  Confirm Deployment
                </button>
                <button
                  onClick={() => setIsPartModalOpen(false)}
                  className="px-6 py-4 rounded-xl text-[10px] uppercase font-bold border border-slate-700 text-slate-500 hover:bg-slate-800 transition-all"
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