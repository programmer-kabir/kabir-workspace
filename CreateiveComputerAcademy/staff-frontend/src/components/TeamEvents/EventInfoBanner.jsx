import React from 'react';
import { FiCheck } from 'react-icons/fi';

const EventInfoBanner = ({
  currentEvent,
  rsvpState,
  handleRsvp,
  submittingRsvp,
  setPreviewImage,
  API_BASE,
}) => {
  return (
    <>
      {/* Main Info Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {currentEvent.banner_image && (
            <img
              src={
                currentEvent.banner_image.startsWith('http')
                  ? currentEvent.banner_image
                  : `${API_BASE}${currentEvent.banner_image}`
              }
              alt={currentEvent.title}
              className="w-full sm:w-36 h-28 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:opacity-95"
              onClick={() =>
                setPreviewImage(
                  currentEvent.banner_image.startsWith('http')
                    ? currentEvent.banner_image
                    : `${API_BASE}${currentEvent.banner_image}`
                )
              }
            />
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 capitalize">
                {currentEvent.event_type}
              </span>
              <span>📅 {currentEvent.event_date}</span>
              <span>📍 {currentEvent.location || 'CCA Campus'}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {currentEvent.title}
            </h2>
            {currentEvent.description && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                {currentEvent.description}
              </p>
            )}
          </div>
        </div>

        {/* Collection Account Card */}
        {currentEvent.collection_number && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shrink-0 md:max-w-xs space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Payment Account
            </div>
            <div className="text-sm font-black text-slate-900 dark:text-white select-all">
              {currentEvent.collection_number}
            </div>
            {currentEvent.collection_note && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentEvent.collection_note}
              </p>
            )}
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold pt-1">
              Target: ৳{currentEvent.target_per_head || 0} per head
            </div>
          </div>
        )}
      </div>

      {/* Pending Invitation Alert for Staff */}
      {rsvpState.rsvp_status === 'invited' && (
        <div className="bg-linear-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-300 dark:border-amber-700/60 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
              💌
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>You are Invited! 🎉</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-bold">
                  Action Required
                </span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Admin has invited you to <strong>{currentEvent.title}</strong> ({currentEvent.event_date}). Will you join the feast/tour?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleRsvp('going')}
              disabled={submittingRsvp}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FiCheck size={15} />
              <span>Accept & Join (Going 😋)</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you can't make it? This event will be removed from your dashboard.")) {
                  handleRsvp('not_going');
                }
              }}
              disabled={submittingRsvp}
              className="px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/40 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <span>Decline / Reject</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EventInfoBanner;

