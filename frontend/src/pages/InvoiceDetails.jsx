import { jwtDecode } from "jwt-decode";
import {
  CheckCircle,
  ChevronLeft,
  CreditCard,
  Package,
  Printer,
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
    } catch (err) {
      console.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handlePrint = () => window.print();

  const handleMarkPaid = async () => {
    try {
      await api.patch(`/shops/invoices/${id}/mark-paid/`);
      fetchInvoice();
    } catch (err) {
      alert("Settlement confirmed.");
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
              Ref //{" "}
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
                  <td className="py-6 font-bold flex items-center gap-3 italic text-slate-200">
                    <Zap size={14} className="text-[#c5a059]" /> Technical Labor
                  </td>
                  <td className="py-6 text-center text-slate-200">1</td>
                  <td className="py-6 text-right text-slate-200">
                    {Number(invoice.labor_cost || 0).toFixed(2)} EGP
                  </td>
                  <td className="py-6 text-right font-black text-slate-200">
                    {Number(invoice.labor_cost || 0).toFixed(2)} EGP
                  </td>
                </tr>
                {(invoice.parts_breakdown || []).map((p, idx) => (
                  <tr key={idx} className="border-b border-[#2d3139]">
                    <td className="py-6 flex items-center gap-3 italic text-slate-200">
                      <Package size={14} className="text-slate-500" /> {p.name}
                    </td>
                    <td className="py-6 text-center text-slate-200">
                      {p.quantity}
                    </td>
                    <td className="py-6 text-right text-slate-200">
                      {Number(p.price).toFixed(2)} EGP
                    </td>
                    <td className="py-6 text-right font-bold text-slate-200">
                      {(Number(p.price) * Number(p.quantity)).toFixed(2)} EGP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="flex justify-end pt-4 border-t border-[#c5a059]/30">
            <div className="text-right">
              <span className="text-[#c5a059] uppercase font-black text-xs tracking-widest">
                Final Total
              </span>
              <div className="text-3xl font-black tracking-tighter text-white">
                {Number(invoice.total_amount || 0).toFixed(2)} EGP
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;