import React from 'react';
import {
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiAlertTriangle,
  FiLock,
  FiUnlock,
  FiArrowRight
} from 'react-icons/fi';

export function MangoFilterToolbar({
  searchQuery,
  setSearchQuery,
  shiftFilter,
  setShiftFilter,
  staffList = [],
  stats = {}
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
      {/* Search */}
      <div className="relative w-full sm:w-64">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search staff..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Shift Filter Dropdown */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto">
        <FiFilter className="text-slate-400 shrink-0 hidden sm:block" size={14} />
        <select
          value={shiftFilter}
          onChange={(e) => setShiftFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
        >
          <option value="all">All Staff ({staffList.length})</option>
          <option value="debt">⚠️ Overtime Debt / ঘাটতি ঋণ ({stats.staff_in_debt_count || 0})</option>
          <option value="6h">🔥 6-Hour Shift Staff ({staffList.filter((s) => s.shift_hours === 6).length})</option>
          <option value="8h">8-Hour Shift Staff ({staffList.filter((s) => s.shift_hours === 8).length})</option>
          <option value="held">🔒 Has Vault Holds ({stats.staff_with_vault_holds_count || 0})</option>
        </select>
      </div>
    </div>
  );
}

export default function MangoStaffTable({
  loading,
  filteredStaff = [],
  openHoldModal,
  openReleaseModal,
  openTransferModal,
  apiBase = ''
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
            <th className="py-3 px-4">Staff Member</th>
            <th className="py-3 px-4">Shift Schedule</th>
            <th className="py-3 px-4 text-center">Total Overtime</th>
            <th className="py-3 px-4 text-center">In Admin Vault</th>
            <th className="py-3 px-4 text-center">Visible on Tree</th>
            <th className="py-3 px-4 text-right">Actions & Controls</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {loading ? (
            <tr>
              <td colSpan="6" className="py-12 text-center text-slate-400">
                <FiRefreshCw className="animate-spin inline-block mr-2" size={18} />
                Loading Mango Vault data...
              </td>
            </tr>
          ) : filteredStaff.length === 0 ? (
            <tr>
              <td colSpan="6" className="py-12 text-center text-slate-400">
                No staff members match the selected criteria.
              </td>
            </tr>
          ) : (
            filteredStaff.map((staff) => (
              <tr
                key={staff.user_id}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
              >
                {/* Column 1: Staff Member */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-2xs">
                      {staff.avatar ? (
                        <img
                          src={`${apiBase}${staff.avatar}`}
                          alt={staff.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        staff.name?.charAt(0)?.toUpperCase() || 'S'
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {staff.name}
                        {staff.is_special_shift && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                            title="6-Hour Duty Schedule"
                          >
                            6h Shift
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {staff.designation} • {staff.department}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Column 2: Shift Schedule */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    {staff.shift_hours} Hours Target
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {staff.shift_start?.slice(0, 5)} - {staff.shift_end?.slice(0, 5)}
                  </div>
                </td>

                {/* Column 3: Total Earned / Overtime Debt */}
                <td className="py-3.5 px-4 text-center">
                  {staff.has_debt ? (
                    <div>
                      <div
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-black border border-rose-300 dark:border-rose-800 text-[11px] shadow-2xs"
                        title={`ঘাটতি ঋণ: - ${staff.debt_formatted || `${staff.debt_hours}h`}. ভবিষ্যৎ কর্মদিবসে ওভারটাইম করে এই ঋণ পূরণ করতে হবে।`}
                      >
                        <FiAlertTriangle size={11} className="text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>-{staff.debt_formatted || `${staff.debt_hours}h`} ঘাটতি</span>
                      </div>
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                        ওভারটাইম দিয়ে পূরণ হবে
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                        <span>🥭 {staff.total_earned_mangoes}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {staff.total_earned_hours}h Overtime
                      </div>
                    </div>
                  )}
                </td>

                {/* Column 4: In Admin Vault (Held) */}
                <td className="py-3.5 px-4 text-center">
                  {staff.vault_held_mangoes > 0 ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/80 shadow-2xs">
                      <FiLock size={11} />
                      <span>{staff.vault_held_mangoes} Locked</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-medium">—</span>
                  )}
                  {staff.vault_held_mangoes > 0 && (
                    <div className="text-[10px] text-indigo-500/80 dark:text-indigo-400/80 mt-0.5">
                      {staff.vault_held_hours}h in reserve
                    </div>
                  )}
                </td>

                {/* Column 5: Visible on Tree */}
                <td className="py-3.5 px-4 text-center">
                  {staff.has_debt ? (
                    <div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 font-bold text-[10px]">
                        <span>⛔ 0 on Tree</span>
                      </div>
                      <div className="text-[10px] text-rose-400 font-medium mt-0.5">
                        ঘাটতি ঋণ সক্রিয়
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold shadow-2xs ${
                          staff.visible_mangoes > 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span>🌳 {staff.visible_mangoes} on Tree</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {staff.visible_hours}h claimable
                      </div>
                    </div>
                  )}
                </td>

                {/* Column 6: Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Hold in Vault Button */}
                    <button
                      onClick={() => openHoldModal(staff)}
                      disabled={staff.visible_mangoes <= 0 || staff.has_debt}
                      title={
                        staff.has_debt
                          ? 'Staff is in overtime debt. No active mangoes to hold.'
                          : "Reserve mangoes from staff's tree into Admin Vault"
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                    >
                      <FiLock size={12} />
                      <span>Hold</span>
                    </button>

                    {/* Release Back Button */}
                    <button
                      onClick={() => openReleaseModal(staff)}
                      disabled={staff.vault_held_mangoes <= 0}
                      title="Release reserved mangoes back to staff tree"
                      className="px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                    >
                      <FiUnlock size={12} />
                      <span>Release</span>
                    </button>

                    {/* Transfer Button */}
                    <button
                      onClick={() => openTransferModal(staff)}
                      disabled={staff.total_earned_mangoes <= 0 || staff.has_debt}
                      title={staff.has_debt ? 'Staff is in overtime debt. Cannot transfer out.' : 'Transfer mango to another colleague'}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                    >
                      <FiArrowRight size={12} />
                      <span>Transfer</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
