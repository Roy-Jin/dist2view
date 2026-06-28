import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  Image,
  FileJson,
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
  Trash2,
  Plus,
  FileCheck,
  X,
  Check,
  Edit3,
  FolderPlus
} from 'lucide-react';
import { FileNode, VirtualFile } from '../types';
import { buildFileTree, formatBytes } from '../utils';
import { useI18n } from '../i18n/I18nContext';

interface FileTreeProps {
  files: VirtualFile[];
  selectedPath: string;
  onSelectFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onRenameFile?: (oldPath: string, newPath: string) => void;
  onRenameFolder?: (oldPath: string, newPath: string) => void;
  onDeleteFolder?: (path: string) => void;
  onCreateFolder?: (path: string) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  path: string;
  isDirectory: boolean;
  visible: boolean;
}

export default function FileTree({
  files,
  selectedPath,
  onSelectFile,
  onDeleteFile,
  onCreateFile,
  onRenameFile,
  onRenameFolder,
  onDeleteFolder,
  onCreateFolder
}: FileTreeProps) {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '': true, // Root always expanded
  });

  // Creation States
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingInFolder, setIsCreatingInFolder] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<'file' | 'folder'>('file');

  // Deleting State
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);

  // Renaming States
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');
  const [renameIsDirectory, setRenameIsDirectory] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    x: 0,
    y: 0,
    path: '',
    isDirectory: false,
    visible: false
  });

  const rootNode = buildFileTree(files);

  // Close context menu on any global click or scroll
  useEffect(() => {
    const handleCloseMenu = () => {
      setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
    };
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('contextmenu', handleCloseMenu);
    window.addEventListener('scroll', handleCloseMenu, true);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('contextmenu', handleCloseMenu);
      window.removeEventListener('scroll', handleCloseMenu, true);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsCreatingInFolder(null);
      setNewFileName('');
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleCreateSubmit = (e: React.FormEvent, parentPath: string) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const fullPath = parentPath
      ? `${parentPath}/${newFileName.trim()}`
      : newFileName.trim();

    if (creatingType === 'folder') {
      onCreateFolder?.(fullPath);
    } else {
      onCreateFile(fullPath);
    }

    setNewFileName('');
    setIsCreatingInFolder(null);

    // Automatically expand parent folder to show new item
    setExpandedFolders(prev => ({ ...prev, [parentPath]: true }));
  };

  const handleRenameSubmit = (oldPath: string) => {
    if (!renamingName.trim() || oldPath.split('/').pop() === renamingName.trim()) {
      setRenamingPath(null);
      return;
    }

    const parts = oldPath.split('/');
    parts[parts.length - 1] = renamingName.trim();
    const newPath = parts.join('/');

    if (renameIsDirectory) {
      onRenameFolder?.(oldPath, newPath);
    } else {
      onRenameFile?.(oldPath, newPath);
    }
    setRenamingPath(null);
  };

  // Trigger Context Menu
  const handleContextMenu = (e: React.MouseEvent, path: string, isDirectory: boolean) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      path,
      isDirectory,
      visible: true
    });
  };

  // Helper to choose file icon
  const getFileIcon = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    if (['html', 'htm'].includes(ext)) {
      return <FileCode className="w-4 h-4 text-orange-400" id={`icon-html-${path}`} />;
    }
    if (['css'].includes(ext)) {
      return <FileCode className="w-4 h-4 text-sky-400" id={`icon-css-${path}`} />;
    }
    if (['js', 'jsx', 'ts', 'tsx', 'mjs'].includes(ext)) {
      return <FileCode className="w-4 h-4 text-amber-400" id={`icon-js-${path}`} />;
    }
    if (['json'].includes(ext)) {
      return <FileJson className="w-4 h-4 text-purple-400" id={`icon-json-${path}`} />;
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
      return <Image className="w-4 h-4 text-emerald-400" id={`icon-image-${path}`} />;
    }
    if (['md', 'txt'].includes(ext)) {
      return <FileText className="w-4 h-4 text-slate-300" id={`icon-text-${path}`} />;
    }
    return <File className="w-4 h-4 text-slate-400" id={`icon-file-${path}`} />;
  };

  // Recursively render file tree
  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedFolders[node.path];
    const hasSearchActive = searchTerm.trim().length > 0;

    // Simple filter matching
    if (hasSearchActive && node.path !== '') {
      const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesChildren = node.children?.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch && !matchesChildren) {
        return null;
      }
    }

    if (node.isDirectory) {
      const isFolderRenaming = renamingPath === node.path && renameIsDirectory;
      return (
        <div key={node.path} className="flex flex-col" id={`dir-node-${node.path || 'root'}`}>
          {node.path !== '' && (
            <div
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-white/4 cursor-pointer transition-all text-slate-300 select-none`}
              onClick={() => toggleFolder(node.path)}
              onContextMenu={(e) => handleContextMenu(e, node.path, true)}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-slate-500">
                  {isExpanded || hasSearchActive ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
                {isExpanded || hasSearchActive ? (
                  <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
                )}
                {isFolderRenaming ? (
                  <input
                    type="text"
                    value={renamingName}
                    onChange={(e) => setRenamingName(e.target.value)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => handleRenameSubmit(node.path)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(node.path);
                      else if (e.key === 'Escape') setRenamingPath(null);
                    }}
                    className="glass-input rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-28 font-mono"
                  />
                ) : (
                  <span className="font-medium truncate text-slate-200">{node.name}</span>
                )}
              </div>

              {/* Action items */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  title={t('createFile')}
                  onClick={() => {
                    setIsCreatingInFolder(node.path);
                    setCreatingType('file');
                  }}
                  className="p-1 hover:bg-white/8 text-slate-400 hover:text-indigo-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  title={t('deleteFolder')}
                  onClick={() => {
                    if (confirm(t('confirmDeleteFolderWithName', { name: node.name }))) {
                      onDeleteFolder?.(node.path);
                    }
                  }}
                  className="p-1 hover:bg-white/8 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* New file/folder input form inside folder */}
          {isCreatingInFolder === node.path && (
            <form
              onSubmit={(e) => handleCreateSubmit(e, node.path)}
              className="flex items-center gap-1.5 my-1 pr-2"
              style={{ paddingLeft: `${(level + 1) * 12 + 16}px` }}
              onClick={(e) => e.stopPropagation()}
            >
              {creatingType === 'folder' ? (
                <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              ) : (
                <File className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <input
                type="text"
                placeholder={creatingType === 'folder' ? t('folderNamePlaceholder') : t('fileNamePlaceholder')}
                autoFocus
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="glass-input rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-28 font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  setIsCreatingInFolder(null);
                  setNewFileName('');
                }}
                className="p-0.5 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                title={t('cancel')}
              >
                <X className="w-3 h-3" />
              </button>
            </form>
          )}

          {/* Render Children */}
          {(isExpanded || hasSearchActive || node.path === '') && node.children && (
            <div className="flex flex-col mt-0.5">
              {node.children.map(child => renderNode(child, node.path === '' ? 0 : level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      const isSelected = selectedPath === node.path;
      const isFileRenaming = renamingPath === node.path && !renameIsDirectory;
      return (
        <div
          key={node.path}
          style={{ paddingLeft: `${level * 12 + 24}px` }}
          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all select-none ${isSelected
              ? 'bg-indigo-600/15 border border-indigo-500/20 text-indigo-200 font-semibold shadow-sm'
              : 'text-slate-400 hover:bg-white/4 hover:text-slate-200 border border-transparent'
            }`}
          onClick={() => onSelectFile(node.path)}
          onContextMenu={(e) => handleContextMenu(e, node.path, false)}
          id={`file-node-${node.path}`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getFileIcon(node.path)}
            {isFileRenaming ? (
              <input
                type="text"
                value={renamingName}
                onChange={(e) => setRenamingName(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onBlur={() => handleRenameSubmit(node.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(node.path);
                  else if (e.key === 'Escape') setRenamingPath(null);
                }}
                className="glass-input rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-28 font-mono"
              />
            ) : (
              <span className="truncate font-mono">{node.name}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] text-slate-500 font-mono opacity-100 group-hover:opacity-0 transition-opacity">
              {node.size ? formatBytes(node.size) : ''}
            </span>
            {deletingPath === node.path ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  title={t('confirmDelete')}
                  onClick={() => {
                    onDeleteFile(node.path);
                    setDeletingPath(null);
                  }}
                  className="p-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded transition-all cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  title={t('cancel')}
                  onClick={() => setDeletingPath(null)}
                  className="p-1 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded transition-all cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                title={t('deleteTooltip')}
                onClick={() => setDeletingPath(node.path)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/8 hover:text-rose-400 rounded text-slate-500 transition-all cursor-pointer shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/20 rounded-2xl overflow-hidden shadow-xl relative">
      {/* Search Header */}
      <div className="p-3.5 border-b border-white/5 bg-slate-950/40 flex items-center gap-2 select-none">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder={t('searchFiles')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass-input rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all font-mono"
          />
        </div>

        {/* Create root-level file button */}
        <button
          onClick={() => {
            setIsCreatingInFolder('');
            setCreatingType('file');
          }}
          className="p-2 bg-white/2 border border-white/5 hover:bg-white/4 text-indigo-400 rounded-xl transition-all cursor-pointer flex items-center justify-center"
          title={t('createFile')}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        {/* Create root-level folder button */}
        <button
          onClick={() => {
            setIsCreatingInFolder('');
            setCreatingType('folder');
          }}
          className="p-2 bg-white/2 border border-white/5 hover:bg-white/4 text-indigo-400 rounded-xl transition-all cursor-pointer flex items-center justify-center"
          title={t('createFolderTooltip')}
        >
          <FolderPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Root-level new item form */}
      {isCreatingInFolder === '' && (
        <div className="p-3 bg-white/1 border-b border-white/5 animate-fade-in">
          <form onSubmit={(e) => handleCreateSubmit(e, '')} className="flex items-center gap-2">
            {creatingType === 'folder' ? (
              <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
            ) : (
              <File className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <input
              type="text"
              placeholder={creatingType === 'folder' ? t('folderNamePlaceholder') : t('fileNamePlaceholder')}
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="glass-input rounded px-2.5 py-1 text-xs text-white focus:outline-none flex-1 font-mono"
            />
            <button
              type="button"
              onClick={() => {
                setIsCreatingInFolder(null);
                setNewFileName('');
              }}
              className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
              title={t('cancel')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1 select-none custom-scrollbar">
        {files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <FileCheck className="w-10 h-10 text-slate-500 mb-2 stroke-1" />
            <span className="text-xs text-slate-400 font-medium">{t('emptyWorkspace')}</span>
            <span className="text-[10px] text-slate-500 mt-1">{t('uploadUnzip')}</span>
          </div>
        ) : (
          renderNode(rootNode)
        )}
      </div>

      {/* Tree Footer stats */}
      <div className="p-3 border-t border-white/5 bg-slate-950/40 flex items-center justify-between text-[10px] font-mono text-slate-500 select-none">
        <span>{t('filesCount', { count: files.length })}</span>
        <span>{t('sizeLabel')}: <b className="text-indigo-400">{formatBytes(files.reduce((acc, f) => acc + f.size, 0))}</b></span>
      </div>

      {/* Sleek Custom Right-Click Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-slate-950/90 border border-white/10 rounded-2xl py-1.5 w-44 shadow-2xl backdrop-blur-xl z-50 text-slate-300 font-sans text-[11px] animate-fade-in overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        >
          {contextMenu.isDirectory ? (
            <>
              <div className="px-3 py-1 text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider border-b border-white/5 mb-1 select-none">
                {t('folderActions')}
              </div>
              <button
                onClick={() => {
                  setIsCreatingInFolder(contextMenu.path);
                  setCreatingType('file');
                }}
                className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-2 cursor-pointer font-medium"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white shrink-0" />
                <span>{t('createFile')}</span>
              </button>
              <button
                onClick={() => {
                  setIsCreatingInFolder(contextMenu.path);
                  setCreatingType('folder');
                }}
                className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-2 cursor-pointer font-medium"
              >
                <FolderPlus className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white shrink-0" />
                <span>{t('newSubfolder')}</span>
              </button>
              <button
                onClick={() => {
                  setRenamingPath(contextMenu.path);
                  setRenamingName(contextMenu.path.split('/').pop() || '');
                  setRenameIsDirectory(true);
                }}
                className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-2 cursor-pointer font-medium"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white shrink-0" />
                <span>{t('renameFolder')}</span>
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button
                onClick={() => {
                  if (confirm(t('confirmDeleteFolder', { path: contextMenu.path }))) {
                    onDeleteFolder?.(contextMenu.path);
                  }
                }}
                className="w-full text-left px-3 py-2 hover:bg-rose-600 hover:text-white text-rose-400 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:text-white shrink-0" />
                <span>{t('deleteFolder')}</span>
              </button>
            </>
          ) : (
            <>
              <div className="px-3 py-1 text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider border-b border-white/5 mb-1 select-none">
                {t('fileActions')}
              </div>
              <button
                onClick={() => onSelectFile(contextMenu.path)}
                className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-2 cursor-pointer font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white shrink-0" />
                <span>{t('openAndView')}</span>
              </button>
              <button
                onClick={() => {
                  setRenamingPath(contextMenu.path);
                  setRenamingName(contextMenu.path.split('/').pop() || '');
                  setRenameIsDirectory(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-2 cursor-pointer font-medium"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white shrink-0" />
                <span>{t('renameFile')}</span>
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button
                onClick={() => {
                  if (confirm(t('confirmDeleteFile', { path: contextMenu.path }))) {
                    onDeleteFile(contextMenu.path);
                  }
                }}
                className="w-full text-left px-3 py-2 hover:bg-rose-600 hover:text-white text-rose-400 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:text-white shrink-0" />
                <span>{t('deleteFile')}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
