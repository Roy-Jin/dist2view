import { FileText } from 'lucide-react';
import { VirtualFile } from '../../core/types';
import { useI18n } from '../../i18n/I18nContext';

interface BinaryViewerProps {
  file: VirtualFile;
  imageUrl: string | null;
}

export default function BinaryViewer({ file, imageUrl }: BinaryViewerProps) {
  const { t } = useI18n();

  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-slate-900/20">
      {imageUrl ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative group max-w-full max-h-87.5 overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-2 shadow-inner">
            <img
              src={imageUrl}
              alt={file.path}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-75 object-contain rounded grid-pattern"
            />
          </div>
          <div className="text-center">
            <span className="text-[11px] bg-slate-900 border border-slate-800 text-emerald-400 font-mono px-3 py-1 rounded-full shadow-sm">
              {t('imageMode')}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-1" />
          <span className="text-xs text-slate-400 block font-semibold">
            {t('binaryDataView')}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">
            {t('binaryDesc')}
          </span>
        </div>
      )}
    </div>
  );
}
