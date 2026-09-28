// admin/src/pages/ContactMessagesPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { getAdminContactMessages, updateAdminContactMessageStatus } from '../lib/api';
import { AdminContactMessage } from '../types/admin';

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [counts, setCounts] = useState({ total: 0, unread: 0, read: 0, replied: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Selected message for details view
  const [activeMessage, setActiveMessage] = useState<AdminContactMessage | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminContactMessages({
        page,
        limit: 20,
        q: search.trim(),
        status: statusFilter || undefined,
      });

      if (res.success && res.data) {
        setMessages(res.data.items);
        setCounts(res.data.counts);
        setTotalPages(res.data.pagination.total_pages);
      }
    } catch (err) {
      console.error('Failed to load contact messages', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  async function handleStatusChange(id: number, newStatus: 'unread' | 'read' | 'replied') {
    try {
      const res = await updateAdminContactMessageStatus(id, newStatus);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
        );
        if (activeMessage && activeMessage.id === id) {
          setActiveMessage((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        loadMessages();
      }
    } catch (err) {
      console.error('Failed to update message status', err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Contact Messages</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review and respond to inquiries submitted through the public contact form.
        </p>
      </div>

      {/* Metric Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setStatusFilter('');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === ''
              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider">All Inquiries</div>
          <div className="text-2xl font-bold text-white mt-1">{counts.total}</div>
        </button>

        <button
          onClick={() => {
            setStatusFilter('unread');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'unread'
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <span>Unread</span>
            {counts.unread > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{counts.unread}</div>
        </button>

        <button
          onClick={() => {
            setStatusFilter('read');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'read'
              ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider">Read</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{counts.read}</div>
        </button>

        <button
          onClick={() => {
            setStatusFilter('replied');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'replied'
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider">Replied</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{counts.replied}</div>
        </button>
      </div>

      {/* Messages Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Sender</th>
                <th className="py-3 px-4">Subject & Message</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Received</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {messages.map((m) => (
                <tr
                  key={m.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    m.status === 'unread' ? 'bg-indigo-950/20 font-medium' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100">{m.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{m.email}</div>
                  </td>
                  <td className="py-3 px-4 max-w-md">
                    <div className="font-semibold text-slate-200">{m.subject}</div>
                    <div className="text-xs text-slate-400 truncate max-w-sm">{m.message}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        m.status === 'unread'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : m.status === 'read'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setActiveMessage(m);
                          if (m.status === 'unread') {
                            handleStatusChange(m.id, 'read');
                          }
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {messages.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No contact messages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Details Modal */}
      {activeMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{activeMessage.subject}</h3>
                <div className="text-xs text-slate-400">
                  From <strong className="text-slate-200">{activeMessage.name}</strong> ({activeMessage.email})
                </div>
              </div>
              <button
                onClick={() => setActiveMessage(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {activeMessage.message}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange(activeMessage.id, 'read')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    activeMessage.status === 'read'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  Mark Read
                </button>
                <button
                  onClick={() => handleStatusChange(activeMessage.id, 'replied')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    activeMessage.status === 'replied'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  Mark Replied
                </button>
              </div>

              <a
                href={`mailto:${activeMessage.email}?subject=Re: ${encodeURIComponent(activeMessage.subject)}`}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Reply via Email &rarr;
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
