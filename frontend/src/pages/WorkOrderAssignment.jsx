import { jwtDecode } from "jwt-decode";
import { ChevronRight, ShieldCheck, Wrench } from "lucide-react";
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

  const token = localStorage.getItem("access");
  const decoded = token ? jwtDecode(token) : {};
  const isOwner = decoded.role === "OWNER";

  // Bridge identifiers from JWT
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
        api.get("/shops/work-order/view/"),
        api.get(dropdownEndpoint),
        api.get("/shops/staff/ostas/"),
        api.get("/shops/staff/sabis/"),
      ]);

      const combined = [...ostaRes.data, ...sabiRes.data];
      setOrders(orderRes.data);
      setStaff(dropdownRes.data);
      setAllPersonnel(combined);

      if (!isOwner) {
        // HANDSHAKE: Match User ID 32 or Username to the Technician Profile
        const me = combined.find(
          (p) =>
            String(p.user) === String(currentUserId) ||
            p.username === currentUsername,
        );

        if (me) {
          setMyTechId(String(me.id));
          console.log("✅ Bridge Established. Tech ID:", me.id);
        } else {
          console.warn(
            "❌ Identity mismatch. Check if your profile tech_level is OSTA.",
          );
        }
      }
    } catch (err) {
      console.error("Fetch Error:", err.response?.data || err.message);
      showNotification("Sync failed. Check terminal.", "error");
    } finally {
      setLoading(false);
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

  const handleAssignment = async (orderId) => {
    const staffId = pendingAssignments[orderId];
    if (!staffId) return showNotification("Select tech.", "error");
    try {
      const payload = isOwner
        ? { assigned_osta_tech: staffId }
        : { assigned_sabi_tech: staffId };
      await api.patch(`/shops/work-order/${orderId}/assign-techs/`, payload);
      showNotification("Success.", "success");
      setPendingAssignments((prev) => ({ ...prev, [orderId]: "" }));
      fetchData();
    } catch (err) {
      showNotification("Error.", "error");
    }
  };

  const handleSelfClaim = async (orderId) => {
    // Fail-safe: try to find ID one last time if state is empty
    let claimId = myTechId;
    if (!claimId) {
      const manual = allPersonnel.find((p) => p.username === currentUsername);
      if (manual) claimId = manual.id;
    }

    if (!claimId) {
      return showNotification("Identity link missing.", "error");
    }

    try {
      await api.patch(`/shops/work-order/${orderId}/assign-techs/`, {
        assigned_osta_tech: claimId,
      });
      showNotification("Ticket claimed.", "success");
      fetchData();
    } catch (err) {
      showNotification("Claim rejected by server.", "error");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-[#c5a059] uppercase tracking-widest font-serif text-sm">
        Establishing Identity Link...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f1115] p-8 font-serif text-slate-200">
      {notification.text && (
        <div
          className={`fixed top-10 right-10 flex items-center gap-3 px-6 py-4 rounded-xl border z-50 animate-in slide-in-from-right-10 ${notification.type === "error" ? "bg-red-500/10 border-red-500/50 text-red-500" : "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"}`}
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
              className="bg-[#1a1d23] border border-[#2d3139] rounded-2xl p-6 hover:border-[#c5a059]/50 transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] text-slate-500 tracking-widest">
                    {order.ticket_id}
                  </span>
                  <h3 className="text-slate-100 text-lg mt-1 font-bold tracking-tight">
                    {order.item_name}
                  </h3>
                </div>
                <div className="px-3 py-1 rounded-full text-[9px] uppercase font-bold border border-emerald-500/30 text-emerald-500">
                  {order.status}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {/* Senior Tech Row */}
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
                      onClick={() => handleSelfClaim(order.id)}
                      className="text-[9px] bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 px-3 py-1 rounded-lg uppercase font-bold hover:bg-[#c5a059] hover:text-[#0f1115] transition-all"
                    >
                      Claim
                    </button>
                  )}
                </div>

                {/* Junior Tech Row */}
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
                <div className="pt-6 border-t border-[#2d3139]">
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
                      onClick={() => handleAssignment(order.id)}
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
    </div>
  );
};

export default WorkOrderAssignment;
