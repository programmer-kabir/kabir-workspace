import React, { useState, useEffect } from 'react';
import {
  Radio,
  Plus,
  Send,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  ShieldAlert,
  ExternalLink,
  Sparkles,
  Key
} from 'lucide-react';
import { Webhook, WebhookDelivery } from '../../../types';
import {
  fetchWebhooks,
  createWebhookApi,
  updateWebhookApi,
  deleteWebhookApi,
  testWebhookApi,
  fetchWebhookDeliveries,
  retryWebhookDeliveryApi
} from '../../../services/api';

const AVAILABLE_EVENTS = [
  { id: 'download.queued', label: 'Download Queued', desc: 'Fires when a new download job is added to the background queue.' },
  { id: 'download.started', label: 'Download Started', desc: 'Fires when a worker begins processing the media stream.' },
  { id: 'download.completed', label: 'Download Completed', desc: 'Fires when the video/audio is ready for download.' },
  { id: 'download.failed', label: 'Download Failed', desc: 'Fires if extraction fails after maximum retry attempts.' },
  { id: 'download.cancelled', label: 'Download Cancelled', desc: 'Fires when a job is cancelled by user or API.' }
];

export const WebhookManagement: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create Webhook Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['download.completed', 'download.failed']);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Deliveries Drawer
  const [activeWebhookForDeliveries, setActiveWebhookForDeliveries] = useState<Webhook | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      const data = await fetchWebhooks();
      setWebhooks(data || []);
    } catch (err) {
      console.error('Failed to load webhooks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWebhooks();
  }, []);

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    setCreating(true);
    setCreateError(null);
    try {
      await createWebhookApi(name.trim(), url.trim(), selectedEvents);
      setShowCreateModal(false);
      setName('');
      setUrl('');
      loadWebhooks();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create webhook.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const handleToggleActive = async (hook: Webhook) => {
    setActionLoading(hook.id);
    try {
      await updateWebhookApi(hook.id, { isActive: !hook.isActive });
      loadWebhooks();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestPing = async (hook: Webhook) => {
    setActionLoading(hook.id);
    try {
      const res = await testWebhookApi(hook.id);
      if (res.success) {
        alert(`Test ping delivered successfully! HTTP ${res.statusCode || 200}`);
      } else {
        alert(`Test ping failed: ${res.error || 'Endpoint responded with error.'}`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (hookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook endpoint?')) return;
    setActionLoading(hookId);
    try {
      await deleteWebhookApi(hookId);
      loadWebhooks();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenDeliveries = async (hook: Webhook) => {
    setActiveWebhookForDeliveries(hook);
    setDeliveriesLoading(true);
    try {
      const data = await fetchWebhookDeliveries(hook.id);
      setDeliveries(data.deliveries || []);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    try {
      await retryWebhookDeliveryApi(deliveryId);
      if (activeWebhookForDeliveries) {
        const data = await fetchWebhookDeliveries(activeWebhookForDeliveries.id);
        setDeliveries(data.deliveries || []);
      }
      alert('Delivery retried.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400" />
            <span>Developer Webhooks & Real-Time Event Dispatch</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Receive instant HTTP POST notifications when downloads queue, finish, or fail. Protected by HMAC-SHA256 signatures.
          </p>
        </div>

        <button
          onClick={() => { setCreateError(null); setShowCreateModal(true); }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Webhook Endpoint</span>
        </button>
      </div>

      {/* Webhooks List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Loading webhooks...</p>
        </div>
      ) : webhooks.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
          <Radio className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h4 className="text-sm font-semibold text-slate-300">No webhooks registered</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add a webhook destination to get notified automatically when background video downloads complete.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((hook) => (
            <div
              key={hook.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">{hook.name}</h4>
                    {hook.isActive ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        Paused
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-xs text-indigo-300 truncate max-w-xl">
                    {hook.url}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleTestPing(hook)}
                    disabled={actionLoading === hook.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3 h-3 text-indigo-400" />
                    <span>Test Ping</span>
                  </button>

                  <button
                    onClick={() => handleOpenDeliveries(hook)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
                  >
                    Logs
                  </button>

                  <button
                    onClick={() => handleToggleActive(hook)}
                    disabled={actionLoading === hook.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
                  >
                    {hook.isActive ? 'Pause' : 'Activate'}
                  </button>

                  <button
                    onClick={() => handleDelete(hook.id)}
                    disabled={actionLoading === hook.id}
                    title="Delete Webhook"
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Subscribed Events & Secret */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-500 font-medium text-[11px]">Events:</span>
                  {hook.events.map((ev) => (
                    <span
                      key={ev}
                      className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono"
                    >
                      {ev}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <Key className="w-3 h-3 text-slate-500" />
                  <span>Signing Secret:</span>
                  <span className="text-slate-300">{hook.secretMasked}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-400" />
              <span>Create Webhook Subscription</span>
            </h3>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Webhook Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discord Notification Bot, AWS Lambda Ingestion"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Destination URL (HTTP/HTTPS) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://your-domain.com/webhooks/streamvault"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>SSRF Protected: Localhost, private IPs (10.*, 192.168.*), and cloud metadata are blocked.</span>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Events to Subscribe *</label>
                <div className="space-y-2">
                  {AVAILABLE_EVENTS.map((ev) => {
                    const isChecked = selectedEvents.includes(ev.id);
                    return (
                      <label
                        key={ev.id}
                        onClick={() => handleToggleEvent(ev.id)}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-indigo-950/30 border-indigo-500/50 text-white'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold font-mono">{ev.id}</div>
                          <div className="text-[11px] text-slate-400">{ev.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || selectedEvents.length === 0}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{creating ? 'Creating...' : 'Create Webhook'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deliveries Slideover/Modal */}
      {activeWebhookForDeliveries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="font-bold text-base text-white">
                  Delivery History: {activeWebhookForDeliveries.name}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {activeWebhookForDeliveries.url}
                </span>
              </div>
              <button
                onClick={() => setActiveWebhookForDeliveries(null)}
                className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {deliveriesLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading deliveries...</div>
              ) : deliveries.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No delivery attempts recorded yet for this webhook. Click "Test Ping" to dispatch a verification payload.
                </div>
              ) : (
                deliveries.map((del) => (
                  <div
                    key={del.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-300">{del.event}</span>
                        {del.status === 'success' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            HTTP {del.response_status || 200} OK
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Failed ({del.error_message || `HTTP ${del.response_status}`})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">
                          {new Date(del.created_at).toLocaleTimeString()}
                        </span>
                        {del.status !== 'success' && (
                          <button
                            onClick={() => handleRetryDelivery(del.id)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                            title="Retry Delivery"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-28">
                      {JSON.stringify(del.payload, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
