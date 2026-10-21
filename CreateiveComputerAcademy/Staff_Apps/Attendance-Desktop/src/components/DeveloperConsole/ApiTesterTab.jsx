import { FiSend, FiRadio, FiZap, FiRefreshCw, FiSearch, FiTerminal, FiCopy, FiCode } from 'react-icons/fi';
import { toast } from 'sonner';

export default function ApiTesterTab({ state }) {
    const {
        testerSubTab, setTesterSubTab,
        apiDirectory, wsLiveReceived, pusherStatus,
        apiSearchQuery, setApiSearchQuery,
        apiCategoryFilter, setApiCategoryFilter, apiCategories, apiDirectoryLoading,
        handleSelectApi, selectedApi, reqMethod, setReqMethod, reqPath, setReqPath, rawJsonBody, setRawJsonBody, autoAttachToken, setAutoAttachToken, apiExecuting, apiResponse,
        fetchApiDirectory, handleExecuteRequest
    } = state;


    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Phase 3 Sub-Navigation Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setTesterSubTab('rest')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${testerSubTab === 'rest'
                            ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-black border border-cyan-500/30'
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        <FiSend className="w-3.5 h-3.5" />
                        <span>REST API Explorer & Sandbox ({apiDirectory.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setTesterSubTab('websocket')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${testerSubTab === 'websocket'
                            ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-black border border-cyan-500/30'
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        <FiRadio className="w-3.5 h-3.5" />
                        <span>WebSocket & Pusher Studio ({wsLiveReceived.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setTesterSubTab('probes')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${testerSubTab === 'probes'
                            ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-black border border-cyan-500/30'
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        <FiZap className="w-3.5 h-3.5" />
                        <span>Quick Latency Probes</span>
                    </button>
                </div>

                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span>{pusherStatus}</span>
                </div>
            </div>

            {/* ── Sub-View 1: REST API Explorer & Runner (Mini-Postman) ── */}
            {testerSubTab === 'rest' && (
                <div className="space-y-4">
                    {/* Category Filter Pills & Search */}
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                {/* Module Dropdown */}
                                <select
                                    value={apiCategoryFilter}
                                    onChange={(e) => setApiCategoryFilter(e.target.value)}
                                    className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30 cursor-pointer shadow-xs"
                                >
                                    <option value="all">📁 All Modules ({apiDirectory.length} Endpoints)</option>
                                    {(apiCategories.length > 0 ? apiCategories : Array.from(new Set(apiDirectory.map(d => d.category))).filter(Boolean).sort()).map(cat => {
                                        const count = apiDirectory.filter(d => d.category === cat).length;
                                        return (
                                            <option key={cat} value={cat}>
                                                {cat} ({count})
                                            </option>
                                        );
                                    })}
                                </select>

                                {/* Re-scan Codebase Button */}
                                <button
                                    type="button"
                                    disabled={apiDirectoryLoading}
                                    onClick={() => fetchApiDirectory(false)}
                                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
                                    title="Re-scan server/api/ directory for newly created endpoints"
                                >
                                    <FiRefreshCw className={`w-3.5 h-3.5 text-cyan-500 ${apiDirectoryLoading ? 'animate-spin' : ''}`} />
                                    <span>{apiDirectoryLoading ? 'Scanning...' : 'Re-scan APIs'}</span>
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className="relative shrink-0 w-full sm:w-72">
                                <FiSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={apiSearchQuery}
                                    onChange={(e) => setApiSearchQuery(e.target.value)}
                                    placeholder="Search endpoints or paths..."
                                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30"
                                />
                            </div>
                        </div>

                        {/* Quick Frequent Category Chips */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                            {[
                                'all',
                                'Attendance & Clock-in',
                                'Authentication & Sessions',
                                'Chat & Messages',
                                'Community Feed',
                                'Tasks & Workflow',
                                'Payroll & Wallet',
                                'Admin Staff Roster',
                                'Admin Students',
                                'Crons & Automation',
                                'System & Diagnostics'
                            ].map(cat => {
                                const count = cat === 'all' ? apiDirectory.length : apiDirectory.filter(d => d.category === cat).length;
                                const isPillActive = apiCategoryFilter === cat;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setApiCategoryFilter(cat)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${isPillActive
                                            ? 'bg-cyan-600 text-white font-black shadow-xs dark:bg-cyan-500 dark:text-slate-950'
                                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 dark:hover:text-white'
                                            }`}
                                    >
                                        <span>{cat === 'all' ? 'All Endpoints' : cat}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isPillActive
                                            ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black font-mono font-bold'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono'
                                            }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2-Column Split: Catalog vs Runner */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Left Column: Endpoints Catalog (5 cols) */}
                        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-2 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                                <span className="flex items-center gap-2">
                                    <FiCode className="w-3.5 h-3.5 text-cyan-500" />
                                    <span>API CATALOG</span>
                                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 text-[10px] font-mono font-bold">
                                        {
                                            apiDirectory.filter(item => {
                                                const matchCat = apiCategoryFilter === 'all' || item.category === apiCategoryFilter;
                                                const matchQuery = !apiSearchQuery ||
                                                    item.name.toLowerCase().includes(apiSearchQuery.toLowerCase()) ||
                                                    item.path.toLowerCase().includes(apiSearchQuery.toLowerCase());
                                                return matchCat && matchQuery;
                                            }).length
                                        } / {apiDirectory.length}
                                    </span>
                                </span>
                                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                                    {apiCategoryFilter === 'all' ? 'All Modules' : apiCategoryFilter}
                                </span>
                            </div>

                            <div className="max-h-[620px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {apiDirectory
                                    .filter(item => {
                                        const matchCat = apiCategoryFilter === 'all' || item.category === apiCategoryFilter;
                                        const matchQuery = !apiSearchQuery ||
                                            item.name.toLowerCase().includes(apiSearchQuery.toLowerCase()) ||
                                            item.path.toLowerCase().includes(apiSearchQuery.toLowerCase());
                                        return matchCat && matchQuery;
                                    })
                                    .map(item => {
                                        const isSelected = selectedApi?.id === item.id || reqPath === item.path;
                                        const paramCount = item.params ? Object.keys(item.params).length : 0;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => handleSelectApi(item)}
                                                className={`p-3 rounded-2xl border transition cursor-pointer space-y-1.5 ${isSelected
                                                    ? 'bg-cyan-50/80 dark:bg-cyan-500/10 border-cyan-400 dark:border-cyan-500/50 shadow-xs ring-1 ring-cyan-400/50 dark:ring-cyan-500/30'
                                                    : 'bg-white hover:bg-slate-50 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-bold text-xs text-slate-800 dark:text-white truncate">
                                                        {item.name}
                                                    </span>
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono shrink-0 ${item.method === 'GET'
                                                            ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30'
                                                            : item.method === 'POST'
                                                                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                                                : item.method === 'PUT'
                                                                    ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                                                                    : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                                                            }`}
                                                    >
                                                        {item.method}
                                                    </span>
                                                </div>

                                                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                                                    /{item.path}
                                                </div>

                                                <div className="flex items-center justify-between gap-2 pt-0.5">
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 truncate">
                                                        {item.category}
                                                    </span>
                                                    {paramCount > 0 && (
                                                        <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-mono font-bold shrink-0">
                                                            {paramCount} params
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Right Column: Interactive Sandbox Runner (7 cols) */}
                        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
                            {/* Request Header Bar */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <FiSend className="w-4 h-4 text-cyan-500" />
                                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            Request Configurator
                                        </h3>
                                    </div>

                                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-bold cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={autoAttachToken}
                                            onChange={(e) => setAutoAttachToken(e.target.checked)}
                                            className="rounded text-cyan-600 focus:ring-cyan-500"
                                        />
                                        <span>Auto-attach Bearer Token</span>
                                    </label>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Method Selector */}
                                    <select
                                        value={reqMethod}
                                        onChange={(e) => setReqMethod(e.target.value)}
                                        className={`px-3 py-2.5 rounded-2xl text-xs font-black cursor-pointer border focus:outline-hidden shadow-2xs transition ${reqMethod === 'GET'
                                            ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30'
                                            : reqMethod === 'POST'
                                                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                                                : reqMethod === 'PUT'
                                                    ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                                                    : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
                                            }`}
                                    >
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                        <option value="PUT">PUT</option>
                                        <option value="DELETE">DELETE</option>
                                    </select>

                                    {/* Path Input */}
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={reqPath}
                                            onChange={(e) => setReqPath(e.target.value)}
                                            placeholder="api/..."
                                            className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30 focus:bg-white dark:focus:bg-slate-800 shadow-inner"
                                        />
                                    </div>

                                    {/* Execute Button */}
                                    <button
                                        type="button"
                                        disabled={apiExecuting}
                                        onClick={handleExecuteRequest}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-2xl text-xs font-black transition shadow-md shadow-cyan-500/20 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                                    >
                                        {apiExecuting ? (
                                            <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <FiZap className="w-3.5 h-3.5" />
                                        )}
                                        <span>{apiExecuting ? 'Executing...' : 'Send'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Request JSON Body Editor */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                                        Request Body (JSON):
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            try {
                                                const obj = JSON.parse(rawJsonBody);
                                                setRawJsonBody(JSON.stringify(obj, null, 2));
                                                toast.success('JSON formatted');
                                            } catch (e) {
                                                toast.error('Invalid JSON: ' + e.message);
                                            }
                                        }}
                                        className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <FiCode className="w-3 h-3" />
                                        <span>Prettify JSON</span>
                                    </button>
                                </div>

                                <textarea
                                    rows={5}
                                    value={rawJsonBody}
                                    onChange={(e) => setRawJsonBody(e.target.value)}
                                    placeholder='{\n  "param": "value"\n}'
                                    className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-cyan-300 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:bg-white dark:focus:bg-slate-950 focus:border-cyan-500 dark:focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-500/40 resize-y leading-relaxed shadow-inner"
                                />
                            </div>

                            {/* Live Response Inspector */}
                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            Response Inspector
                                        </span>
                                        {apiResponse && (
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${apiResponse.status >= 200 && apiResponse.status < 300
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                                    : 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                                                    }`}
                                            >
                                                {apiResponse.status} {apiResponse.statusText}
                                            </span>
                                        )}
                                    </div>

                                    {apiResponse && (
                                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-bold">
                                                ⚡ {apiResponse.duration} ms
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                📦 {apiResponse.size}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(JSON.stringify(apiResponse.data, null, 2));
                                                    toast.success('Response JSON copied to clipboard');
                                                }}
                                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                                                title="Copy JSON"
                                            >
                                                <FiCopy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {!apiResponse && !apiExecuting && (
                                    <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-sans space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-transparent">
                                        <FiTerminal className="w-8 h-8 mx-auto text-slate-400" />
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No Request Dispatched</p>
                                        <p className="text-[11px] text-slate-400">
                                            Select an endpoint on the left or type a URL, then click <strong>Send</strong>.
                                        </p>
                                    </div>
                                )}

                                {apiExecuting && (
                                    <div className="py-12 text-center text-cyan-600 dark:text-cyan-400 font-sans space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 shadow-inner">
                                        <FiRefreshCw className="w-7 h-7 mx-auto animate-spin text-cyan-500" />
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Awaiting Server Response...</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Measuring roundtrip network latency</p>
                                    </div>
                                )}

                                {apiResponse && (
                                    <div className="relative">
                                        <pre className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono overflow-x-auto max-h-80 custom-scrollbar leading-relaxed shadow-inner ${apiResponse.status >= 200 && apiResponse.status < 300
                                            ? 'text-emerald-800 dark:text-emerald-400'
                                            : 'text-rose-700 dark:text-rose-400'
                                            }`}>
                                            {JSON.stringify(apiResponse.data, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Sub-View 2: WebSocket & Pusher Studio ── */}
            {testerSubTab === 'websocket' && (
                <div className="space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Left: Event Dispatcher (5 cols) */}
                        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <FiRadio className="w-5 h-5 text-cyan-500" />
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                        Pusher Event Dispatcher
                                    </h3>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                    Live Gateway Active
                                </span>
                            </div>

                            {/* Channel Preset / Input */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">
                                    Target Channel:
                                </label>
                                <input
                                    type="text"
                                    value={wsChannel}
                                    onChange={(e) => setWsChannel(e.target.value)}
                                    placeholder="e.g. community-channel"
                                    className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30"
                                />
                                <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400">
                                    <span>Presets:</span>
                                    <button
                                        type="button"
                                        onClick={() => setWsChannel('community-channel')}
                                        className="hover:text-cyan-400 underline cursor-pointer"
                                    >
                                        community-channel
                                    </button>
                                    &bull;
                                    <button
                                        type="button"
                                        onClick={() => setWsChannel(`user-${currentUser?.id || 1}`)}
                                        className="hover:text-cyan-400 underline cursor-pointer"
                                    >
                                        user-{currentUser?.id || 1}
                                    </button>
                                </div>
                            </div>

                            {/* Event Name Preset / Input */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">
                                    Event Name:
                                </label>
                                <input
                                    type="text"
                                    value={wsEvent}
                                    onChange={(e) => setWsEvent(e.target.value)}
                                    placeholder="e.g. dev-ping"
                                    className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/30"
                                />
                                <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-400">
                                    <span>Presets:</span>
                                    <button
                                        type="button"
                                        onClick={() => setWsEvent('dev-ping')}
                                        className="hover:text-cyan-400 underline cursor-pointer"
                                    >
                                        dev-ping
                                    </button>
                                    &bull;
                                    <button
                                        type="button"
                                        onClick={() => setWsEvent('dev-test-event')}
                                        className="hover:text-cyan-400 underline cursor-pointer"
                                    >
                                        dev-test-event
                                    </button>
                                    &bull;
                                    <button
                                        type="button"
                                        onClick={() => setWsEvent('system-maintenance-update')}
                                        className="hover:text-cyan-400 underline cursor-pointer"
                                    >
                                        maintenance
                                    </button>
                                </div>
                            </div>

                            {/* Payload Editor */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">
                                    Event Payload (JSON):
                                </label>
                                <textarea
                                    rows={4}
                                    value={wsPayload}
                                    onChange={(e) => setWsPayload(e.target.value)}
                                    placeholder='{\n  "message": "test"\n}'
                                    className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-cyan-300 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:bg-white dark:focus:bg-slate-950 focus:border-cyan-500 dark:focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-500/40 resize-y shadow-inner"
                                />
                            </div>

                            {/* Transmit Button */}
                            <button
                                type="button"
                                disabled={wsDispatching}
                                onClick={handleDispatchWebSocket}
                                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-2xl text-xs font-black transition shadow-lg shadow-cyan-500/20 cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {wsDispatching ? (
                                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <FiSend className="w-4 h-4" />
                                )}
                                <span>{wsDispatching ? 'Broadcasting...' : 'Broadcast Event to Pusher'}</span>
                            </button>
                        </div>

                        {/* Right: Live Echo & Reflection Stream (7 cols) */}
                        <div className="lg:col-span-7 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 font-mono">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                                    <FiActivity className="w-4 h-4 text-emerald-500" />
                                    <span>Live WebSocket Reflection Monitor</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-slate-400">
                                        {wsLiveReceived.length} events caught
                                    </span>
                                    {wsLiveReceived.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setWsLiveReceived([])}
                                            className="text-[10px] text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 cursor-pointer font-bold"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="max-h-[500px] overflow-y-auto space-y-2.5 text-xs pr-1 custom-scrollbar">
                                {wsLiveReceived.length === 0 ? (
                                    <div className="py-20 text-center text-slate-400 dark:text-slate-500 font-sans space-y-2">
                                        <FiRadio className="w-8 h-8 text-cyan-500 mx-auto animate-pulse" />
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Awaiting Realtime Events</p>
                                        <p className="text-xs text-slate-400">
                                            Dispatched events or external broadcasts will reflect here live.
                                        </p>
                                    </div>
                                ) : (
                                    wsLiveReceived.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 space-y-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition animate-fadeIn"
                                        >
                                            <div className="flex items-center justify-between text-[11px]">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-bold uppercase text-[9px]">
                                                        {item.event}
                                                    </span>
                                                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                                                        #{item.channel}
                                                    </span>
                                                </div>
                                                <span className="text-slate-400 text-[10px]">
                                                    {item.time}
                                                </span>
                                            </div>

                                            <pre className="p-2.5 rounded-xl bg-white dark:bg-slate-950 text-[11px] text-slate-800 dark:text-emerald-300 overflow-x-auto leading-relaxed border border-slate-200 dark:border-slate-900 shadow-inner">
                                                {JSON.stringify(item.data, null, 2)}
                                            </pre>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Sub-View 3: Quick Latency Probes ── */}
            {testerSubTab === 'probes' && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                    <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <FiZap className="w-5 h-5 text-amber-500" />
                        <span>Quick Backend Latency Probes</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                        Measure roundtrip latency and HTTP 200 health on primary system endpoints with a single click.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                        {[
                            { name: 'Server Time API', endpoint: 'api/server_time.php' },
                            { name: 'Active Staff API', endpoint: 'api/chat/get_chat_users.php' },
                            { name: 'Community Feed API', endpoint: 'api/community/get_feed.php' }
                        ].map(api => {
                            const res = apiProbeResults[api.endpoint];
                            return (
                                <div key={api.endpoint} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs text-slate-900 dark:text-white">{api.name}</span>
                                        {res?.status === 'success' && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                                                {res.duration}ms &bull; {res.code}
                                            </span>
                                        )}
                                        {res?.status === 'error' && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30">
                                                Error {res.code}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-400 truncate">{api.endpoint}</div>
                                    <button
                                        type="button"
                                        disabled={res?.status === 'loading'}
                                        onClick={() => handleProbeApi(api.endpoint, api.name)}
                                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <FiZap className="w-3.5 h-3.5 text-amber-500" />
                                        <span>{res?.status === 'loading' ? 'Probing...' : 'Ping Endpoint'}</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
