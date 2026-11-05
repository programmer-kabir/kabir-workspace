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
  Filter,
  Trash2,
  Edit2,
  Key,
  Columns,
  X
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

  // Live Table Data Browser
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [isTableDataLoading, setIsTableDataLoading] = useState(false);
  const [tableDataPage, setTableDataPage] = useState(1);
  const [tableDataLimit, setTableDataLimit] = useState(25);
  const [tableDataSearch, setTableDataSearch] = useState("");
  const [showSqlRunner, setShowSqlRunner] = useState(false);

  // Column Visibility Filter
  const [visibleCols, setVisibleCols] = useState([]);
  const [showColDropdown, setShowColDropdown] = useState(false);

  // CRUD Modals for Database Rows
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [insertFormData, setInsertFormData] = useState({});
  const [isInserting, setIsInserting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editRowPKs, setEditRowPKs] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetPKs, setDeleteTargetPKs] = useState(null);
  const [isDeletingRow, setIsDeletingRow] = useState(false);

  // SQL Query Console
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM cash ORDER BY id DESC LIMIT 20;");
  const [queryResult, setQueryResult] = useState(null);
  const [isQueryExecuting, setIsQueryExecuting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ==========================================
  // 2. FILE MANAGER & CODE EDITOR (hPanel style)
  // ==========================================
  const [currentFolder, setCurrentFolder] = useState(""); // "" = root of server/public_html
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: "public_html", path: "" }]);
  const [parentFolder, setParentFolder] = useState(null);
  const [folderList, setFolderList] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [isFolderLoading, setIsFolderLoading] = useState(false);
  const [itemSearch, setItemSearch] = useState("");

  // Modals for creating new files, folders, and deleting
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [deleteItemModal, setDeleteItemModal] = useState(null); // { path, type, name }
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // File Editor
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isSavingFile, setIsSavingFile] = useState(false);

  // ==========================================
  // API: FETCH DATABASE TABLES
  // ==========================================
  const fetchTables = useCallback(async (autoSelectDefault = true) => {
    setIsTablesLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/developer/sql_runner.php?action=get_tables`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        const fetchedTables = data.tables || [];
        setTables(fetchedTables);
        setDatabaseName(data.database || "supplylink");
        if (autoSelectDefault && !selectedTable && fetchedTables.length > 0) {
          const defaultTbl = fetchedTables.find((t) => t.table_name === "users")?.table_name || fetchedTables[0].table_name;
          browseTableData(defaultTbl, 1, "", 25);
        }
      } else {
        toast.error(data.message || "Failed to load tables");
      }
    } catch (e) {
      toast.error("Could not connect to database inspector");
    } finally {
      setIsTablesLoading(false);
    }
  }, [selectedTable]);

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
        setVisibleCols(data.columns || []);
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
  // API: INSERT NEW ROW INTO TABLE
  // ==========================================
  const handleInsertRow = async () => {
    if (!selectedTable) return;
    setIsInserting(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/developer/sql_runner.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "insert_row",
            table: selectedTable,
            data: insertFormData
          })
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "নতুন রেকর্ড সফলভাবে যুক্ত হয়েছে");
        setIsInsertModalOpen(false);
        setInsertFormData({});
        browseTableData(selectedTable, 1, tableDataSearch);
        fetchTables(false);
      } else {
        toast.error(data.message || "ডাটা ইনসার্ট করা সম্ভব হয়নি");
      }
    } catch (e) {
      toast.error("Insert error: " + e.message);
    } finally {
      setIsInserting(false);
    }
  };

  // ==========================================
  // API: UPDATE EXISTING ROW IN TABLE
  // ==========================================
  const handleUpdateRow = async () => {
    if (!selectedTable || !editRowPKs) return;
    setIsUpdating(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/developer/sql_runner.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "update_row",
            table: selectedTable,
            primary_keys: editRowPKs,
            data: editFormData
          })
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "রেকর্ড আপডেট সম্পন্ন");
        setIsEditModalOpen(false);
        setEditFormData({});
        setEditRowPKs({});
        browseTableData(selectedTable, tableDataPage, tableDataSearch);
      } else {
        toast.error(data.message || "রেকর্ড আপডেট ব্যর্থ হয়েছে");
      }
    } catch (e) {
      toast.error("Update error: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // ==========================================
  // API: DELETE ROW FROM TABLE
  // ==========================================
  const handleDeleteRow = async () => {
    if (!selectedTable || !deleteTargetPKs) return;
    setIsDeletingRow(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/developer/sql_runner.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "delete_row",
            table: selectedTable,
            primary_keys: deleteTargetPKs
          })
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "রেকর্ড সফলভাবে মুছে ফেলা হয়েছে");
        setIsDeleteModalOpen(false);
        setDeleteTargetPKs(null);
        browseTableData(selectedTable, tableDataPage, tableDataSearch);
        fetchTables(false);
      } else {
        toast.error(data.message || "রেকর্ড মুছতে ব্যর্থ হয়েছে");
      }
    } catch (e) {
      toast.error("Delete error: " + e.message);
    } finally {
      setIsDeletingRow(false);
    }
  };

  // ==========================================
  // ACTION: EXPORT TABLE DATA AS CSV / JSON
  // ==========================================
  const exportData = (format = "csv") => {
    if (!tableData?.rows || tableData.rows.length === 0) {
      return toast.warning("এক্সপোর্ট করার মতো কোনো ডাটা নেই");
    }

    if (format === "json") {
      const jsonStr = JSON.stringify(tableData.rows, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedTable}_page${tableData.page}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("JSON এক্সপোর্ট সম্পন্ন");
      return;
    }

    // CSV format
    const cols = tableData.columns || Object.keys(tableData.rows[0] || {});
    const headerRow = cols.join(",");
    const dataRows = tableData.rows.map((row) =>
      cols
        .map((col) => {
          const val = row[col] === null ? "" : String(row[col]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headerRow, ...dataRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement("a");
    a.href = encodedUri;
    a.download = `${selectedTable}_page${tableData.page}.csv`;
    a.click();
    toast.success("CSV এক্সপোর্ট সম্পন্ন");
  };

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
  // API: BROWSE DIRECTORY (Full Server Codebase)
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
        setBreadcrumbs(data.breadcrumbs || [{ name: "public_html", path: "" }]);
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
      return toast.warning("ফোল্ডারের নাম লিখুন (যেমন: cron)");
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

  // ==========================================
  // API: DELETE FILE OR FOLDER
  // ==========================================
  const handleDeleteItem = async () => {
    if (!deleteItemModal) return;
    setIsDeletingItem(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/developer/file_manager.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "delete_item",
            path: deleteItemModal.path,
            type: deleteItemModal.type
          })
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "মুছে ফেলা সম্পন্ন");
        if (selectedFile?.path === deleteItemModal.path) {
          setSelectedFile(null);
          setFileContent("");
        }
        setDeleteItemModal(null);
        browseFolder(currentFolder);
      } else {
        toast.error(data.message || "মুছতে ব্যর্থ হয়েছে");
      }
    } catch (e) {
      toast.error("Delete error: " + e.message);
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (activeTab === "database") {
      fetchTables(true);
    } else {
      browseFolder(currentFolder);
    }
  }, [activeTab]);

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
                Hostinger Backend Sync
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              সম্পূর্ণ সার্ভার কোডবেস (apis, cron, uploads) ব্রাউজিং, এডিট/ডিলিট ও লাইভ ডাটাবেজ CRUD
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
          <span>SCHEMA TABLES & CRUD</span>
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
          <span>SERVER FILE EXPLORER & EDITOR</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 🔹 TAB 1: DATABASE & LIVE DATA CRUD INSPECTOR */}
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
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
                      className="px-2 py-1 rounded bg-white/[0.05] hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 border border-white/10 text-[10px] font-mono transition cursor-pointer"
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

          {/* Main Database Grid: Left SCHEMA TABLES + Right Data Grid with CRUD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: SCHEMA TABLES (3 Cols) */}
            <div className="lg:col-span-3 rounded-2xl border border-white/[0.08] bg-[#0c1426]/85 p-4 shadow-xl backdrop-blur-md space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Database className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    SCHEMA TABLES ({tables.length})
                  </h3>
                </div>
                <button
                  onClick={() => fetchTables(false)}
                  disabled={isTablesLoading}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                  title="টেবিল রিফ্রেশ করুন"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isTablesLoading ? "animate-spin text-indigo-400" : ""}`}
                  />
                </button>
              </div>

              {/* Table Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tables..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Tables List */}
              <div className="max-h-[640px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
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
                          browseTableData(t.table_name, 1, "", tableDataLimit);
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600/30 border-indigo-500/60 text-white shadow-md shadow-indigo-600/20 font-semibold"
                            : "bg-white/[0.02] border-white/[0.04] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Table
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? "text-indigo-400" : "text-slate-500"
                            }`}
                          />
                          <span className="text-xs font-mono truncate">
                            {t.table_name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {Number(t.table_rows || 0).toLocaleString()}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Table Data Grid with Insert / Edit / Delete (9 Cols) */}
            <div className="lg:col-span-9 rounded-2xl border border-white/[0.08] bg-[#0c1426]/90 p-5 shadow-xl backdrop-blur-md space-y-4 flex flex-col min-h-[680px]">
              {selectedTable ? (
                <>
                  {/* Table Info Bar & Top Action Buttons (Matching Screenshot 1 & 2) */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-xl font-black font-mono text-indigo-400">
                          {selectedTable}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold">
                          {Number(tableData?.total_rows || 0).toLocaleString()} rows
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[11px] font-mono border border-white/[0.06]">
                          InnoDB
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Primary Key:</span>
                        <span className="font-mono font-bold text-amber-300">
                          {tableData?.primary_key || "None"}
                        </span>
                        <span>•</span>
                        <span>{tableData?.columns?.length || 0} columns detected</span>
                      </p>
                    </div>

                    {/* Action Buttons Toolbar: Insert Row, Columns, CSV, JSON */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          const initial = {};
                          (tableData?.columns_meta || []).forEach((c) => {
                            initial[c.COLUMN_NAME] = "";
                          });
                          setInsertFormData(initial);
                          setIsInsertModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Insert Row</span>
                      </button>

                      {/* Columns Toggle Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowColDropdown(!showColDropdown)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition cursor-pointer"
                        >
                          <Columns className="w-3.5 h-3.5" />
                          <span>Columns ({visibleCols.length})</span>
                        </button>

                        {showColDropdown && (
                          <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#0F172A] border border-white/10 p-3 shadow-2xl z-40 max-h-64 overflow-y-auto space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block pb-1 border-b border-white/10 mb-1">
                              Toggle Columns
                            </span>
                            {tableData?.columns?.map((c) => (
                              <label
                                key={c}
                                className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer py-0.5"
                              >
                                <input
                                  type="checkbox"
                                  checked={visibleCols.includes(c)}
                                  onChange={() => {
                                    setVisibleCols((prev) =>
                                      prev.includes(c)
                                        ? prev.filter((x) => x !== c)
                                        : [...prev, c]
                                    );
                                  }}
                                  className="rounded border-slate-700 bg-slate-900 text-indigo-500"
                                />
                                <span className="font-mono truncate">{c}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => exportData("csv")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition cursor-pointer"
                        title="Export current page to CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>CSV</span>
                      </button>

                      <button
                        onClick={() => exportData("json")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition cursor-pointer"
                        title="Export current page to JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>JSON</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter & Rows Per Page Toolbar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Search in records */}
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder={`Filter records in ${selectedTable}...`}
                          value={tableDataSearch}
                          onChange={(e) => setTableDataSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              browseTableData(selectedTable, 1, tableDataSearch, tableDataLimit);
                            }
                          }}
                          className="w-full pl-9 pr-7 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        {tableDataSearch && (
                          <button
                            onClick={() => {
                              setTableDataSearch("");
                              browseTableData(selectedTable, 1, "", tableDataLimit);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => browseTableData(selectedTable, 1, tableDataSearch, tableDataLimit)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Search
                      </button>
                    </div>

                    {/* Pagination & Limit dropdown */}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span>Rows:</span>
                        <select
                          value={tableDataLimit}
                          onChange={(e) => {
                            const newLim = Number(e.target.value);
                            setTableDataLimit(newLim);
                            browseTableData(selectedTable, 1, tableDataSearch, newLim);
                          }}
                          className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-indigo-500"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>

                      <span className="font-mono text-slate-300">
                        Page {tableData?.page || 1} of {tableData?.total_pages || 1}
                      </span>
                    </div>
                  </div>

                  {/* Live Table Grid with ACTION Column (Edit ✏️ & Delete 🗑️) */}
                  {isTableDataLoading ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-24 space-y-3">
                      <Loader />
                      <p className="text-xs text-slate-400 font-mono">
                        {selectedTable} ডাটা লোড হচ্ছে...
                      </p>
                    </div>
                  ) : tableData?.rows && tableData.rows.length > 0 ? (
                    <div className="overflow-x-auto flex-1 max-h-[520px] overflow-y-auto rounded-xl border border-white/10 bg-black/40 scrollbar-thin">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-[#0b1220] sticky top-0 z-10 border-b border-white/10 text-slate-400 font-mono uppercase text-[11px]">
                          <tr>
                            <th className="px-3.5 py-3 text-center w-24">ACTION</th>
                            <th className="px-2.5 py-3 text-center text-slate-500 w-10">#</th>
                            {tableData.columns
                              ?.filter((c) => visibleCols.includes(c))
                              .map((col) => {
                                const meta = tableData.columns_meta?.find(
                                  (m) => m.COLUMN_NAME === col
                                );
                                const isPK = col === tableData.primary_key;
                                return (
                                  <th
                                    key={col}
                                    className={`px-3.5 py-3 font-bold whitespace-nowrap ${
                                      isPK ? "text-amber-300" : "text-slate-300"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      {isPK && <Key className="w-3 h-3 text-amber-400 shrink-0" />}
                                      <span>{col}</span>
                                      {meta?.DATA_TYPE && (
                                        <span className="text-[10px] font-normal text-slate-500 lowercase">
                                          {meta.DATA_TYPE}
                                        </span>
                                      )}
                                    </div>
                                  </th>
                                );
                              })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] font-mono">
                          {tableData.rows.map((row, rIdx) => {
                            const rowNum = (tableData.page - 1) * tableData.limit + rIdx + 1;
                            const pkVal = tableData.primary_key ? row[tableData.primary_key] : null;

                            return (
                              <tr
                                key={rIdx}
                                className="hover:bg-white/[0.03] transition-colors group"
                              >
                                {/* Action Buttons: Edit ✏️ and Delete 🗑️ */}
                                <td className="px-3 py-2 text-center whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        setEditFormData({ ...row });
                                        setEditRowPKs(
                                          tableData.primary_key
                                            ? { [tableData.primary_key]: pkVal }
                                            : { ...row }
                                        );
                                        setIsEditModalOpen(true);
                                      }}
                                      className="p-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 transition cursor-pointer"
                                      title="Edit record"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDeleteTargetPKs(
                                          tableData.primary_key
                                            ? { [tableData.primary_key]: pkVal }
                                            : { ...row }
                                        );
                                        setIsDeleteModalOpen(true);
                                      }}
                                      className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition cursor-pointer"
                                      title="Delete record"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>

                                {/* Row Number */}
                                <td className="px-2.5 py-2 text-center text-slate-500 text-[11px]">
                                  {rowNum}
                                </td>

                                {/* Column Values */}
                                {tableData.columns
                                  ?.filter((c) => visibleCols.includes(c))
                                  .map((col) => (
                                    <td
                                      key={col}
                                      className="px-3.5 py-2 text-slate-300 max-w-[280px] truncate select-text"
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
                    <div className="flex flex-col items-center justify-center flex-1 text-center py-24 text-slate-500 space-y-2">
                      <AlertTriangle className="w-10 h-10 text-slate-600" />
                      <p className="text-sm font-medium">এই টেবিলে কোনো ডাটা পাওয়া যায়নি</p>
                    </div>
                  )}

                  {/* Bottom Pagination Controls */}
                  {tableData && tableData.total_pages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08] text-xs">
                      <span className="text-slate-400">
                        রেকর্ড {(tableData.page - 1) * tableData.limit + 1} -{" "}
                        {Math.min(tableData.page * tableData.limit, tableData.total_rows)} (মোট {tableData.total_rows})
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => browseTableData(selectedTable, tableDataPage - 1, tableDataSearch, tableDataLimit)}
                          disabled={tableDataPage <= 1 || isTableDataLoading}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer"
                        >
                          Previous
                        </button>
                        <span className="font-mono text-indigo-300 font-semibold px-2">
                          {tableDataPage} / {tableData.total_pages}
                        </span>
                        <button
                          onClick={() => browseTableData(selectedTable, tableDataPage + 1, tableDataSearch, tableDataLimit)}
                          disabled={tableDataPage >= tableData.total_pages || isTableDataLoading}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition cursor-pointer"
                        >
                          Next
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 🔹 TAB 2: SERVER FILE EXPLORER & EDITOR (Full Server Codebase) */}
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
                  title={`বর্তমান ফোল্ডারে (${currentFolder || "public_html"}) নতুন ফাইল তৈরি করুন`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ ফাইল</span>
                </button>
                <button
                  onClick={() => setIsNewFolderModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                  title={`বর্তমান ফোল্ডারে (${currentFolder || "public_html"}) নতুন সাব-ফোল্ডার তৈরি করুন`}
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ ফোল্ডার</span>
                </button>
              </div>

              <button
                onClick={() => browseFolder(currentFolder)}
                disabled={isFolderLoading}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isFolderLoading ? "animate-spin text-indigo-400" : ""}`}
                />
              </button>
            </div>

            {/* Breadcrumb Navigation Trail (Shows Entire Server Root) */}
            <div className="flex items-center gap-1 text-xs font-mono p-2 rounded-xl bg-black/40 border border-white/[0.06] overflow-x-auto text-slate-300">
              {breadcrumbs.map((bc, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-600">/</span>}
                    <button
                      onClick={() => browseFolder(bc.path)}
                      className={`hover:text-indigo-300 transition shrink-0 cursor-pointer ${
                        isLast ? "font-bold text-white bg-indigo-500/20 px-1.5 py-0.5 rounded" : "text-slate-400"
                      }`}
                    >
                      {idx === 0 ? "📁 public_html" : bc.name}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Back / Up-one-level button */}
            {parentFolder !== null && (
              <button
                onClick={() => browseFolder(parentFolder)}
                className="w-full flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.04] text-xs font-mono text-slate-300 transition cursor-pointer"
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

            {/* Folders and Files List (With Delete 🗑️ option for each) */}
            <div className="max-h-[540px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
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
                      className="flex items-center justify-between p-2 rounded-xl border border-white/[0.04] bg-white/[0.02] text-slate-300 hover:bg-white/[0.08] hover:text-white transition group"
                    >
                      <div
                        onClick={() => browseFolder(folder.path)}
                        className="flex items-center gap-2 min-w-0 pr-2 flex-1 cursor-pointer"
                      >
                        <Folder className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400/20" />
                        <span className="text-xs font-mono font-medium truncate">
                          {folder.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-500 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.06] font-mono">
                          {folder.item_count} items
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteItemModal({ path: folder.path, type: "folder", name: folder.name });
                          }}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title="ফোল্ডার মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Files Group */}
                  {filteredItemsFiles.map((file) => {
                    const isSelected = selectedFile?.path === file.path;
                    return (
                      <div
                        key={file.path}
                        className={`flex items-center justify-between p-2 rounded-xl border transition group ${
                          isSelected
                            ? "bg-indigo-600/30 border-indigo-500/60 text-white shadow-md shadow-indigo-600/20"
                            : "bg-white/[0.02] border-white/[0.04] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <div
                          onClick={() => openFile(file)}
                          className="flex items-center gap-2 min-w-0 pr-2 flex-1 cursor-pointer"
                        >
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

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteItemModal({ path: file.path, type: "file", name: file.name });
                          }}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition cursor-pointer shrink-0"
                          title="ফাইল মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                        {selectedFile.path}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {selectedFile.size_kb} KB • সর্বশেষ পরিবর্তন:{" "}
                        {selectedFile.modified || "—"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={saveFile}
                    disabled={isSavingFile}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingFile ? "সেভ হচ্ছে..." : "Save File (Ctrl+S)"}</span>
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
                  No Server File Selected
                </h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Click any file in the left Explorer tree to open and live-edit code on Hostinger, or create a brand new endpoint.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔹 Modal: Insert Row into Table */}
      {isInsertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0F172A] rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <span>Insert Row into `{selectedTable}`</span>
              </h3>
              <button
                onClick={() => setIsInsertModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {(tableData?.columns_meta || []).map((col) => {
                const isPK = col.COLUMN_NAME === tableData.primary_key;
                const isAuto = col.EXTRA?.toLowerCase().includes("auto_increment");

                return (
                  <div key={col.COLUMN_NAME} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      {isPK && <Key className="w-3 h-3 text-amber-400" />}
                      <span className="font-mono">{col.COLUMN_NAME}</span>
                      <span className="text-[10px] text-slate-500 lowercase">({col.DATA_TYPE})</span>
                      {isAuto && <span className="text-[10px] text-emerald-400">(Auto-Increment)</span>}
                    </label>
                    <input
                      type="text"
                      placeholder={isAuto ? "Auto generated (leave blank)" : "Value..."}
                      value={insertFormData[col.COLUMN_NAME] ?? ""}
                      onChange={(e) =>
                        setInsertFormData({
                          ...insertFormData,
                          [col.COLUMN_NAME]: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsInsertModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertRow}
                disabled={isInserting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
              >
                {isInserting ? "Inserting..." : "Insert Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Modal: Edit Row in Table */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0F172A] rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <span>Edit Record in `{selectedTable}`</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {tableData?.columns?.map((col) => {
                const isPK = col === tableData.primary_key;
                return (
                  <div key={col} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      {isPK && <Key className="w-3 h-3 text-amber-400" />}
                      <span className="font-mono">{col}</span>
                      {isPK && <span className="text-[10px] text-amber-400">(Primary Key)</span>}
                    </label>
                    <textarea
                      rows={typeof editFormData[col] === "string" && editFormData[col].length > 60 ? 3 : 1}
                      value={editFormData[col] !== null && editFormData[col] !== undefined ? String(editFormData[col]) : ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          [col]: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRow}
                disabled={isUpdating}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Modal: Confirm Delete Table Row */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F172A] rounded-2xl border border-rose-500/30 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-400" />
              <span>রেকর্ড মুছে ফেলা নিশ্চিত করুন</span>
            </h3>

            <p className="text-xs text-slate-300">
              আপনি কি নিশ্চিতভাবে <span className="font-mono text-indigo-300 font-bold">`{selectedTable}`</span> টেবিল থেকে এই রেকর্ডটি মুছে ফেলতে চান?
            </p>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-amber-300">
              {JSON.stringify(deleteTargetPKs, null, 2)}
            </div>

            <p className="text-[11px] text-rose-400">
              ⚠️ এই অ্যাকশনটি অপরিবর্তনীয় (Irreversible)!
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteTargetPKs(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteRow}
                disabled={isDeletingRow}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50"
              >
                {isDeletingRow ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছে ফেলুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Modal: Create New File */}
      {isNewFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F172A] rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>নতুন ফাইল তৈরি করুন</span>
            </h3>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <span className="text-[11px] text-slate-400 block">টার্গেট ফোল্ডার:</span>
                <span className="text-xs font-mono font-bold text-indigo-300">
                  public_html/{currentFolder ? `${currentFolder}/` : ""}
                </span>
              </div>

              <label className="text-xs font-semibold text-slate-300 block">
                ফাইলের নাম
              </label>
              <input
                type="text"
                placeholder="যেমন: my_endpoint.php বা cron_task.php"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createNewFileInCurrentFolder();
                }}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
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

      {/* 🔹 Modal: Create New Folder */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F172A] rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-indigo-400" />
              <span>নতুন ফোল্ডার তৈরি করুন</span>
            </h3>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <span className="text-[11px] text-slate-400 block">লোকেশন:</span>
                <span className="text-xs font-mono font-bold text-indigo-300">
                  public_html/{currentFolder ? `${currentFolder}/` : ""}
                </span>
              </div>

              <label className="text-xs font-semibold text-slate-300 block">
                ফোল্ডারের নাম
              </label>
              <input
                type="text"
                placeholder="যেমন: custom_cron বা logs"
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

      {/* 🔹 Modal: Confirm Delete File or Folder */}
      {deleteItemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F172A] rounded-2xl border border-rose-500/30 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-400" />
              <span>{deleteItemModal.type === "folder" ? "ফোল্ডার" : "ফাইল"} মুছে ফেলুন</span>
            </h3>

            <p className="text-xs text-slate-300">
              আপনি কি নিশ্চিতভাবে নিচের {deleteItemModal.type === "folder" ? "ফোল্ডারটি" : "ফাইলটি"} মুছে ফেলতে চান?
            </p>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-rose-300 break-all">
              public_html/{deleteItemModal.path}
            </div>

            {deleteItemModal.type === "file" && (
              <p className="text-[11px] text-emerald-400">
                🛡️ ফাইলটি মুছে ফেলার পূর্বে .code_backups ফোল্ডারে স্বয়ংক্রিয় ব্যাকআপ সংরক্ষিত হবে।
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteItemModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                disabled={isDeletingItem}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50"
              >
                {isDeletingItem ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, ডিলিট করুন"}
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
