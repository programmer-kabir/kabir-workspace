import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  FiFolder, FiFolderPlus, FiFile, FiFilePlus, FiSearch, FiRefreshCw,
  FiSave, FiRotateCcw, FiShield, FiCode, FiCheck, FiAlertTriangle,
  FiChevronRight, FiChevronDown, FiClock, FiHardDrive, FiX, FiLayers,
  FiDatabase, FiFileText
} from 'react-icons/fi';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Helper to determine file icon
const FileTypeIcon = ({ ext }) => {
  switch (ext) {
    case 'php':
      return <span className="text-[9px] font-black tracking-tighter text-indigo-400 bg-indigo-950/80 px-1 py-0.5 rounded border border-indigo-700/60 leading-none">PHP</span>;
    case 'json':
      return <span className="text-[10px] font-bold text-amber-400 font-mono leading-none">{'{}'}</span>;
    case 'sql':
      return <FiDatabase size={12} className="text-emerald-400 shrink-0" />;
    case 'md':
    case 'txt':
    case 'log':
      return <FiFileText size={12} className="text-slate-400 shrink-0" />;
    default:
      return <FiFile size={12} className="text-slate-400 shrink-0" />;
  }
};

// Recursive Tree Node Component
const TreeNode = ({
  node,
  depth = 0,
  activePath,
  onOpenFile,
  expandedFolders,
  toggleFolder,
  isDirty
}) => {
  const isDir = node.type === 'dir';
  const isExpanded = !!expandedFolders[node.path];
  const isSelected = activePath === node.path;
  const paddingLeft = depth * 14 + 8;

  if (isDir) {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;

    return (
      <div className="relative">
        <div
          onClick={(e) => toggleFolder(node.path, e)}
          style={{ paddingLeft: `${paddingLeft}px` }}
          className={`flex items-center gap-1.5 py-1.5 pr-2 rounded-lg cursor-pointer select-none text-xs transition group ${
            isExpanded
              ? 'text-slate-200 hover:bg-slate-800/60'
              : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
          }`}
        >
          <span className="w-3.5 h-3.5 flex items-center justify-center text-slate-500 group-hover:text-slate-300 shrink-0">
            {isExpanded ? (
              <FiChevronDown size={13} className="text-slate-400" />
            ) : (
              <FiChevronRight size={13} className="text-slate-500" />
            )}
          </span>
          <FiFolder
            size={14}
            className={`shrink-0 transition-colors ${
              isExpanded ? 'text-amber-400' : 'text-amber-500/80'
            }`}
          />
          <span className="truncate font-semibold tracking-tight">{node.name}</span>
          {node.children && (
            <span className="text-[10px] text-slate-600 font-mono ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              {node.children.length}
            </span>
          )}
        </div>

        {/* Children Subtree with Vertical Indentation Guide */}
        {isExpanded && hasChildren && (
          <div className="relative">
            <div
              style={{ left: `${paddingLeft + 6}px` }}
              className="absolute top-0 bottom-1 w-[1px] bg-slate-800/80 pointer-events-none"
            />
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                activePath={activePath}
                onOpenFile={onOpenFile}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                isDirty={isDirty}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File Item
  const filePaddingLeft = depth * 14 + 22; // Indent aligned with folder text
  const fileIsDirty = isSelected && isDirty;

  return (
    <div
      onClick={() => onOpenFile(node.path)}
      style={{ paddingLeft: `${filePaddingLeft}px` }}
      className={`flex items-center justify-between py-1.5 pr-2.5 rounded-lg cursor-pointer transition select-none text-xs group ${
        isSelected
          ? 'bg-cyan-500/15 text-cyan-300 font-semibold border-l-2 border-cyan-400'
          : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        <FileTypeIcon ext={node.extension} />
        <span className="truncate font-mono text-[11px]">{node.name}</span>
      </div>
      {fileIsDirty && (
        <span
          className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0 ml-2 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
          title="Unsaved changes"
        />
      )}
    </div>
  );
};

// Filter a recursive tree by search query
function filterTree(nodes, query) {
  if (!query.trim()) return nodes;
  const q = query.toLowerCase();

  const filtered = [];
  for (const node of nodes) {
    if (node.type === 'dir') {
      const filteredChildren = filterTree(node.children || [], query);
      const nameMatch = node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q);
      if (nameMatch || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren
        });
      }
    } else {
      if (node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q)) {
        filtered.push(node);
      }
    }
  }
  return filtered;
}

// Extract all directory paths from tree for expand-all
function getAllDirPaths(nodes, acc = {}) {
  for (const node of nodes) {
    if (node.type === 'dir') {
      acc[node.path] = true;
      if (node.children) {
        getAllDirPaths(node.children, acc);
      }
    }
  }
  return acc;
}

export default function ServerCodeEditorTab() {
  const [treeData, setTreeData] = useState([]);
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
    const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token') || '';
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
        const receivedTree = res.data.tree || [];
        setTreeData(receivedTree);

        // Auto-expand root directories on initial load
        if (Object.keys(expandedFolders).length <= 2) {
          const initialExpanded = {};
          receivedTree.forEach(node => {
            if (node.type === 'dir') {
              initialExpanded[node.path] = true;
              if (node.children) {
                node.children.forEach(sub => {
                  if (sub.type === 'dir' && ['admin', 'attendance', 'auth', 'developer'].includes(sub.name)) {
                    initialExpanded[sub.path] = true;
                  }
                });
              }
            }
          });
          setExpandedFolders(prev => ({ ...prev, ...initialExpanded }));
        }
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

  // Folder toggling
  const toggleFolder = (dirPath, e) => {
    e?.stopPropagation?.();
    setExpandedFolders(prev => ({
      ...prev,
      [dirPath]: !prev[dirPath]
    }));
  };

  const handleExpandAll = () => {
    const all = getAllDirPaths(treeData);
    setExpandedFolders(all);
  };

  const handleCollapseAll = () => {
    setExpandedFolders({});
  };

  // Filtered Tree & Auto-Expand when searching
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return treeData;
    return filterTree(treeData, searchQuery);
  }, [treeData, searchQuery]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const matching = getAllDirPaths(filteredTree);
      setExpandedFolders(prev => ({ ...prev, ...matching }));
    }
  }, [searchQuery, filteredTree]);

  // Breadcrumbs calculation
  const breadcrumbs = useMemo(() => {
    if (!activePath) return [];
    return activePath.split('/');
  }, [activePath]);

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/95 overflow-hidden shadow-2xl flex flex-col min-h-[720px] h-[calc(100vh-230px)]">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/80 px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <FiCode size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Server File Manager & Live PHP Editor
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                Hostinger Backend Sync
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Direct Server File Tree & Live Code Editor (Developer & Admin Authorized)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activePath && (
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer mr-3 select-none">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
              />
              Auto-Backup (.bak)
            </label>
          )}

          {activePath && (
            <button
              onClick={() => setEditorContent(originalContent)}
              disabled={!isDirty || savingFile}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
              title="Discard unsaved edits"
            >
              <FiRotateCcw size={14} />
              Discard
            </button>
          )}

          <button
            onClick={handleSaveFile}
            disabled={!activePath || !isDirty || savingFile}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer ${
              isDirty
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-cyan-900/30 ring-1 ring-cyan-400/40'
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
        <aside className="w-80 border-r border-slate-800 bg-slate-950/70 flex flex-col shrink-0 select-none">
          {/* Explorer Tools */}
          <div className="p-3 border-b border-slate-800 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FiHardDrive size={13} className="text-cyan-400" />
                Server Explorer
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleExpandAll}
                  title="Expand All Folders"
                  className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition text-[11px] font-mono px-1.5 cursor-pointer"
                >
                  +All
                </button>
                <button
                  onClick={handleCollapseAll}
                  title="Collapse All Folders"
                  className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition text-[11px] font-mono px-1.5 cursor-pointer"
                >
                  -All
                </button>
                <button
                  onClick={() => setShowNewModal(true)}
                  title="Create New File / Folder"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition cursor-pointer"
                >
                  <FiFilePlus size={15} />
                </button>
                <button
                  onClick={fetchFileTree}
                  title="Refresh File Tree"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
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
                placeholder="Search files / folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Hierarchical Tree Container */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs custom-scrollbar">
            {loadingTree ? (
              <div className="p-6 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <FiRefreshCw className="animate-spin text-cyan-400" size={18} />
                Loading hierarchical tree...
              </div>
            ) : filteredTree.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No matching files or folders found.
              </div>
            ) : (
              filteredTree.map((node) => (
                <TreeNode
                  key={node.path}
                  node={node}
                  depth={0}
                  activePath={activePath}
                  onOpenFile={handleOpenFile}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                  isDirty={isDirty}
                />
              ))
            )}
          </div>
        </aside>

        {/* Center Code Editor Area */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
          {activePath ? (
            <>
              {/* Active Tab & Breadcrumb Bar */}
              <div className="h-9 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between text-xs shrink-0 select-none">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="text-slate-500 font-mono text-[11px]">server</span>
                  {breadcrumbs.map((part, index) => (
                    <React.Fragment key={index}>
                      <span className="text-slate-600 text-[10px]">&gt;</span>
                      <span
                        className={`font-mono truncate ${
                          index === breadcrumbs.length - 1
                            ? 'text-slate-200 font-bold'
                            : 'text-slate-400'
                        }`}
                      >
                        {part}
                      </span>
                    </React.Fragment>
                  ))}

                  {isDirty ? (
                    <span className="ml-2 text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/60 px-1.5 py-0.2 rounded-full flex items-center gap-1 shrink-0">
                      ● Unsaved
                    </span>
                  ) : (
                    <span className="ml-2 text-[10px] font-medium text-emerald-400 flex items-center gap-1 shrink-0">
                      <FiCheck size={11} /> Saved
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono shrink-0 ml-2">
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
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <FiRefreshCw className="animate-spin text-cyan-400" size={18} />
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
                  placeholder="Write or edit server PHP code here..."
                  className="flex-1 h-full bg-transparent p-3 font-mono text-xs text-slate-100 placeholder-slate-600 resize-none focus:outline-none leading-5 selection:bg-cyan-600/40 tab-4 overflow-auto"
                />
              </div>

              {/* Bottom Status Bar */}
              <footer className="h-6 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0 select-none">
                <div className="flex items-center gap-3">
                  <span>UTF-8</span>
                  <span>PHP (Hypertext Preprocessor)</span>
                  <span>Indent: 4 Spaces</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <FiShield size={12} className="text-cyan-400" />
                  <span>Jail Boundary: server/</span>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 select-none">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-500/60 mb-4 shadow-inner">
                <FiCode size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-300 mb-1">No Server File Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                Click any file in the left Explorer tree to open and live-edit code on Hostinger, or create a brand new endpoint.
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FiFilePlus className="text-cyan-400" />
                Create New File or Folder
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
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
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${
                      newType === 'file'
                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    PHP / Text File
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('folder')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${
                      newType === 'folder'
                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
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
                  placeholder={newType === 'folder' ? 'api/custom_module' : 'api/custom_module/endpoint.php'}
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Example: <code>api/custom/sample.php</code>
                </p>
              </div>

              {newType === 'file' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Boilerplate Template</label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg transition cursor-pointer"
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
