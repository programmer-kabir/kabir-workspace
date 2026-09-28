import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronLeft, AlertCircle, Sparkles } from 'lucide-react';
import { getContentPage } from '@/lib/api';
import { ContentPage as ContentPageType } from '@/types/cms';
import MarkdownRenderer from './MarkdownRenderer';

interface ContentPageProps {
  slug: string;
  initialPage?: ContentPageType | null;
}

export default function ContentPage({ slug, initialPage }: ContentPageProps) {
  const [page, setPage] = useState<ContentPageType | null>(initialPage || null);
  const [loading, setLoading] = useState<boolean>(!initialPage);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      try {
        setLoading(true);
        setError(null);
        const res = await getContentPage(slug);
        if (!isMounted) return;

        if (res.success && res.data) {
          setPage(res.data);
        } else {
          setError(res.message || 'The requested page could not be found.');
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load page content.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-pulse">
        <div className="h-4 w-64 bg-white/10 rounded mb-8" />
        <div className="h-10 w-3/4 bg-white/10 rounded-lg mb-4" />
        <div className="h-5 w-48 bg-white/10 rounded mb-12" />
        <div className="space-y-4">
          <div className="h-4 w-full bg-white/5 rounded" />
          <div className="h-4 w-5/6 bg-white/5 rounded" />
          <div className="h-4 w-4/6 bg-white/5 rounded" />
          <div className="h-28 w-full bg-white/5 rounded-xl mt-6" />
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center p-8 rounded-2xl bg-white/[0.02] border border-white/10 shadow-2xl">
          <div className="size-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="size-6 text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Page Not Found</h2>
          <p className="text-sm text-slate-400 mb-6">
            {error || 'This page either does not exist or has not been published yet.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
          >
            <ChevronLeft className="size-4" />
            Back to Icon Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="size-3.5" />
            Back to Icons
          </Link>
        </div>

        {/* Page Header */}
        <header className="border-b border-white/10 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-4">
            <Sparkles className="size-3" />
            IconBaba Documentation
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            {page.title}
          </h1>

          {/* Last Updated Date (Direct from Database) */}
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-1.5 text-purple-400 font-medium">
              <Calendar className="size-4 text-purple-400 shrink-0" />
              <span>Last updated: {formatDate(page.updated_at)}</span>
            </div>
            {page.status === 'draft' && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Draft Mode
              </span>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="text-slate-300">
          <MarkdownRenderer content={page.content} />
        </main>
      </div>
    </article>
  );
}
