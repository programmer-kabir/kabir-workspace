import { useState, useEffect } from "react";
import { Key, Plus, Trash2, CheckCircle2, XCircle, RotateCcw, AlertCircle, Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import useAuth from "../../utils/Hooks/useAuth";
import DayalLoader from "../../components/Common/DayalLoader";

const API_BASE = import.meta.env.VITE_LOCALHOST_KEY;

const AIKeysManager = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [provider, setProvider] = useState("gemini");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const getHeaders = async () => {
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_APP_SECRET || "dayalstock_secure_api_key_2026",
    };
    if (user) {
      const token = await user.getIdToken();
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/ai/keys_manager.php`, { headers });
      const data = await res.json();
      if (data.success) {
        setKeys(data.data || []);
      } else {
        toast.error(data.message || "Failed to load AI keys");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleAddKey = async (e) => {
    e.preventDefault();
    if (!newKey.trim()) {
      toast.error("Please enter an API Key");
      return;
    }
    setSubmitting(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/ai/keys_manager.php`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "add",
          api_key: newKey.trim(),
          label: newLabel.trim() || "Gemini Flash Key",
          provider,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("AI API Key added successfully!");
        setNewKey("");
        setNewLabel("");
        setShowAddModal(false);
        fetchKeys();
      } else {
        toast.error(data.message || "Failed to add key");
      }
    } catch {
      toast.error("Error adding API Key");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/ai/keys_manager.php`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "toggle_status",
          id,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Key status changed to ${newStatus}`);
        fetchKeys();
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch {
      toast.error("Error updating key status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this API key?")) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/ai/keys_manager.php`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "delete",
          id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("API Key deleted");
        fetchKeys();
      } else {
        toast.error(data.message || "Failed to delete key");
      }
    } catch {
      toast.error("Error deleting API key");
    }
  };

  const handleResetCounts = async () => {
    if (!window.confirm("Reset all usage counts and reactivate rate-limited keys?")) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/ai/keys_manager.php`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "reset_counts" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("All metrics reset and keys activated");
        fetchKeys();
      }
    } catch {
      toast.error("Error resetting counts");
    }
  };

  const activeCount = keys.filter((k) => k.status === "active").length;
  const totalCalls = keys.reduce((acc, curr) => acc + (parseInt(curr.usage_count) || 0), 0);

  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white font-outfit">AI API Keys Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 flex items-center gap-1">
              <Sparkles size={12} /> Multi-Key Pool
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Configure Google Gemini API keys for automatic stock metadata generation (Title, 45-49 Tags, Description).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetCounts}
            title="Reset usage counters"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition"
          >
            <RotateCcw size={14} /> Reset Usage
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition cursor-pointer"
          >
            <Plus size={16} /> Add New Key
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-white/10 bg-[#121824]/80 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Keys</p>
            <p className="text-2xl font-black text-white mt-1">
              {activeCount} <span className="text-xs font-normal text-gray-500">/ {keys.length} total</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121824]/80 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total AI Generations</p>
            <p className="text-2xl font-black text-[#00D4FF] mt-1">{totalCalls}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20">
            <Sparkles size={24} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121824]/80 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Auto Failover Status</p>
            <p className="text-sm font-bold text-white mt-1 flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck size={16} /> Key Rotation Active
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Key size={24} />
          </div>
        </div>
      </div>

      {/* Keys Table / List */}
      <div className="rounded-2xl border border-white/10 bg-[#121824]/60 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Key size={18} className="text-[#00D4FF]" /> Configured API Keys
          </h2>
          <span className="text-xs text-gray-400">Least-used active key is prioritized automatically</span>
        </div>

        {loading ? (
          <div className="p-12">
            <DayalLoader text="Loading keys..." />
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle size={36} className="mx-auto text-gray-500" />
            <p className="text-sm text-gray-400">No API Keys configured yet.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-bold text-[#00D4FF] hover:underline"
            >
              + Add your first Gemini API Key
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {keys.map((k) => (
              <div
                key={k.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-sm">{k.label}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-gray-300">
                      {k.provider}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${k.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : k.status === "rate_limited"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                    >
                      {k.status === "active" ? (
                        <CheckCircle2 size={10} />
                      ) : k.status === "rate_limited" ? (
                        <AlertCircle size={10} />
                      ) : (
                        <XCircle size={10} />
                      )}
                      {k.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                    <span>Key: <code className="text-gray-200 bg-black/40 px-2 py-0.5 rounded">{k.masked_key}</code></span>
                    <span>Calls: <strong className="text-[#00D4FF] font-sans">{k.usage_count}</strong></span>
                    {k.last_used_at && (
                      <span className="text-gray-500 font-sans">
                        Last used: {new Date(k.last_used_at).toLocaleDateString()} {new Date(k.last_used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(k.id, k.status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${k.status === "active"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                      }`}
                  >
                    {k.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDelete(k.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Delete Key"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl border border-white/10 bg-[#151a26] p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-[#00D4FF]" /> Add AI API Key
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#00D4FF]"
                >
                  <option value="gemini">Google Gemini (Recommended - Fast Vision)</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">
                  API Key <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="AIzaSyB..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white font-mono outline-none focus:border-[#00D4FF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">Key Label / Description</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Primary Production Key"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#00D4FF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIKeysManager;
