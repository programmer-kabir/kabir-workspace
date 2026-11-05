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
  FolderPlus,
  Play,
  Copy,
  Clock,
  Sparkles,
  Server,
  ChevronRight,
  ArrowLeft,
  CornerLeftUp,
  ExternalLink,
  File,
  Eye,
  Code,
  List,
  Filter
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
  const [tableSearch, setTableSearch] = useState("");

  // Live Table Data Browser (phpMyAdmin / hPanel style)
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [isTableDataLoading, setIsTableDataLoading] = useState(false);
  const [tableDataPage, setTableDataPage] = useState(1);
  const [tableDataLimit, setTableDataLimit] = useState(50);
  const [tableDataSearch, setTableDataSearch] = useState("");
  const [showSqlRunner, setShowSqlRunner] = useState(false);

  // SQL Query Console
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM cash ORDER BY id DESC LIMIT 20;");
  const [queryResult, setQueryResult] = useState(null);
  const [isQueryExecuting, setIsQueryExecuting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ==========================================
  // 2. FILE MANAGER & CODE EDITOR (hPanel style)
  // ==========================================
  const [currentFolder, setCurrentFolder] = useState(""); // "" = root of apis/
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: "apis", path: "" }]);
  const [parentFolder, setParentFolder] = useState(null);
  const [folderList, setFolderList] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [isFolderLoading, setIsFolderLoading] = useState(false);
  const [itemSearch, setItemSearch] = useState("");

  // Modals for creating new files and folders
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // File Editor
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isSavingFile, setIsSavingFile] = useState(false);

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
  // API: BROWSE TABLE DATA (Live Records View)
  // ==========================================
  const browseTableData = useCallback(async (tableName, page = 1, search = "", limit = tableDataLimit) => {
    if (!tableName) return;
    setIsTableDataLoading(true);
    try {
      const params = new URLSearchParams({
        action: "browse_table",
        table: tableName,
        page: String(page),
        limit: String(limit),
        search: search.trim()
      });

      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/developer/sql_runner.php?${params.toString()}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setTableData(data);
        setSelectedTable(tableName);
        setTableDataPage(data.page);
      } else {
        toast.error(data.message || "ডাটা লোড করা যায়নি");
      }
    } catch (e) {
      toast.error("Table browse error: " + e.message);
    } finally {
      setIsTableDataLoading(false);
    }
  }, [tableDataLimit]);

  // ==========================================
  // API: EXECUTE CUSTOM SQL QUERY
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
        message: "সম্পূর্ণ MySQL ডাটাবেজের ফুল স্ট্রাকচার ও ডাটা সহ .sql ফাইল ডাউনলোড হচ্ছে...",
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
  // API: BROWSE DIRECTORY (hPanel Folder View)
  // ==========================================
  const browseFolder = useCallback(async (folderPath = "") => {
    setIsFolderLoading(true);
    try {
      const params = new URLSearchParams({
        action: "browse_folder",
        folder: folderPath
      });
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/developer/file_manager.php?${params.toString()}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setCurrentFolder(data.current_folder || "");
        setBreadcrumbs(data.breadcrumbs || [{ name: "apis", path: "" }]);
        setParentFolder(data.parent_folder);
        setFolderList(data.folders || []);
        setFileList(data.files || []);
      } else {
        toast.error(data.message || "Folder navigation failed");
      }
    } catch (e) {
      toast.error("File manager connection error");
    } finally {
      setIsFolderLoading(false);
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
        // Refresh folder to update modified time and size
        browseFolder(currentFolder);
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
  // API: CREATE NEW FILE (In Current Open Folder)
  // ==========================================
  const createNewFileInCurrentFolder = async () => {
    if (!newFileName.trim()) {
      return toast.warning("ফাইলের নাম লিখুন (যেমন: my_endpoint.php)");
    }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/developer/file_manager.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "create_file",
            folder: currentFolder,
            filename: newFileName.trim()
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("নতুন ফাইল তৈরি সম্পন্ন! ✅");
        setIsNewFileModalOpen(false);
        setNewFileName("");
        browseFolder(currentFolder);
        // Automatically open the newly created file in editor
        openFile({ path: data.path, name: data.name });
      } else {
        toast.error(data.message || "Could not create file");
      }
    } catch (e) {
      toast.error("Create file error: " + e.message);
    }
  };

  // ==========================================
  // API: CREATE NEW FOLDER (In Current Open Folder)
  // ==========================================
  const createNewFolderInCurrentFolder = async () => {
    if (!newFolderName.trim()) {
      return toast.warning("ফোল্ডারের নাম লিখুন (যেমন: reports)");
    }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/developer/file_manager.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "create_folder",
            folder: currentFolder,
            folder_name: newFolderName.trim()
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("নতুন ফোল্ডার তৈরি সম্পন্ন! 📁");
        setIsNewFolderModalOpen(false);
        setNewFolderName("");
        browseFolder(currentFolder);
      } else {
        toast.error(data.message || "Could not create folder");
      }
    } catch (e) {
      toast.error("Create folder error: " + e.message);
    }
  };

  // Initial load
  useEffect(() => {
    if (activeTab === "database") {
      fetchTables();
    } else {
      browseFolder(currentFolder);
    }
  }, [activeTab, fetchTables, browseFolder, currentFolder]);

  // Filtered Database Tables
  const filteredTables = useMemo(() => {
    if (!tableSearch.trim()) return tables;
    const q = tableSearch.toLowerCase();
    return tables.filter((t) => t.table_name.toLowerCase().includes(q));
  }, [tables, tableSearch]);

  // Filtered Folder & Files
  const filteredFolders = useMemo(() => {
    if (!itemSearch.trim()) return folderList;
    const q = itemSearch.toLowerCase();
    return folderList.filter((f) => f.name.toLowerCase().includes(q));
  }, [folderList, itemSearch]);

  const filteredItemsFiles = useMemo(() => {
    if (!itemSearch.trim()) return fileList;
    const q = itemSearch.toLowerCase();
    return fileList.filter((f) => f.name.toLowerCase().includes(q));
  }, [fileList, itemSearch]);

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
    <div className="p-4 sm:p-6 text-white max-w-[1700px] mx-auto space-y-6">
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
              লাইভ ডেটাবেজ ডাটা ব্রাউজার, ওয়ান-ক্লিক SQL ব্যাকআপ ও ফোল্ডার-বেসড PHP ফাইল ম্যানেজার
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
          <span>Database & Live Data Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab("files")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
            activeTab === "files"
              ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-sm"
              : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>API Folder & File Manager (hPanel View)</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 🔹 TAB 1: DATABASE & LIVE DATA INSPECTOR (phpMyAdmin style) */}
      {/* ============================================================== */}
      {activeTab === "database" && (
        <div className="space-y-6">
          {/* Top Bar: Switch between Table Inspector & SQL Runner */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0c1426]/60 p-3 rounded-2xl border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Database:</span>
              <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                {databaseName || "supplylink"}
              </span>
              <span className="text-xs text-slate-400 ml-2">({tables.length} টি টেবিল)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSqlRunner((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  showSqlRunner
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                    : "bg-white/[0.04] text-slate-300 border-white/[0.08] hover:bg-white/[0.08]"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{showSqlRunner ? "Hide SQL Runner" : "Open SQL Runner Console"}</span>
              </button>
            </div>
          </div>

          {/* Optional SQL Query Runner Accordion */}
          {showSqlRunner && (
            <div className="rounded-2xl border border-indigo-500/30 bg-[#0c1426]/90 p-5 shadow-2xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Terminal className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white">Interactive SQL Runner</h3>
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
                  placeholder="আপনার SQL কোয়েরি এখানে লিখুন..."
                  className="w-full font-mono text-xs sm:text-sm bg-black/60 border border-white/10 rounded-xl p-3.5 text-emerald-300 focus:outline-none focus:border-indigo-500 transition leading-relaxed resize-y"
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-400">
                  💡 যেকোনো কাস্টম SELECT, SHOW, UPDATE, INSERT কোয়েরি সরাসরি রান করুন।
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

              {/* Query Results */}
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
                    <div className="overflow-x-auto max-h-[350px] overflow-y-auto rounded-xl border border-white/10 bg-black/50">
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
                                  className="px-3.5 py-2 text-slate-300 max-w-[280px] truncate"
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
          )}

          {/* Main Database Grid: Left Tables List + Right Live Data View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Table List Selector (4 Cols) */}
            <div className="lg:col-span-4 rounded-2xl border border-white/[0.08] bg-[#0c1426]/85 p-4 shadow-xl backdrop-blur-md space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Table className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white">Database Tables</h3>
                </div>
                <button
                  onClick={fetchTables}
                  disabled={isTablesLoading}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                  title="টেবিল রিফ্রেশ করুন"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isTablesLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {/* Table Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="টেবিল খুঁজুন..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Tables List */}
              <div className="max-h-[600px] overflow-y-auto space-y-1 pr-1">
                {filteredTables.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-6">
                    কোনো টেবিল পাওয়া যায়নি
                  </p>
                ) : (
                  filteredTables.map((t) => {
                    const isSelected = selectedTable === t.table_name;
                    return (
                      <div
                        key={t.table_name}
                        onClick={() => {
                          setTableDataSearch("");
                          browseTableData(t.table_name, 1, "");
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600/30 border-indigo-500/60 text-white shadow-md shadow-indigo-600/20"
                            : "bg-white/[0.02] border-white/[0.04] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Table
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? "text-indigo-400" : "text-slate-400"
                            }`}
                          />
                          <span className="text-xs font-mono font-semibold truncate">
                            {t.table_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-right">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                            {Number(t.table_rows || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Table Data Inspector (8 Cols) */}
            <div className="lg:col-span-8 rounded-2xl border border-white/[0.08] bg-[#0c1426]/90 p-4 shadow-xl backdrop-blur-md space-y-4 flex flex-col min-h-[640px]">
              {selectedTable ? (
                <>
                  {/* Table Header & Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                        <Table className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-mono font-bold text-white flex items-center gap-2">
                          <span>{selectedTable}</span>
                          {tableData?.primary_key && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                              PK: {tableData.primary_key}
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          মোট রেকর্ড: {Number(tableData?.total_rows || 0).toLocaleString()} টি •
                          পেজ {tableData?.page || 1} / {tableData?.total_pages || 1}
                        </p>
                      </div>
                    </div>

                    {/* Table Search & Refresh */}
                    <div className="flex items-center gap-2">
                      <div className="relative w-48 sm:w-56">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="টেবিলের ডাটা খুঁজুন..."
                          value={tableDataSearch}
                          onChange={(e) => setTableDataSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              browseTableData(selectedTable, 1, tableDataSearch);
                            }
                          }}
                          className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        {tableDataSearch && (
                          <button
                            onClick={() => {
                              setTableDataSearch("");
                              browseTableData(selectedTable, 1, "");
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => browseTableData(selectedTable, tableDataPage, tableDataSearch)}
                        disabled={isTableDataLoading}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
                        title="রিফ্রেশ করুন"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${isTableDataLoading ? "animate-spin text-indigo-400" : ""}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Table Rows Viewer */}
                  {isTableDataLoading ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-20 space-y-3">
                      <Loader />
                      <p className="text-xs text-slate-400 font-mono">
                        {selectedTable} ডাটা লোড হচ্ছে...
                      </p>
                    </div>
                  ) : tableData?.rows && tableData.rows.length > 0 ? (
                    <div className="overflow-x-auto flex-1 max-h-[520px] overflow-y-auto rounded-xl border border-white/10 bg-black/40">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-900/95 sticky top-0 z-10 border-b border-white/10 text-slate-300 font-mono">
                          <tr>
                            <th className="px-3 py-2.5 text-center text-slate-500 w-12">#</th>
                            {tableData.columns?.map((col) => (
                              <th
                                key={col}
                                className={`px-3.5 py-2.5 font-bold whitespace-nowrap ${
                                  col === tableData.primary_key ? "text-amber-300" : "text-slate-200"
                                }`}
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] font-mono">
                          {tableData.rows.map((row, rIdx) => {
                            const rowNum = (tableData.page - 1) * tableData.limit + rIdx + 1;
                            return (
                              <tr key={rIdx} className="hover:bg-white/[0.03] transition-colors">
                                <td className="px-3 py-2 text-center text-slate-500 font-mono text-[11px]">
                                  {rowNum}
                                </td>
                                {tableData.columns?.map((col) => (
                                  <td
                                    key={col}
                                    className="px-3.5 py-2 text-slate-300 max-w-[320px] truncate"
                                    title={row[col] !== null ? String(row[col]) : "NULL"}
                                  >
                                    {row[col] === null ? (
                                      <span className="text-slate-600 italic">NULL</span>
                                    ) : (
                                      String(row[col])
                                    )}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-center py-20 text-slate-500 space-y-2">
                      <AlertTriangle className="w-10 h-10 text-slate-600" />
                      <p className="text-sm font-medium">এই টেবিলে কোনো ডাটা পাওয়া যায়নি</p>
                      {tableDataSearch && (
                        <p className="text-xs text-slate-500">
                          অনুসন্ধান শব্দ "{tableDataSearch}" এর সাথে মিলে এমন কোনো রেকর্ড নেই।
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {tableData && tableData.total_pages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08] text-xs">
                      <span className="text-slate-400">
                        মোট রেকর্ড {tableData.total_rows} এর মধ্যে{" "}
                        {Math.min((tableData.page - 1) * tableData.limit + 1, tableData.total_rows)} -{" "}
                        {Math.min(tableData.page * tableData.limit, tableData.total_rows)} দেখাচ্ছে
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => browseTableData(selectedTable, tableDataPage - 1, tableDataSearch)}
                          disabled={tableDataPage <= 1 || isTableDataLoading}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition"
                        >
                          পূর্ববর্তী (Prev)
                        </button>
                        <span className="font-mono text-indigo-300 font-semibold px-2">
                          পেজ {tableDataPage} / {tableData.total_pages}
                        </span>
                        <button
                          onClick={() => browseTableData(selectedTable, tableDataPage + 1, tableDataSearch)}
                          disabled={tableDataPage >= tableData.total_pages || isTableDataLoading}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition"
                        >
                          পরবর্তী (Next)
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center py-24 text-slate-500 space-y-3">
                  <Table className="w-14 h-14 text-slate-600 stroke-1" />
                  <h4 className="text-base font-bold text-slate-300">
                    বামপাশ থেকে যেকোনো টেবিল নির্বাচন করুন
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md">
                    phpMyAdmin বা hPanel ডেটাবেজ ম্যানেজারের মতো নির্বাচিত টেবিলের সকল রেকর্ড সরাসরি
                    এখানে পেজিনেশন ও সার্চ সহ প্রদর্শিত হবে।
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 🔹 TAB 2: API FOLDER & FILE MANAGER (hPanel Folder Directory) */}
      {/* ============================================================== */}
      {activeTab === "files" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* File Explorer (Left Panel: 4 Cols) */}
          <div className="lg:col-span-4 rounded-2xl border border-white/[0.08] bg-[#0c1426]/85 p-4 shadow-xl backdrop-blur-md space-y-3.5">
            {/* Top Toolbar: New File & New Folder Buttons */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsNewFileModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                  title={`বর্তমান ফোল্ডারে (${currentFolder || "apis"}) নতুন ফাইল তৈরি করুন`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ ফাইল</span>
                </button>
                <button
                  onClick={() => setIsNewFolderModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                  title={`বর্তমান ফোল্ডারে (${currentFolder || "apis"}) নতুন সাব-ফোল্ডার তৈরি করুন`}
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ ফোল্ডার</span>
                </button>
              </div>

              <button
                onClick={() => browseFolder(currentFolder)}
                disabled={isFolderLoading}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isFolderLoading ? "animate-spin text-indigo-400" : ""}`}
                />
              </button>
            </div>

            {/* Breadcrumb Navigation Trail (hPanel Style) */}
            <div className="flex items-center gap-1 text-xs font-mono p-2 rounded-xl bg-black/40 border border-white/[0.06] overflow-x-auto text-slate-300">
              {breadcrumbs.map((bc, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-600">/</span>}
                    <button
                      onClick={() => browseFolder(bc.path)}
                      className={`hover:text-indigo-300 transition shrink-0 ${
                        isLast ? "font-bold text-white bg-indigo-500/20 px-1.5 py-0.5 rounded" : "text-slate-400"
                      }`}
                    >
                      {idx === 0 ? "📁 apis" : bc.name}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Back / Up-one-level button */}
            {parentFolder !== null && (
              <button
                onClick={() => browseFolder(parentFolder)}
                className="w-full flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.04] text-xs font-mono text-slate-300 transition"
              >
                <CornerLeftUp className="w-4 h-4 text-cyan-400" />
                <span>.. (Up one level)</span>
              </button>
            )}

            {/* Search inside current folder */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ফাইল বা ফোল্ডার খুঁজুন..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Folders and Files List (hPanel Tree View) */}
            <div className="max-h-[520px] overflow-y-auto space-y-1 pr-1">
              {isFolderLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <Loader />
                  <p className="text-xs text-slate-500 font-mono">ফোল্ডার লোড হচ্ছে...</p>
                </div>
              ) : filteredFolders.length === 0 && filteredItemsFiles.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">
                  এই ফোল্ডারটি খালি (Empty)
                </p>
              ) : (
                <>
                  {/* Subfolders Group */}
                  {filteredFolders.map((folder) => (
                    <div
                      key={folder.path}
                      onClick={() => browseFolder(folder.path)}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] text-slate-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <Folder className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400/20" />
                        <span className="text-xs font-mono font-medium truncate">
                          {folder.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.06] shrink-0 font-mono">
                        {folder.item_count} items
                      </span>
                    </div>
                  ))}

                  {/* Files Group */}
                  {filteredItemsFiles.map((file) => {
                    const isSelected = selectedFile?.path === file.path;
                    return (
                      <div
                        key={file.path}
                        onClick={() => openFile(file)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600/30 border-indigo-500/60 text-white shadow-md shadow-indigo-600/20"
                            : "bg-white/[0.02] border-white/[0.04] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <FileCode
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? "text-indigo-400" : "text-emerald-400"
                            }`}
                          />
                          <div className="min-w-0 truncate">
                            <p className="text-xs font-mono font-medium truncate">
                              {file.name}
                            </p>
                            <span className="text-[10px] text-slate-500">
                              {file.size_kb} KB
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
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
                        apis/{selectedFile.path}
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
              <div className="flex flex-col items-center justify-center flex-1 text-center py-24 text-slate-500 space-y-3">
                <FileCode className="w-14 h-14 text-slate-600 stroke-1" />
                <h4 className="text-base font-bold text-slate-300">
                  বামপাশের ফোল্ডার থেকে ফাইল নির্বাচন করুন
                </h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  ফাইল সিলেক্ট করে সরাসরি কোড এডিট করা যাবে। সেভ করার সাথে সাথে স্বয়ংক্রিয়ভাবে
                  পূর্বের কোডের একটি ব্যাকআপ কপি তৈরি হবে।
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔹 Modal: Create New File (Creates directly inside current open folder) */}
      {isNewFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F172A] rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>নতুন ফাইল তৈরি করুন</span>
            </h3>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <span className="text-[11px] text-slate-400 block">টার্গেট ফোল্ডার (Target Directory):</span>
                <span className="text-xs font-mono font-bold text-indigo-300">
                  apis/{currentFolder ? `${currentFolder}/` : ""}
                </span>
              </div>

              <label className="text-xs font-semibold text-slate-300 block">
                ফাইলের নাম (File Name)
              </label>
              <input
                type="text"
                placeholder="যেমন: my_api.php"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createNewFileInCurrentFolder();
                }}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                ফাইলটি সরাসরি বর্তমান ওপেন থাকা ফোল্ডারে তৈরি হবে।
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsNewFileModalOpen(false);
                  setNewFileName("");
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={createNewFileInCurrentFolder}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                তৈরি করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Modal: Create New Folder (Creates directly inside current open folder) */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F172A] rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-indigo-400" />
              <span>নতুন ফোল্ডার তৈরি করুন</span>
            </h3>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <span className="text-[11px] text-slate-400 block">টার্গেট লোকেশন (Location):</span>
                <span className="text-xs font-mono font-bold text-indigo-300">
                  apis/{currentFolder ? `${currentFolder}/` : ""}
                </span>
              </div>

              <label className="text-xs font-semibold text-slate-300 block">
                ফোল্ডারের নাম (Folder Name)
              </label>
              <input
                type="text"
                placeholder="যেমন: reports"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createNewFolderInCurrentFolder();
                }}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsNewFolderModalOpen(false);
                  setNewFolderName("");
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={createNewFolderInCurrentFolder}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 cursor-pointer"
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
