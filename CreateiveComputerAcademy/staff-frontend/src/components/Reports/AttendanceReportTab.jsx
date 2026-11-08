import { FiAlertCircle, FiCalendar, FiCheckCircle, FiClock, FiDownload, FiTrendingUp, FiUserCheck, FiXCircle } from "react-icons/fi";

const AttendanceReportTab = ({ attReport }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Working Days */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 group-hover:h-1.5 transition-all"></div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-blue-500 transition-colors">Working Days</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-slate-100 group-hover:translate-x-1 transition-transform">{attReport.summary.total_days}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                        <FiCalendar size={20} />
                    </div>
                </div>

                {/* Card 2: Present */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 group-hover:h-1.5 transition-all"></div>
                    <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Present</p>
                        <p className="text-3xl font-black text-emerald-700 group-hover:translate-x-1 transition-transform">{attReport.summary.present}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                        <FiCheckCircle size={20} />
                    </div>
                </div>

                {/* Card 3: Absent */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-rose-200 dark:hover:border-rose-800 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 group-hover:h-1.5 transition-all"></div>
                    <div>
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Absent</p>
                        <p className="text-3xl font-black text-rose-700 group-hover:translate-x-1 transition-transform">{attReport.summary.absent}</p>
                    </div>
                    <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                        <FiXCircle size={20} />
                    </div>
                </div>

                {/* Card 4: Late */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-amber-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-800 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 group-hover:h-1.5 transition-all"></div>
                    <div>
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Late</p>
                        <p className="text-3xl font-black text-amber-700 group-hover:translate-x-1 transition-transform">{attReport.summary.late}</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:-rotate-12 transition-transform">
                        <FiClock size={20} />
                    </div>
                </div>

                {/* Card 5: Expected Hours */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-violet-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-full h-1 bg-violet-500 group-hover:h-1.5 transition-all"></div>
                    <div>
                        <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1">Expected Duty</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1 group-hover:translate-x-1 transition-transform">{attReport.summary.total_expected}</p>
                    </div>
                    <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:-rotate-12 transition-transform">
                        <FiClock size={20} />
                    </div>
                </div>

                {/* Card 6: Worked Hours */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 group-hover:h-1.5 transition-all"></div>
                    <div>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Hours Worked</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1 group-hover:translate-x-1 transition-transform">{attReport.summary.total_worked}</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:-rotate-12 transition-transform">
                        <FiUserCheck size={20} />
                    </div>
                </div>

                {/* Card 7: Overtime */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-teal-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-800 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-full h-1 bg-teal-500 group-hover:h-1.5 transition-all"></div>
                    <div>
                        <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">Overtime</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1 group-hover:translate-x-1 transition-transform">{attReport.summary.total_overtime}</p>
                    </div>
                    <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                        <FiTrendingUp size={20} />
                    </div>
                </div>

                {/* Card 8: Short Time */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg hover:border-rose-200 dark:hover:border-rose-800 transition-all duration-300">
                    <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 group-hover:h-1.5 transition-all"></div>
                    <div>
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Short Time</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1 group-hover:translate-x-1 transition-transform">{attReport.summary.total_short_time}</p>
                    </div>
                    <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                        <FiAlertCircle size={20} />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Daily Attendance Breakdown</h3>
                    <button className="text-sm font-semibold text-primary-600 flex items-center gap-2 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors">
                        <FiDownload /> Export
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-white dark:bg-slate-800 text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Check In</th>
                                <th className="px-6 py-4">Check Out</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Duty Hours</th>
                                <th className="px-6 py-4 text-center">Work Hours</th>
                                <th className="px-6 py-4 text-center">Break Time</th>
                                <th className="px-6 py-4 text-right">OT / Short</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {attReport.history.map((record, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{record.date}</td>
                                    <td className="px-6 py-4">{record.check_in || '-'}</td>
                                    <td className="px-6 py-4">{record.check_out || '-'}</td>
                                    <td className="px-6 py-4 flex gap-2">
                                        {(record.is_weekend && record.status !== 'Weekend') && (
                                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                Weekend
                                            </span>
                                        )}
                                        {(record.is_holiday && record.status !== 'Holiday') && (
                                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                                                Holiday
                                            </span>
                                        )}
                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                                            record.status === 'Late' ? 'bg-amber-100 text-amber-700' :
                                                record.status === 'Weekend' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' :
                                                    record.status === 'Holiday' ? 'bg-purple-100 text-purple-700' :
                                                        record.status === 'Leave' ? 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400' :
                                                            'bg-rose-100 text-rose-700'
                                            }`}>
                                            {record.leave_title ? `Leave (${record.leave_title})` : record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium text-slate-400">{record.expected_hours || '-'}</td>
                                    <td className="px-6 py-4 text-center font-medium">{record.total_hours || '-'}</td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">{record.total_break_minutes > 0 ? `${record.total_break_minutes}m` : '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        {record.overtime ? (
                                            <span className={`font-bold ${record.is_short ? 'text-orange-500' : 'text-emerald-500'}`}>
                                                {record.overtime}
                                            </span>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                            {attReport.history.length === 0 && (
                                <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-400">No records found for this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
export default AttendanceReportTab;