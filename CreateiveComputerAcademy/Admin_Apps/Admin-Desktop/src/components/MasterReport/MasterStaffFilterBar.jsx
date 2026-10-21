import React from 'react';
import { FiSearch } from 'react-icons/fi';

const MasterStaffFilterBar = ({
  searchTerm = '',
  setSearchTerm,
  departmentOptions = ['all'],
  selectedDept = 'all',
  setSelectedDept,
  sortBy = 'overall',
  setSortBy
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Search Staff */}
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search staff name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
          />
        </div>

        {/* Department Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-1">
          {departmentOptions.map(dept => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDept && setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedDept === dept
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {dept === 'all' ? 'All Departments' : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Sort By Dropdown */}
      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
        <span className="text-xs font-bold text-slate-400">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy && setSortBy(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
        >
          <option value="overall">🌟 Overall Performance</option>
          <option value="tasks_completed">🎯 Tasks Completed</option>
          <option value="quality_stars">⭐ Quality Stars (Highest)</option>
          <option value="attendance_rate">📅 Attendance Rate %</option>
          <option value="task_worked">⏱️ Task Work Duration</option>
          <option value="total_worked">💼 Office Hours Worked</option>
          <option value="quality">✨ Fewest Rejections</option>
          <option value="name">🔤 Staff Name (A-Z)</option>
        </select>
      </div>
    </div>
  );
};

export default MasterStaffFilterBar;
