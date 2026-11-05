import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import useUserRole from "../../../utils/Hooks/useUserRole";
import LuxuryToast from "../../../components/Modal/LuxuryToast";
import Loader from "../../../components/Loader/Loader";
import {
  Database,
  FileCode,
  Terminal,
  Download,
  Save,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Table,
  FileText,
  Lock,
  Folder,
  Play,
  Copy,
  Clock,
  Sparkles,
  Server
} from "lucide-react";

export default function DevStudio() {
  const { isAdminOrDev } = useUserRole();
  const [activeTab, setActiveTab] = useState("database"); // 'database' | 'files'
  const [luxuryToast, setLuxuryToast] = useState(null);

  // ==========================================
  // 1. DATABASE & SQL STUDIO STATES
  // ==========================================
  const [tables, setTables] = useState([]);
  const [databaseName, setDatabaseName] = useState("");
  const [isTablesLoading, setIsTablesLoading] = useState(false);
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM cash ORDER BY id DESC LIMIT 20;");
  const [queryResult, setQueryResult] = useState(null);
  const [isQueryExecuting, setIsQueryExecuting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ==========================================
  // 2. FILE MANAGER & CODE EDITOR STATES
  // ==========================================
  const [files, setFiles] = useState([]);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [fileSearch, setFileSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");

  // ==========================================
  // API: FETCH DATABASE TABLES
  // ==========================================
  const fetchTables = useCallback(async () => {
    setIsTablesLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/developer/sql_runner.php?action=get_tables`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setTables(data.tables || []);
        setDatabaseName(data.database || "supplylink");
      } else {
        toast.error(data.message || "Failed to load tables");
      }
    } catch (e) {
      toast.error("Could not connect to database inspector");
    } finally {
      setIsTablesLoading(false);
    }
  }, []);

  // ==========================================
  // API: EXECUTE SQL QUERY
  // ==========================================
  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      return toast.warning("অনুগ্রহ করে SQL কোয়েরি লিখুন");
    }
    setIsQueryExecuting(true);
    setQueryResult(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/developer/sql_runner.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "run_query", query: sqlQuery }),
        }
      );
      const data = await res.json();
      setQueryResult(data);
      if (data.success) {
        setLuxuryToast({
          title: "SQL কোয়েরি সফল! ⚡",
          message: data.is_select
            ? `মোট ${data.row_count} টি রেকর্ড পাওয়া গেছে (${data.duration_ms} ms)`
            : `${data.message} (${data.duration_ms} ms)`,
          tag: `${data.duration_ms} ms`,
          type: "success",
        });
      } else {
        setLuxuryToast({
          title: "SQL ত্রুটি (Error) ⚠️",
          message: data.error || data.message || "Query execution failed",
          type: "error",
        });
      }
    } catch (e) {
      toast.error("Query execution error: " + e.message);
    } finally {
      setIsQueryExecuting(false);
    }
  };

  // ==========================================
  // ACTION: DOWNLOAD FULL DATABASE DUMP (.sql)
  // ==========================================
  const downloadDatabaseBackup = async () => {
    setIsExporting(true);
    try {
      const downloadUrl = `${import.meta.env.VITE_LOCALHOST_KEY}/developer/db_export.php`;
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.setAttribute("download", `supplylink_backup_${new Date().toISOString().slice(0, 10)}.sql`);
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setLuxuryToast({
        title: "ডাটাবেজ ডাম্প শুরু হয়েছে! 💾",
        message: "সম্পূর্ণ MySQL ডাটাবেজের ফুল স্ট্রাকচার ও ডাটা ডাউনলোড হচ্ছে...",
        tag: "Full SQL Backup",
        type: "success",
      });
    } catch (e) {
      toast.error("Backup download failed: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  // ==========================================
  // API: LIST PHP FILES
  // ==========================================
  const fetchFiles = useCallback(async () => {
    setIsFilesLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/developer/file_manager.php?action=list_files`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || []);
      } else {
        toast.error(data.message || "Failed to load files");
      }
    } catch (e) {
      toast.error("File manager connection error");
    } finally {
      setIsFilesLoading(false);
    }
  }, []);

  // ==========================================
  // API: READ SINGLE FILE
  // ==========================================
  const openFile = async (fileObj) => {
    setSelectedFile(fileObj);
    setIsReadingFile(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/developer/file_manager.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "read_file", path: fileObj.path }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setFileContent(data.content ?? "");
      } else {
        toast.error(data.message || "Failed to read file");
      }
    } catch (e) {
      toast.error("Error reading file: " + e.message);
    } finally {
      setIsReadingFile(false);
    }
  };

  // ==========================================
  // API: SAVE EDITED FILE
  // ==========================================
  const saveFile = async () => {
    if (!selectedFile) return;
    setIsSavingFile(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/developer/file_manager.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "save_file",
            path: selectedFile.path,
            content: fileContent,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setLuxuryToast({
          title: "ফাইল সংরক্ষিত হয়েছে! 💾",
          message: `${selectedFile.name} সফলভাবে সেভ হয়েছে। পূর্বের ভার্সন অটো-ব্যাকআপে সংরক্ষিত।`,
          tag: data.backup_created || "Backup Created",
          type: "success",
        });
      } else {
        setLuxuryToast({
          title: "সংরক্ষণ ব্যর্থ! ⚠️",
          message: data.message || "File could not be saved",
          type: "error",
        });
      }
    } catch (e) {
      toast.error("Save error: " + e.message);
    } finally {
      setIsSavingFile(false);
    }
  };

  // ==========================================
  // API: CREATE NEW PHP FILE
  // ==========================================
  const createNewFile = async () => {
    if (!newFilePath.trim()) {
      return toast.warning("ফাইলের পাথ ও নাম লিখুন (যেমন: test/example.php)");
    }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/developer/file_manager.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "create_file", path: newFilePath }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("নতুন ফাইল তৈরি সম্পন্ন! ✅");
        setIsNewFileModalOpen(false);
        setNewFilePath("");
        fetchFiles();
      } else {
        toast.error(data.message || "Could not create file");
      }
    } catch (e) {
      toast.error("Create file error: " + e.message);
    }
  };

  useEffect(() => {
    if (activeTab === "database") {
      fetchTables();
    } else {
      fetchFiles();
    }
  }, [activeTab, fetchTables, fetchFiles]);

  const filteredFiles = useMemo(() => {
    if (!fileSearch.trim()) return files;
    const q = fileSearch.toLowerCase();
    return files.filter(
      (f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
    );
  }, [files, fileSearch]);

  if (!isAdminOrDev) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-bold text-white">প্রবেশাধিকার সংরক্ষিত</h2>
        <p className="text-slate-400 text-sm max-w-md">
          এই সেকশনটি শুধুমাত্র সিস্টেম অ্যাডমিন ও ডেভেলপারদের ব্যবহারের জন্য সংরক্ষিত।
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 text-white max-w-[1600px] mx-auto space-y-6">
      {/* 🔹 Top Header & Quick Backup Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-inner">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Dev & Server Studio</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-normal">
                hPanel Console
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              ডাটাবেজ ম্যানেজমেন্ট, ওয়ান-ক্লিক SQL ব্যাকআপ ও লাইভ PHP কোড এডিটর
            </p>
          </div>
        </div>

        {/* Global Action: 1-Click Complete Database Dump */}
        <div className="flex items-center gap-3">
          <button
            onClick={downloadDatabaseBackup}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            title="সম্পূর্ণ ডাটাবেজের স্কিমা ও ডাটা সহ .sql ফাইল ডাউনলোড করুন"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "ডাম্প হচ্ছে..." : "Download Full Database (.sql)"}</span>
          </button>
        </div>
      </div>

      {/* 🔹 Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveTab("database")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
            activeTab === "database"
              ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-sm"
              : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database & SQL Studio</span>
        </button>

        <button
          onClick={() => setActiveTab("files")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
            activeTab === "files"
              ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-sm"
              : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>API File Manager & PHP Editor</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 🔹 TAB 1: DATABASE & SQL STUDIO */}
      {/* ============================================================== */}
      {activeTab === "database" && (
        <div className="space-y-6">
          {/* SQL Query Console */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c1426]/80 p-5 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <Terminal className="w-4 h-4" />
                <h3 className="text-sm font-bold text-white">Interactive SQL Runner</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  (DB: {databaseName})
                </span>
              </div>

              {/* Quick Snippets */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] text-slate-400">কুইক কোয়েরি:</span>
                {[
                  "SELECT * FROM cash ORDER BY id DESC LIMIT 10;",
                  "SELECT * FROM users ORDER BY id ASC LIMIT 10;",
                  "SHOW PROCESSLIST;",
                ].map((snip, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSqlQuery(snip)}
                    className="px-2 py-1 rounded bg-white/[0.05] hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 border border-white/10 text-[10px] font-mono transition"
                  >
                    {snip.slice(0, 25)}...
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="আপনার SQL কোয়েরি এখানে লিখুন (যেমন: SELECT * FROM users LIMIT 10;)"
                className="w-full font-mono text-xs sm:text-sm bg-black/50 border border-white/10 rounded-xl p-3.5 text-emerald-300 focus:outline-none focus:border-indigo-500 transition leading-relaxed resize-y"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                💡 <span className="text-slate-300">টিপ:</span> SELECT, SHOW, UPDATE,
                INSERT বা যেকোনো কোয়েরি এখানে সরাসরি এক্সিকিউট করতে পারেন।
              </p>
              <button
                onClick={executeQuery}
                disabled={isQueryExecuting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isQueryExecuting ? "চলছে..." : "Execute Query"}</span>
              </button>
            </div>

            {/* Query Results Viewer */}
            {queryResult && (
              <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-2">
                    {queryResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="font-semibold text-white">
                      {queryResult.success ? "কোয়েরি সম্পন্ন" : "কোয়েরি এরর"}
                    </span>
                    <span className="font-mono text-slate-400">
                      ({queryResult.duration_ms} ms)
                    </span>
                  </span>

                  {queryResult.row_count !== undefined && (
                    <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                      রেকর্ড: {queryResult.row_count}
                    </span>
                  )}
                </div>

                {queryResult.error && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs">
                    {queryResult.error}
                  </div>
                )}

                {queryResult.is_select && queryResult.rows?.length > 0 && (
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded-xl border border-white/10 bg-black/40">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 sticky top-0 border-b border-white/10 text-slate-300 font-mono">
                        <tr>
                          {queryResult.columns?.map((col) => (
                            <th key={col} className="px-3.5 py-2.5 font-bold">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] font-mono">
                        {queryResult.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-white/[0.02]">
                            {queryResult.columns?.map((col) => (
                              <td
                                key={col}
                                className="px-3.5 py-2 text-slate-300 max-w-[300px] truncate"
                              >
                                {row[col] !== null ? String(row[col]) : "NULL"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Database Tables Inspector */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c1426]/75 p-5 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Database Tables ({tables.length} টি টেবিল)
                </h3>
              </div>
              <button
                onClick={fetchTables}
                disabled={isTablesLoading}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isTablesLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            <div className="overflow-x-auto max-h-[350px] overflow-y-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 sticky top-0 border-b border-white/10 text-slate-400 uppercase">
                  <tr>
                    <th className="px-4 py-3">টেবিল নাম (Table Name)</th>
                    <th className="px-4 py-3 text-right">মোট রো (Rows)</th>
                    <th className="px-4 py-3 text-right">সাইজ (Size KB)</th>
                    <th className="px-4 py-3">Collation</th>
                    <th className="px-4 py-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {tables.map((t) => (
                    <tr key={t.table_name} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-200">
                        {t.table_name}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-400">
                        {Number(t.table_rows || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-cyan-300">
                        {t.size_kb} KB
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px]">
                        {t.collation || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => {
                            setSqlQuery(`SELECT * FROM \`${t.table_name}\` LIMIT 50;`);
                            window.scrollTo({ top: 150, behavior: "smooth" });
                          }}
                          className="px-2.5 py-1 rounded bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold transition"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 🔹 TAB 2: API FILE MANAGER & PHP CODE EDITOR */}
      {/* ============================================================== */}
      {activeTab === "files" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* File Explorer (Left Panel: 4 Cols) */}
          <div className="lg:col-span-4 rounded-2xl border border-white/[0.08] bg-[#0c1426]/85 p-4 shadow-xl backdrop-blur-md space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <Folder className="w-4 h-4" />
                <h3 className="text-sm font-bold text-white">
                  server/public_html/apis/
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsNewFileModalOpen(true)}
                  className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1"
                  title="নতুন PHP ফাইল তৈরি করুন"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন ফাইল</span>
                </button>
                <button
                  onClick={fetchFiles}
                  disabled={isFilesLoading}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                  title="রিফ্রেশ"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isFilesLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Search Files */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ফাইল খুঁজুন..."
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Files List */}
            <div className="max-h-[550px] overflow-y-auto space-y-1 pr-1">
              {filteredFiles.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6">
                  কোনো ফাইল পাওয়া যায়নি
                </p>
              ) : (
                filteredFiles.map((file) => {
                  const isSelected = selectedFile?.path === file.path;
                  return (
                    <div
                      key={file.path}
                      onClick={() => openFile(file)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600/25 border-indigo-500/50 text-white shadow-sm"
                          : "bg-white/[0.02] border-white/[0.04] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <FileCode
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? "text-indigo-400" : "text-slate-400"
                          }`}
                        />
                        <div className="min-w-0 truncate">
                          <p className="text-xs font-mono font-medium truncate">
                            {file.path}
                          </p>
                          <span className="text-[10px] text-slate-500">
                            {file.size_kb} KB • {file.modified?.slice(5, 16)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Code Editor (Right Panel: 8 Cols) */}
          <div className="lg:col-span-8 rounded-2xl border border-white/[0.08] bg-[#0c1426]/90 p-4 shadow-xl backdrop-blur-md space-y-3 flex flex-col min-h-[640px]">
            {selectedFile ? (
              <>
                {/* Editor Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-sm font-mono font-bold text-white">
                        {selectedFile.path}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {selectedFile.size_kb} KB • সর্বশেষ পরিবর্তন:{" "}
                        {selectedFile.modified}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={saveFile}
                    disabled={isSavingFile}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingFile ? "সেভ হচ্ছে..." : "Save Changes (Ctrl+S)"}</span>
                  </button>
                </div>

                {/* Editor Area */}
                {isReadingFile ? (
                  <div className="flex items-center justify-center flex-1">
                    <Loader />
                  </div>
                ) : (
                  <div className="flex-1 relative">
                    <textarea
                      rows={26}
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                          e.preventDefault();
                          saveFile();
                        }
                      }}
                      spellCheck={false}
                      className="w-full h-full min-h-[500px] font-mono text-xs sm:text-sm bg-black/75 border border-white/10 rounded-xl p-4 text-emerald-300 focus:outline-none focus:border-indigo-500 transition leading-relaxed resize-y select-text"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-20 text-slate-500 space-y-3">
                <FileCode className="w-12 h-12 text-slate-600" />
                <p className="text-sm font-medium">
                  বামপাশের তালিকা থেকে যেকোনো PHP ফাইল নির্বাচন করুন
                </p>
                <p className="text-xs text-slate-600 max-w-sm">
                  ফাইল এডিট করে সেভ করলে স্বয়ংক্রিয়ভাবে পূর্বের কোডের ব্যাকআপ কপি তৈরি হবে।
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔹 Modal: Create New PHP File */}
      {isNewFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F172A] rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>নতুন ফাইল তৈরি করুন</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                ফাইলের পাথ ও নাম (Relative to apis/)
              </label>
              <input
                type="text"
                placeholder="যেমন: developer/my_api.php"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                ফোল্ডার না থাকলে স্বয়ংক্রিয়ভাবে তৈরি হবে।
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewFileModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={createNewFile}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30"
              >
                তৈরি করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Luxury Toast for feedback */}
      <LuxuryToast
        toast={luxuryToast}
        onClose={() => setLuxuryToast(null)}
        duration={4500}
      />
    </div>
  );
}
