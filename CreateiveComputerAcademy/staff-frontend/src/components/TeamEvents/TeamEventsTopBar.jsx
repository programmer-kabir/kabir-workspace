import React from 'react';
import { Link } from 'react-router-dom';
import { FiTerminal } from 'react-icons/fi';

const TeamEventsTopBar = ({
  isDeveloper,
  events,
  selectedEventId,
  setSelectedEventId,
  API_BASE,
}) => {
  return (
    <>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-amber-500 via-orange-500 to-rose-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 uppercase tracking-wider backdrop-blur-xs">
              CCA Social Hub
            </span>
            <span className="text-xs opacity-90">Tours, Dinners & Biryani Feasts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Team Feasts & Tours 🎉
          </h1>
          <p className="text-xs sm:text-sm text-white/90 max-w-xl">
            Live transparency board for all academy outings, biryani parties, contributions, and real-time expense vouchers.
          </p>
        </div>

        {isDeveloper && (
          <div className="relative z-10 flex items-center gap-2">
            <Link
              to="/developer/events"
              className="px-4 py-2.5 bg-slate-950/80 hover:bg-slate-950 text-cyan-400 hover:text-cyan-300 text-xs font-black rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer border border-cyan-400/40 backdrop-blur-xs"
              title="Go to Developer Console to create events, manage invites and approve collections"
            >
              <FiTerminal size={14} className="text-cyan-400" />
              <span>Dev Console &bull; Event Manager →</span>
            </Link>
          </div>
        )}
      </div>

      {/* Events Selector Strip */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {events.map((ev) => (
          <button
            key={ev.id}
            onClick={() => setSelectedEventId(ev.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left shrink-0 transition-all cursor-pointer ${
              selectedEventId === ev.id
                ? 'bg-orange-50 border-orange-500 text-orange-950 dark:bg-orange-950/40 dark:border-orange-500 dark:text-orange-200 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
            }`}
          >
            {ev.banner_image ? (
              <img
                src={
                  ev.banner_image.startsWith('http')
                    ? ev.banner_image
                    : `${API_BASE}${ev.banner_image}`
                }
                alt={ev.title}
                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
              />
            ) : (
              <span className="text-2xl">
                {ev.event_type === 'tour' ? '🏖️' : ev.event_type === 'feast' ? '🍗' : '🎉'}
              </span>
            )}
            <div>
              <div className="text-sm font-bold truncate max-w-[180px]">{ev.title}</div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{ev.event_date}</span>
                <span className="capitalize">{ev.event_type}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
};

export default TeamEventsTopBar;

