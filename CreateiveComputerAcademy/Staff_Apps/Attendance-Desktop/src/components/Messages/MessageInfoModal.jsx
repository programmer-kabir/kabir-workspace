import React from 'react';
import { FiX, FiCheck } from 'react-icons/fi';

const MessageInfoModal = ({ infoMessage, setInfoMessage }) => {
  if (!infoMessage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={() => setInfoMessage(null)} />
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700/80 shadow-2xl z-10 relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-250">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Message Info</h3>
          <button
            onClick={() => setInfoMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* The Message Preview */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl mb-4 text-sm text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700">
          {infoMessage.file_path && <p className="font-bold text-xs text-primary-500 mb-1">Attachment: {infoMessage.file_name}</p>}
          {infoMessage.message}
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Read by</p>
          {infoMessage.receipts && infoMessage.receipts.filter(r => r.read_at).length === 0 && (
            <p className="text-xs font-semibold text-slate-500">No one has read this yet.</p>
          )}
          {infoMessage.receipts && infoMessage.receipts.filter(r => r.read_at).map(r => (
            <div key={r.user_id} className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{r.name}</span>
              <span className="text-xs font-semibold text-blue-500 flex items-center gap-1">
                <FiCheck /> {(() => {
                  let str = String(r.read_at).trim().replace(' ', 'T');
                  if (!str.includes('+') && !str.endsWith('Z')) str += '+06:00';
                  return new Date(str).toLocaleTimeString([], { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' });
                })()}
              </span>
            </div>
          ))}

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Delivered to</p>
          {infoMessage.receipts && infoMessage.receipts.filter(r => r.delivered_at && !r.read_at).length === 0 && (
            <p className="text-xs font-semibold text-slate-500">No pending deliveries.</p>
          )}
          {infoMessage.receipts && infoMessage.receipts.filter(r => r.delivered_at && !r.read_at).map(r => (
            <div key={r.user_id} className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{r.name}</span>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <FiCheck /> {(() => {
                  let str = String(r.delivered_at).trim().replace(' ', 'T');
                  if (!str.includes('+') && !str.endsWith('Z')) str += '+06:00';
                  return new Date(str).toLocaleTimeString([], { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' });
                })()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessageInfoModal;
