import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Folder, Plus, Trash2, Sparkles, FolderOpen } from 'lucide-react';
import SiteHeader from '@/components/header/SiteHeader';
import IconDetailDrawer from '@/components/drawer/IconDetailDrawer';
import { Collection, IconItem } from '@/types/icon';
import { getCollections, getCollection, createCollection, deleteCollection } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useIconCustomization } from '@/context/IconCustomizationContext';
import { applyCustomizationToSvg } from '@/lib/svg-utils';
import ProtectedCanvasPreview from '@/components/common/ProtectedCanvasPreview';

export default function CollectionsPage() {
  const { user, setShowAuthModal, setAuthMode } = useAuth();
  const { customization, style } = useIconCustomization();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [newColName, setNewColName] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<IconItem | null>(null);

  const loadCollections = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const res = await getCollections();
    if (res.success && res.data?.collections) {
      setCollections(res.data.collections);
      if (res.data.collections.length > 0 && !activeCollection) {
        loadCollectionDetail(res.data.collections[0].id);
      }
    }
    setLoading(false);
  };

  const loadCollectionDetail = async (id: number) => {
    const res = await getCollection(id, style);
    if (res.success && res.data?.collection) {
      setActiveCollection(res.data.collection);
    }
  };

  useEffect(() => {
    loadCollections();
  }, [user, style]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    setCreating(true);
    try {
      const res = await createCollection(newColName.trim());
      if (res.success && res.data?.collection) {
        setCollections([res.data.collection, ...collections]);
        setActiveCollection(res.data.collection);
        setNewColName('');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (colId: number) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    const res = await deleteCollection(colId);
    if (res.success) {
      const remaining = collections.filter((c) => c.id !== colId);
      setCollections(remaining);
      if (activeCollection?.id === colId) {
        setActiveCollection(remaining.length > 0 ? remaining[0] : null);
        if (remaining.length > 0) {
          loadCollectionDetail(remaining[0].id);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0e15]">
      <SiteHeader sidebarOpen={false} onToggleSidebar={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Folder className="size-6 text-purple-400" />
                My Icon Collections
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Organize and group icons for your projects
              </p>
            </div>
          </div>
        </div>

        {!user ? (
          <div className="text-center py-20 bg-[#141522] rounded-3xl border border-white/10 p-8">
            <div className="size-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mx-auto mb-3">
              <Sparkles className="size-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Sign in to view collections</h3>
            <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
              Create and manage custom icon collections for your design and development workflows.
            </p>
            <button
              onClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md transition-all"
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Collections Sidebar */}
            <div className="md:col-span-1 space-y-4">
              <form onSubmit={handleCreate} className="flex gap-2">
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="New collection..."
                  className="flex-1 h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={creating || !newColName.trim()}
                  className="px-3 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1 shadow-sm"
                >
                  <Plus className="size-3.5" />
                </button>
              </form>

              <div className="space-y-1">
                {collections.map((col) => {
                  const isActive = activeCollection?.id === col.id;
                  return (
                    <div
                      key={col.id}
                      onClick={() => loadCollectionDetail(col.id)}
                      className={`group flex items-center justify-between p-3 rounded-2xl border text-xs font-medium cursor-pointer transition-all ${
                        isActive
                          ? 'bg-purple-600/20 border-purple-500/30 text-white shadow-md'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FolderOpen className={`size-4 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                        <span className="truncate">{col.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">{col.items_count}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(col.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Collection Icons Grid */}
            <div className="md:col-span-3">
              {activeCollection ? (
                <div>
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-white">{activeCollection.name}</h2>
                    {activeCollection.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{activeCollection.description}</p>
                    )}
                  </div>

                  {activeCollection.items && activeCollection.items.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {activeCollection.items.map((icon) => (
                        <div
                          key={icon.id}
                          onClick={() => setSelectedIcon(icon)}
                          onContextMenu={(e) => e.preventDefault()}
                          className={`group aspect-square rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer select-none bg-[#141522] border transition-all hover:shadow-xl ${
                            icon.is_premium
                              ? 'border-amber-500/20 hover:border-amber-500/50'
                              : 'border-white/5 hover:border-purple-500/40'
                          }`}
                        >
                          {icon.is_premium && (
                            <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-black tracking-wider uppercase flex items-center gap-1 shadow-sm pointer-events-none">
                              <span>👑</span>
                              <span className="font-extrabold">PRO</span>
                            </div>
                          )}
                          <div
                            className="relative z-10 flex items-center justify-center mb-2 pointer-events-none"
                            style={{ width: `${customization.size}px`, height: `${customization.size}px` }}
                          >
                            <ProtectedCanvasPreview
                              svgContent={applyCustomizationToSvg(icon.svg, customization, style)}
                              size={customization.size}
                            />
                          </div>
                          <span className="relative z-10 text-[11px] font-medium text-slate-400 group-hover:text-slate-100 truncate w-full text-center">
                            {icon.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-2xl">
                      No icons in this collection yet. Browse icons and click &quot;Add to Collection&quot; to add them!
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-2xl">
                  Select or create a collection to view its icons.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <IconDetailDrawer
        icon={selectedIcon}
        onClose={() => setSelectedIcon(null)}
        onOpenAddToCollection={() => {}}
        onSelectIcon={(icon) => setSelectedIcon(icon)}
      />
    </div>
  );
}
