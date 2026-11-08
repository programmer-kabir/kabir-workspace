import { FiCheckCircle, FiClock, FiDownload, FiXCircle, FiRefreshCw } from "react-icons/fi";

const TaskReportTab = ({ taskReport }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Assigned</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{taskReport.summary.total_assigned}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-emerald-100 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Completed</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{taskReport.summary.total_completed}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-orange-100 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Delayed Completion</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{taskReport.summary.delayed_completions}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-rose-100 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Total Rejected</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{taskReport.summary.total_rejected}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-blue-100 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Resubmitted</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{taskReport.summary.total_resubmitted}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Task History Details</h3>
                    <button className="text-sm font-semibold text-primary-600 flex items-center gap-2 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors">
                        <FiDownload /> Export
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-white dark:bg-slate-800 text-xs uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4">Task Title</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Assigned On</th>
                                <th className="px-6 py-4 text-right">Current Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {taskReport.tasks.map((task, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-700 dark:text-slate-300 max-w-[300px] truncate">{task.title}</div>
                                        {task.was_resubmitted && (
                                            <div className="mt-1">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                                    <FiRefreshCw className="mr-1" /> Resubmitted {task.resubmit_count > 1 ? `x${task.resubmit_count}` : ''}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded">{task.category}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(task.assign_date || task.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        {task.status === 'Completed' ? (
                                            <span className={`flex items-center justify-end gap-1.5 font-bold ${task.was_delayed ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                <FiCheckCircle /> {task.was_delayed ? 'Completed (Delayed)' : 'Completed'}
                                            </span>
                                        ) : task.status === 'Rejected' ? (
                                            <span className="flex items-center justify-end gap-1.5 font-bold text-rose-600">
                                                <FiXCircle /> Needs Revision
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-end gap-1.5 font-bold text-blue-600">
                                                <FiClock /> {task.status}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {taskReport.tasks.length === 0 && (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400">No tasks assigned in this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default TaskReportTab;