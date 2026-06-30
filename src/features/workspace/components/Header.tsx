import {
  ArrowLeft,
  Eye,
  Code,
  FolderClosed,
  FolderOpen,
  Terminal,
} from 'lucide-react';
import { useI18n } from '../../../i18n/I18nContext';
import { useWorkspace } from '../WorkspaceStore';

export default function Header() {
  const { t } = useI18n();
  const workspace = useWorkspace();
  const {
    files,
    logs,
    selectedFilePath,
    viewMode,
    showFileTree,
    showConsole,
    actions,
  } = workspace;

  const handleSwitchToCode = () => {
    actions.setViewMode('code');
    if (!selectedFilePath && files.length > 0) {
      const defaultFile =
        files.find((file) => file.path.toLowerCase() === 'index.html') ||
        files[0];
      actions.selectFile(defaultFile.path);
    }
  };

  return (
    <header className="h-14 px-3 sm:px-6 bg-slate-950 border-b border-white/5 flex items-center justify-between shrink-0 select-none z-10">
      {/* Left: Back + Logo */}
      <div className="flex items-center gap-2 min-w-0">
        <img src="/logo.webp" alt="Dist2View" className="w-6 h-6 object-contain shrink-0 hidden sm:block" draggable="false" />
        <button
          onClick={() => actions.reset()}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-all py-1.5 px-2.5 sm:px-3.5 rounded-xl bg-white/2 border border-white/5 hover:bg-white/6 cursor-pointer font-semibold shadow-inner shrink-0"
          title={t('backToUploader')}
          id="back-to-uploader-btn"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">{t('backToUploader')}</span>
        </button>
      </div>

      {/* Right: View toggle + Explorer + Console + Export + Locale */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* View toggle */}
        <div className="flex items-center bg-slate-900 border border-white/5 rounded-xl p-0.5 shadow-inner shrink-0">
          <button
            onClick={handleSwitchToCode}
            className={`px-2 py-1 sm:px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              viewMode === 'code'
                ? 'bg-[#45969c] text-white shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
            title={t('codeTab')}
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('codeTab')}</span>
          </button>
          <button
            onClick={() => actions.setViewMode('preview')}
            className={`px-2 py-1 sm:px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-[#45969c] text-white shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
            title={t('previewTab')}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('previewTab')}</span>
          </button>
        </div>

        <div className="hidden sm:block h-4 w-px bg-white/5" />

        {/* File Tree toggle */}
        <button
          onClick={() => actions.setShowFileTree(!showFileTree)}
          className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
            showFileTree
              ? 'bg-[#45969c]/10 border-[#45969c]/20 text-[#45969c] font-bold'
              : 'bg-white/2 border-white/5 text-slate-400 hover:text-slate-200'
          }`}
          title={t('toggleExplorer')}
          id="toggle-explorer-btn"
        >
          {showFileTree ? (
            <FolderOpen className="w-3.5 h-3.5" />
          ) : (
            <FolderClosed className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">{t('explorer')}</span>
        </button>

        {/* Console toggle */}
        <button
          onClick={() => actions.setShowConsole(!showConsole)}
          className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer relative ${
            showConsole
              ? 'bg-[#45969c]/10 border-[#45969c]/20 text-[#45969c] font-bold'
              : 'bg-white/2 border-white/5 text-slate-400 hover:text-slate-200'
          }`}
          title={t('toggleConsole')}
          id="toggle-console-btn"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('console')}</span>
          {logs.length > 0 && (
            <span className="h-4 min-w-4 px-1 rounded-full bg-[#45969c]/20 border border-[#45969c]/30 text-[11px] font-bold text-[#45969c] font-mono flex items-center justify-center">
              {logs.length}
            </span>
          )}
        </button>

      </div>
    </header>
  );
}
