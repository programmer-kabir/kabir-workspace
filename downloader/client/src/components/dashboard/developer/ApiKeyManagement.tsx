import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Sparkles,
  Calendar,
  Shield,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { ApiKey } from '../../../types';
import {
  fetchApiKeys,
  createApiKeyApi,
  toggleApiKeyApi,
  regenerateApiKeyApi,
  deleteApiKeyApi
} from '../../../services/api';

export const ApiKeyManagement: React.FC = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New Key Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [creating, setCreating] = useState(false);
  const [newRawKeyResult, setNewRawKeyResult] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Regenerated Key Alert
  const [regeneratedKeyResult, setRegeneratedKeyResult] = useState<string | null>(null);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const data = await fetchApiKeys();
      setKeys(data || []);
    } catch (err) {
      console.error('Failed to load API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      const result = await createApiKeyApi(newKeyName.trim(), newKeyExpiry || undefined);
      setNewRawKeyResult(result.rawKey);
      setNewKeyName('');
      setNewKeyExpiry('');
      loadKeys();
    } catch (err: any) {
      alert(err.message || 'Failed to create API key.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (key: ApiKey) => {
    setActionLoading(key.id);
    try {
      await toggleApiKeyApi(key.id, !key.isEnabled);
      loadKeys();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerate = async (id: string) => {
    if (!confirm('Are you sure you want to regenerate this API key? Existing integrations using the old key will stop working immediately.')) return;

    setActionLoading(id);
    try {
      const res = await regenerateApiKeyApi(id);
      setRegeneratedKeyResult(res.rawKey);
      loadKeys();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this API key?')) return;

    setActionLoading(id);
    try {
      await deleteApiKeyApi(id);
      loadKeys();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <span>Active API Keys</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Keys are securely hashed in SQLite. Raw secrets are shown only once upon generation.
          </p>
        </div>

        <button
          onClick={() => { setNewRawKeyResult(null); setShowCreateModal(true); }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New API Key</span>
        </button>
      </div>

      {/* Alert banner for newly regenerated key */}
      {regeneratedKeyResult && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>API Key Regenerated Successfully — Copy Your New Key Now!</span>
          </div>
          <p className="text-xs text-slate-300">
            This key will not be displayed again. Update your applications immediately.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              readOnly
              value={regeneratedKeyResult}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 font-mono text-xs text-amber-300 border border-amber-500/40 select-all"
            />
            <button
              onClick={() => copyToClipboard(regeneratedKeyResult)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={() => setRegeneratedKeyResult(null)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Keys List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Fetching developer keys...</p>
        </div>
      ) : keys.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
          <Key className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h4 className="text-sm font-semibold text-slate-300">No API keys created yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Generate an API key to access the video extraction engine programmatically from your own applications.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                key.isEnabled && key.status === 'active'
                  ? 'bg-slate-900/70 border-slate-800'
                  : 'bg-slate-900/40 border-slate-800/60 opacity-75'
              }`}
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white truncate">{key.name}</h4>
                  {key.status === 'revoked' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Revoked
                    </span>
                  ) : key.isEnabled ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      Disabled
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 font-mono text-xs text-slate-300">
                  <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-indigo-300">
                    {key.keyPrefix}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-0.5">
                  <span>
                    Monthly Requests: <strong className="text-white">{key.requestsThisMonth}</strong> / {key.monthlyQuota}
                  </span>
                  {key.lastUsedAt && (
                    <span>Last used: {new Date(key.lastUsedAt).toLocaleString()}</span>
                  )}
                  {key.lastUsedIp && <span>• IP: {key.lastUsedIp}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {key.status !== 'revoked' && (
                  <>
                    <button
                      onClick={() => handleToggle(key)}
                      disabled={actionLoading === key.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        key.isEnabled
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
                      }`}
                    >
                      {key.isEnabled ? 'Disable' : 'Enable'}
                    </button>

                    <button
                      onClick={() => handleRegenerate(key.id)}
                      disabled={actionLoading === key.id}
                      title="Regenerate Key Secret"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleDelete(key.id)}
                  disabled={actionLoading === key.id}
                  title="Delete Key"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              <span>Generate API Key</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Your API key grants programmatic access to StreamVault API endpoints.
            </p>

            {newRawKeyResult ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                  <strong>API Key Generated!</strong> Copy your key now. For your security, this key will never be shown again.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Your Secret API Key</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={newRawKeyResult}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-700 select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(newRawKeyResult)}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => { setShowCreateModal(false); setNewRawKeyResult(null); }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  I have copied my secret key
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Key Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production Worker, Backend Microservice"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Expiration Date (Optional)</label>
                  <input
                    type="date"
                    value={newKeyExpiry}
                    onChange={(e) => setNewKeyExpiry(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Leave blank for no expiration</span>
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
                    disabled={creating}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{creating ? 'Generating...' : 'Generate Key'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
