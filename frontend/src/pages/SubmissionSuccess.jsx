import { Link, useLocation } from "react-router-dom";

const SubmissionSuccess = () => {
  const location = useLocation();
  const { workOrderId } = location.state || { workOrderId: "N/A" };

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#0f1115] p-6">
      <div className="flex flex-col items-center bg-[#1a1d23] border border-[#2d3139] rounded-xl p-8 md:p-12 shadow-2xl w-full max-w-2xl text-center">
        <div className="w-20 h-20 bg-[#c5a059]/10 rounded-full flex items-center justify-center mb-6">
          <div className="text-[#c5a059] text-5xl">✓</div>
        </div>

        <h2 className="text-[#c5a059] text-2xl md:text-3xl font-serif tracking-widest uppercase mb-4">
          Repair Submitted
        </h2>

        <p className="text-slate-400 text-sm md:text-base mb-8 max-w-md">
          Your item has been successfully logged into our system. Our
          technicians will begin the diagnosis shortly.
        </p>

        <div className="bg-[#13151a] border border-[#2d3139] rounded-lg p-6 w-full mb-8">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">
            Reference ID
          </p>
          <p className="text-slate-100 font-mono text-lg font-bold">
            {workOrderId}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link
            to={`/track/${workOrderId}`}
            className="flex-1 bg-linear-to-b from-[#D4AF37] to-[#C5A059] text-[#0F1115] py-4 rounded-lg font-serif font-bold uppercase tracking-wider hover:opacity-90 transition-all text-center"
          >
            Track Progress
          </Link>
          <Link
            to="/login"
            className="flex-1 border border-[#4A4439] text-[#c5a059] py-4 rounded-lg font-serif font-bold uppercase tracking-wider hover:bg-[#c5a059]/5 transition-all text-center"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubmissionSuccess;
