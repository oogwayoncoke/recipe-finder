import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

const WorkOrderForm = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    device_type: "COMP",
    brand: "",
    model_name: "",
    serial_number: "",
    description: "",
  });

  const deviceChoices = [
    { value: "COMP", label: "Computing" },
    { value: "MOBL", label: "Mobile" },
    { value: "GAME", label: "Gaming" },
    { value: "AUDI", label: "Audio" },
    { value: "WEAR", label: "Wearable" },
    { value: "VIDO", label: "Home Video" },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/shops/work-order/create/", {
        ...formData,
        token: token,
      });

      const newWorkOrder = response.data;
      navigate("/submission-success", {
        state: { workOrderId: newWorkOrder.id },
      });
    } catch (error) {
      alert("Submission failed: " + JSON.stringify(error.response?.data));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-start md:items-center bg-[#0f1115] p-4 py-8 md:p-6">
      <div className="flex flex-col items-center bg-[#1a1d23] border border-[#2d3139] rounded-xl p-5 md:p-8 shadow-2xl w-full max-w-4xl">
        <h2 className="text-[#c5a059] text-lg md:text-2xl font-serif tracking-[0.15em] md:tracking-[0.3em] uppercase mb-6 md:mb-8 text-center">
          Repair Intake
        </h2>

        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-6 md:gap-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="flex flex-col gap-4 bg-[#13151a] p-4 md:p-6 rounded-lg border border-[#2d3139]">
              <h3 className="text-[#c5a059] text-xs md:text-sm uppercase tracking-widest font-serif border-b border-[#2d3139] pb-2 mb-1">
                Contact Info
              </h3>

              <input
                type="text"
                name="full_name"
                placeholder="Full Name"
                className="bg-[#1a1d23] border border-[#4A4439] text-slate-100 placeholder:text-slate-500 rounded-lg p-3.5 text-sm md:text-base outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all font-serif"
                onChange={handleChange}
                required
              />
              <p className="text-slate-500 text-xs italic mt-2">
                *Your phone number is securely linked to this invitation.
              </p>
            </div>

            <div className="flex flex-col gap-4 bg-[#13151a] p-4 md:p-6 rounded-lg border border-[#2d3139]">
              <h3 className="text-[#c5a059] text-xs md:text-sm uppercase tracking-widest font-serif border-b border-[#2d3139] pb-2 mb-1">
                Device Details
              </h3>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <select
                  name="device_type"
                  value={formData.device_type}
                  className="bg-[#1a1d23] border border-[#4A4439] text-slate-100 rounded-lg p-3.5 text-sm md:text-base outline-none focus:border-[#C5A059] transition-all appearance-none cursor-pointer font-serif"
                  onChange={handleChange}
                  required
                >
                  {deviceChoices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  name="brand"
                  placeholder="Brand"
                  className="bg-[#1a1d23] border border-[#4A4439] text-slate-100 rounded-lg p-3.5 text-sm md:text-base outline-none focus:border-[#C5A059] transition-all font-serif"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <input
                  type="text"
                  name="model_name"
                  placeholder="Model"
                  className="bg-[#1a1d23] border border-[#4A4439] text-slate-100 rounded-lg p-3.5 text-sm md:text-base outline-none focus:border-[#C5A059] transition-all font-serif"
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="serial_number"
                  placeholder="Serial #"
                  className="bg-[#1a1d23] border border-[#4A4439] text-slate-100 rounded-lg p-3.5 text-sm md:text-base outline-none focus:border-[#C5A059] transition-all font-serif"
                  onChange={handleChange}
                  required
                />
              </div>

              <textarea
                name="description"
                placeholder="Describe the issue in detail..."
                rows="3"
                className="bg-[#1a1d23] border border-[#4A4439] text-slate-100 rounded-lg p-3.5 text-sm md:text-base outline-none focus:border-[#C5A059] transition-all resize-none mt-1 font-serif"
                onChange={handleChange}
                required
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-b from-[#D4AF37] to-[#C5A059] text-[#0F1115] py-4 rounded-lg font-serif font-bold uppercase tracking-widest md:tracking-[0.2em] shadow-[0_4px_0_rgb(74,68,57)] hover:translate-y-0.5 hover:shadow-[0_2px_0_rgb(74,68,57)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? "Processing Intake..." : "Submit Repair Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WorkOrderForm;
