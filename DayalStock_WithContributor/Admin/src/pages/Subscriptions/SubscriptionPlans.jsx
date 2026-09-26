import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminSubscriptionPlans, updateSubscriptionPlan } from "../../api/subscriptionApi";
import {
  CreditCard, CheckCircle2, XCircle, Image, Video,
  CalendarDays, Star, Zap, Shield, Headphones, Ban,
  Pencil, X, Save, Loader2
} from "lucide-react";

/* ── per-plan accent colours ─────────────────────── */
const PLAN_THEME = {
  free:       { from: "#374151", to: "#1f2937", accent: "#6b7280", ring: "rgba(107,114,128,.25)" },
  starter:    { from: "#1e3a5f", to: "#0f172a", accent: "#3b82f6", ring: "rgba(59,130,246,.25)" },
  premium:    { from: "#2d1b69", to: "#0f172a", accent: "#8b5cf6", ring: "rgba(139,92,246,.25)" },
  pro:        { from: "#1a1040", to: "#0f172a", accent: "#a78bfa", ring: "rgba(167,139,250,.25)" },
  "pro-plus": { from: "#3b1f00", to: "#0f172a", accent: "#f59e0b", ring: "rgba(245,158,11,.25)" },
};
const getTheme = (slug = "") =>
  PLAN_THEME[slug.replace("-yearly", "").replace("+", "-plus")] ?? PLAN_THEME.starter;

/* ── features list ───────────────────────────────── */
const FEATURES = [
  { key: "premium_access",      icon: Zap,       label: "Premium Access",           invert: false },
  { key: "commercial_license",  icon: Shield,    label: "Commercial License",        invert: false },
  { key: "ad_free",             icon: Ban,       label: "Ad Free",                   invert: false },
  { key: "priority_support",    icon: Headphones,label: "Priority Support",          invert: false },
  { key: "attribution_required",icon: Star,      label: "No Attribution Required",   invert: true  },
];

const BILLING_COLOR = {
  free:    "bg-gray-500/15 text-gray-300 border-gray-500/30",
  monthly: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  yearly:  "bg-purple-500/15 text-purple-300 border-purple-500/30",
};

/* ── small stat ──────────────────────────────────── */
const Stat = ({ icon: Icon, value, label, color }) => (
  <div className="flex flex-col items-center gap-0.5 rounded-xl bg-white/5 border border-white/8 px-4 py-2.5 min-w-[68px]">
    <Icon size={14} className={color} />
    <span className={`text-lg font-black ${color}`}>{value}</span>
    <span className="text-[9px] uppercase tracking-widest text-gray-500">{label}</span>
  </div>
);

/* ── toggle ──────────────────────────────────────── */
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${checked ? "bg-indigo-500" : "bg-white/10"}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
  </button>
);

/* ── EDIT MODAL ──────────────────────────────────── */
function EditModal({ plan, onClose, onSave, isSaving }) {
  const [form, setForm] = useState({ ...plan });

  const set   = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setInt = (key, val) => setForm(f => ({ ...f, [key]: parseInt(val) || 0 }));
  const setFlag = (key, val) => setForm(f => ({ ...f, [key]: val ? 1 : 0 }));

  const inputCls = "w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-indigo-500/50 placeholder-gray-600 transition";
  const labelCls = "text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0e0e1c] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-7 py-5 bg-[#0e0e1c] border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Pencil size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Edit Plan</h2>
              <p className="text-xs text-gray-500">#{plan.id} · {plan.slug}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="px-7 py-6 space-y-6">
          {/* Name + Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Plan Name</label>
              <input className={inputCls} value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Slug</label>
              <input className={inputCls} value={form.slug} onChange={e => set("slug", e.target.value)} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={2} className={`${inputCls} resize-none`} value={form.description || ""} onChange={e => set("description", e.target.value)} />
          </div>

          {/* Price + Billing + Sort */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Price ($)</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={form.price} onChange={e => set("price", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className={labelCls}>Billing Cycle</label>
              <select className={inputCls} value={form.billing_cycle} onChange={e => set("billing_cycle", e.target.value)}
                style={{ background: "#1a1a2e" }}>
                <option value="free">Free</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Sort Order</label>
              <input type="number" min="0" className={inputCls} value={form.sort_order} onChange={e => setInt("sort_order", e.target.value)} />
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><Image size={11} /> Images / Month</span>
              </label>
              <input type="number" min="0" className={inputCls} value={form.image_limit} onChange={e => setInt("image_limit", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><Video size={11} /> Videos / Month</span>
              </label>
              <input type="number" min="0" className={inputCls} value={form.video_limit} onChange={e => setInt("video_limit", e.target.value)} />
            </div>
          </div>

          {/* Feature Toggles */}
          <div>
            <label className={labelCls}>Features</label>
            <div className="rounded-2xl bg-white/3 border border-white/8 divide-y divide-white/5">
              {FEATURES.map(({ key, icon: Icon, label, invert }) => {
                const checked = invert ? !parseInt(form[key]) : !!parseInt(form[key]);
                return (
                  <div key={key} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Icon size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-300 font-medium">{label}</span>
                    </div>
                    <Toggle
                      checked={checked}
                      onChange={v => setFlag(key, invert ? !v : v)}
                    />
                  </div>
                );
              })}

              {/* is_popular */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Star size={14} className="text-yellow-400" />
                  <span className="text-sm text-gray-300 font-medium">Mark as Popular</span>
                </div>
                <Toggle checked={!!parseInt(form.is_popular)} onChange={v => setFlag("is_popular", v)} />
              </div>

              {/* is_active */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span className="text-sm text-gray-300 font-medium">Plan Active</span>
                </div>
                <Toggle checked={!!parseInt(form.is_active)} onChange={v => setFlag("is_active", v)} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-7 py-5 bg-[#0e0e1c] border-t border-white/5">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-semibold hover:bg-white/10 transition cursor-pointer">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ MAIN PAGE ══════════════════════════════════════ */
export default function SubscriptionPlans() {
  const [filter, setFilter]   = useState("all");
  const [editing, setEditing] = useState(null);
  const [toast,   setToast]   = useState(null);

  const qc = useQueryClient();

  const { data: allPlans = [], isLoading, isError } = useQuery({
    queryKey: ["adminSubscriptionPlans"],
    queryFn:  getAdminSubscriptionPlans,
  });

  const { mutate: savePlan, isPending: isSaving } = useMutation({
    mutationFn: updateSubscriptionPlan,
    onSuccess: (updated) => {
      qc.setQueryData(["adminSubscriptionPlans"], (old) =>
        old.map(p => p.id === updated.id ? updated : p)
      );
      setEditing(null);
      setToast({ type: "success", msg: "Plan updated successfully!" });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err) => {
      setToast({ type: "error", msg: err.message || "Update failed." });
      setTimeout(() => setToast(null), 4000);
    },
  });

  const plans = filter === "all" ? allPlans : allPlans.filter(p => p.billing_cycle === filter);
  const counts = {
    all:     allPlans.length,
    monthly: allPlans.filter(p => p.billing_cycle === "monthly").length,
    yearly:  allPlans.filter(p => p.billing_cycle === "yearly").length,
  };

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
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-[#0d0d1a] border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-transparent to-purple-900/20 pointer-events-none" />
        <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/40 text-indigo-400">
              <CreditCard size={30} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-200">
                Subscription Plans
              </h1>
              <p className="mt-1 text-sm text-gray-400">Manage all plans · Admin only</p>
            </div>
          </div>
          {!isLoading && !isError && (
            <div className="flex items-center gap-3 flex-wrap">
              <Stat icon={CreditCard}   value={counts.all}     label="Total"   color="text-white" />
              <Stat icon={CalendarDays} value={counts.monthly} label="Monthly" color="text-blue-400" />
              <Stat icon={Star}         value={counts.yearly}  label="Yearly"  color="text-purple-400" />
            </div>
          )}
        </div>

        {!isLoading && !isError && (
          <div className="relative mt-6 flex gap-2 flex-wrap">
            {[
              { id: "all",     label: `All (${counts.all})` },
              { id: "monthly", label: `Monthly (${counts.monthly})` },
              { id: "yearly",  label: `Yearly (${counts.yearly})` },
            ].map(tab => (
              <button key={tab.id} onClick={() => setFilter(tab.id)} className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer
                ${filter === tab.id ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"}`}>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Loading / Error ─── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-gray-400">Loading plans…</p>
        </div>
      )}
      {isError && (
        <div className="text-center py-20 text-red-400 bg-red-500/5 rounded-2xl border border-red-500/10">
          Failed to load subscription plans.
        </div>
      )}

      {/* ── CARDS ─── */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const theme    = getTheme(plan.slug);
            const isActive = parseInt(plan.is_active) === 1;
            const isPopular= parseInt(plan.is_popular) === 1;
            const isYearly = plan.billing_cycle === "yearly";
            const p = (v) => parseInt(v) === 1;

            return (
              <div key={plan.id} className="relative rounded-2xl border overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
                style={{ background: `linear-gradient(145deg,${theme.from}55,#0a0a14)`, borderColor: theme.ring, boxShadow: `0 0 40px ${theme.ring}` }}>

                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg,transparent,${theme.accent}88,transparent)` }} />

                {isPopular && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest"
                    style={{ background: `${theme.accent}25`, color: theme.accent, border: `1px solid ${theme.accent}50` }}>
                    <Star size={9} fill="currentColor" /> Popular
                  </div>
                )}
                {isYearly && !isPopular && (
                  <div className="absolute top-4 right-4 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                    Save 30%
                  </div>
                )}

                <div className="p-6 flex flex-col gap-4 flex-1">
                  {/* Plan heading */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${BILLING_COLOR[plan.billing_cycle]}`}>
                        <CalendarDays size={9}/> {plan.billing_cycle}
                      </span>
                      <span className="text-[10px] text-gray-600 font-mono">#{plan.id}</span>
                    </div>
                    <h2 className="text-xl font-black text-white">{plan.name}</h2>
                    {plan.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{plan.description}</p>}
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-1">
                    {parseFloat(plan.price) === 0
                      ? <span className="text-4xl font-black text-emerald-400">Free</span>
                      : <><span className="text-4xl font-black text-white">${parseFloat(plan.price).toFixed(2)}</span>
                          <span className="text-gray-500 text-sm mb-1.5">/{isYearly ? "yr" : "mo"}</span></>}
                  </div>

                  {/* Limits */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-blue-500/8 border border-blue-500/15 px-4 py-3">
                      <div className="flex items-center gap-1 text-[10px] text-blue-400/70 uppercase font-semibold mb-1"><Image size={10}/> Images/mo</div>
                      <span className="text-2xl font-black text-blue-300">{parseInt(plan.image_limit) === 0 ? "—" : plan.image_limit}</span>
                    </div>
                    <div className="rounded-xl bg-violet-500/8 border border-violet-500/15 px-4 py-3">
                      <div className="flex items-center gap-1 text-[10px] text-violet-400/70 uppercase font-semibold mb-1"><Video size={10}/> Videos/mo</div>
                      <span className="text-2xl font-black text-violet-300">{parseInt(plan.video_limit) === 0 ? "—" : plan.video_limit}</span>
                    </div>
                  </div>

                  <div className="h-px bg-white/5" />

                  {/* Features */}
                  <div className="space-y-2">
                    {FEATURES.map(({ key, icon: Icon, label, invert }) => {
                      const isOn = invert ? !p(plan[key]) : p(plan[key]);
                      return (
                        <div key={key} className="flex items-center gap-2.5">
                          {isOn ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0"/> : <XCircle size={13} className="text-gray-700 shrink-0"/>}
                          <span className={`text-xs font-medium ${isOn ? "text-gray-200" : "text-gray-600"}`}>{label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex-1" />

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                    {isActive
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400"><CheckCircle2 size={11}/> Active</span>
                      : <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-bold text-red-400"><XCircle size={11}/> Inactive</span>}

                    {/* Edit button */}
                    <button
                      onClick={() => setEditing(plan)}
                      className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-indigo-500/15 hover:border-indigo-500/30 hover:text-indigo-300 text-gray-400 text-xs font-semibold px-3.5 py-2 transition cursor-pointer"
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

      {/* ── EDIT MODAL ─── */}
      {editing && (
        <EditModal
          plan={editing}
          onClose={() => setEditing(null)}
          onSave={savePlan}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
