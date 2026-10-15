import { FiRefreshCw, FiRadio, FiTerminal } from "react-icons/fi";

const DeveloperHeader = ({ fetchStatus, loading, handleTestPing, pingLoading }) => {
    return (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-cyan-950/40 dark:to-slate-950 p-6 md:p-8 rounded-3xl border border-cyan-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 text-xs font-black uppercase tracking-wider mb-2.5">
                    <FiTerminal className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>CCA Developer Suite &bull; Staff Hybrid Access</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5">
                    <span>Developer Console</span>
                    <span className="text-xl">⚡</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
                    Live system telemetry, server environment diagnostics, realtime WebSocket monitors, cron job automation, and developer controls.
                </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
                <button
                    type="button"
                    onClick={fetchStatus}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                    <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh Diagnostics</span>
                </button>

                <button
                    type="button"
                    onClick={handleTestPing}
                    disabled={pingLoading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-cyan-500/25 transition cursor-pointer disabled:opacity-50"
                >
                    <FiRadio className={`w-4 h-4 ${pingLoading ? 'animate-spin' : ''}`} />
                    <span>Broadcast Ping</span>
                </button>
            </div>
        </div>
    )
}

export default DeveloperHeader;