import React from 'react';

const EventParticipantsList = ({ participants, API_BASE }) => {
  const goingParticipants = participants.filter((p) => p.rsvp_status === 'going');
  const totalHeads = participants.reduce(
    (sum, p) => (p.rsvp_status === 'going' ? sum + 1 + (Number(p.guest_count) || 0) : sum),
    0
  );

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>👥 Who's Joining & Guests</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {goingParticipants.length} Going ({totalHeads} Total Heads)
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            List of academy team members and guests confirmed for this feast/tour.
          </p>
        </div>
      </div>

      {/* Participants Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {goingParticipants.length === 0 ? (
          <div className="col-span-full p-6 text-center text-slate-400 text-xs">
            No one has confirmed attendance yet. Be the first to click "I am Going!"
          </div>
        ) : (
          goingParticipants.map((p) => (
            <div
              key={p.user_id}
              className="p-3 rounded-2xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {p.profile_picture ? (
                    <img
                      src={
                        p.profile_picture.startsWith('http')
                          ? p.profile_picture
                          : `${API_BASE}${p.profile_picture}`
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    p.name?.charAt(0) || 'U'
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    Going {p.guest_count > 0 ? `(+${p.guest_count} guest)` : ''}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                {parseFloat(p.total_paid || 0) > 0 ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    ৳{parseFloat(p.total_paid)}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">৳0</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventParticipantsList;

