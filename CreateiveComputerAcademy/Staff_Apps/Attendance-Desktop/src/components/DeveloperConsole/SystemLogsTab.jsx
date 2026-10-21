import React from 'react';
import { FiServer, FiRadio, FiRefreshCw, FiTrash2, FiCheckCircle, FiCopy } from 'react-icons/fi';
import { toast } from 'sonner';

const SystemLogsTab = ({
    setLogSubTab,
    logSubTab,
    serverErrorLog,
    serverLogLoading,
    setLiveTail,
    liveTail,
    fetchServerErrorLog,
    setIsClearModalOpen,
    filteredLogs,
    setLogFilter,
    logFilter,
    setLogs,
}) => {
    return (
        <div className="space-y-4">
            {/* Sub-tabs: Server PHP error_log vs WebSocket Stream */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setLogSubTab('server')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${logSubTab === 'server'
                            ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-black border border-cyan-500/30'
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        <FiServer className="w-3.5 h-3.5" />
                        <span>Server PHP Error Logs ({serverErrorLog?.line_count || 0})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setLogSubTab('websocket')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${logSubTab === 'websocket'
                            ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-black border border-cyan-500/30'
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        <FiRadio className="w-3.5 h-3.5" />
                        <span>WebSocket Event Stream ({filteredLogs.length})</span>
                    </button>
                </div>

                {logSubTab === 'server' && (
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">
                            {serverErrorLog?.log_file} ({serverErrorLog?.file_size_formatted || '0 KB'})
                        </span>
                        <button
                            type="button"
                            onClick={() => setLiveTail(prev => !prev)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${liveTail
                                ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 font-black animate-pulse'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${liveTail ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span>Live Tail</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => fetchServerErrorLog(false)}
                            disabled={serverLogLoading}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                            title="Refresh Server Logs"
                        >
                            <FiRefreshCw className={`w-3.5 h-3.5 ${serverLogLoading ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsClearModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                            title="Truncate error_log"
                        >
                            <FiTrash2 className="w-3.5 h-3.5" />
                            <span>Clear Log</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Sub-view 1: Server PHP error_log */}
            {logSubTab === 'server' && (
                <div className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm dark:shadow-2xl space-y-4 font-mono">
                    <div className="max-h-[500px] overflow-y-auto space-y-2 text-xs pr-2 custom-scrollbar">
                        {!serverErrorLog || serverErrorLog.lines?.length === 0 ? (
                            <div className="py-16 text-center text-slate-500 font-sans space-y-2">
                                <FiCheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-300">Clean Server State</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">No PHP errors or warnings detected in server error_log.</p>
                            </div>
                        ) : (
                            serverErrorLog.lines.map((l) => (
                                <div
                                    key={l.id}
                                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/60 space-y-1.5 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 transition"
                                >
                                    <div className="flex items-center justify-between text-[10px]">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-2 py-0.5 rounded font-black uppercase text-[9px] ${l.type === 'fatal'
                                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                                                    : l.type === 'warning'
                                                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                                                        : l.type === 'notice'
                                                            ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/40'
                                                            : l.type === 'trace'
                                                                ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/40'
                                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                    }`}
                                            >
                                                {l.type}
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400">{l.time}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(l.raw);
                                                toast.success('Log line copied');
                                            }}
                                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                                            title="Copy line"
                                        >
                                            <FiCopy className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono break-all whitespace-pre-wrap">
                                        {l.message}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Sub-view 2: WebSocket Event Stream */}
            {logSubTab === 'websocket' && (
                <div className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm dark:shadow-2xl space-y-4 font-mono">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-300 ml-2">Realtime Stream Logs ({filteredLogs.length})</span>
                        </div>

                        <div className="flex items-center gap-2">
                            {['all', 'info', 'success', 'warning', 'error'].map(f => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setLogFilter(f)}
                                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg transition cursor-pointer ${logFilter === f
                                        ? 'bg-cyan-500 text-white dark:text-slate-950 font-black'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setLogs([])}
                                className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition ml-2 cursor-pointer"
                                title="Clear Logs"
                            >
                                <FiTrash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2 text-xs pr-2 custom-scrollbar">
                        {filteredLogs.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 dark:text-slate-600 font-sans text-xs">No log entries matching filter.</div>
                        ) : (
                            filteredLogs.map(l => (
                                <div key={l.id} className="flex items-start gap-2.5 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200 dark:border-slate-800/40">
                                    <span className="text-slate-400 dark:text-slate-500 text-[10px] shrink-0 pt-0.5">[{l.time}]</span>
                                    <span className={
                                        l.type === 'error'
                                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                                            : l.type === 'warning'
                                                ? 'text-amber-600 dark:text-amber-400 font-medium'
                                                : l.type === 'success'
                                                    ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                                    : 'text-slate-700 dark:text-slate-300'
                                    }>
                                        {l.msg}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default SystemLogsTab;