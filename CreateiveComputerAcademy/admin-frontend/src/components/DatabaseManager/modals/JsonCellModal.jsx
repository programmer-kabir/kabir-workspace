import React from 'react';
import { createPortal } from 'react-dom';
import { FiCode, FiX } from 'react-icons/fi';

const JsonCellModal = ({ jsonViewModal = { isOpen: false, title: '', content: '' }, setJsonViewModal }) => {
  if (!jsonViewModal?.isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full border border-slate-700 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold font-mono text-purple-400 flex items-center gap-2">
            <FiCode />
            <span>{jsonViewModal.title}</span>
          </h3>
          <button
            type="button"
            onClick={() => setJsonViewModal && setJsonViewModal({ isOpen: false, title: '', content: '' })}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>
        <pre className="p-4 bg-slate-950 rounded-2xl overflow-auto max-h-96 text-xs font-mono text-emerald-400 whitespace-pre-wrap">
          {(() => {
            try {
              return JSON.stringify(JSON.parse(jsonViewModal.content), null, 2);
            } catch {
              return jsonViewModal.content;
            }
          })()}
        </pre>
      </div>
    </div>,
    document.body
  );
};

export default JsonCellModal;
