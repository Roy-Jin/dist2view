import { Save, Code, Image as ImageIcon, Sparkles } from 'lucide-react';
import { VirtualFile } from '../../core/types';
import { getMimeType } from '../../core/file/parser';
import { formatBytes } from '../../utils/format';
import { useI18n } from '../../i18n/I18nContext';

interface EditorHeaderProps {
  file: VirtualFile;
  isModified: boolean;
  hideHeader?: boolean;
  onSave: () => void;
}

export default function EditorHeader({
  file,
  isModified,
  hideHeader = false,
  onSave,
}: EditorHeaderProps) {
  const { t } = useI18n();

  if (hideHeader) {
    if (file.isBinary || !isModified) return null;

    return (
      <div className="absolute top-3 right-5 z-20 flex items-center gap-2 animate-fade-in">
        <span className="text-[10px] text-amber-400 font-medium px-2 py-1 bg-slate-900/90 border border-amber-500/20 rounded-lg flex items-center gap-1 shadow-xl">
          <Sparkles className="w-2.5 h-2.5 animate-pulse" /> {t('unsavedEdits')}
        </span>
        <button
          onClick={onSave}
          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all shadow-lg hover:shadow-indigo-600/20 border border-indigo-500/30 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          {t('saveAndSync')}
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 bg-white/2 border-b border-white/5 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-2 min-w-0">
        {file.isBinary ? (
          <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <Code className="w-4 h-4 text-indigo-400 shrink-0" />
        )}
        <div className="min-w-0">
          <span className="text-xs font-mono font-semibold text-slate-200 block truncate">
            {file.path}
          </span>
          <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
            {formatBytes(file.size)} &bull; {getMimeType(file.path).split(';')[0]}
          </span>
        </div>
      </div>

      {!file.isBinary && (
        <div className="flex items-center gap-2">
          {isModified && (
            <span className="text-[10px] text-amber-400 font-medium px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> {t('unsavedEdits')}
            </span>
          )}
          <button
            onClick={onSave}
            disabled={!isModified}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
              isModified
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                : 'bg-white/2 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {t('saveAndSync')}
          </button>
        </div>
      )}
    </div>
  );
}
