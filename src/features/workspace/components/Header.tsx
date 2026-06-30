import {
  ArrowLeft,
  FileCode,
  Eye,
  Code,
  Globe,
  RefreshCw,
  ExternalLink,
  FolderClosed,
  FolderOpen,
  Terminal,
  Download,
} from 'lucide-react';
import { useI18n } from '../../../i18n/I18nContext';
import { useWorkspace } from '../WorkspaceStore';
import { buildPreviewBaseUrl } from '../../../core/sandbox/url';

interface HeaderProps {
  onRefresh: () => void;
}

export default function Header({ onRefresh }: HeaderProps) {
  const { locale, setLocale, t } = useI18n();
  const workspace = useWorkspace();
  const {
    files,
    sandboxId,
    addressPath,
    logs,
    selectedFilePath,
    viewMode,
    iframeTitle,
    showFileTree,
    showConsole,
    actions,
  } = workspace;

  const activeEditFile =
    files.find((file) => file.path === selectedFilePath) || null;

  const handleOpenNewWindow = () => {
    if (!sandboxId) return;
    const previewBaseUrl = buildPreviewBaseUrl(sandboxId);
    const fullUrl = `${window.location.origin}${previewBaseUrl}${addressPath}`;
    window.open(fullUrl, '_blank');
  };

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
      {/* Left: Back + File path indicator */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => actions.reset()}
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
            <span
              className="truncate font-mono text-[11px] text-slate-400"
              title={iframeTitle || addressPath}
            >
              {iframeTitle || addressPath}
            </span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold truncate max-w-40 lg:max-w-70">
            <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span
              className="truncate font-mono text-[11px] text-slate-300 font-bold"
              title={selectedFilePath || 'index.html'}
            >
              {selectedFilePath || 'index.html'}
            </span>
            <span className="text-slate-700 font-mono text-[11px] hidden lg:inline">•</span>
            <span className="text-[11px] text-slate-500 font-mono hidden lg:inline">
              {activeEditFile
                ? `${(activeEditFile.size / 1024).toFixed(1)} KB`
                : '0.0 KB'}
            </span>
          </div>
        )}
      </div>

      {/* Center: View toggle + Preview tools */}
      <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
        <div className="flex items-center bg-slate-900 border border-white/5 rounded-xl p-0.5 shadow-inner shrink-0">
          <button
            onClick={() => actions.setViewMode('preview')}
            className={`px-2 py-1 sm:px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
            title={t('previewTab')}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('previewTab')}</span>
          </button>
          <button
            onClick={handleSwitchToCode}
            className={`px-2 py-1 sm:px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              viewMode === 'code'
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
                onChange={(e) => actions.setAddressPath(e.target.value)}
                placeholder="index.html"
                className="bg-slate-950/50 border border-white/5 focus:border-indigo-500/30 rounded-lg pl-7 pr-2 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none font-mono w-35"
              />
            </div>
            <button
              onClick={onRefresh}
              className="p-1.5 hover:bg-white/8 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
              title={t('refreshPreview')}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleOpenNewWindow}
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
          onClick={() => actions.setShowFileTree(!showFileTree)}
          className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
            showFileTree
              ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-300 font-bold'
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
          onClick={() => actions.downloadZip()}
          className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/15 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          title={t('exportZipTooltip')}
          id="export-zip-btn"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('exportZip')}</span>
        </button>

        {/* Tiny inline locale toggle */}
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
  );
}
