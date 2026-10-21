import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  FiFolder, FiFolderPlus, FiFile, FiFilePlus, FiSearch, FiRefreshCw,
  FiSave, FiRotateCcw, FiShield, FiCode, FiCheck, FiAlertTriangle,
  FiChevronRight, FiChevronDown, FiChevronUp, FiClock, FiHardDrive, FiX, FiLayers,
  FiDatabase, FiFileText, FiMaximize2, FiMinimize2, FiZoomIn, FiZoomOut, FiAlignLeft, FiRepeat
} from 'react-icons/fi';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Helper to determine file icon
const FileTypeIcon = ({ ext }) => {
  switch (ext) {
    case 'php':
      return <span className="text-[9px] font-black tracking-tighter text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/80 px-1 py-0.5 rounded border border-indigo-200 dark:border-indigo-700/60 leading-none">PHP</span>;
    case 'json':
      return <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 font-mono leading-none">{'{}'}</span>;
    case 'sql':
      return <FiDatabase size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />;
    case 'md':
    case 'txt':
    case 'log':
      return <FiFileText size={12} className="text-slate-500 dark:text-slate-400 shrink-0" />;
    default:
      return <FiFile size={12} className="text-slate-500 dark:text-slate-400 shrink-0" />;
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
  isDirty,
  onNewItemInFolder
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
              ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span className="w-3.5 h-3.5 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0">
            {isExpanded ? (
              <FiChevronDown size={13} className="text-slate-500 dark:text-slate-400" />
            ) : (
              <FiChevronRight size={13} className="text-slate-400 dark:text-slate-500" />
            )}
          </span>
          <FiFolder
            size={14}
            className={`shrink-0 transition-colors ${
              isExpanded ? 'text-amber-500 dark:text-amber-400' : 'text-amber-600/80 dark:text-amber-500/80'
            }`}
          />
          <span className="truncate font-semibold tracking-tight">{node.name}</span>

          {/* Quick Hover Actions to add file or folder directly inside THIS directory */}
          <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNewItemInFolder?.('file', node.path);
              }}
              title={`New File inside ${node.path}`}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer"
            >
              <FiFilePlus size={12} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNewItemInFolder?.('folder', node.path);
              }}
              title={`New Folder inside ${node.path}`}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer"
            >
              <FiFolderPlus size={12} />
            </button>
            {node.children && (
              <span className="text-[10px] text-slate-400 dark:text-slate-600 font-mono ml-0.5">
                {node.children.length}
              </span>
            )}
          </div>
        </div>

        {/* Children Subtree with Vertical Indentation Guide */}
        {isExpanded && hasChildren && (
          <div className="relative">
            <div
              style={{ left: `${paddingLeft + 6}px` }}
              className="absolute top-0 bottom-1 w-[1px] bg-slate-200 dark:bg-slate-800/80 pointer-events-none"
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
                onNewItemInFolder={onNewItemInFolder}
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
          ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold border-l-2 border-cyan-500 dark:border-cyan-400'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        <FileTypeIcon ext={node.extension} />
        <span className="truncate font-mono text-[11px]">{node.name}</span>
      </div>
      {fileIsDirty && (
        <span
          className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse shrink-0 ml-2 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
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

// Extract flat list of directory paths
function getDirectoryList(nodes, acc = []) {
  for (const node of nodes) {
    if (node.type === 'dir') {
      acc.push(node.path);
      if (node.children) {
        getDirectoryList(node.children, acc);
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

  // IDE Fluid Smoothness & Keyboard States
  const [activeLine, setActiveLine] = useState(1);
  const [activeCol, setActiveCol] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [wordWrap, setWordWrap] = useState(false);

  // Find & Replace States
  const [showFindBar, setShowFindBar] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplaceRow, setShowReplaceRow] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [matchIndices, setMatchIndices] = useState([]);
  const findInputRef = useRef(null);

  // Directory List & Active Folder calculation
  const directoryList = useMemo(() => {
    const list = getDirectoryList(treeData);
    return Array.from(new Set(['api', ...list]));
  }, [treeData]);

  const getParentDir = (filePath) => {
    if (!filePath) return 'api';
    const idx = filePath.lastIndexOf('/');
    return idx !== -1 ? filePath.substring(0, idx) : 'api';
  };

  // New File/Folder Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newType, setNewType] = useState('file'); // 'file' | 'folder'
  const [targetDir, setTargetDir] = useState('api');
  const [newName, setNewName] = useState('');
  const [templateType, setTemplateType] = useState('api'); // 'api' | 'empty'

  const handleOpenCreateModal = (type = 'file', customDir = null) => {
    setNewType(type);
    const destination = customDir || (activePath ? getParentDir(activePath) : 'api');
    setTargetDir(destination);
    setNewName('');
    setShowNewModal(true);
  };

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

  // 4. Cursor position & Active Line Tracker
  const updateCursorPosition = (customPos = null, customContent = null) => {
    if (!textareaRef.current) return;
    const pos = customPos !== null ? customPos : textareaRef.current.selectionStart;
    const content = customContent !== null ? customContent : editorContent;
    const textBefore = content.substring(0, pos);
    const lines = textBefore.split('\n');
    setActiveLine(lines.length);
    setActiveCol(lines[lines.length - 1].length + 1);
  };

  // Jump to specific line on gutter click
  const handleLineClick = (lineNum) => {
    if (!textareaRef.current) return;
    const lines = editorContent.split('\n');
    let pos = 0;
    for (let i = 0; i < lineNum - 1 && i < lines.length; i++) {
      pos += lines[i].length + 1;
    }
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(pos, pos + (lines[lineNum - 1]?.length || 0));
    updateCursorPosition(pos);
  };

  // Find & Replace match finder
  useEffect(() => {
    if (!findQuery || !editorContent) {
      setMatchIndices([]);
      setMatchCount(0);
      setCurrentMatchIdx(0);
      return;
    }
    const q = findQuery.toLowerCase();
    const text = editorContent.toLowerCase();
    const indices = [];
    let startIdx = 0;
    while ((startIdx = text.indexOf(q, startIdx)) !== -1) {
      indices.push(startIdx);
      startIdx += q.length;
    }
    setMatchIndices(indices);
    setMatchCount(indices.length);
    setCurrentMatchIdx(indices.length > 0 ? 1 : 0);
  }, [findQuery, editorContent]);

  const jumpToMatch = (idx) => {
    if (!matchIndices.length || !textareaRef.current) return;
    const pos = matchIndices[idx];
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(pos, pos + findQuery.length);
    updateCursorPosition(pos);
  };

  const handleNextMatch = () => {
    if (!matchIndices.length) return;
    const nextIdx = (currentMatchIdx % matchIndices.length);
    setCurrentMatchIdx(nextIdx + 1);
    jumpToMatch(nextIdx);
  };

  const handlePrevMatch = () => {
    if (!matchIndices.length) return;
    const prevIdx = (currentMatchIdx - 2 + matchIndices.length) % matchIndices.length;
    setCurrentMatchIdx(prevIdx + 1);
    jumpToMatch(prevIdx);
  };

  const handleReplace = () => {
    if (!matchIndices.length || !findQuery) return;
    const currentPos = matchIndices[currentMatchIdx - 1];
    if (currentPos === undefined) return;
    const newText = editorContent.substring(0, currentPos) + replaceQuery + editorContent.substring(currentPos + findQuery.length);
    setEditorContent(newText);
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    const newText = editorContent.split(findQuery).join(replaceQuery);
    setEditorContent(newText);
    toast.success(`Replaced ${matchCount} occurrence(s)`);
  };

  // 5. Advanced IDE Keyboard Shortcuts (Auto-brackets, smart Enter, Duplicate line, Commenting, Tab)
  const handleKeyDown = (e) => {
    // 1. Ctrl+S Save
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (isDirty) {
        handleSaveFile();
      }
      return;
    }

    // 2. Ctrl+F Find
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setShowFindBar(prev => {
        const next = !prev;
        if (next) {
          setTimeout(() => findInputRef.current?.focus(), 50);
        }
        return next;
      });
      return;
    }

    // 3. Escape key closes find or exits fullscreen
    if (e.key === 'Escape') {
      if (showFindBar) {
        setShowFindBar(false);
        textareaRef.current?.focus();
        return;
      }
      if (isFullscreen) {
        setIsFullscreen(false);
        return;
      }
    }

    // 4. Ctrl+D Duplicate Line
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      const target = e.target;
      const start = target.selectionStart;
      const lastNewline = editorContent.lastIndexOf('\n', start - 1);
      const nextNewline = editorContent.indexOf('\n', start);
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
      const lineEnd = nextNewline === -1 ? editorContent.length : nextNewline;
      const currentLineText = editorContent.substring(lineStart, lineEnd);

      const newContent = editorContent.substring(0, lineEnd) + '\n' + currentLineText + editorContent.substring(lineEnd);
      setEditorContent(newContent);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + currentLineText.length + 1;
        updateCursorPosition(start + currentLineText.length + 1, newContent);
      }, 0);
      return;
    }

    // 5. Ctrl+/ Toggle Line Comment
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const lastNewline = editorContent.lastIndexOf('\n', start - 1);
      const nextNewline = editorContent.indexOf('\n', end);
      const blockStart = lastNewline === -1 ? 0 : lastNewline + 1;
      const blockEnd = nextNewline === -1 ? editorContent.length : nextNewline;

      const lines = editorContent.substring(blockStart, blockEnd).split('\n');
      const allCommented = lines.every(l => l.trimStart().startsWith('//'));

      const modifiedLines = lines.map(l => {
        if (allCommented) {
          return l.replace(/(\s*)\/\/\s?/, '$1');
        } else {
          const indent = (l.match(/^\s*/) || [''])[0];
          return indent + '// ' + l.substring(indent.length);
        }
      });

      const newBlock = modifiedLines.join('\n');
      const newContent = editorContent.substring(0, blockStart) + newBlock + editorContent.substring(blockEnd);
      setEditorContent(newContent);
      setTimeout(() => {
        target.selectionStart = blockStart;
        target.selectionEnd = blockStart + newBlock.length;
        updateCursorPosition(blockStart, newContent);
      }, 0);
      return;
    }

    // 6. Tab & Shift+Tab handling
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      if (!e.shiftKey) {
        if (start === end) {
          const newText = editorContent.substring(0, start) + '    ' + editorContent.substring(end);
          setEditorContent(newText);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = start + 4;
            updateCursorPosition(start + 4, newText);
          }, 0);
        } else {
          const lastNewline = editorContent.lastIndexOf('\n', start - 1);
          const blockStart = lastNewline === -1 ? 0 : lastNewline + 1;
          const nextNewline = editorContent.indexOf('\n', end);
          const blockEnd = nextNewline === -1 ? editorContent.length : nextNewline;

          const lines = editorContent.substring(blockStart, blockEnd).split('\n');
          const indented = lines.map(l => '    ' + l).join('\n');
          const newContent = editorContent.substring(0, blockStart) + indented + editorContent.substring(blockEnd);
          setEditorContent(newContent);
          setTimeout(() => {
            target.selectionStart = start + 4;
            target.selectionEnd = end + (lines.length * 4);
            updateCursorPosition(start + 4, newContent);
          }, 0);
        }
      } else {
        const lastNewline = editorContent.lastIndexOf('\n', start - 1);
        const blockStart = lastNewline === -1 ? 0 : lastNewline + 1;
        const nextNewline = editorContent.indexOf('\n', end);
        const blockEnd = nextNewline === -1 ? editorContent.length : nextNewline;

        const lines = editorContent.substring(blockStart, blockEnd).split('\n');
        let removedTotal = 0;
        const unindented = lines.map(l => {
          const match = l.match(/^ {1,4}/);
          if (match) {
            removedTotal += match[0].length;
            return l.substring(match[0].length);
          }
          return l;
        }).join('\n');

        const newContent = editorContent.substring(0, blockStart) + unindented + editorContent.substring(blockEnd);
        setEditorContent(newContent);
        setTimeout(() => {
          target.selectionStart = Math.max(blockStart, start - 4);
          target.selectionEnd = Math.max(blockStart, end - removedTotal);
          updateCursorPosition(target.selectionStart, newContent);
        }, 0);
      }
      return;
    }

    // 7. Auto-closing pairs: (, [, {, ", '
    const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
    const CLOSERS = [')', ']', '}', '"', "'"];

    if (PAIRS[e.key]) {
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      if (start !== end) {
        e.preventDefault();
        const selected = editorContent.substring(start, end);
        const wrapped = `${e.key}${selected}${PAIRS[e.key]}`;
        const newText = editorContent.substring(0, start) + wrapped + editorContent.substring(end);
        setEditorContent(newText);
        setTimeout(() => {
          target.selectionStart = start + 1;
          target.selectionEnd = end + 1;
          updateCursorPosition(start + 1, newText);
        }, 0);
        return;
      } else {
        e.preventDefault();
        const nextChar = editorContent[start];
        if ((e.key === '"' || e.key === "'") && nextChar === e.key) {
          target.selectionStart = target.selectionEnd = start + 1;
          updateCursorPosition(start + 1);
          return;
        }

        const newText = editorContent.substring(0, start) + e.key + PAIRS[e.key] + editorContent.substring(end);
        setEditorContent(newText);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 1;
          updateCursorPosition(start + 1, newText);
        }, 0);
        return;
      }
    }

    if (CLOSERS.includes(e.key)) {
      const target = e.target;
      const start = target.selectionStart;
      if (start === target.selectionEnd && editorContent[start] === e.key) {
        e.preventDefault();
        target.selectionStart = target.selectionEnd = start + 1;
        updateCursorPosition(start + 1);
        return;
      }
    }

    // 8. Smart Backspace Pair Deletion
    if (e.key === 'Backspace') {
      const target = e.target;
      const start = target.selectionStart;
      if (start === target.selectionEnd && start > 0) {
        const charBefore = editorContent[start - 1];
        const charAfter = editorContent[start];
        if (PAIRS[charBefore] && PAIRS[charBefore] === charAfter) {
          e.preventDefault();
          const newText = editorContent.substring(0, start - 1) + editorContent.substring(start + 1);
          setEditorContent(newText);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = start - 1;
            updateCursorPosition(start - 1, newText);
          }, 0);
          return;
        }
      }
    }

    // 9. Smart Enter with Automatic Indentation & Expanding Blocks
    if (e.key === 'Enter') {
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const lastNewline = editorContent.lastIndexOf('\n', start - 1);
      const currentLine = editorContent.substring(lastNewline + 1, start);
      const indent = (currentLine.match(/^\s*/) || [''])[0];
      const trimmed = currentLine.trimEnd();
      const charAfter = editorContent[start];

      if (trimmed.endsWith('{') || trimmed.endsWith(':') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
        const extraIndent = indent + '    ';
        if ((trimmed.endsWith('{') && charAfter === '}') ||
            (trimmed.endsWith('(') && charAfter === ')') ||
            (trimmed.endsWith('[') && charAfter === ']')) {
          e.preventDefault();
          const newText = editorContent.substring(0, start) + '\n' + extraIndent + '\n' + indent + editorContent.substring(end);
          setEditorContent(newText);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = start + 1 + extraIndent.length;
            updateCursorPosition(start + 1 + extraIndent.length, newText);
          }, 0);
          return;
        }

        e.preventDefault();
        const newText = editorContent.substring(0, start) + '\n' + extraIndent + editorContent.substring(end);
        setEditorContent(newText);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 1 + extraIndent.length;
          updateCursorPosition(start + 1 + extraIndent.length, newText);
        }, 0);
        return;
      } else {
        e.preventDefault();
        const newText = editorContent.substring(0, start) + '\n' + indent + editorContent.substring(end);
        setEditorContent(newText);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 1 + indent.length;
          updateCursorPosition(start + 1 + indent.length, newText);
        }, 0);
        return;
      }
    }
  };

  // 5. Create New File / Folder
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    // Combine targetDir and trimmedName
    const cleanDir = targetDir.trim().replace(/\/+$/, '');
    const cleanName = trimmedName.replace(/^\/+/, '');
    const finalRelPath = cleanDir ? `${cleanDir}/${cleanName}` : cleanName;

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
        path: finalRelPath,
        type: newType,
        initial_content: initCode
      }, {
        headers: getHeaders()
      });

      if (res.data?.status === 'success') {
        toast.success(`${newType === 'folder' ? 'Folder' : 'File'} created: ${finalRelPath}`);
        setShowNewModal(false);
        setNewName('');
        // Auto-expand target folder so new file is visible in tree
        if (cleanDir) {
          setExpandedFolders(prev => ({ ...prev, [cleanDir]: true }));
        }
        await fetchFileTree();
        if (newType === 'file') {
          handleOpenFile(finalRelPath);
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

  const lineHeight = Math.round(fontSize * 1.6);

  return (
    <div className={`border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-slate-900/95 overflow-hidden shadow-xl dark:shadow-2xl flex flex-col transition-all duration-200 ${
      isFullscreen
        ? 'fixed inset-0 z-50 rounded-none h-screen min-h-screen'
        : 'rounded-3xl min-h-[720px] h-[calc(100vh-230px)]'
    }`}>
      {/* Top Header Bar */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <FiCode size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Server File Manager & Live PHP Editor
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60">
                Hostinger Backend Sync
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Direct Server File Tree & Live Code Editor (Developer & Admin Authorized)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activePath && (
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer mr-3 select-none">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-cyan-600 focus:ring-0"
              />
              Auto-Backup (.bak)
            </label>
          )}

          {activePath && (
            <button
              onClick={() => setEditorContent(originalContent)}
              disabled={!isDirty || savingFile}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
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
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700/50'
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
        <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/70 flex flex-col shrink-0 select-none">
          {/* Explorer Tools */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FiHardDrive size={13} className="text-cyan-600 dark:text-cyan-400" />
                Server Explorer
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleExpandAll}
                  title="Expand All Folders"
                  className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition text-[11px] font-mono px-1.5 cursor-pointer"
                >
                  +All
                </button>
                <button
                  onClick={handleCollapseAll}
                  title="Collapse All Folders"
                  className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition text-[11px] font-mono px-1.5 cursor-pointer"
                >
                  -All
                </button>
                <button
                  onClick={() => handleOpenCreateModal('file')}
                  title="Create New File / Folder"
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition cursor-pointer"
                >
                  <FiFilePlus size={15} />
                </button>
                <button
                  onClick={fetchFileTree}
                  title="Refresh File Tree"
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  <FiRefreshCw size={13} className={loadingTree ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Quick Search Filter */}
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500" size={13} />
              <input
                type="text"
                placeholder="Search files / folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Hierarchical Tree Container */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs custom-scrollbar">
            {loadingTree ? (
              <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center gap-2">
                <FiRefreshCw className="animate-spin text-cyan-600 dark:text-cyan-400" size={18} />
                Loading hierarchical tree...
              </div>
            ) : filteredTree.length === 0 ? (
              <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
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
                  onNewItemInFolder={handleOpenCreateModal}
                />
              ))
            )}
          </div>
        </aside>

        {/* Center Code Editor Area */}
        <main className="flex-1 flex flex-col bg-slate-50/40 dark:bg-slate-950 overflow-hidden relative">
          {activePath ? (
            <>
              {/* Active Tab & Breadcrumb Bar with IDE Quick Controls */}
              <div className="h-9 bg-slate-100/90 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between text-xs shrink-0 select-none">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">server</span>
                  {breadcrumbs.map((part, index) => (
                    <React.Fragment key={index}>
                      <span className="text-slate-400 dark:text-slate-600 text-[10px]">&gt;</span>
                      <span
                        className={`font-mono truncate ${
                          index === breadcrumbs.length - 1
                            ? 'text-slate-800 dark:text-slate-200 font-bold'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {part}
                      </span>
                    </React.Fragment>
                  ))}

                  {/* Quick button to create a new file right inside current file's folder */}
                  <button
                    onClick={() => handleOpenCreateModal('file', getParentDir(activePath))}
                    title={`Create new file inside server/${getParentDir(activePath)}`}
                    className="flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-300/80 dark:border-cyan-800/80 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition cursor-pointer shrink-0"
                  >
                    <FiFilePlus size={11} />
                    <span>+ File Here</span>
                  </button>

                  {isDirty ? (
                    <span className="ml-2 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800/60 px-1.5 py-0.2 rounded-full flex items-center gap-1 shrink-0">
                      ● Unsaved
                    </span>
                  ) : (
                    <span className="ml-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                      <FiCheck size={11} /> Saved
                    </span>
                  )}
                </div>

                {/* Editor Quick Tools (Find, Zoom, Wrap, Fullscreen) */}
                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono shrink-0 ml-2">
                  <button
                    onClick={() => {
                      setShowFindBar(prev => {
                        const next = !prev;
                        if (next) setTimeout(() => findInputRef.current?.focus(), 50);
                        return next;
                      });
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
                      showFindBar
                        ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                    title="Find & Replace (Ctrl+F)"
                  >
                    <FiSearch size={12} />
                    <span>Find</span>
                  </button>

                  <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800/60 px-1.5 py-0.5 rounded">
                    <button
                      onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
                      className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer px-1 text-[10px]"
                      title="Decrease font size"
                    >
                      A-
                    </button>
                    <span className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold select-none">{fontSize}px</span>
                    <button
                      onClick={() => setFontSize(prev => Math.min(22, prev + 1))}
                      className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer px-1 text-[10px]"
                      title="Increase font size"
                    >
                      A+
                    </button>
                  </div>

                  <button
                    onClick={() => setWordWrap(prev => !prev)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
                      wordWrap
                        ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                    title="Toggle Word Wrap"
                  >
                    <FiAlignLeft size={12} />
                    <span>Wrap</span>
                  </button>

                  <button
                    onClick={() => setIsFullscreen(prev => !prev)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                    title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Mode"}
                  >
                    {isFullscreen ? <FiMinimize2 size={12} /> : <FiMaximize2 size={12} />}
                  </button>

                  <span className="hidden md:inline pl-2 border-l border-slate-200 dark:border-slate-800">
                    Lines: {lineCount}
                  </span>
                  <span className="hidden lg:inline">
                    {Math.round((editorContent.length || 0) / 1024 * 10) / 10} KB
                  </span>
                </div>
              </div>

              {/* Floating Find & Replace Bar */}
              {showFindBar && (
                <div className="bg-slate-100/95 dark:bg-[#0c1322] border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-col gap-2 text-xs font-mono shadow-md z-10">
                  <div className="flex items-center gap-2">
                    <FiSearch size={14} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <input
                      ref={findInputRef}
                      type="text"
                      placeholder="Find in file..."
                      value={findQuery}
                      onChange={(e) => setFindQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.shiftKey ? handlePrevMatch() : handleNextMatch();
                        } else if (e.key === 'Escape') {
                          setShowFindBar(false);
                          textareaRef.current?.focus();
                        }
                      }}
                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-cyan-500 w-56"
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 min-w-14">
                      {matchCount > 0 ? `${currentMatchIdx}/${matchCount}` : findQuery ? 'No match' : ''}
                    </span>
                    <button
                      onClick={handlePrevMatch}
                      disabled={!matchCount}
                      title="Previous match (Shift+Enter)"
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                    >
                      <FiChevronUp size={14} />
                    </button>
                    <button
                      onClick={handleNextMatch}
                      disabled={!matchCount}
                      title="Next match (Enter)"
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                    >
                      <FiChevronDown size={14} />
                    </button>
                    <button
                      onClick={() => setShowReplaceRow(prev => !prev)}
                      className={`p-1 rounded text-xs transition cursor-pointer flex items-center gap-1 px-2 ${
                        showReplaceRow
                          ? 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400'
                          : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                      title="Toggle Replace Row"
                    >
                      <FiRepeat size={12} /> Replace
                    </button>
                    <button
                      onClick={() => {
                        setShowFindBar(false);
                        textareaRef.current?.focus();
                      }}
                      className="p-1 ml-auto rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                      title="Close (Esc)"
                    >
                      <FiX size={14} />
                    </button>
                  </div>

                  {showReplaceRow && (
                    <div className="flex items-center gap-2 pl-6">
                      <input
                        type="text"
                        placeholder="Replace with..."
                        value={replaceQuery}
                        onChange={(e) => setReplaceQuery(e.target.value)}
                        className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-cyan-500 w-56"
                      />
                      <button
                        onClick={handleReplace}
                        disabled={!matchCount}
                        className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        Replace
                      </button>
                      <button
                        onClick={handleReplaceAll}
                        disabled={!matchCount}
                        className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        Replace All
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Editor Code Area with Line Numbers */}
              <div className="flex-1 flex overflow-hidden relative bg-white dark:bg-[#070b14]">
                {loadingFile ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-950/80 z-20">
                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm">
                      <FiRefreshCw className="animate-spin text-cyan-600 dark:text-cyan-400" size={18} />
                      Loading file from server...
                    </div>
                  </div>
                ) : null}

                {/* Line Numbers Gutter with Active Line Highlight & Click-to-jump */}
                <div
                  ref={lineNumbersRef}
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: `${lineHeight}px`,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
                  }}
                  className="w-13 bg-slate-50/90 dark:bg-[#070b12] border-r border-slate-200 dark:border-slate-800/80 py-3 pr-2 text-right select-none text-slate-400 dark:text-slate-600 overflow-hidden shrink-0 transition-colors"
                >
                  {Array.from({ length: lineCount }).map((_, idx) => {
                    const lineNum = idx + 1;
                    const isActive = lineNum === activeLine;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleLineClick(lineNum)}
                        style={{ height: `${lineHeight}px` }}
                        className={`cursor-pointer transition-colors px-1 rounded-sm ${
                          isActive
                            ? 'text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-100/60 dark:bg-cyan-500/15'
                            : 'hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                        }`}
                        title={`Click to jump to line ${lineNum}`}
                      >
                        {lineNum}
                      </div>
                    );
                  })}
                </div>

                {/* Main Textarea with JetBrains Mono, Smooth font rendering, Ln tracking */}
                <textarea
                  ref={textareaRef}
                  value={editorContent}
                  onChange={(e) => {
                    setEditorContent(e.target.value);
                    updateCursorPosition();
                  }}
                  onClick={() => updateCursorPosition()}
                  onKeyUp={() => updateCursorPosition()}
                  onSelect={() => updateCursorPosition()}
                  onKeyDown={handleKeyDown}
                  onScroll={handleScroll}
                  spellCheck={false}
                  wrap={wordWrap ? 'on' : 'off'}
                  placeholder="Write or edit server PHP code here..."
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: `${lineHeight}px`,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    whiteSpace: wordWrap ? 'pre-wrap' : 'pre'
                  }}
                  className="flex-1 h-full bg-transparent p-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 resize-none focus:outline-none selection:bg-cyan-200 dark:selection:bg-cyan-600/40 tab-4 overflow-auto scroll-smooth font-normal"
                />
              </div>

              {/* Bottom Status Bar with Live Line & Column Tracking */}
              <footer className="h-6 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono shrink-0 select-none">
                <div className="flex items-center gap-4">
                  <span className="text-slate-800 dark:text-slate-200 font-bold">
                    Ln {activeLine}, Col {activeCol}
                  </span>
                  <span className="hidden sm:inline">UTF-8</span>
                  <span className="hidden sm:inline">PHP</span>
                  <span className="hidden md:inline">Spaces: 4</span>
                  <span className="hidden lg:inline text-slate-400 dark:text-slate-600">
                    [Ctrl+F: Find | Ctrl+/: Comment | Ctrl+D: Dup]
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                  <FiShield size={12} className="text-cyan-600 dark:text-cyan-400" />
                  <span>Jail Boundary: server/</span>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 select-none bg-slate-50/50 dark:bg-transparent">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-cyan-600 dark:text-cyan-500/60 mb-4 shadow-sm dark:shadow-inner">
                <FiCode size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-300 mb-1">No Server File Selected</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">
                Click any file in the left Explorer tree to open and live-edit code on Hostinger, or create a brand new endpoint.
              </p>
              <button
                onClick={() => handleOpenCreateModal('file')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {newType === 'folder' ? (
                  <FiFolderPlus className="text-cyan-600 dark:text-cyan-400" size={17} />
                ) : (
                  <FiFilePlus className="text-cyan-600 dark:text-cyan-400" size={17} />
                )}
                Create New {newType === 'folder' ? 'Folder' : 'File'}
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <FiX size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Type Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('file')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${
                      newType === 'file'
                        ? 'bg-cyan-50 border-cyan-400 text-cyan-700 dark:bg-cyan-600/20 dark:border-cyan-500 dark:text-cyan-300 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    PHP / Text File
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('folder')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${
                      newType === 'folder'
                        ? 'bg-cyan-50 border-cyan-400 text-cyan-700 dark:bg-cyan-600/20 dark:border-cyan-500 dark:text-cyan-300 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Directory / Folder
                  </button>
                </div>
              </div>

              {/* Target Folder Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Destination Folder (inside server/)
                  </label>
                  {activePath && (
                    <button
                      type="button"
                      onClick={() => setTargetDir(getParentDir(activePath))}
                      className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                    >
                      Use Active File's Folder
                    </button>
                  )}
                </div>
                <select
                  value={targetDir}
                  onChange={(e) => setTargetDir(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {directoryList.map((dir) => (
                    <option key={dir} value={dir}>
                      server/{dir}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {newType === 'folder' ? 'Folder Name' : 'File Name'}
                </label>
                <div className="flex items-center">
                  <span
                    className="bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs px-2.5 py-2 rounded-l-xl font-mono select-none truncate max-w-[170px]"
                    title={`server/${targetDir}/`}
                  >
                    {targetDir}/
                  </span>
                  <input
                    type="text"
                    placeholder={newType === 'folder' ? 'new_subfolder' : 'endpoint_name.php'}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-r-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    autoFocus
                    required
                  />
                </div>

                {/* Resolved Path Preview */}
                <div className="mt-1.5 p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-[11px] font-mono flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400">Target:</span>
                  <span className="truncate text-slate-800 dark:text-slate-200">
                    server/{targetDir ? `${targetDir.replace(/\/+$/, '')}/` : ''}{newName.trim() || (newType === 'folder' ? '[folder_name]' : '[file_name.php]')}
                  </span>
                </div>
              </div>

              {newType === 'file' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Boilerplate Template</label>
                  <select
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="api">Standard CCA API Endpoint (CORS + Database + JSON)</option>
                    <option value="empty">Blank PHP File (&lt;?php)</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
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
