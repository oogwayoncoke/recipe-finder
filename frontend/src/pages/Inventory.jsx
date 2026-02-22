import { jwtDecode } from "jwt-decode";
import { AlertCircle, Edit3, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api";

const InventoryTerminal = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [notification, setNotification] = useState({ text: "", type: "" });

  const [newItem, setNewItem] = useState({
    name: "",
    sku: "",
    product_type: "PART",
    cost_price: 0,
    retail_price: 0,
    stock_count: 0,
    specifications: { brand: "", model: "" },
  });

  const token = localStorage.getItem("access");
  const decoded = token ? jwtDecode(token) : {};
  const isOwner = decoded.role === "OWNER";

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get("/shops/inventory/");
      setInventory(res.data);
    } catch (err) {
      showNotification("Vault link failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text, type = "info") => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: "", type: "" }), 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = {
      ...newItem,
      retail_price: parseFloat(newItem.retail_price) || 0,
      stock_count: parseInt(newItem.stock_count) || 0,
    };
    try {
      await api.post("/shops/inventory/", payload);
      showNotification("Asset Registered in Vault", "success");
      setShowModal(false);
      fetchInventory();
      setNewItem({
        name: "",
        sku: "",
        product_type: "PART",
        cost_price: 0,
        retail_price: 0,
        stock_count: 0,
        specifications: { brand: "", model: "" },
      });
    } catch (err) {
      showNotification("Vault Entry Denied", "error");
    }
  };

  const handleEditClick = (item) => {
    setEditingItem({
      ...item,
      specifications: item.specifications || { brand: "", model: "" },
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const payload = {
      ...editingItem,
      retail_price: parseFloat(editingItem.retail_price),
      stock_count: parseInt(editingItem.stock_count),
    };
    try {
      await api.put(`/shops/inventory/${editingItem.id}/`, payload);
      showNotification("Asset Updated", "success");
      setEditingItem(null);
      fetchInventory();
    } catch (err) {
      showNotification("Update Failed", "error");
    }
  };

  const filteredItems = inventory.filter((item) => {
    const brand = item.specifications?.brand?.toLowerCase() || "";
    const model = item.specifications?.model?.toLowerCase() || "";
    const name = item.name?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return (
      brand.includes(search) || model.includes(search) || name.includes(search)
    );
  });

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-[#c5a059] uppercase tracking-widest font-serif text-xs">
        Scanning Vault Assets...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f1115] p-8 font-serif text-slate-200 relative">
      {notification.text && (
        <div
          className={`fixed top-10 right-10 flex items-center gap-3 px-6 py-4 rounded-xl border z-50 ${notification.type === "error" ? "bg-red-500/10 border-red-500/50 text-red-500" : "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"}`}
        >
          <span className="text-[10px] uppercase font-black italic tracking-widest">
            {notification.text}
          </span>
        </div>
      )}

      <header className="mb-12 border-b border-[#2d3139] pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-[#c5a059] text-3xl tracking-[0.4em] uppercase">
            The Vault
          </h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2 italic">
            Physical Asset Manifest
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter Assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1d23] border border-[#2d3139] rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-[#c5a059] transition-all placeholder:text-slate-600"
            />
          </div>
          {isOwner && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#c5a059] text-[#0f1115] px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-[#d4b475] transition-all"
            >
              Add Stock
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-[#1a1d23] border border-[#2d3139] rounded-2xl p-6 hover:border-[#c5a059]/40 transition-all group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div
                className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold border ${item.product_type === "PART" ? "border-[#c5a059] text-[#c5a059]" : "border-slate-500 text-slate-500"}`}
              >
                {item.product_type}
              </div>
              {isOwner && (
                <button
                  onClick={() => handleEditClick(item)}
                  className="text-slate-600 hover:text-[#c5a059] transition-colors"
                >
                  <Edit3 size={14} />
                </button>
              )}
            </div>

            <h3 className="text-slate-100 font-bold text-lg mb-1 leading-tight">
              {item.name}
            </h3>
            <p className="text-slate-500 text-[10px] uppercase tracking-tighter mb-8 italic">
              {item.specifications?.brand || "Generic"} //{" "}
              {item.specifications?.model || "Standard"}
            </p>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[8px] text-slate-600 uppercase mb-1 tracking-[0.2em]">
                  Available
                </p>
                <p
                  className={`text-2xl font-bold ${item.stock_count < 5 ? "text-red-500" : "text-slate-100"}`}
                >
                  {item.stock_count}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-slate-600 uppercase mb-1 tracking-[0.2em]">
                  Unit Price
                </p>
                <p className="text-[#c5a059] text-lg font-bold">
                  {item.retail_price}{" "}
                  <span className="text-[10px] font-normal">EGP</span>
                </p>
              </div>
            </div>

            {item.stock_count < 5 && (
              <div className="absolute top-0 right-0 p-2 text-red-500/20 group-hover:text-red-500 transition-colors">
                <AlertCircle size={14} />
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#0f1115]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-[#1a1d23] border border-[#c5a059]/30 w-full max-w-lg rounded-3xl p-8 shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-[#c5a059] text-xl tracking-widest uppercase font-bold">
                  New Asset Registration
                </h2>
                <p className="text-slate-500 text-[10px] uppercase italic">
                  Secure Vault Entry
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <input
                placeholder="Item Name"
                required
                className="col-span-2 bg-[#0f1115] border border-[#2d3139] p-3 rounded-xl text-xs outline-none focus:border-[#c5a059]"
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
              />
              <input
                placeholder="Brand"
                className="bg-[#0f1115] border border-[#2d3139] p-3 rounded-xl text-xs outline-none focus:border-[#c5a059]"
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    specifications: {
                      ...newItem.specifications,
                      brand: e.target.value,
                    },
                  })
                }
              />
              <input
                placeholder="Model"
                className="bg-[#0f1115] border border-[#2d3139] p-3 rounded-xl text-xs outline-none focus:border-[#c5a059]"
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    specifications: {
                      ...newItem.specifications,
                      model: e.target.value,
                    },
                  })
                }
              />
              <input
                type="number"
                placeholder="Retail Price"
                required
                className="bg-[#0f1115] border border-[#2d3139] p-3 rounded-xl text-xs outline-none focus:border-[#c5a059]"
                onChange={(e) =>
                  setNewItem({ ...newItem, retail_price: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Initial Stock"
                required
                className="bg-[#0f1115] border border-[#2d3139] p-3 rounded-xl text-xs outline-none focus:border-[#c5a059]"
                onChange={(e) =>
                  setNewItem({ ...newItem, stock_count: e.target.value })
                }
              />
              <select
                className="col-span-2 bg-[#0f1115] border border-[#2d3139] p-3 rounded-xl text-xs outline-none focus:border-[#c5a059] text-slate-400"
                onChange={(e) =>
                  setNewItem({ ...newItem, product_type: e.target.value })
                }
              >
                <option value="PART">REPAIR PART</option>
                <option value="RETAIL">RETAIL PRODUCT</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-[#c5a059] text-[#0f1115] py-4 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-[#d4b475] transition-all active:scale-95"
              >
                Confirm Entry
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-4 rounded-xl text-[10px] uppercase font-bold border border-slate-700 text-slate-500 hover:bg-slate-800 transition-all"
              >
                Abort
              </button>
            </div>
          </form>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-[#0f1115]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdate}
            className="bg-[#1a1d23] border border-[#c5a059]/30 w-full max-w-lg rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-[#c5a059] text-xl tracking-widest uppercase font-bold">
                  Modify Asset
                </h2>
                <p className="text-slate-500 text-[10px] uppercase italic">
                  SKU: {editingItem.sku || "UNASSIGNED"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <input
                value={editingItem.name}
                placeholder="Item Name"
                required
                className="col-span-2 bg-[#0f1115] border border-[#2d3139] p-3 rounded-xl text-xs text-white outline-none focus:border-[#c5a059]"
                onChange={(e) =>
                  setEditingItem({ ...editingItem, name: e.target.value })
                }
              />
              <input
                value={editingItem.specifications.brand}
                placeholder="Brand"
                className="bg-[#0f1115] border border-[#2d3139] p-3 rounded-xl text-xs text-white outline-none focus:border-[#c5a059]"
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    specifications: {
                      ...editingItem.specifications,
                      brand: e.target.value,
                    },
                  })
                }
              />
              <input
                value={editingItem.specifications.model}
                placeholder="Model"
                className="bg-[#0f1115] border border-[#2d3139] p-3 rounded-xl text-xs text-white outline-none focus:border-[#c5a059]"
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    specifications: {
                      ...editingItem.specifications,
                      model: e.target.value,
                    },
                  })
                }
              />
              <div className="space-y-1">
                <label className="text-[8px] text-slate-500 uppercase ml-2 tracking-widest">
                  Retail Price
                </label>
                <input
                  type="number"
                  value={editingItem.retail_price}
                  className="w-full bg-[#0f1115] border border-[#2d3139] p-3 rounded-xl text-xs text-white outline-none focus:border-[#c5a059]"
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      retail_price: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] text-slate-500 uppercase ml-2 tracking-widest">
                  Stock Level
                </label>
                <input
                  type="number"
                  value={editingItem.stock_count}
                  className="w-full bg-[#0f1115] border border-[#2d3139] p-3 rounded-xl text-xs text-white outline-none focus:border-[#c5a059]"
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      stock_count: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-[#c5a059] text-[#0f1115] py-4 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-[#d4b475] transition-all"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-6 py-4 rounded-xl text-[10px] uppercase font-bold border border-slate-700 text-slate-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InventoryTerminal;
