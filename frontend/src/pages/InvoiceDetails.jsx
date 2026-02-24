import { jwtDecode } from "jwt-decode";
import {
  CheckCircle,
  ChevronLeft,
  CreditCard,
  Edit3,
  Package,
  Printer,
  Save,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [bargainPrice, setBargainPrice] = useState(0);

  const token = localStorage.getItem("access");
  const authPayload = useMemo(() => {
    try {
      return token ? jwtDecode(token) : {};
    } catch (e) {
      return {};
    }
  }, [token]);

  const isOwner = authPayload.role === "OWNER";

  const fetchInvoice = useCallback(async () => {
    try {
      const res = await api.get(`/shops/invoices/${id}/`);
      setInvoice(res.data);
      setBargainPrice(res.data.total_amount || 0);
    } catch (err) {
      console.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveBargain = async () => {
    try {
      const res = await api.post(
        `/shops/work-orders/${invoice.work_order}/generate-invoice/`,
        {
          total_override: bargainPrice,
        },
      );
      setInvoice({ ...invoice, total_amount: res.data.total });
      setIsEditing(false);
    } catch (err) {
      alert("Failed to save bargained price.");
    }
  };

  const handleMarkPaid = async () => {
    try {
      await api.patch(`/shops/invoices/${id}/mark-paid/`);
      fetchInvoice();
    } catch (err) {
      alert("Settlement confirmation failed.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-[#c5a059] uppercase animate-pulse tracking-widest">
        Retrieving Fiscal Records...
      </div>
    );

  if (!invoice)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-red-500 uppercase font-bold">
        Invoice Not Found
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f1115] p-4 md:p-12 font-serif text-slate-200">
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-all uppercase text-[10px] font-black tracking-widest"
        >
          <ChevronLeft size={16} /> Return to Terminal
        </button>
        <div className="flex gap-4">
          {isOwner && !invoice.is_paid && (
            <button
              onClick={handleMarkPaid}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
            >
              <CreditCard size={16} /> Confirm Settlement
            </button>
          )}
          <button
            onClick={handlePrint}
            className="bg-[#c5a059] text-[#0f1115] px-6 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] hover:bg-white transition-all"
          >
            <Printer size={16} /> Print Document
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-[#1a1d23] border border-[#2d3139] rounded-3xl overflow-hidden shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none">
        <div className="p-10 border-b border-[#2d3139] bg-gradient-to-r from-[#c5a059]/10 to-transparent flex justify-between items-start print:bg-none print:border-b-2 print:border-black">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">
              Invoice
            </h1>
            <p className="text-[#c5a059] text-xs font-black tracking-[0.2em] uppercase">
              {"Ref // "}{" "}
              {invoice.work_order_ticket_id || `WO-${invoice.work_order}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">
              Status
            </p>
            <div
              className={`inline-flex items-center gap-2 font-black uppercase text-[10px] ${invoice.is_paid ? "text-emerald-500" : "text-amber-500 animate-pulse"}`}
            >
              {invoice.is_paid ? (
                <CheckCircle size={14} />
              ) : (
                <CreditCard size={14} />
              )}
              {invoice.is_paid ? "Payment Confirmed" : "Awaiting Settlement"}
            </div>
          </div>
        </div>

        <div className="p-10 space-y-12">
          <section>
            <h4 className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-4 border-b border-[#2d3139] pb-2">
              Asset Identification
            </h4>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">
                  Item Description
                </p>
                <p className="text-lg font-bold uppercase tracking-tight">
                  {invoice.item_name || "Repair Service"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">
                  Filing Date
                </p>
                <p className="text-sm font-bold uppercase">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-[10px] uppercase text-slate-500 font-black tracking-widest mb-4 border-b border-[#2d3139] pb-2">
              Service Manifest
            </h4>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase text-slate-500 font-black tracking-widest">
                  <th className="py-4">Description</th>
                  <th className="py-4 text-center">Qty</th>
                  <th className="py-4 text-right">Unit Price</th>
                  <th className="py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-[#2d3139]">
                  <td className="py-6 font-bold flex items-center gap-3 italic">
                    <Zap size={14} className="text-[#c5a059]" /> Technical Labor
                  </td>
                  <td className="py-6 text-center">1</td>
                  <td className="py-6 text-right">
                    {Number(invoice.labor_cost || 0).toFixed(2)} EGP
                  </td>
                  <td className="py-6 text-right font-black">
                    {Number(invoice.labor_cost || 0).toFixed(2)} EGP
                  </td>
                </tr>

                {(invoice.parts_breakdown || []).map((p, idx) => (
                  <tr key={idx} className="border-b border-[#2d3139]">
                    <td className="py-6 flex items-center gap-3 italic">
                      <Package size={14} className="text-slate-500" /> {p.name}
                    </td>
                    <td className="py-6 text-center">{p.quantity}</td>
                    <td className="py-6 text-right">
                      {Number(p.price).toFixed(2)} EGP
                    </td>
                    <td className="py-6 text-right font-bold">
                      {(Number(p.price) * Number(p.quantity)).toFixed(2)} EGP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="flex justify-end">
            <div className="w-full max-w-xs space-y-4">
              <div className="flex justify-between items-center pt-4 border-t border-[#c5a059]/30">
                <span className="text-[#c5a059] uppercase font-black text-xs tracking-widest">
                  Final Total
                </span>
                <div className="text-right">
                  {isEditing && isOwner ? (
                    <div className="flex flex-col items-end gap-3 print:hidden">
                      <input
                        type="number"
                        value={bargainPrice}
                        onChange={(e) => setBargainPrice(e.target.value)}
                        className="bg-[#0f1115] border border-[#c5a059] text-white text-3xl font-black p-3 rounded-xl w-40 text-right outline-none shadow-inner"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="p-2 text-slate-500 hover:text-white transition-all"
                        >
                          <XCircle size={18} />
                        </button>
                        <button
                          onClick={handleSaveBargain}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2"
                        >
                          <Save size={14} /> Save Price
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative">
                      <span
                        onClick={() => isOwner && setIsEditing(true)}
                        className={`text-3xl font-black tracking-tighter text-white print:text-black ${isOwner ? "cursor-pointer hover:text-[#c5a059] transition-all" : ""}`}
                      >
                        {(() => {
                          const total = Number(invoice.total_amount);
                          const labor = Number(invoice.labor_cost || 0);
                          const parts = (invoice.parts_breakdown || []).reduce(
                            (acc, p) =>
                              acc + Number(p.price) * Number(p.quantity),
                            0,
                          );
                          const finalDisplay =
                            total > 0 ? total : labor + parts;
                          return finalDisplay.toFixed(2);
                        })()}{" "}
                        EGP
                      </span>
                      {isOwner && (
                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all print:hidden">
                          <Edit3 size={14} className="text-[#c5a059]" />
                        </div>
                      )}
                    </div>
                  )}
                  {isOwner && !isEditing && (
                    <p className="text-[8px] text-slate-500 uppercase mt-2 italic font-bold tracking-tighter print:hidden">
                      Bargain Mode Active // Click to Adjust
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="p-10 bg-[#0f1115] border-t border-[#2d3139] flex justify-between items-center print:bg-none">
          <div className="flex items-center gap-4 text-slate-600">
            <CreditCard size={32} strokeWidth={1} />
            <div className="text-[8px] uppercase leading-tight font-bold">
              Electronic Settlement System <br />
              Workshop Distribution Terminal
            </div>
          </div>
          <div className="text-right text-[8px] text-slate-600 uppercase font-black tracking-[0.2em]">
            Document Generated Locally <br />
            By Oogway Management v2.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
