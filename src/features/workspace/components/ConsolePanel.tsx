import { Terminal, Trash2, X } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nContext';
import { useWorkspace } from '../WorkspaceStore';

export default function ConsolePanel() {
  const { t } = useI18n();
  const { logs, actions } = useWorkspace();

  return (
    <div
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
              onClick={() => actions.clearLogs()}
              className="text-slate-500 hover:text-rose-400 text-[11px] font-mono flex items-center gap-1 bg-white/2 border border-white/5 px-2 py-0.5 rounded-md transition-all cursor-pointer"
              id="clear-logs-btn"
            >
              <Trash2 className="w-3 h-3" />
              {t('clearLogs')}
            </button>
          )}
          <button
            onClick={() => actions.setShowConsole(false)}
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
              <div
                key={index}
                className={`flex items-start gap-2.5 px-3 py-1.5 rounded-lg leading-relaxed break-all ${colorClass}`}
              >
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
    </div>
  );
}
