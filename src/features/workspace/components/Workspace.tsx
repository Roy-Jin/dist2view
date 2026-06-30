import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FileCode } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nContext';
import { useWorkspace } from '../WorkspaceStore';
import FileTree from '../../../components/FileTree';
import PreviewFrame from '../../../components/PreviewFrame';
import CodeEditor from '../../../components/CodeEditor';
import Header from './Header';
import ConsolePanel from './ConsolePanel';

export default function Workspace() {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const {
    files,
    sandboxId,
    addressPath,
    selectedFilePath,
    viewMode,
    showFileTree,
    showConsole,
    actions,
  } = workspace;

  const [reloadKey, setReloadKey] = useState(0);

  const htmlFiles = useMemo(
    () =>
      files
        .map((file) => file.path)
        .filter(
          (path) =>
            path.toLowerCase().endsWith('.html') ||
            path.toLowerCase().endsWith('.htm')
        )
        .sort((a, b) => {
          const isAIndex =
            a.toLowerCase() === 'index.html' ||
            a.toLowerCase().endsWith('/index.html');
          const isBIndex =
            b.toLowerCase() === 'index.html' ||
            b.toLowerCase().endsWith('/index.html');
          if (isAIndex && !isBIndex) return -1;
          if (!isAIndex && isBIndex) return 1;
          return a.localeCompare(b);
        }),
    [files]
  );

  const activeEditFile = useMemo(
    () => files.find((file) => file.path === selectedFilePath) || null,
    [files, selectedFilePath]
  );

  const handleAddLog = (log: {
    type: 'log' | 'info' | 'warn' | 'error' | 'debug';
    message: string;
    timestamp: string;
  }) => {
    actions.addLog(log);
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden relative grid-pattern">
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-220 h-220 bg-indigo-500/5 rounded-full filter blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-15%] right-[-5%] w-180 h-180 bg-indigo-500/5 rounded-full filter blur-[140px] pointer-events-none -z-10" />

      <Header onRefresh={() => setReloadKey((key) => key + 1)} />

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
                onClick={() => actions.setShowFileTree(false)}
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
                  onSelectFile={(path) => actions.selectFile(path)}
                  onDeleteFile={(path) => actions.deleteFile(path)}
                  onCreateFile={(path) => actions.createFile(path)}
                  onRenameFile={(oldPath, newPath) =>
                    actions.renameFile(oldPath, newPath)
                  }
                  onRenameFolder={(oldPath, newPath) =>
                    actions.renameFolder(oldPath, newPath)
                  }
                  onDeleteFolder={(path) => actions.deleteFolder(path)}
                  onCreateFolder={(path) => actions.createFolder(path)}
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
                setAddressPath={(path) => actions.setAddressPath(path)}
                onAddLog={handleAddLog}
                htmlFiles={htmlFiles}
                onTitleChange={(title) => actions.setIframeTitle(title)}
                hideHeader={true}
              />
            ) : (
              <div className="h-full w-full overflow-hidden flex flex-col">
                {activeEditFile ? (
                  <CodeEditor
                    file={activeEditFile}
                    onSave={(path, content) => actions.saveFile(path, content)}
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
            {showConsole && <ConsolePanel />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
