import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  FiFolder, FiFolderPlus, FiFile, FiFilePlus, FiSearch, FiRefreshCw,
  FiSave, FiRotateCcw, FiShield, FiCode, FiCheck, FiAlertTriangle,
  FiChevronRight, FiChevronDown, FiClock, FiHardDrive, FiX, FiLayers
} from 'react-icons/fi';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.creativecomputeracademy.com/';

export default function ServerCodeEditor() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loadingTree, setLoadingTree] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({ 'api': true, 'config': true });

  // Active File & Editor State
  const [activePath, setActivePath] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [savingFile, setSavingFile] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  // New File/Folder Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newPath, setNewPath] = useState('');
  const [newType, setNewType] = useState('file'); // 'file' | 'folder'
  const [templateType, setTemplateType] = useState('api'); // 'api' | 'empty'

  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const isDirty = useMemo(() => {
    return activePath && editorContent !== originalContent;
  }, [activePath, editorContent, originalContent]);

  const lineCount = useMemo(() => {
    return editorContent ? editorContent.split('\n').length : 1;
  }, [editorContent]);

  // Auth Header Helper
  const getHeaders = () => {
    const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token') || localStorage.getItem('token') || '';
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  // 1. Fetch File Tree
  const fetchFileTree = async () => {
    try {
      setLoadingTree(true);
      const res = await axios.get(`${API_BASE}api/admin/code_editor/list_files.php`, {
        headers: getHeaders()
      });
      if (res.data?.status === 'success') {
        setItems(res.data.items || []);
      } else {
        toast.error(res.data?.message || 'Failed to list server files');
      }
    } catch (err) {
      console.error('File list error:', err);
      toast.error(err.response?.data?.message || 'Failed to connect to Server Code Editor API.');
    } finally {
      setLoadingTree(false);
    }
  };

  useEffect(() => {
    fetchFileTree();
  }, []);

  // 2. Open a File
  const handleOpenFile = async (relPath) => {
    if (isDirty) {
      const confirmLeave = window.confirm('You have unsaved changes in the current file. Discard and switch?');
      if (!confirmLeave) return;
    }

    try {
      setLoadingFile(true);
      setActivePath(relPath);
      const res = await axios.get(`${API_BASE}api/admin/code_editor/get_file.php`, {
        params: { path: relPath },
        headers: getHeaders()
      });

      if (res.data?.status === 'success') {
        setFileData(res.data);
        setEditorContent(res.data.content || '');
        setOriginalContent(res.data.content || '');
      } else {
        toast.error(res.data?.message || 'Failed to open file');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error opening file');
    } finally {
      setLoadingFile(false);
    }
  };

  // 3. Save File Content
  const handleSaveFile = async () => {
    if (!activePath) return;

    try {
      setSavingFile(true);
      const res = await axios.post(`${API_BASE}api/admin/code_editor/save_file.php`, {
        path: activePath,
        content: editorContent,
        create_backup: autoBackup
      }, {
        headers: getHeaders()
      });

      if (res.data?.status === 'success') {
        setOriginalContent(editorContent);
        setFileData(prev => ({
          ...prev,
          size: res.data.size,
          last_modified: res.data.last_modified
        }));
        toast.success(`Saved: ${activePath}`, {
          description: res.data.backup_created ? 'Auto-backup created in server/backups.' : undefined
        });
      } else {
        toast.error(res.data?.message || 'Save failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save file to server.');
    } finally {
      setSavingFile(false);
    }
  };

  // 4. Handle Tab Key & Keyboard Shortcut (Ctrl+S / Cmd+S)
  const handleKeyDown = (e) => {
    // Ctrl+S / Cmd+S Save Shortcut
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (isDirty) {
        handleSaveFile();
      }
      return;
    }

    // Tab key inserts 4 spaces instead of losing focus
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newText = editorContent.substring(0, start) + '    ' + editorContent.substring(end);
      setEditorContent(newText);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  // 5. Create New File / Folder
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newPath.trim()) return;

    let initCode = "<?php\n";
    if (templateType === 'api') {
      initCode = `<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';

try {
    $db = (new Database())->getConnection();

    echo json_encode([
        'status' => 'success',
        'message' => 'API Endpoint working successfully'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
`;
    }

    try {
      const res = await axios.post(`${API_BASE}api/admin/code_editor/create_file.php`, {
        path: newPath.trim(),
        type: newType,
        initial_content: initCode
      }, {
        headers: getHeaders()
      });

      if (res.data?.status === 'success') {
        toast.success(`${newType === 'folder' ? 'Folder' : 'File'} created: ${newPath}`);
        setShowNewModal(false);
        setNewPath('');
        await fetchFileTree();
        if (newType === 'file') {
          handleOpenFile(newPath.trim());
        }
      } else {
        toast.error(res.data?.message || 'Creation failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating file');
    }
  };

  // Sync scroll between textarea and line numbers gutter
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Filtered files & folder toggle
  const toggleFolder = (dirPath) => {
    setExpandedFolders(prev => ({
      ...prev,
      [dirPath]: !prev[dirPath]
    }));
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(it => it.path.toLowerCase().includes(q) || it.name.toLowerCase().includes(q));
  }, [items, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <FiCode size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Server Code & File Manager
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                Hostinger Live Sync
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Direct In-Browser PHP Code Editor & Endpoint Creator (Admin & Developer Privileged)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activePath && (
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer mr-3 select-none">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
              />
              Auto-Backup (.bak)
            </label>
          )}

          {activePath && (
            <button
              onClick={() => setEditorContent(originalContent)}
              disabled={!isDirty || savingFile}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition"
              title="Discard unsaved edits"
            >
              <FiRotateCcw size={14} />
              Discard
            </button>
          )}

          <button
            onClick={handleSaveFile}
            disabled={!activePath || !isDirty || savingFile}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition shadow-sm ${
              isDirty
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 ring-1 ring-emerald-400/40'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <FiSave size={14} className={savingFile ? 'animate-spin' : ''} />
            {savingFile ? 'Saving...' : 'Save File (Ctrl+S)'}
          </button>
        </div>
      </header>

      {/* Workspace Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Explorer Sidebar */}
        <aside className="w-80 border-r border-slate-800/80 bg-slate-900/60 flex flex-col shrink-0 select-none">
          {/* Explorer Tools */}
          <div className="p-3 border-b border-slate-800/80 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FiHardDrive size={13} className="text-slate-400" />
                Server Explorer (server/)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowNewModal(true)}
                  title="Create New File / Folder"
                  className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                >
                  <FiFilePlus size={15} />
                </button>
                <button
                  onClick={fetchFileTree}
                  title="Refresh File Tree"
                  className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                >
                  <FiRefreshCw size={13} className={loadingTree ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Quick Search Filter */}
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-2.5 text-slate-500" size={13} />
              <input
                type="text"
                placeholder="Search endpoints / files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs">
            {loadingTree ? (
              <div className="p-4 text-center text-slate-500 text-xs">Loading server directory...</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs">No files matching filter.</div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = activePath === item.path;
                const isDir = item.type === 'dir';

                if (isDir) {
                  const isExp = expandedFolders[item.path];
                  return (
                    <div
                      key={item.path}
                      onClick={() => toggleFolder(item.path)}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-slate-300 hover:bg-slate-800/60 cursor-pointer font-bold text-xs"
                    >
                      {isExp ? <FiChevronDown size={14} className="text-slate-500" /> : <FiChevronRight size={14} className="text-slate-500" />}
                      <FiFolder className="text-amber-400 shrink-0" size={14} />
                      <span className="truncate">{item.name}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.path}
                    onClick={() => handleOpenFile(item.path)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-600/20 text-emerald-300 font-semibold border-l-2 border-emerald-500 pl-2'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FiFile size={13} className={item.extension === 'php' ? 'text-indigo-400' : 'text-slate-400'} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isSelected && isDirty && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" title="Unsaved changes" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Center Code Editor Area */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
          {activePath ? (
            <>
              {/* Active Tab Bar */}
              <div className="h-9 bg-slate-900 border-b border-slate-800/80 px-4 flex items-center justify-between text-xs shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-300 font-semibold">{fileData?.filename || activePath}</span>
                  <span className="text-[11px] text-slate-500 font-mono">({activePath})</span>
                  {isDirty ? (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/60 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                      ● Unsaved Edits
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                      <FiCheck size={11} /> Saved
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
                  <span>Lines: {lineCount}</span>
                  <span>Size: {Math.round((editorContent.length || 0) / 1024 * 10) / 10} KB</span>
                  {fileData?.last_modified && (
                    <span className="hidden md:inline">Last Sync: {fileData.last_modified}</span>
                  )}
                </div>
              </div>

              {/* Editor Code Area with Line Numbers */}
              <div className="flex-1 flex overflow-hidden relative bg-[#090d16]">
                {loadingFile ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-20">
                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                      <FiRefreshCw className="animate-spin text-emerald-400" size={18} />
                      Loading file from server...
                    </div>
                  </div>
                ) : null}

                {/* Line Numbers Gutter */}
                <div
                  ref={lineNumbersRef}
                  className="w-12 bg-slate-950/80 border-r border-slate-800/60 py-3 pr-2 text-right select-none font-mono text-xs text-slate-600 overflow-hidden shrink-0 leading-5"
                >
                  {Array.from({ length: lineCount }).map((_, idx) => (
                    <div key={idx} className="h-5">{idx + 1}</div>
                  ))}
                </div>

                {/* Main Textarea */}
                <textarea
                  ref={textareaRef}
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onScroll={handleScroll}
                  spellCheck={false}
                  placeholder="Paste or write your PHP / server code here..."
                  className="flex-1 h-full bg-transparent p-3 font-mono text-xs text-slate-100 placeholder-slate-600 resize-none focus:outline-none leading-5 selection:bg-emerald-600/40 tab-4 overflow-auto"
                />
              </div>

              {/* Bottom Status Bar */}
              <footer className="h-6 bg-slate-900 border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0 select-none">
                <div className="flex items-center gap-3">
                  <span>UTF-8</span>
                  <span>PHP (Hypertext Preprocessor)</span>
                  <span>Indent: 4 Spaces</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <FiShield size={12} className="text-emerald-500" />
                  <span>Jail Boundary: server/</span>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 select-none">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4">
                <FiCode size={28} />
              </div>
              <h2 className="text-base font-bold text-slate-300 mb-1">No File Selected</h2>
              <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
                Click any PHP file in the left Explorer to open and edit live code on Hostinger, or create a brand new file.
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                <FiFilePlus size={15} />
                Create New Endpoint
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Create New File / Folder Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FiFilePlus className="text-emerald-400" />
                Create New File or Folder
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <FiX size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('file')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border text-center transition ${
                      newType === 'file'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    PHP / Text File
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('folder')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border text-center transition ${
                      newType === 'folder'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Directory / Folder
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Relative Path inside server/
                </label>
                <input
                  type="text"
                  placeholder={newType === 'folder' ? 'api/custom_feature' : 'api/custom_feature/my_endpoint.php'}
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Example: <code>api/breaks/my_test.php</code>
                </p>
              </div>

              {newType === 'file' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Boilerplate Template</label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="api">Standard CCA API Endpoint (CORS + Database + JSON)</option>
                    <option value="empty">Blank PHP File (&lt;?php)</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition"
                >
                  Create {newType === 'folder' ? 'Folder' : 'File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
