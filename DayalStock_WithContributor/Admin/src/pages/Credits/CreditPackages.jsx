import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminCreditPackages, updateCreditPackage } from "../../api/creditApi";
import {
  CreditCard, CheckCircle2, XCircle, Image, Video,
  Star, Pencil, X, Save, Loader2, Music, Plus
} from "lucide-react";

/* ── toggle ──────────────────────────────────────── */
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${checked ? "bg-emerald-500" : "bg-white/10"}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
  </button>
);

/* ── EDIT / CREATE MODAL ─────────────────────────── */
function EditModal({ pkg, onClose, onSave, isSaving }) {
  const [form, setForm] = useState(pkg || {
    id: 0,
    name: "",
    slug: "",
    price: 0,
    expiry_days: 365,
    image_limit: 0,
    video_limit: 0,
    sort_order: 0,
    is_active: 1
  });

  const set   = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setInt = (key, val) => setForm(f => ({ ...f, [key]: parseInt(val) || 0 }));
  const setFlag = (key, val) => setForm(f => ({ ...f, [key]: val ? 1 : 0 }));

  const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-emerald-500/50 placeholder-gray-600 transition";
  const labelCls = "text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1 block";

  const isNew = form.id === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0e0e1c] border border-white/10 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-7 py-5 bg-[#0e0e1c] border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              {isNew ? <Plus size={16} /> : <Pencil size={16} />}
            </div>
            <div>
              <h2 className="text-base font-black text-white">{isNew ? "Create Package" : "Edit Package"}</h2>
              {!isNew && <p className="text-xs text-gray-500">#{form.id} · {form.slug}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="px-7 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Package Name</label>
              <input className={inputCls} placeholder="e.g. Starter Credit" value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Slug</label>
              <input className={inputCls} placeholder="starter-credit" value={form.slug} onChange={e => set("slug", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Price ($)</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={form.price} onChange={e => set("price", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className={labelCls}>Expiry (Days)</label>
              <input type="number" min="0" className={inputCls} value={form.expiry_days} onChange={e => setInt("expiry_days", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Sort Order</label>
              <input type="number" min="0" className={inputCls} value={form.sort_order} onChange={e => setInt("sort_order", e.target.value)} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-emerald-400">Download Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5"><Image size={11} /> Images</span>
                </label>
                <input type="number" min="0" className={inputCls} value={form.image_limit} onChange={e => setInt("image_limit", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5"><Video size={11} /> Videos</span>
                </label>
                <input type="number" min="0" className={inputCls} value={form.video_limit} onChange={e => setInt("video_limit", e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Description will be automatically generated based on these limits.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-sm text-gray-300 font-medium">Package Active</span>
              </div>
              <Toggle checked={!!parseInt(form.is_active)} onChange={v => setFlag("is_active", v)} />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-7 py-5 bg-[#0e0e1c] border-t border-white/5">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-semibold hover:bg-white/10 transition cursor-pointer">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {isSaving ? "Saving…" : "Save Package"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ MAIN PAGE ══════════════════════════════════════ */
export default function CreditPackages() {
  const [editing, setEditing] = useState(null);
  const [toast,   setToast]   = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const qc = useQueryClient();

  const { data: packages = [], isLoading, isError } = useQuery({
    queryKey: ["adminCreditPackages"],
    queryFn:  getAdminCreditPackages,
  });

  const { mutate: savePackage, isPending: isSaving } = useMutation({
    mutationFn: updateCreditPackage,
    onSuccess: (updated) => {
      qc.invalidateQueries(["adminCreditPackages"]);
      setEditing(null);
      setIsCreating(false);
      setToast({ type: "success", msg: "Package saved successfully!" });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err) => {
      setToast({ type: "error", msg: err.message || "Save failed." });
      setTimeout(() => setToast(null), 4000);
    },
  });

  const activeCount = packages.filter(p => parseInt(p.is_active) === 1).length;

  return (
    <div className="space-y-8 pb-10">

      {/* ── Toast ─── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl border text-sm font-semibold transition-all
          ${toast.type === "success"
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
            : "bg-red-500/15 border-red-500/30 text-red-300"}`}>
          {toast.type === "success" ? <CheckCircle2 size={16}/> : <XCircle size={16}/>}
          {toast.msg}
        </div>
      )}

      {/* ── HEADER ─── */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-[#0d0d1a] border border-white/5 shadow-2xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-teal-900/10 pointer-events-none" />
        <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border border-emerald-500/40 text-emerald-400">
            <Star size={30} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
              Credit Packages
            </h1>
            <p className="mt-1 text-sm text-gray-400">Manage one-time credit purchases · Admin only</p>
          </div>
        </div>

        <div className="relative flex items-center gap-4">
          {!isLoading && !isError && (
            <div className="flex items-center gap-3">
               <div className="flex flex-col items-center gap-0.5 rounded-xl bg-white/5 border border-white/8 px-4 py-2.5 min-w-[68px]">
                <span className="text-lg font-black text-white">{packages.length}</span>
                <span className="text-[9px] uppercase tracking-widest text-gray-500">Total</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 rounded-xl bg-white/5 border border-white/8 px-4 py-2.5 min-w-[68px]">
                <span className="text-lg font-black text-emerald-400">{activeCount}</span>
                <span className="text-[9px] uppercase tracking-widest text-gray-500">Active</span>
              </div>
            </div>
          )}
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Plus size={18} /> New Package
          </button>
        </div>
      </div>

      {/* ── Loading / Error ─── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-gray-400">Loading packages…</p>
        </div>
      )}
      {isError && (
        <div className="text-center py-20 text-red-400 bg-red-500/5 rounded-2xl border border-red-500/10">
          Failed to load credit packages.
        </div>
      )}

      {/* ── CARDS ─── */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {packages.map((pkg) => {
            const isActive = parseInt(pkg.is_active) === 1;

            return (
              <div key={pkg.id} className="relative rounded-2xl border border-white/10 overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 bg-[#12121E]">
                
                <div className="p-6 flex flex-col gap-5 flex-1">
                  
                  {/* Package heading */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-2 py-0.5 rounded-md">#{pkg.id} · {pkg.slug}</span>
                    </div>
                    <h2 className="text-xl font-black text-white">{pkg.name}</h2>
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-emerald-400">${parseFloat(pkg.price).toFixed(2)}</span>
                  </div>

                  <p className="text-sm font-semibold text-gray-300 leading-relaxed bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                    {pkg.description}
                  </p>

                  {/* Limits Breakdown */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-2 flex flex-col items-center justify-center gap-1">
                      <Image size={12} className="text-blue-400" />
                      <span className="text-lg font-black text-blue-300">{pkg.image_limit}</span>
                    </div>
                    <div className="rounded-lg bg-violet-500/5 border border-violet-500/10 p-2 flex flex-col items-center justify-center gap-1">
                      <Video size={12} className="text-violet-400" />
                      <span className="text-lg font-black text-violet-300">{pkg.video_limit}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 flex items-center justify-center bg-white/5 rounded-lg py-2">
                    Valid for {pkg.expiry_days} days
                  </div>

                  <div className="flex-1" />

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                    {isActive
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wide font-bold text-emerald-400"><CheckCircle2 size={11}/> Active</span>
                      : <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wide font-bold text-red-400"><XCircle size={11}/> Inactive</span>}

                    <button
                      onClick={() => setEditing(pkg)}
                      className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500/15 hover:border-emerald-500/30 hover:text-emerald-300 text-gray-400 text-xs font-semibold px-4 py-2 transition cursor-pointer"
                    >
                      <Pencil size={12}/> Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── EDIT / CREATE MODAL ─── */}
      {(editing || isCreating) && (
        <EditModal
          pkg={editing}
          onClose={() => {
            setEditing(null);
            setIsCreating(false);
          }}
          onSave={savePackage}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
