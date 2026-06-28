import React, { useState, useEffect } from 'react';
import {
  Upload,
  FolderOpen,
  Loader2,
  CheckCircle,
  FolderClosed,
  FolderOpen as FolderOpenIcon,
  Terminal,
  Download,
  X,
  FileCode,
  Sparkles,
  RefreshCw,
  Globe,
  Trash2,
  Eye,
  Code,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VirtualFile, ConsoleLog } from './types';
import {
  isBinaryFile,
  getMimeType
} from './utils';
import PreviewFrame from './components/PreviewFrame';
import FileTree from './components/FileTree';
import CodeEditor from './components/CodeEditor';
import * as fflate from 'fflate';
import { useI18n } from './i18n/I18nContext';
import {
  buildSandboxUrl,
  buildPreviewBaseUrl,
  buildCacheName,
  generateSandboxId,
  CACHE_RESPONSE_HEADERS,
  SW_SCRIPT_URL,
  EXPORT_FILENAME_PREFIX,
} from './config';

export default function App() {
  const { locale, setLocale, t } = useI18n();
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [sandboxId, setSandboxId] = useState('');
  const [addressPath, setAddressPath] = useState('index.html');
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [isSwRegistered, setIsSwRegistered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Layout toggle states
  const [hasUploaded, setHasUploaded] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);
  const [showConsole, setShowConsole] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [iframeTitle, setIframeTitle] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Register Service Worker on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(SW_SCRIPT_URL)
        .then((reg) => {
          console.log('Service Worker active. Scope:', reg.scope);
          setIsSwRegistered(true);
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
          setRegisterError(err.message || 'Registration error');
        });
    } else {
      setRegisterError('Service Workers not supported in this browser.');
    }
  }, []);

  // Helper: Reset and clear current workspace
  const handleReset = () => {
    setFiles([]);
    setSandboxId('');
    setAddressPath('index.html');
    setLogs([]);
    setHasUploaded(false);
    setSelectedFilePath(null);
    setViewMode('preview');
    setIframeTitle('');
  };

  // Helper: Decode files and put into sandboxed cache
  const loadSandboxWithFiles = async (newFiles: VirtualFile[], customSandboxId: string, sourceName: string) => {
    const cache = await caches.open(buildCacheName(customSandboxId));

    const promises = newFiles.map(async (file) => {
      const requestUrl = buildSandboxUrl(customSandboxId, file.path);
      const response = new Response(file.content, {
        headers: {
          'Content-Type': getMimeType(file.path),
          ...CACHE_RESPONSE_HEADERS,
        }
      });
      await cache.put(requestUrl, response);
    });

    await Promise.all(promises);

    // Find first HTML file to select as default path
    const htmlFilePaths = newFiles
      .map(f => f.path)
      .filter(p => p.toLowerCase().endsWith('.html') || p.toLowerCase().endsWith('.htm'));

    let defaultPath = 'index.html';
    if (htmlFilePaths.length > 0) {
      const indexMatch = htmlFilePaths.find(p => p.toLowerCase() === 'index.html' || p.toLowerCase().endsWith('/index.html'));
      defaultPath = indexMatch || htmlFilePaths[0];
    }

    setFiles(newFiles);
    setSandboxId(customSandboxId);
    setAddressPath(defaultPath);
    setSelectedFilePath(defaultPath);
    setHasUploaded(true);
    setLogs([
      {
        type: 'info',
        message: t('sandboxInited', { count: newFiles.length, source: sourceName }),
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  // Handle ZIP Decompression
  const handleZipBuffer = (uint8Array: Uint8Array, name: string) => {
    try {
      const unzipped = fflate.unzipSync(uint8Array);
      const newFiles: VirtualFile[] = [];
      const newSandboxId = generateSandboxId('zip');

      Object.entries(unzipped).forEach(([path, content]) => {
        if (path.endsWith('/') || content.length === 0 || path.includes('__MACOSX')) return;

        const isBinary = isBinaryFile(path);
        let textContent: string | undefined;

        if (!isBinary) {
          try {
            textContent = new TextDecoder('utf-8').decode(content);
          } catch (e) {
            textContent = '/* Failed decoding file text */';
          }
        }

        newFiles.push({
          path,
          content,
          size: content.length,
          isBinary,
          textContent
        });
      });

      if (newFiles.length === 0) {
        alert(t('noValidFilesZip'));
        return;
      }

      loadSandboxWithFiles(newFiles, newSandboxId, name);
    } catch (err) {
      console.error('ZIP extraction error:', err);
      alert(t('zipFailed'));
    }
  };

  // File Upload Handlers
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      handleZipBuffer(new Uint8Array(buffer), file.name);
    };
    reader.readAsArrayBuffer(file);
  };

  // Folder Upload Handlers
  const handleFolderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const newFiles: VirtualFile[] = [];
    const newSandboxId = generateSandboxId('folder');

    const loadFiles = async () => {
      const promises = (Array.from(fileList) as any[]).map(async (file) => {
        let path = file.webkitRelativePath;
        // Strip out the first level directory name so index.html is root
        const firstSlash = path.indexOf('/');
        if (firstSlash !== -1) {
          path = path.substring(firstSlash + 1);
        }

        const buffer = await file.arrayBuffer();
        const content = new Uint8Array(buffer);
        const isBinary = isBinaryFile(path);
        let textContent: string | undefined;

        if (!isBinary) {
          try {
            textContent = new TextDecoder('utf-8').decode(content);
          } catch (e) {
            textContent = '/* Failed decoding file text */';
          }
        }

        newFiles.push({
          path,
          content,
          size: content.length,
          isBinary,
          textContent
        });
      });

      await Promise.all(promises);
      loadSandboxWithFiles(newFiles, newSandboxId, fileList[0].webkitRelativePath.split('/')[0]);
    };

    loadFiles();
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.zip')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        handleZipBuffer(new Uint8Array(buffer), file.name);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert(t('zipFailed'));
    }
  };

  // Loads the built-in demo bundle (served as /demo.zip from public/)
  const loadDemoTemplate = async () => {
    try {
      const res = await fetch('demo.zip');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      handleZipBuffer(buf, t('demoTemplateName'));
    } catch (err) {
      console.error('Failed to load demo.zip:', err);
      alert(t('zipFailed'));
    }
  };

  // Virtual File Operations
  const handleSaveFile = async (path: string, textContent: string) => {
    const content = new TextEncoder().encode(textContent);
    const updatedFiles = files.map(f => {
      if (f.path === path) {
        return {
          ...f,
          content,
          size: content.length,
          textContent
        };
      }
      return f;
    });
    setFiles(updatedFiles);

    if (sandboxId) {
      const cache = await caches.open(buildCacheName(sandboxId));
      const requestUrl = buildSandboxUrl(sandboxId, path);
      const response = new Response(content, {
        headers: {
          'Content-Type': getMimeType(path),
          ...CACHE_RESPONSE_HEADERS,
        }
      });
      await cache.put(requestUrl, response);

      setLogs(prev => [...prev, {
        type: 'info',
        message: t('hotSwapped', { path }),
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const handleDeleteFile = async (path: string) => {
    const updatedFiles = files.filter(f => f.path !== path);
    setFiles(updatedFiles);

    if (sandboxId) {
      const cache = await caches.open(buildCacheName(sandboxId));
      const requestUrl = buildSandboxUrl(sandboxId, path);
      await cache.delete(requestUrl);

      setLogs(prev => [...prev, {
        type: 'warn',
        message: t('deletedFile', { path }),
        timestamp: new Date().toLocaleTimeString()
      }]);
    }

    if (selectedFilePath === path) {
      setSelectedFilePath(null);
    }
  };

  const handleRenameFile = async (oldPath: string, newPath: string) => {
    if (!newPath.trim() || oldPath === newPath) return;
    if (files.some(f => f.path === newPath)) {
      alert(t('fileAlreadyExists') || 'File already exists');
      return;
    }

    const fileToRename = files.find(f => f.path === oldPath);
    if (!fileToRename) return;

    const updatedFile = {
      ...fileToRename,
      path: newPath
    };

    const updatedFiles = files.map(f => f.path === oldPath ? updatedFile : f);
    setFiles(updatedFiles);

    if (sandboxId) {
      const cache = await caches.open(buildCacheName(sandboxId));
      const oldRequestUrl = buildSandboxUrl(sandboxId, oldPath);
      await cache.delete(oldRequestUrl);

      const newRequestUrl = buildSandboxUrl(sandboxId, newPath);
      const response = new Response(updatedFile.content, {
        headers: {
          'Content-Type': getMimeType(newPath),
          ...CACHE_RESPONSE_HEADERS,
        }
      });
      await cache.put(newRequestUrl, response);

      setLogs(prev => [...prev, {
        type: 'info',
        message: t('renamedFile', { oldPath, newPath }),
        timestamp: new Date().toLocaleTimeString()
      }]);
    }

    if (selectedFilePath === oldPath) {
      setSelectedFilePath(newPath);
    }
    if (addressPath === oldPath) {
      setAddressPath(newPath);
    }
  };

  const handleRenameFolder = async (oldFolderPath: string, newFolderPath: string) => {
    if (!newFolderPath.trim() || oldFolderPath === newFolderPath) return;
    const oldPrefix = oldFolderPath.endsWith('/') ? oldFolderPath : `${oldFolderPath}/`;
    const newPrefix = newFolderPath.endsWith('/') ? newFolderPath : `${newFolderPath}/`;

    if (files.some(f => f.path.startsWith(newPrefix))) {
      alert(t('folderOrFileExists'));
      return;
    }

    const updatedFiles = files.map(f => {
      if (f.path.startsWith(oldPrefix)) {
        return {
          ...f,
          path: f.path.replace(oldPrefix, newPrefix)
        };
      }
      return f;
    });

    setFiles(updatedFiles);

    if (sandboxId) {
      const cache = await caches.open(buildCacheName(sandboxId));

      const affectedFiles = files.filter(f => f.path.startsWith(oldPrefix));
      for (const f of affectedFiles) {
        const oldRequestUrl = buildSandboxUrl(sandboxId, f.path);
        await cache.delete(oldRequestUrl);

        const updatedPath = f.path.replace(oldPrefix, newPrefix);
        const newRequestUrl = buildSandboxUrl(sandboxId, updatedPath);
        const response = new Response(f.content, {
          headers: {
            'Content-Type': getMimeType(updatedPath),
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Access-Control-Allow-Origin': '*'
          }
        });
        await cache.put(newRequestUrl, response);
      }

      setLogs(prev => [...prev, {
        type: 'info',
        message: t('renamedFolder', { oldFolderPath, newFolderPath }),
        timestamp: new Date().toLocaleTimeString()
      }]);
    }

    if (selectedFilePath && selectedFilePath.startsWith(oldPrefix)) {
      setSelectedFilePath(selectedFilePath.replace(oldPrefix, newPrefix));
    }
    if (addressPath && addressPath.startsWith(oldPrefix)) {
      setAddressPath(addressPath.replace(oldPrefix, newPrefix));
    }
  };

  const handleDeleteFolder = async (folderPath: string) => {
    const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    const filesToDelete = files.filter(f => f.path.startsWith(prefix));
    const updatedFiles = files.filter(f => !f.path.startsWith(prefix));

    setFiles(updatedFiles);

    if (sandboxId) {
      const cache = await caches.open(buildCacheName(sandboxId));
      for (const f of filesToDelete) {
        const requestUrl = buildSandboxUrl(sandboxId, f.path);
        await cache.delete(requestUrl);
      }

      setLogs(prev => [...prev, {
        type: 'warn',
        message: t('deletedFolder', { folderPath }),
        timestamp: new Date().toLocaleTimeString()
      }]);
    }

    if (selectedFilePath && selectedFilePath.startsWith(prefix)) {
      setSelectedFilePath(null);
    }
  };

  const handleCreateFolder = async (folderPath: string) => {
    const keepPath = folderPath.endsWith('/') ? `${folderPath}.keep` : `${folderPath}/.keep`;
    if (files.some(f => f.path === keepPath)) {
      alert(t('folderExists'));
      return;
    }
    const defaultContent = `/* Folder keep file for: ${folderPath} */\n`;
    const content = new TextEncoder().encode(defaultContent);
    const newFile: VirtualFile = {
      path: keepPath,
      content,
      size: content.length,
      isBinary: false,
      textContent: defaultContent
    };

    const updatedFiles = [...files, newFile];
    setFiles(updatedFiles);

    if (sandboxId) {
      const cache = await caches.open(buildCacheName(sandboxId));
      const requestUrl = buildSandboxUrl(sandboxId, keepPath);
      const response = new Response(content, {
        headers: {
          'Content-Type': getMimeType(keepPath),
          ...CACHE_RESPONSE_HEADERS,
        }
      });
      await cache.put(requestUrl, response);

      setLogs(prev => [...prev, {
        type: 'info',
        message: t('createdFolder', { folderPath }),
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const handleCreateFile = async (path: string) => {
    if (files.some(f => f.path === path)) {
      alert(t('fileAlreadyExists'));
      return;
    }

    const defaultContent = `/* New file: ${path} */\n`;
    const content = new TextEncoder().encode(defaultContent);
    const newFile: VirtualFile = {
      path,
      content,
      size: content.length,
      isBinary: false,
      textContent: defaultContent
    };

    const updatedFiles = [...files, newFile];
    setFiles(updatedFiles);

    if (sandboxId) {
      const cache = await caches.open(buildCacheName(sandboxId));
      const requestUrl = buildSandboxUrl(sandboxId, path);
      const response = new Response(content, {
        headers: {
          'Content-Type': getMimeType(path),
          ...CACHE_RESPONSE_HEADERS,
        }
      });
      await cache.put(requestUrl, response);

      setLogs(prev => [...prev, {
        type: 'info',
        message: t('createdFile', { path }),
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  // Navigating FileTree selections
  const handleSelectFile = (path: string) => {
    setSelectedFilePath(path);
    const ext = path.split('.').pop()?.toLowerCase() || '';
    if (['html', 'htm'].includes(ext)) {
      setAddressPath(path);
    } else {
      setViewMode('code');
    }
  };

  // ZIP Downloader back to local storage
  const handleDownloadZip = () => {
    if (files.length === 0) return;
    const zipData: Record<string, Uint8Array> = {};
    files.forEach(file => {
      zipData[file.path] = file.content;
    });
    const zipped = fflate.zipSync(zipData);
    const blob = new Blob([zipped], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${EXPORT_FILENAME_PREFIX}${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute HTML files list for selection
  const htmlFiles = files
    .map(f => f.path)
    .filter(p => p.toLowerCase().endsWith('.html') || p.toLowerCase().endsWith('.htm'))
    .sort((a, b) => {
      const isAIndex = a.toLowerCase() === 'index.html' || a.toLowerCase().endsWith('/index.html');
      const isBIndex = b.toLowerCase() === 'index.html' || b.toLowerCase().endsWith('/index.html');
      if (isAIndex && !isBIndex) return -1;
      if (!isAIndex && isBIndex) return 1;
      return a.localeCompare(b);
    });

  const activeEditFile = files.find(f => f.path === selectedFilePath) || null;

  // View 1: Centered Spacious Uploader (Unuploaded State)
  if (!hasUploaded) {
    return (
      <div className="min-h-screen text-slate-200 flex flex-col font-sans grid-pattern relative overflow-hidden select-none">
        {/* Ambient background glows */}
        <div className="absolute top-[-20%] left-[-10%] w-220 h-220 bg-indigo-500/5 rounded-full filter blur-[140px] pointer-events-none -z-10" />
        <div className="absolute bottom-[-15%] right-[-5%] w-180 h-180 bg-indigo-500/5 rounded-full filter blur-[140px] pointer-events-none -z-10" />

        {/* Top Minimalist Header */}
        <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-white/3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
              <Upload className="w-3.5 h-3.5 stroke-1" />
            </span>
            <span className="text-xs font-semibold tracking-widest text-indigo-400 uppercase select-none font-mono">
              {t('title')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Elegant Language Switcher */}
            <div className="flex items-center gap-1 bg-white/2 border border-white/5 rounded-xl p-0.5 shadow-inner">
              <button
                onClick={() => setLocale('en')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase transition-all duration-200 cursor-pointer ${locale === 'en'
                    ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                    : 'text-slate-400 hover:text-white'
                  }`}
                title={t('switchToEnglish')}
              >
                EN
              </button>
              <button
                onClick={() => setLocale('zh')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase transition-all duration-200 cursor-pointer ${locale === 'zh'
                    ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                    : 'text-slate-400 hover:text-white'
                  }`}
                title={t('switchToChinese')}
              >
                中文
              </button>
            </div>

            {isSwRegistered ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono shadow-sm shadow-emerald-500/5">
                <CheckCircle className="w-3 h-3" /> {t('swActive')}
              </span>
            ) : registerError ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[11px] font-bold text-rose-400 uppercase tracking-wider font-mono">
                ⚠️ {t('swRestricted')}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/5 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                <Loader2 className="w-3 h-3 animate-spin" /> {t('swBooting')}
              </span>
            )}
          </div>
        </header>

        {/* Center Canvas */}
        <motion.main
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 max-w-4xl w-full mx-auto px-6 flex flex-col justify-center items-center py-12 md:py-20"
        >
          <div className="text-center space-y-6 max-w-2xl">
            {/* Visual Icon */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex p-4 rounded-3xl bg-indigo-500/5 text-indigo-400 border border-indigo-500/15 shadow-2xl shadow-indigo-500/5"
            >
              <Upload className="w-7 h-7 stroke-1" />
            </motion.div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-white font-sans leading-tight">
                {t('zeroLag')} <br />
                <span className="font-normal bg-linear-to-r from-indigo-300 via-indigo-400 to-violet-300 bg-clip-text text-transparent">
                  {t('pureSandbox')}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-light max-w-md mx-auto">
                {t('landingDesc')}
              </p>
            </div>

            {/* Drag and Drop Zone Container */}
            <motion.div
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full max-w-lg mx-auto rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all cursor-pointer relative overflow-hidden group ${isDragging
                  ? 'border-indigo-500/60 bg-indigo-500/10 shadow-[0_0_32px_0_rgba(99,102,241,0.15)]'
                  : 'border-white/10 bg-white/1 hover:border-white/20 hover:bg-white/2 hover:shadow-[0_12px_40px_0_rgba(99,102,241,0.03)]'
                }`}
            >
              <input
                type="file"
                accept=".zip"
                onChange={handleFileInput}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                id="zip-uploader-input"
              />

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-950/40 flex items-center justify-center border border-white/5 mx-auto group-hover:border-indigo-500/20 group-hover:text-indigo-400 transition-colors shadow-inner">
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-all group-hover:-translate-y-0.5 duration-300" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                    {t('dropZip', { filename: 'dist.zip' }).split('{filename}')[0]}
                    <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 text-xs font-mono">dist.zip</code>
                    {t('dropZip', { filename: 'dist.zip' }).split('{filename}')[1]}
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-400 block mt-1.5 font-light">
                    {t('uploadUnzip')}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Quick Upload Action Buttons & Demos */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {/* Directory selection button */}
              <div className="relative group/btn cursor-pointer px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-slate-300 text-xs font-semibold border border-white/5 transition-all shadow-md flex items-center gap-2">
                <input
                  type="file"
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={handleFolderInput}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  id="folder-uploader-input"
                />
                <FolderOpen className="w-4 h-4 text-slate-400" />
                {t('uploadFolder')}
              </div>

              {/* Sample Template Trigger */}
              <button
                onClick={loadDemoTemplate}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.01] text-xs font-semibold text-white transition-all shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center gap-2"
                id="demo-template-btn"
              >
                <Sparkles className="w-4 h-4" />
                {t('loadDemo')}
              </button>
            </div>
          </div>
        </motion.main>

        {/* Minimalist Footer */}
        <footer className="w-full border-t border-white/3 py-5 px-6 mt-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-slate-500 font-mono max-w-7xl mx-auto">
          <span>{t('secureBanner')}</span>
          <span>{t('offlineEncryption')}</span>
        </footer>
      </div>
    );
  }

  // View 2: High-Polish Live Preview Workspace (Uploaded State)
  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden relative grid-pattern">
      {/* Ambient background glows for visual continuity with landing page */}
      <div className="absolute top-[-20%] left-[-10%] w-220 h-220 bg-indigo-500/5 rounded-full filter blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-15%] right-[-5%] w-180 h-180 bg-indigo-500/5 rounded-full filter blur-[140px] pointer-events-none -z-10" />

      {/* Unified Single Header */}
      <header className="h-14 px-3 sm:px-6 bg-slate-950 border-b border-white/5 flex items-center justify-between shrink-0 select-none z-10">

        {/* Left: Back + File path indicator */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-all py-1.5 px-2.5 sm:px-3.5 rounded-xl bg-white/2 border border-white/5 hover:bg-white/6 cursor-pointer font-semibold shadow-inner shrink-0"
            title={t('backToUploader')}
            id="back-to-uploader-btn"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">{t('backToUploader')}</span>
          </button>

          {viewMode === 'preview' ? (
            <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold truncate max-w-40 lg:max-w-70">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate font-mono text-[11px] text-slate-400" title={iframeTitle || addressPath}>
                {iframeTitle || addressPath}
              </span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold truncate max-w-40 lg:max-w-70">
              <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate font-mono text-[11px] text-slate-300 font-bold" title={selectedFilePath || 'index.html'}>
                {selectedFilePath || 'index.html'}
              </span>
              <span className="text-slate-700 font-mono text-[11px] hidden lg:inline">•</span>
              <span className="text-[11px] text-slate-500 font-mono hidden lg:inline">
                {activeEditFile ? `${((activeEditFile.size) / 1024).toFixed(1)} KB` : '0.0 KB'}
              </span>
            </div>
          )}
        </div>

        {/* Center: View toggle + Preview tools / Save badge */}
        <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
          <div className="flex items-center bg-slate-900 border border-white/5 rounded-xl p-0.5 shadow-inner shrink-0">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2 py-1 sm:px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${viewMode === 'preview'
                  ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
                }`}
              title={t('previewTab')}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('previewTab')}</span>
            </button>
            <button
              onClick={() => {
                setViewMode('code');
                if (!selectedFilePath && files.length > 0) {
                  const defaultF = files.find(f => f.path.toLowerCase() === 'index.html') || files[0];
                  setSelectedFilePath(defaultF.path);
                }
              }}
              className={`px-2 py-1 sm:px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${viewMode === 'code'
                  ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
                }`}
              title={t('codeTab')}
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('codeTab')}</span>
            </button>
          </div>

          {viewMode === 'preview' && (
            <div className="flex items-center gap-1.5">
              <div className="hidden lg:flex items-center relative">
                <Globe className="w-3.5 h-3.5 text-slate-600 absolute left-2.5" />
                <input
                  type="text"
                  value={addressPath}
                  onChange={(e) => setAddressPath(e.target.value)}
                  placeholder="index.html"
                  className="bg-slate-950/50 border border-white/5 focus:border-indigo-500/30 rounded-lg pl-7 pr-2 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none font-mono w-35"
                />
              </div>
              <button
                onClick={() => setReloadKey(prev => prev + 1)}
                className="p-1.5 hover:bg-white/8 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                title={t('refreshPreview')}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const previewBaseUrl = buildPreviewBaseUrl(sandboxId);
                  const fullUrl = `${window.location.origin}${previewBaseUrl}${addressPath}`;
                  window.open(fullUrl, '_blank');
                }}
                className="p-1.5 hover:bg-white/8 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                title={t('openNewWindow')}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Explorer, Console, Export, Locale */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* File Tree toggle */}
          <button
            onClick={() => setShowFileTree(!showFileTree)}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${showFileTree
                ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-300 font-bold'
                : 'bg-white/2 border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            title={t('toggleExplorer')}
            id="toggle-explorer-btn"
          >
            {showFileTree ? <FolderOpenIcon className="w-3.5 h-3.5" /> : <FolderClosed className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{t('explorer')}</span>
          </button>

          {/* Console toggle */}
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer relative ${showConsole
                ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-300 font-bold'
                : 'bg-white/2 border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            title={t('toggleConsole')}
            id="toggle-console-btn"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('console')}</span>
            {logs.length > 0 && (
              <span className="h-4 min-w-4 px-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[11px] font-bold text-indigo-300 font-mono flex items-center justify-center">
                {logs.length}
              </span>
            )}
          </button>

          <div className="hidden sm:block h-4 w-px bg-white/5" />

          {/* Export ZIP */}
          <button
            onClick={handleDownloadZip}
            className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/15 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title={t('exportZipTooltip')}
            id="export-zip-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('exportZip')}</span>
          </button>

          {/* Tiny inline locale toggle for clean looks */}
          <div className="hidden sm:flex items-center gap-0.5 bg-white/2 border border-white/5 rounded-xl p-0.5 ml-0.5 sm:ml-1">
            <button
              onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
              className="px-1.5 py-0.5 rounded-lg text-[11px] font-mono text-slate-400 hover:text-white transition-all"
            >
              {locale.toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame split view */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Left Collapsible File Explorer Sidebar */}
        <AnimatePresence>
          {showFileTree && (
            <>
              {/* Mobile overlay backdrop for sidebar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFileTree(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-20 md:hidden"
                id="sidebar-backdrop"
              />
              <motion.aside
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                className="fixed inset-y-0 left-0 w-72 md:relative md:w-80 border-r border-white/5 h-full flex flex-col bg-slate-950 shrink-0 z-30 md:z-10"
              >
                <FileTree
                  files={files}
                  selectedPath={selectedFilePath || ''}
                  onSelectFile={handleSelectFile}
                  onDeleteFile={handleDeleteFile}
                  onCreateFile={handleCreateFile}
                  onRenameFile={handleRenameFile}
                  onRenameFolder={handleRenameFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onCreateFolder={handleCreateFolder}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Center / Right main view section */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative">

          {/* Dynamic View Area */}
          <div className="flex-1 overflow-hidden min-h-0 relative bg-slate-950/10">
            {viewMode === 'preview' ? (
              <PreviewFrame
                key={reloadKey}
                sandboxId={sandboxId}
                addressPath={addressPath}
                setAddressPath={setAddressPath}
                onAddLog={(log) => setLogs(prev => [...prev, log])}
                htmlFiles={htmlFiles}
                onTitleChange={setIframeTitle}
                hideHeader={true}
              />
            ) : (
              <div className="h-full w-full overflow-hidden flex flex-col">
                {activeEditFile ? (
                  <CodeEditor
                    file={activeEditFile}
                    onSave={handleSaveFile}
                    hideHeader={true}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 font-mono gap-2 bg-slate-950/40">
                    <FileCode className="w-8 h-8 text-slate-700 stroke-1" />
                    <span className="text-xs">{t('selectFileToEdit')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Collapsible Console Drawer */}
          <AnimatePresence>
            {showConsole && (
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="h-64 border-t border-white/5 bg-slate-950/90 backdrop-blur-md flex flex-col shrink-0 z-10"
                id="console-drawer"
              >
                {/* Console logs sub header */}
                <div className="h-9 px-4 border-b border-white/5 flex items-center justify-between text-xs select-none bg-slate-950 shrink-0">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                      {t('liveLogs')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {logs.length > 0 && (
                      <button
                        onClick={() => setLogs([])}
                        className="text-slate-500 hover:text-rose-400 text-[11px] font-mono flex items-center gap-1 bg-white/2 border border-white/5 px-2 py-0.5 rounded-md transition-all cursor-pointer"
                        id="clear-logs-btn"
                      >
                        <Trash2 className="w-3 h-3" />
                        {t('clearLogs')}
                      </button>
                    )}
                    <button
                      onClick={() => setShowConsole(false)}
                      className="text-slate-500 hover:text-slate-300 cursor-pointer"
                      id="close-console-btn"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Log stream view area */}
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 custom-scrollbar select-text selection:bg-indigo-500/25">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center font-mono gap-1.5">
                      <Terminal className="w-5 h-5 text-slate-700 stroke-1" />
                      <span className="text-[11px]">{t('noLogsYet')}</span>
                    </div>
                  ) : (
                    logs.map((log, index) => {
                      let colorClass = 'text-slate-400';
                      let prefix = '●';
                      if (log.type === 'info') {
                        colorClass = 'text-sky-400 bg-sky-500/5';
                        prefix = 'ℹ';
                      } else if (log.type === 'warn') {
                        colorClass = 'text-amber-400 bg-amber-500/5';
                        prefix = '⚠';
                      } else if (log.type === 'error') {
                        colorClass = 'text-rose-400 bg-rose-500/5';
                        prefix = '❌';
                      }

                      return (
                        <div key={index} className={`flex items-start gap-2.5 px-3 py-1.5 rounded-lg leading-relaxed break-all ${colorClass}`}>
                          <span className="text-slate-600 text-[11px] font-semibold tracking-wider uppercase mt-0.5 select-none shrink-0">
                            {log.timestamp}
                          </span>
                          <span className="font-bold select-none shrink-0">{prefix}</span>
                          <span className="font-mono text-slate-300 flex-1">{log.message}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
