import { motion } from 'motion/react';
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
  const {
    handleFileInput,
    handleFolderInput,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    loadDemoTemplate,
  } = useUploader();

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
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                locale === 'en'
                  ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
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
            className={`w-full max-w-lg mx-auto rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all cursor-pointer relative overflow-hidden group ${
              isDragging
                ? 'border-indigo-500/60 bg-indigo-500/10 shadow-[0_0_32px_0_rgba(99,102,241,0.15)]'
                : 'border-white/10 bg-white/1 hover:border-white/20 hover:bg-white/2 hover:shadow-[0_12px_40px_0_rgba(99,102,241,0.03)]'
            }`}
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
