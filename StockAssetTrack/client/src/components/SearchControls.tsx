import { Camera, ClipboardPaste, Search, Sparkles, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { ContentTypeFilter, GenAIFilter, SortOption } from '../types/stock';

interface SearchControlsProps {
  query: string;
  order: SortOption;
  contentType: ContentTypeFilter;
  generativeAi: GenAIFilter;
  loading: boolean;
  onQueryChange: (val: string) => void;
  onOrderChange: (val: SortOption) => void;
  onContentTypeChange: (val: ContentTypeFilter) => void;
  onGenerativeAiChange: (val: GenAIFilter) => void;
  onSubmit: (overrideQuery?: string) => void;
  onOpenImageSearch?: () => void;
}

const POPULAR_SEARCHES = [
  'nature',
  'business',
  'technology',
  'vintage brass compass macro',
  'sustainable packaging mockup',
  'eid al-adha',
  'education',
  'finance',
];

export function SearchControls({
  query,
  order,
  contentType,
  generativeAi,
  loading,
  onQueryChange,
  onOrderChange,
  onContentTypeChange,
  onGenerativeAiChange,
  onSubmit,
  onOpenImageSearch,
}: SearchControlsProps) {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        onQueryChange(text.trim());
        toast.success('Pasted from clipboard');
      }
    } catch {
      toast.error('Clipboard read blocked by browser permission');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-950/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/75">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex flex-1 items-center rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 focus-within:border-brand-indigo focus-within:ring-2 focus-within:ring-brand-indigo/20 dark:border-slate-700 dark:bg-slate-950">
          <Search className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
          <input
            id="search-query-input"
            name="q"
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by keywords or Asset ID (try: 'nature')..."
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Clear search"
              className="mr-1 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handlePaste}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ClipboardPaste className="h-3 w-3" />
            <span>Paste</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-purple px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-indigo/25 transition hover:opacity-95 disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          <span>{loading ? 'Searching...' : 'Search'}</span>
        </button>

        {onOpenImageSearch && (
          <button
            type="button"
            onClick={onOpenImageSearch}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-cyan/40 bg-brand-cyan/10 px-4 py-2.5 text-sm font-semibold text-brand-cyan transition hover:bg-brand-cyan/20"
          >
            <Camera className="h-4 w-4" />
            <span>By Image</span>
          </button>
        )}
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">
          <span className="font-medium text-slate-500 dark:text-slate-400">Sort By</span>
          <select
            id="search-sort-select"
            name="order"
            aria-label="Sort By"
            value={order}
            onChange={(e) => onOrderChange(e.target.value as SortOption)}
            className="bg-transparent font-semibold text-slate-900 outline-none dark:text-white"
          >
            <option value="relevance" className="dark:bg-slate-900">Relevance</option>
            <option value="nb_downloads" className="dark:bg-slate-900">Most Downloaded</option>
            <option value="creation" className="dark:bg-slate-900">Newest</option>
            <option value="featured" className="dark:bg-slate-900">Featured</option>
            <option value="undiscovered" className="dark:bg-slate-900">Undiscovered</option>
          </select>
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">
          <span className="font-medium text-slate-500 dark:text-slate-400">Content Type</span>
          <select
            id="search-type-select"
            name="contentType"
            aria-label="Content Type"
            value={contentType}
            onChange={(e) => onContentTypeChange(e.target.value as ContentTypeFilter)}
            className="bg-transparent font-semibold text-slate-900 outline-none dark:text-white"
          >
            <option value="all" className="dark:bg-slate-900">All Types</option>
            <option value="photo" className="dark:bg-slate-900">Photo</option>
            <option value="illustration" className="dark:bg-slate-900">Illustration</option>
            <option value="vector" className="dark:bg-slate-900">Vector</option>
            <option value="video" className="dark:bg-slate-900">Video</option>
            <option value="template" className="dark:bg-slate-900">Template</option>
            <option value="3d" className="dark:bg-slate-900">3D</option>
          </select>
        </label>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
          <span className="inline-flex items-center gap-1 px-2 font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="h-3 w-3 text-brand-purple" />
            AI
          </span>
          {(
            [
              { value: 'all', label: 'All' },
              { value: 'only', label: 'AI Only' },
              { value: 'exclude', label: 'Exclude AI' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onGenerativeAiChange(opt.value)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                generativeAi === opt.value
                  ? 'bg-brand-indigo text-white'
                  : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Link
          to="/tracker"
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-brand-indigo/30 bg-brand-indigo/10 px-3 py-1.5 text-xs font-semibold text-brand-indigo transition hover:bg-brand-indigo/20 dark:text-indigo-300"
        >
          <Users className="h-3.5 w-3.5" />
          <span>Track Contributor</span>
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-slate-200/80 pt-3 dark:border-slate-800/80">
        <span className="mr-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Popular niches:
        </span>
        {POPULAR_SEARCHES.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => {
              onQueryChange(chip);
              onSubmit(chip);
            }}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-brand-indigo"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
