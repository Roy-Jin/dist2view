import React, { useState, useRef, useEffect } from 'react';
import { 
  RefreshCw, 
  ExternalLink, 
  Globe,
  Loader2
} from 'lucide-react';
import { ConsoleLog } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { buildPreviewBaseUrl, buildSandboxUrl, IFRAME_SANDBOX_POLICY } from '../config';

interface PreviewFrameProps {
  key?: any;
  sandboxId: string;
  addressPath: string;
  setAddressPath: (path: string) => void;
  onAddLog: (log: ConsoleLog) => void;
  htmlFiles?: string[];
  onTitleChange?: (title: string) => void;
  hideHeader?: boolean;
}

export default function PreviewFrame({ 
  sandboxId, 
  addressPath, 
  setAddressPath,
  onAddLog, 
  htmlFiles = [],
  onTitleChange,
  hideHeader = false
}: PreviewFrameProps) {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const previewBaseUrl = buildPreviewBaseUrl(sandboxId);
  const fullPreviewUrl = buildSandboxUrl(sandboxId, addressPath);

  // When sandboxId or addressPath changes, load the iframe
  useEffect(() => {
    if (!sandboxId) return;
    
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = fullPreviewUrl;
    }
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [sandboxId, addressPath]);

  const handleReload = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = fullPreviewUrl;
    }
    setTimeout(() => setIsLoading(false), 600);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    try {
      const iframeWindow = iframeRef.current?.contentWindow as any;
      if (!iframeWindow) return;

      // Extract and update document title
      try {
        const title = iframeWindow.document?.title;
        if (title) {
          setDocTitle(title);
          onTitleChange?.(title);
        } else {
          setDocTitle(addressPath);
          onTitleChange?.(addressPath);
        }
      } catch (titleErr) {
        setDocTitle(addressPath);
        onTitleChange?.(addressPath);
      }

      // Track internal navigation changes if they click links
      const currentInnerPath = iframeWindow.location.pathname;
      if (currentInnerPath.startsWith(previewBaseUrl)) {
        const subPath = currentInnerPath.replace(previewBaseUrl, '');
        if (subPath !== addressPath) {
          setAddressPath(subPath);
        }
      }

      // Hook all console methods
      const formatMessage = (args: any[]): string => {
        return args.map(arg => {
          if (arg === null) return 'null';
          if (arg === undefined) return 'undefined';
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg);
            } catch (e) {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' ');
      };

      const hookConsoleMethod = (method: string, logType: 'log' | 'info' | 'warn' | 'error' | 'debug') => {
        const original = iframeWindow.console[method];
        iframeWindow.console[method] = (...args: any[]) => {
          onAddLog({
            type: logType,
            message: formatMessage(args),
            timestamp: new Date().toLocaleTimeString()
          });
          original.apply(iframeWindow.console, args);
        };
      };

      hookConsoleMethod('log', 'log');
      hookConsoleMethod('info', 'info');
      hookConsoleMethod('warn', 'warn');
      hookConsoleMethod('error', 'error');
      hookConsoleMethod('debug', 'debug');

      // console.assert: only logs when assertion fails
      const originalAssert = iframeWindow.console.assert;
      iframeWindow.console.assert = (condition: any, ...args: any[]) => {
        if (!condition) {
          onAddLog({
            type: 'error',
            message: 'Assertion failed: ' + formatMessage(args),
            timestamp: new Date().toLocaleTimeString()
          });
        }
        originalAssert.apply(iframeWindow.console, [condition, ...args]);
      };

      // console.table / console.dir / console.trace → map to log
      const hookPassthrough = (method: string, prefix: string) => {
        const original = iframeWindow.console[method];
        iframeWindow.console[method] = (...args: any[]) => {
          onAddLog({
            type: 'log',
            message: prefix + formatMessage(args),
            timestamp: new Date().toLocaleTimeString()
          });
          original.apply(iframeWindow.console, args);
        };
      };
      hookPassthrough('table', '[table] ');
      hookPassthrough('dir', '[dir] ');
      hookPassthrough('trace', '[trace] ');
      hookPassthrough('count', '[count] ');

      // console.clear → log a clear marker
      const originalClear = iframeWindow.console.clear;
      iframeWindow.console.clear = () => {
        onAddLog({
          type: 'log',
          message: '[console was cleared]',
          timestamp: new Date().toLocaleTimeString()
        });
        originalClear.apply(iframeWindow.console);
      };

      // Capture runtime errors
      const errorHandler = (event: any) => {
        onAddLog({
          type: 'error',
          message: event.error?.message || event.message || 'Unhandled Runtime Error',
          timestamp: new Date().toLocaleTimeString()
        });
      };

      // Capture unhandled promise rejections
      const rejectionHandler = (event: any) => {
        const reason = event.reason;
        const message = reason instanceof Error ? reason.message : formatMessage([reason]);
        onAddLog({
          type: 'error',
          message: 'Unhandled Promise Rejection: ' + message,
          timestamp: new Date().toLocaleTimeString()
        });
      };

      // Remove previous listeners to avoid accumulation on reload
      iframeWindow.removeEventListener('error', (iframeWindow as any).__dist2viewErrorHandler);
      iframeWindow.removeEventListener('unhandledrejection', (iframeWindow as any).__dist2viewRejectionHandler);

      iframeWindow.addEventListener('error', errorHandler);
      iframeWindow.addEventListener('unhandledrejection', rejectionHandler);

      // Store refs for cleanup on next load
      (iframeWindow as any).__dist2viewErrorHandler = errorHandler;
      (iframeWindow as any).__dist2viewRejectionHandler = rejectionHandler;

    } catch (err) {
      console.warn('Iframe sandbox hooks isolated:', err);
    }
  };

  const handleOpenNewTab = () => {
    window.open(fullPreviewUrl, '_blank');
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleReload();
  };

  return (
    <div className={`flex flex-col h-full bg-slate-950/20 ${hideHeader ? '' : 'border border-white/5 rounded-2xl'} overflow-hidden shadow-2xl relative`}>
      
      {/* Minimalist Address bar & Controller */}
      {!hideHeader && (
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Dynamic Document Title with pulsing status */}
          <div className="flex items-center gap-1.5 bg-white/2 border border-white/5 px-2.5 py-1.5 rounded-xl text-slate-300 text-xs font-semibold shrink-0 select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="max-w-[180px] truncate font-mono tracking-tight" title={docTitle || addressPath}>
              {docTitle || addressPath}
            </span>
          </div>

          {/* Address URL Input bar */}
          <form onSubmit={handleAddressSubmit} className="flex-1 min-w-[200px] max-w-xl flex items-center">
            <div className="relative w-full flex items-center">
              <Globe className="w-3.5 h-3.5 text-slate-600 absolute left-3" />
              <span className="text-[10px] font-mono font-medium text-slate-500 absolute left-8 select-none">
                preview/
              </span>
              <input 
                type="text" 
                value={addressPath}
                onChange={(e) => setAddressPath(e.target.value)}
                placeholder="index.html" 
                className="w-full bg-slate-950/30 border border-white/5 focus:border-indigo-500/30 rounded-xl pl-[84px] pr-20 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none font-mono"
              />
              
              {/* Quick Action Buttons */}
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleReload}
                  className="p-1 hover:bg-white/8 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                  title={t('refreshPreview')}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="p-1 hover:bg-white/8 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                  title={t('openNewWindow')}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>

          {/* Balance space */}
          <div className="w-4 h-4 hidden md:block" />
        </div>
      )}

      {/* Frame Visual Area */}
      <div className="flex-1 bg-slate-950/10 flex items-center justify-center p-0 overflow-hidden relative">
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3 z-30 backdrop-blur-md">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{t('reloadingFrame')}</span>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={fullPreviewUrl}
          onLoad={handleIframeLoad}
          sandbox={IFRAME_SANDBOX_POLICY}
          className="w-full h-full border-none bg-white"
          title="Static Output Frame"
          id="preview-iframe-element"
        />
      </div>
    </div>
  );
}
