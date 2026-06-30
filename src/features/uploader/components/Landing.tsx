import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FolderOpen,
  Sparkles,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useI18n } from '../../../i18n/I18nContext';
import { useWorkspace } from '../../workspace/WorkspaceStore';
import { useUploader } from '../hooks/useUploader';

export default function Landing() {
  const { locale, setLocale, t } = useI18n();
  const { isSwRegistered, registerError, isDragging } = useWorkspace();
  const { handleFileInput, handleFolderInput, loadDemoTemplate } = useUploader();

  return (
    <div className="min-h-screen text-slate-200 flex flex-col font-sans grid-pattern relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-220 h-220 bg-[#45969c]/5 rounded-full filter blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-15%] right-[-5%] w-180 h-180 bg-[#45969c]/5 rounded-full filter blur-[140px] pointer-events-none -z-10" />

      {/* Top Minimalist Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between border-b border-white/3">
        <div className="flex items-center gap-2.5">
          <img src="/logo.webp" alt="Dist2View logo" className="w-7 h-7 object-contain" draggable="false" />
          <span className="text-xs font-semibold tracking-widest text-[#45969c] uppercase select-none font-mono">
            {t('title')}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Elegant Language Switcher */}
          <div className="flex items-center gap-1 bg-white/2 border border-white/5 rounded-xl p-0.5 shadow-inner">
            <button
              onClick={() => setLocale('en')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                locale === 'en'
                  ? 'bg-[#45969c] text-white shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t('switchToEnglish')}
            >
              EN
            </button>
            <button
              onClick={() => setLocale('zh')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                locale === 'zh'
                  ? 'bg-[#45969c] text-white shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t('switchToChinese')}
            >
              中文
            </button>
          </div>

          {isSwRegistered ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono shadow-sm shadow-emerald-500/5">
              <CheckCircle className="w-3 h-3" /> {t('swActive')}
            </span>
          ) : registerError ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[11px] font-bold text-rose-400 uppercase tracking-wider font-mono">
              ⚠️ {t('swRestricted')}
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/5 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
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
        className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 flex flex-col justify-center items-center py-10 sm:py-16 md:py-24"
      >
        <div className="text-center space-y-8 sm:space-y-10 max-w-2xl w-full">
          {/* Visual Icon */}
<div className="space-y-3 sm:space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-white font-sans leading-[1.1]">
              {t('zeroLag')} <br />
              <span className="font-normal bg-linear-to-r from-[#67b3b8] via-[#45969c] to-[#7ecdd1] bg-clip-text text-transparent">
                {t('pureSandbox')}
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-light max-w-md mx-auto px-2 sm:px-0">
              {t('landingDesc')}
            </p>
          </div>

          {/* Drag and Drop Zone Container */}
          <motion.div
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            className="w-full max-w-xl mx-auto rounded-3xl border-2 border-dashed p-6 sm:p-10 text-center transition-all cursor-pointer relative overflow-hidden group bg-white/2 hover:bg-white/3 hover:border-white/20 hover:shadow-[0_12px_40px_0_rgba(69,150,156,0.04)] border-white/10"
          >
            <input
              type="file"
              accept=".zip"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileInput(file);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              id="zip-uploader-input"
            />

            <div className="space-y-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-950/40 flex items-center justify-center border border-white/5 mx-auto group-hover:border-[#45969c]/20 group-hover:text-[#45969c] transition-colors shadow-inner">
                <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400 group-hover:text-[#45969c] transition-all group-hover:-translate-y-0.5 duration-300" />
              </div>
              <div className="space-y-1.5">
                <span className="text-sm sm:text-base font-semibold text-slate-200 block">
                  {t('dropZip', { filename: 'dist.zip' }).split('{filename}')[0]}
                  <code className="bg-slate-900 px-1.5 py-0.5 rounded text-[#45969c] text-xs sm:text-sm font-mono">dist.zip</code>
                  {t('dropZip', { filename: 'dist.zip' }).split('{filename}')[1]}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 block font-light">
                  {t('uploadUnzip')}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Quick Upload Action Buttons & Demos */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            {/* Directory selection button */}
            <div className="relative group/btn cursor-pointer px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-slate-300 text-xs sm:text-sm font-semibold border border-white/5 transition-all shadow-md flex items-center gap-2 w-full sm:w-auto justify-center">
              <input
                type="file"
                // @ts-ignore
                webkitdirectory=""
                directory=""
                multiple
                onChange={(e) => {
                  const fileList = e.target.files;
                  if (fileList) handleFolderInput(fileList);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                id="folder-uploader-input"
              />
              <FolderOpen className="w-4 h-4 text-slate-400" />
              {t('uploadFolder')}
            </div>

            {/* Sample Template Trigger */}
            <button
              onClick={loadDemoTemplate}
              className="px-5 py-2.5 rounded-xl bg-[#45969c] hover:bg-[#67b3b8] hover:scale-[1.01] text-xs sm:text-sm font-semibold text-white transition-all shadow-lg shadow-[#45969c]/10 cursor-pointer flex items-center gap-2 w-full sm:w-auto justify-center"
              id="demo-template-btn"
            >
              <Sparkles className="w-4 h-4" />
              {t('loadDemo')}
            </button>
          </div>
        </div>
      </motion.main>

      {/* Minimalist Footer */}
      <footer className="w-full border-t border-white/3 py-4 sm:py-5 px-4 sm:px-6 mt-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-500 font-mono max-w-7xl mx-auto">
        <span className="text-center sm:text-left">{t('secureBanner')}</span>
        <span className="text-center sm:text-right">{t('offlineEncryption')}</span>
      </footer>

      {/* Full-body drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-2xl rounded-3xl border-2 border-dashed border-[#45969c]/60 bg-[#45969c]/10 p-10 sm:p-16 flex flex-col items-center justify-center text-center shadow-[0_0_64px_0_rgba(69,150,156,0.25)]"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#45969c]/20 flex items-center justify-center border border-[#45969c]/30 mb-6"
              >
                <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-[#67b3b8]" />
              </motion.div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                {t('dropZip', { filename: 'dist.zip' }).split('{filename}')[0]}
                <span className="text-[#67b3b8]">dist.zip</span>
                {t('dropZip', { filename: 'dist.zip' }).split('{filename}')[1]}
              </h3>
              <p className="text-sm text-slate-300 font-light">
                {t('uploadUnzip')}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
