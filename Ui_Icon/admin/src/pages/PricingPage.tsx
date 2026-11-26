// admin/src/pages/PricingPage.tsx
import { useEffect, useState } from 'react';
import { getPricingPlans, saveAdminPricingPlan, deleteAdminPricingPlan } from '../lib/api';
import { PricingPlan } from '../types/cms';

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [, setLoading] = useState(true);

  // Edit / Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [billingPeriod, setBillingPeriod] = useState('year');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [buttonText, setButtonText] = useState('Get Started');
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [userCount, setUserCount] = useState(1);
  const [extraSeatPrice, setExtraSeatPrice] = useState(20);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadPlans() {
    setLoading(true);
    try {
      const res = await getPricingPlans();
      if (res.success && res.data?.plans) {
        setPlans(res.data.plans);
      }
    } catch (err) {
      console.error('Failed to load plans', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  function openCreate() {
    setEditId(null);
    setName('');
    setSlug('');
    setPrice(99);
    setBillingPeriod('year');
    setDescription('');
    setFeaturesText('Unlimited SVG & PNG Downloads\nFull Commercial License\nVector Customization Editor\nPriority Support');
    setButtonText('Get Started');
    setIsPopular(false);
    setIsActive(true);
    setSortOrder(plans.length + 1);
    setUserCount(1);
    setExtraSeatPrice(20);
    setModalOpen(true);
  }

  function openEdit(p: PricingPlan) {
    setEditId(p.id);
    setName(p.name);
    setSlug(p.slug || '');
    setPrice(Number(p.price));
    setBillingPeriod(p.billing_period);
    setDescription(p.description || '');
    setFeaturesText(Array.isArray(p.features) ? p.features.join('\n') : '');
    setButtonText(p.button_text || p.cta_text || 'Get Started');
    setIsPopular(Boolean(p.is_popular));
    setIsActive(p.is_active !== undefined ? Boolean(p.is_active) : true);
    setSortOrder(p.sort_order || p.display_order);
    setUserCount((p as unknown as { user_count?: number }).user_count || 1);
    setExtraSeatPrice((p as unknown as { extra_seat_price?: number }).extra_seat_price || 20);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    const featuresArray = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      const res = await saveAdminPricingPlan({
        id: editId || 0,
        name: name.trim(),
        slug: slug.trim() || undefined,
        price,
        billing_period: billingPeriod,
        description: description.trim(),
        features: featuresArray,
        button_text: buttonText.trim(),
        is_popular: isPopular,
        is_active: isActive,
        sort_order: sortOrder,
        user_count: userCount,
        extra_seat_price: extraSeatPrice,
      });

      if (res.success) {
        setModalOpen(false);
        setMsg({ type: 'success', text: `Pricing plan saved successfully!` });
        setTimeout(() => setMsg(null), 3000);
        loadPlans();
      } else {
        alert(res.message || 'Failed to save plan');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Save error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number, planName: string) {
    const confirmed = window.confirm(`Are you sure you want to delete "${planName}"?`);
    if (!confirmed) return;

    try {
      const res = await deleteAdminPricingPlan(id);
      if (res.success) {
        setMsg({ type: 'success', text: `Plan "${planName}" deleted.` });
        setTimeout(() => setMsg(null), 3000);
        loadPlans();
      } else {
        alert(res.message || 'Failed to delete plan');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete error');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Pricing Plans</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure subscription tiers, seat upgrade multipliers, and feature lists. Synchronizes live with the public pricing page.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-colors self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Plan</span>
        </button>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl text-sm ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => {
          const userCnt = (p as unknown as { user_count?: number }).user_count || 1;
          const extraPrice = (p as unknown as { extra_seat_price?: number }).extra_seat_price || 20;

          return (
            <div
              key={p.id}
              className={`p-6 rounded-2xl bg-slate-900/80 border flex flex-col justify-between transition-all ${
                p.is_popular
                  ? 'border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-white">{p.name}</span>
                  <div className="flex items-center gap-1.5">
                    {p.is_popular && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Popular
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.is_active
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {p.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-3xl font-black text-white">${Number(p.price)}</span>
                  <span className="text-xs text-slate-400">/{p.billing_period}</span>
                </div>

                {p.description && (
                  <p className="text-xs text-slate-400 mb-4">{p.description}</p>
                )}

                {/* Seats Config Badge */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs space-y-1 mb-4">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Seats:</span>
                    <span className="font-semibold text-slate-200">{userCnt} user{userCnt > 1 ? 's' : ''}</span>
                  </div>
                  {userCnt > 1 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Extra Seat Cost:</span>
                      <span className="font-semibold text-indigo-400">+${extraPrice}/seat/{p.billing_period}</span>
                    </div>
                  )}
                </div>

                {/* Features list */}
                <div className="space-y-2 mb-6">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Features</div>
                  {Array.isArray(p.features) &&
                    p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feat}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => openEdit(p)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                >
                  Edit Plan
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-semibold rounded-lg border border-red-500/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editId ? `Edit Plan: ${name}` : 'Create Pricing Plan'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Solo, Team, Pro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Slug</label>
                <input
                  type="text"
                  placeholder="solo, team"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Price (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Period</label>
                <select
                  value={billingPeriod}
                  onChange={(e) => setBillingPeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="year">Yearly (year)</option>
                  <option value="month">Monthly (month)</option>
                  <option value="one-time">One-time (lifetime)</option>
                </select>
              </div>
            </div>

            {/* Seats & Upgrades */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Included Users/Seats
                </label>
                <input
                  type="number"
                  min="1"
                  value={userCount}
                  onChange={(e) => setUserCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Extra Seat Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={extraSeatPrice}
                  onChange={(e) => setExtraSeatPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Features <span className="text-slate-500 font-normal">(One feature per line)</span>
              </label>
              <textarea
                rows={5}
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Button Text</label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-4 pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600"
                  />
                  <span>Popular Badge</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600"
                  />
                  <span>Active / Published</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
              >
                {submitting ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
