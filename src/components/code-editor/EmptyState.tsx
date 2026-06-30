import { Code } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

export default function EmptyState() {
  const { t } = useI18n();

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none bg-slate-950/40 font-mono">
      <div className="w-16 h-16 rounded-full bg-white/2 flex items-center justify-center border border-white/5 text-slate-400 mb-4 shadow-inner">
        <Code className="w-8 h-8 stroke-1" />
      </div>
      <h3 className="text-sm font-bold text-slate-300">{t('noFileSelected')}</h3>
      <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
        {t('selectFileToEdit')}
      </p>
    </div>
  );
}
