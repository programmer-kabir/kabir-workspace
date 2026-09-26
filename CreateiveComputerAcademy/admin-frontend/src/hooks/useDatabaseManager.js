import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * useDatabaseManager Hook
 * Pure JavaScript custom hook managing schema metadata, table records,
 * pagination, CRUD operations, and SQL runner queries.
 * (Contains ZERO JSX elements).
 */
export function useDatabaseManager() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'explorer' | 'sql'
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [loadingTables, setLoadingTables] = useState(true);

  // System Health & Storage State
  const [systemHealth, setSystemHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Table Data State
  const [tableData, setTableData] = useState({
    columns: [],
    primary_keys: [],
    rows: [],
    pagination: {
      page: 1,
      limit: 25,
      total_records: 0,
      total_pages: 0,
      sort_col: '',
      sort_dir: 'DESC',
      search: ''
    }
  });
  const [loadingData, setLoadingData] = useState(false);
  const [rowSearchInput, setRowSearchInput] = useState('');

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [showColDropdown, setShowColDropdown] = useState(false);

  // Modals & Drawers
  const [editModal, setEditModal] = useState({ isOpen: false, row: null, table: '' });
  const [insertModal, setInsertModal] = useState({ isOpen: false, data: {}, table: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, row: null, table: '', fromSql: false });
  const [jsonViewModal, setJsonViewModal] = useState({ isOpen: false, title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  // SQL Runner State
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users LIMIT 25;');
  const [sqlResult, setSqlResult] = useState(null);
  const [executingSql, setExecutingSql] = useState(false);
  const [queryHistory, setQueryHistory] = useState([
    'SELECT * FROM users LIMIT 25;',
    'SELECT * FROM attendance ORDER BY id DESC LIMIT 20;',
    'SELECT * FROM tasks WHERE status = "pending";',
    'SHOW TABLES;'
  ]);

  // Copied cell tooltip
  const [copiedKey, setCopiedKey] = useState(null);

  // Detect target table name from SQL Query
  const sqlDetectedTable = useMemo(() => {
    if (!sqlQuery) return selectedTable || '';
    const match = sqlQuery.match(/from\s+[`]?([a-zA-Z0-9_]+)[`]?/i);
    return match ? match[1] : (selectedTable || '');
  }, [sqlQuery, selectedTable]);

  // Stats calculation
  const totalDbRows = useMemo(() => tables.reduce((sum, t) => sum + (t.rows || 0), 0), [tables]);
  const totalDbSize = useMemo(() => {
    const totalBytes = tables.reduce((sum, t) => sum + (t.data_size || 0) + (t.index_size || 0), 0);
    return (totalBytes / (1024 * 1024)).toFixed(2);
  }, [tables]);

  // Fetch Tables
  const fetchTables = async (selectDefault = false) => {
    setLoadingTables(true);
    try {
      const res = await axios.get(`${API_BASE}api/admin/database/get_tables.php`);
      if (res.data.status === 'success') {
        const fetchedTables = res.data.tables || [];
        setTables(fetchedTables);
        if ((selectDefault || !selectedTable) && fetchedTables.length > 0) {
          const defaultTable = fetchedTables.find(t => t.name === 'users')?.name || fetchedTables[0].name;
          setSelectedTable(defaultTable);
        }
      } else {
        toast.error(res.data.message || 'Failed to load tables');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to database API');
    } finally {
      setLoadingTables(false);
    }
  };

  // Fetch System Health (Cloudflare R2 Storage & MariaDB Status)
  const fetchSystemHealth = async (showToast = false) => {
    setLoadingHealth(true);
    try {
      const res = await axios.get(`${API_BASE}api/admin/database/get_system_health.php`);
      if (res.data && res.data.status === 'success') {
        setSystemHealth(res.data);
        if (showToast) {
          toast.success('Storage & System Health updated');
        }
        return;
      }
    } catch (err) {
      // Gracefully continue with local metrics
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchTables(true);
    fetchSystemHealth();
  }, []);

  // Fetch Table Data
  const fetchTableData = async (table, page = 1, limit = 25, search = '', sortCol = '', sortDir = 'DESC') => {
    if (!table) return;
    setLoadingData(true);
    try {
      const params = {
        table,
        page,
        limit,
        search,
        sort_col: sortCol,
        sort_dir: sortDir
      };
      const res = await axios.get(`${API_BASE}api/admin/database/get_table_data.php`, { params });
      if (res.data.status === 'success') {
        setTableData(res.data);
        if (res.data.columns) {
          setVisibleColumns(res.data.columns.map(c => c.name));
        }
      } else {
        toast.error(res.data.message || 'Failed to load table records');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching table records');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (selectedTable) {
      setRowSearchInput('');
      fetchTableData(selectedTable, 1, tableData.pagination?.limit || 25, '', '', 'DESC');
    }
  }, [selectedTable]);

  // Search Filtered Tables list
  const filteredTables = useMemo(() => {
    if (!tableSearch) return tables;
    return tables.filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase()));
  }, [tables, tableSearch]);

  // Handle Sort
  const handleSort = (colName) => {
    let nextDir = 'ASC';
    if (tableData.pagination.sort_col === colName && tableData.pagination.sort_dir === 'ASC') {
      nextDir = 'DESC';
    }
    fetchTableData(
      selectedTable,
      tableData.pagination.page,
      tableData.pagination.limit,
      tableData.pagination.search,
      colName,
      nextDir
    );
  };

  // Handle Row Search Submit
  const handleRowSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    fetchTableData(
      selectedTable,
      1,
      tableData.pagination.limit,
      rowSearchInput,
      tableData.pagination.sort_col,
      tableData.pagination.sort_dir
    );
  };

  // Handle Page Change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > tableData.pagination.total_pages) return;
    fetchTableData(
      selectedTable,
      newPage,
      tableData.pagination.limit,
      tableData.pagination.search,
      tableData.pagination.sort_col,
      tableData.pagination.sort_dir
    );
  };

  // Handle Limit Change
  const handleLimitChange = (newLimit) => {
    fetchTableData(
      selectedTable,
      1,
      parseInt(newLimit),
      tableData.pagination.search,
      tableData.pagination.sort_col,
      tableData.pagination.sort_dir
    );
  };

  // Copy cell value
  const handleCopyCell = (text, key) => {
    if (text === null || text === undefined) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    toast.success('Copied to clipboard', { duration: 1500 });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Column toggle
  const toggleColumn = (colName) => {
    setVisibleColumns(prev =>
      prev.includes(colName) ? prev.filter(c => c !== colName) : [...prev, colName]
    );
  };

  // Open Insert Modal
  const openInsertModal = () => {
    const initialData = {};
    tableData.columns.forEach(col => {
      initialData[col.name] = col.default_value !== null ? col.default_value : '';
    });
    setInsertModal({ isOpen: true, data: initialData, table: selectedTable });
  };

  // Submit Insert Row
  const handleInsertRow = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmitting(true);
    const target = insertModal.table || selectedTable;
    try {
      const res = await axios.post(`${API_BASE}api/admin/database/insert_row.php`, {
        table: target,
        data: insertModal.data
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Row inserted successfully');
        setInsertModal({ isOpen: false, data: {}, table: '' });
        fetchTableData(selectedTable, 1, tableData.pagination.limit, tableData.pagination.search);
        fetchTables();
      } else {
        toast.error(res.data.message || 'Failed to insert row');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error inserting row');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (row, table = selectedTable) => {
    setEditModal({ isOpen: true, row: { ...row }, table });
  };

  // Submit Edit Row
  const handleUpdateRow = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmitting(true);
    const target = editModal.table || selectedTable;

    const primaryKeys = {};
    if (tableData.primary_keys.length > 0) {
      tableData.primary_keys.forEach(pk => {
        if (editModal.row[pk] !== undefined) primaryKeys[pk] = editModal.row[pk];
      });
    } else if (editModal.row.id !== undefined) {
      primaryKeys['id'] = editModal.row.id;
    }

    try {
      const res = await axios.post(`${API_BASE}api/admin/database/update_row.php`, {
        table: target,
        primary_keys: primaryKeys,
        data: editModal.row
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Row updated successfully');
        setEditModal({ isOpen: false, row: null, table: '' });
        if (activeTab === 'explorer') {
          fetchTableData(
            selectedTable,
            tableData.pagination.page,
            tableData.pagination.limit,
            tableData.pagination.search,
            tableData.pagination.sort_col,
            tableData.pagination.sort_dir
          );
        } else {
          handleExecuteSql();
        }
      } else {
        toast.error(res.data.message || 'Failed to update row');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating row');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (row, table = selectedTable, fromSql = false) => {
    setDeleteModal({ isOpen: true, row, table, fromSql });
  };

  // Submit Delete Row
  const handleDeleteRow = async () => {
    if (!deleteModal.row) return;
    setSubmitting(true);
    const target = deleteModal.table || selectedTable;

    const primaryKeys = {};
    if (tableData.primary_keys.length > 0 && tableData.table === target) {
      tableData.primary_keys.forEach(pk => {
        if (deleteModal.row[pk] !== undefined) primaryKeys[pk] = deleteModal.row[pk];
      });
    } else if (deleteModal.row.id !== undefined) {
      primaryKeys['id'] = deleteModal.row.id;
    } else {
      const firstCol = Object.keys(deleteModal.row)[0];
      primaryKeys[firstCol] = deleteModal.row[firstCol];
    }

    try {
      const res = await axios.post(`${API_BASE}api/admin/database/delete_row.php`, {
        table: target,
        primary_keys: primaryKeys
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Row deleted successfully');
        setDeleteModal({ isOpen: false, row: null, table: '', fromSql: false });
        if (deleteModal.fromSql || activeTab === 'sql') {
          handleExecuteSql();
        } else {
          fetchTableData(
            selectedTable,
            tableData.pagination.page,
            tableData.pagination.limit,
            tableData.pagination.search
          );
        }
        fetchTables();
      } else {
        toast.error(res.data.message || 'Failed to delete row');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting row');
    } finally {
      setSubmitting(false);
    }
  };

  // Convert SELECT query to DELETE query
  const handleConvertToDelete = () => {
    if (!sqlQuery.trim().toLowerCase().startsWith('select')) {
      toast.info('Query is not a SELECT statement');
      return;
    }
    const converted = sqlQuery.replace(/^select\s+.*?\s+from\s+/i, 'DELETE FROM ');
    setSqlQuery(converted);
    toast.info('Query converted to DELETE statement. Review before executing!');
  };

  // Export Table Data
  const exportData = (format, customRows = null, customCols = null, customName = null) => {
    const rowsToExport = customRows || tableData.rows;
    const nameToExport = customName || selectedTable;
    if (!rowsToExport || rowsToExport.length === 0) {
      toast.warning('No data to export');
      return;
    }

    if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rowsToExport, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${nameToExport}_export.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Exported to JSON');
    } else if (format === 'csv') {
      const headers = customCols || (tableData.columns ? tableData.columns.map(c => c.name) : Object.keys(rowsToExport[0]));
      const csvRows = [
        headers.join(','),
        ...rowsToExport.map(row =>
          headers.map(field => {
            const val = row[field] === null ? '' : String(row[field]);
            return `"${val.replace(/"/g, '""')}"`;
          }).join(',')
        )
      ];
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${nameToExport}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Exported to CSV');
    }
  };

  // Run Custom SQL Query
  const handleExecuteSql = async (customQ = null) => {
    const queryToRun = customQ || sqlQuery;
    if (!queryToRun.trim()) {
      toast.warning('Please enter a SQL query');
      return;
    }
    setExecutingSql(true);
    try {
      const res = await axios.post(`${API_BASE}api/admin/database/run_query.php`, {
        query: queryToRun
      });
      setSqlResult(res.data);
      if (res.data.status === 'success') {
        toast.success(res.data.message || `Query executed in ${res.data.execution_time_ms}ms`);
        if (!queryHistory.includes(queryToRun)) {
          setQueryHistory(prev => [queryToRun, ...prev.slice(0, 9)]);
        }
        fetchTables();
      } else {
        toast.error(res.data.message || 'Query execution error');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to execute SQL query');
    } finally {
      setExecutingSql(false);
    }
  };

  // Keyboard shortcut Ctrl+Enter for SQL runner
  const handleKeyDownSql = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecuteSql();
    }
  };

  const selectedTableInfo = useMemo(() => {
    return tables.find(t => t.name === selectedTable) || null;
  }, [tables, selectedTable]);

  return {
    API_BASE,
    activeTab,
    setActiveTab,
    tables,
    setTables,
    selectedTable,
    setSelectedTable,
    selectedTableInfo,
    tableSearch,
    setTableSearch,
    loadingTables,
    tableData,
    setTableData,
    loadingData,
    rowSearchInput,
    setRowSearchInput,
    visibleColumns,
    setVisibleColumns,
    showColDropdown,
    setShowColDropdown,
    editModal,
    setEditModal,
    insertModal,
    setInsertModal,
    deleteModal,
    setDeleteModal,
    jsonViewModal,
    setJsonViewModal,
    submitting,
    sqlQuery,
    setSqlQuery,
    sqlResult,
    setSqlResult,
    executingSql,
    queryHistory,
    setQueryHistory,
    copiedKey,
    sqlDetectedTable,
    totalDbRows,
    totalDbSize,
    systemHealth,
    loadingHealth,
    fetchSystemHealth,
    fetchTables,
    fetchTableData,
    filteredTables,
    handleSort,
    handleRowSearch,
    handlePageChange,
    handleLimitChange,
    handleCopyCell,
    toggleColumn,
    openInsertModal,
    handleInsertRow,
    openEditModal,
    handleUpdateRow,
    openDeleteModal,
    handleDeleteRow,
    handleConvertToDelete,
    exportData,
    handleExecuteSql,
    handleKeyDownSql
  };
}
