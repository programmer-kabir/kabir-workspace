// frontend/components/collections/AddToCollectionModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Folder, Plus, Check } from 'lucide-react';
import { Collection, IconItem } from '@/types/icon';
import { getCollections, createCollection, addIconToCollection } from '@/lib/api';

interface AddToCollectionModalProps {
  icon: IconItem | null;
  onClose: () => void;
}

export default function AddToCollectionModal({
  icon,
  onClose,
}: AddToCollectionModalProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [newColName, setNewColName] = useState('');
  const [creating, setCreating] = useState(false);
  const [addedMap, setAddedMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!icon) return;
    getCollections().then((res) => {
      if (res.success && res.data?.collections) {
        setCollections(res.data.collections);
      }
      setLoading(false);
    });
  }, [icon]);

  if (!icon) return null;

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    setCreating(true);
    try {
      const res = await createCollection(newColName.trim());
      if (res.success && res.data?.collection) {
        const newCol = res.data.collection;
        setCollections([newCol, ...collections]);
        setNewColName('');
        // Automatically add icon to new collection
        await addIconToCollection(newCol.id, icon.id);
        setAddedMap((prev) => ({ ...prev, [newCol.id]: true }));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleAddToCollection = async (colId: number) => {
    const res = await addIconToCollection(colId, icon.id);
    if (res.success) {
      setAddedMap((prev) => ({ ...prev, [colId]: true }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#141522] border border-white/10 shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
        >
          <X className="size-4" />
        </button>

        <h3 className="text-base font-bold text-white mb-1">Add to Collection</h3>
        <p className="text-xs text-slate-400 mb-4">
          Save <span className="font-semibold text-purple-300">{icon.name}</span> to a collection
        </p>

        {/* Create New Collection Form */}
        <form onSubmit={handleCreateCollection} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            placeholder="New collection name..."
            className="flex-1 h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={creating || !newColName.trim()}
            className="px-3 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1 shadow-sm"
          >
            <Plus className="size-3.5" />
            Create
          </button>
        </form>

        {/* Existing Collections List */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading collections...</div>
          ) : collections.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No collections yet. Create one above!</div>
          ) : (
            collections.map((col) => {
              const isAdded = addedMap[col.id];
              return (
                <button
                  key={col.id}
                  onClick={() => handleAddToCollection(col.id)}
                  disabled={isAdded}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                    isAdded
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder className="size-4 text-purple-400 shrink-0" />
                    <span className="truncate">{col.name}</span>
                  </div>
                  {isAdded ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <Check className="size-3.5" /> Added
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {col.items_count} items
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
