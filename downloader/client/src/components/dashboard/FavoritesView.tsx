import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Search,
  Plus,
  Trash2,
  Download,
  FolderPlus,
  ExternalLink,
  Sparkles,
  Tag
} from 'lucide-react';
import { FavoriteItem } from '../../types';
import { fetchFavorites, addFavoriteItem, deleteFavoriteItem } from '../../services/api';

export const FavoritesView: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [activeCollection, setActiveCollection] = useState('all');

  // New Favorite Modal / Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCollection, setNewCollection] = useState('General');
  const [submitting, setSubmitting] = useState(false);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await fetchFavorites({
        search,
        collection: activeCollection === 'all' ? undefined : activeCollection
      });
      setFavorites(data.favorites || []);
      setCollections(data.collections || ['General']);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [activeCollection]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFavorites();
  };

  const handleAddFavorite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setSubmitting(true);
    try {
      await addFavoriteItem({
        url: newUrl.trim(),
        title: newTitle.trim() || newUrl.trim(),
        collection: newCollection.trim() || 'General'
      });
      setNewUrl('');
      setNewTitle('');
      setShowAddModal(false);
      loadFavorites();
    } catch (err: any) {
      alert(err.message || 'Failed to save favorite.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this video from your favorites?')) return;
    try {
      await deleteFavoriteItem(id);
      loadFavorites();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-indigo-400" />
            <span>Saved Favorites & Collections</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Bookmark your favorite video links to download or re-process anytime with 1-click.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Save New URL</span>
        </button>
      </div>

      {/* Filter and Collection Strip */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
        
        {/* Collection Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveCollection('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCollection === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            All Items
          </button>
          {collections.map((col) => (
            <button
              key={col}
              onClick={() => setActiveCollection(col)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCollection === col
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {col}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search favorites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/60 border border-slate-700/80 text-xs text-slate-200 outline-none focus:border-indigo-500"
          />
        </form>
      </div>

      {/* Grid of Favorites Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading your saved favorites...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800">
          <Bookmark className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No favorites saved yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click "Save New URL" above to bookmark frequent video links or channels into custom collections.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 shadow-md flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Media Preview or Icon */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 mb-3 border border-slate-800">
                  {fav.thumbnail ? (
                    <img
                      src={fav.thumbnail}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Bookmark className="w-8 h-8" />
                    </div>
                  )}

                  {/* Platform & Duration Badges */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-md text-[10px] font-semibold text-slate-200 border border-slate-700/60">
                    {fav.platform}
                  </span>

                  {fav.duration && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-white">
                      {fav.duration}
                    </span>
                  )}
                </div>

                {/* Title & Collection */}
                <h4 className="text-sm font-semibold text-white truncate max-w-full mb-1">
                  {fav.title}
                </h4>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    <Tag className="w-2.5 h-2.5" />
                    {fav.collection || 'General'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Added {new Date(fav.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <a
                  href={`/api/download?url=${encodeURIComponent(fav.url)}&type=video`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>

                <div className="flex items-center gap-1">
                  <a
                    href={fav.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Open Source Link"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleDelete(fav.id)}
                    title="Remove Favorite"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add Favorite Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-indigo-400" />
              <span>Save Favorite URL</span>
            </h3>

            <form onSubmit={handleAddFavorite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Video URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. My Favorite Coding Podcast"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Collection / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Music, Education, Shorts..."
                  value={newCollection}
                  onChange={(e) => setNewCollection(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Saving...' : 'Save to Favorites'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
