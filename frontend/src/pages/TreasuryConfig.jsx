import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  DollarSign,
  Edit2,
  Loader2,
  PenTool,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const TreasuryConfig = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [addingService, setAddingService] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState({
    service_name: "",
    cost: "",
    standard_duration: "01:00:00",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, serviceRes] = await Promise.all([
        api.get("/shops/staff/treasury/"),
        api.get("/shops/services/"),
      ]);

      setStaff(staffRes.data.results || staffRes.data || []);
      setServices(serviceRes.data.results || serviceRes.data || []);
    } catch (err) {
      console.error("Treasury Sync Failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRateUpdate = async (member, newRate) => {
    const numericRate = parseFloat(newRate);
    if (member.hourly_rate === numericRate) return;
    setSaving(member.id);
    try {
      const res = await api.patch(`/shops/profiles/${member.id}/`, {
        hourly_rate: numericRate,
      });
      setStaff((prev) =>
        prev.map((s) =>
          s.id === member.id ? { ...s, hourly_rate: res.data.hourly_rate } : s,
        ),
      );
    } catch (err) {
      console.error("Rate Update Failed");
    } finally {
      setSaving(null);
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    setSaving("service_op");
    try {
      if (editingService) {
        const res = await api.patch(
          `/shops/services/${editingService.id}/`,
          newService,
        );
        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? res.data : s)),
        );
      } else {
        const res = await api.post("/shops/services/", newService);
        setServices((prev) => [...prev, res.data]);
      }
      closeModal();
    } catch (err) {
      console.error("Service Save Failed");
    } finally {
      setSaving(null);
    }
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setNewService({
      service_name: service.service_name,
      cost: service.cost,
      standard_duration: service.standard_duration,
    });
    setAddingService(true);
  };

  const closeModal = () => {
    setAddingService(false);
    setEditingService(null);
    setNewService({
      service_name: "",
      cost: "",
      standard_duration: "01:00:00",
    });
  };

  const handleDeleteProfile = async (id) => {
    try {
      await api.delete(`/shops/profiles/${id}/`);
      setStaff(staff.filter((s) => s.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      alert("Purge failed.");
    }
  };

  const averageRate =
    staff.length > 0
      ? (
          staff.reduce((acc, s) => acc + parseFloat(s.hourly_rate || 0), 0) /
          staff.length
        ).toFixed(2)
      : "0.00";

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-[#c5a059] uppercase tracking-[0.4em] animate-pulse italic font-serif text-sm">
        Syncing Treasury...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f1115] p-8 font-serif text-slate-200 relative">
      <button
        onClick={() => navigate("/owner-dashboard")}
        className="flex items-center gap-2 text-slate-500 hover:text-[#c5a059] transition-colors mb-8 group"
      >
        <ArrowLeft
          size={16}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span className="text-[10px] uppercase font-bold tracking-widest">
          Return to Terminal
        </span>
      </button>

      <header className="mb-12 border-b border-[#2d3139] pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-[#c5a059] text-3xl tracking-[0.4em] uppercase">
            Treasury Config
          </h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2 italic font-bold">
            Labor Valuation & Management
          </p>
        </div>
        <div className="text-right">
          <p className="text-[#c5a059] text-[10px] uppercase font-bold tracking-widest mb-1 italic">
            Average Burn Rate
          </p>
          <div className="bg-[#c5a059]/10 border border-[#c5a059]/20 px-6 py-2 rounded-xl">
            <span className="text-slate-100 text-xl font-mono font-bold">
              EGP {averageRate}
              <span className="text-[10px] text-slate-500 ml-1">/HR</span>
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {staff.map((member) => (
          <div
            key={member.id}
            className="bg-[#1a1d23] border border-[#2d3139] p-6 rounded-3xl flex flex-col gap-6 group hover:border-[#c5a059]/40 transition-all relative"
          >
            <button
              onClick={() => setDeleteConfirm(member.id)}
              className="absolute top-4 right-4 text-slate-600 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0f1115] border border-[#2d3139] flex items-center justify-center text-slate-500">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-slate-100 font-bold text-sm tracking-wide capitalize">
                  {member.username}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Briefcase size={10} className="text-slate-600" />
                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                    {member.tech_level}
                  </span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5a059] opacity-50">
                <DollarSign size={14} />
              </div>
              <input
                type="number"
                defaultValue={member.hourly_rate || 0}
                onBlur={(e) => handleRateUpdate(member, e.target.value)}
                className="w-full bg-[#0f1115] border border-[#2d3139] rounded-xl py-4 pl-10 pr-4 text-xs font-mono text-emerald-500 focus:border-[#c5a059] outline-none transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-[8px] text-slate-600 uppercase font-black">
                  EGP/HR
                </span>
                {saving === member.id && (
                  <Loader2 size={12} className="text-[#c5a059] animate-spin" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <header className="mb-12 flex justify-between items-end border-t border-[#2d3139] pt-12">
        <div>
          <h2 className="text-[#c5a059] text-2xl tracking-[0.4em] uppercase">
            Service Manifest
          </h2>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2 italic font-bold">
            Standard Benchmarks & Pricing
          </p>
        </div>
        <button
          onClick={() => setAddingService(true)}
          className="bg-[#c5a059]/10 border border-[#c5a059]/40 text-[#c5a059] px-4 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-[#c5a059] hover:text-[#0f1115] transition-all flex items-center gap-2"
        >
          <Plus size={14} /> New Service
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-[#1a1d23] border border-[#2d3139] p-6 rounded-3xl group hover:border-[#c5a059]/40 transition-all relative"
          >
            <button
              onClick={() => openEditModal(service)}
              className="absolute top-4 right-4 text-slate-600 hover:text-[#c5a059] transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#0f1115] border border-[#2d3139] flex items-center justify-center text-[#c5a059]">
                <PenTool size={18} />
              </div>
              <h3 className="text-slate-100 font-bold text-sm uppercase tracking-wider">
                {service.service_name}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="bg-[#0f1115] p-3 rounded-xl border border-[#2d3139] flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Base Rate
                </span>
                <span className="text-emerald-500 font-mono text-xs">
                  EGP {service.cost}
                </span>
              </div>
              <div className="bg-[#0f1115] p-3 rounded-xl border border-[#2d3139] flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Benchmark
                </span>
                <span className="text-blue-400 font-mono text-xs">
                  {service.standard_duration}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {addingService && (
        <div className="fixed inset-0 bg-[#0f1115]/95 backdrop-blur-xl z-100 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveService}
            className="bg-[#1a1d23] border border-[#c5a059]/20 w-full max-w-md rounded-3xl p-8 relative"
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-6 right-6 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-[#c5a059] text-xl font-bold uppercase tracking-widest mb-8">
              {editingService ? "Update" : "Register"} Service
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2 block">
                  Service Name
                </label>
                <input
                  required
                  type="text"
                  value={newService.service_name}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      service_name: e.target.value,
                    })
                  }
                  className="w-full bg-[#0f1115] border border-[#2d3139] rounded-xl p-4 text-xs outline-none focus:border-[#c5a059]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2 block">
                    Cost (EGP)
                  </label>
                  <input
                    required
                    type="number"
                    value={newService.cost}
                    onChange={(e) =>
                      setNewService({ ...newService, cost: e.target.value })
                    }
                    className="w-full bg-[#0f1115] border border-[#2d3139] rounded-xl p-4 text-xs font-mono text-emerald-500 outline-none focus:border-[#c5a059]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2 block">
                    Limit (HH:MM:SS)
                  </label>
                  <input
                    required
                    type="text"
                    value={newService.standard_duration}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        standard_duration: e.target.value,
                      })
                    }
                    className="w-full bg-[#0f1115] border border-[#2d3139] rounded-xl p-4 text-xs font-mono text-blue-400 outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving === "service_op"}
                className="w-full bg-[#c5a059] text-[#0f1115] py-4 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-white transition-all"
              >
                {saving === "service_op" ? (
                  <Loader2 className="animate-spin mx-auto" size={16} />
                ) : editingService ? (
                  "Update Manifest"
                ) : (
                  "Commit to Manifest"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-[#0f1115]/95 backdrop-blur-xl z-100 flex items-center justify-center p-4">
          <div className="bg-[#1a1d23] border border-red-500/30 w-full max-w-sm rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 text-red-500">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-white text-lg font-bold uppercase tracking-widest mb-2">
              Purge Personnel
            </h3>
            <p className="text-slate-500 text-xs mb-8 italic">
              Confirm permanent removal from the workshop records.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDeleteProfile(deleteConfirm)}
                className="flex-1 bg-red-500 text-white py-4 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-red-600 transition-all"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-slate-700 text-slate-500 py-4 rounded-xl text-[10px] uppercase font-bold hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasuryConfig;
