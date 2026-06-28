import React, { useState, useEffect, useRef } from 'react';
import { Save, Code, Image as ImageIcon, Sparkles, FileText } from 'lucide-react';
import Editor, { OnMount, BeforeMount } from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import { VirtualFile } from '../types';
import { getMimeType, formatBytes } from '../utils';
import { useI18n } from '../i18n/I18nContext';

// 自定义主题：仅定义一次，避免重复 defineTheme
const THEME_NAME = 'dist2view-dark';
let themeDefined = false;

interface CodeEditorProps {
  file: VirtualFile | null;
  onSave: (path: string, content: string) => void;
  hideHeader?: boolean;
}

export default function CodeEditor({ file, onSave, hideHeader = false }: CodeEditorProps) {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  useEffect(() => {
    if (!file) {
      setCode('');
      setIsModified(false);
      return;
    }

    if (!file.isBinary) {
      const text = file.textContent !== undefined 
        ? file.textContent 
        : new TextDecoder('utf-8').decode(file.content);
      setCode(text);
      setIsModified(false);
    } else {
      const ext = file.path.split('.').pop()?.toLowerCase() || '';
      if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
        const mimeType = getMimeType(file.path);
        const blob = new Blob([new Uint8Array(file.content)], { type: mimeType });
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
        
        return () => {
          URL.revokeObjectURL(url);
          setImageUrl(null);
        };
      }
    }
  }, [file]);

  const handleSaveClick = () => {
    if (!file) return;
    onSave(file.path, code);
    setIsModified(false);
  };

  const getLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    if (ext === 'html' || ext === 'htm') return 'html';
    if (ext === 'css') return 'css';
    if (['js', 'jsx', 'mjs'].includes(ext)) return 'javascript';
    if (['ts', 'tsx'].includes(ext)) return 'typescript';
    if (ext === 'json') return 'json';
    return 'plaintext';
  };

  const handleBeforeMount: BeforeMount = (monaco) => {
    // 主题仅定义一次（多个编辑器实例共享同一个 monaco runtime）
    if (!themeDefined) {
      monaco.editor.defineTheme(THEME_NAME, {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: '', foreground: 'cbd5e1' }, // slate-300 默认前景
          { token: 'comment', foreground: '64748b', fontStyle: 'italic' }, // slate-500
          { token: 'keyword', foreground: '818cf8' }, // indigo-400
          { token: 'operator', foreground: '94a3b8' }, // slate-400
          { token: 'number', foreground: 'fbbf24' }, // amber-400
          { token: 'string', foreground: '34d399' }, // emerald-400
          { token: 'string.escape', foreground: '22d3ee' }, // cyan-400
          { token: 'type', foreground: 'a78bfa' }, // violet-400
          { token: 'type.identifier', foreground: 'a78bfa' },
          { token: 'class', foreground: 'a78bfa' },
          { token: 'function', foreground: '22d3ee' }, // cyan-400
          { token: 'variable', foreground: 'e2e8f0' }, // slate-200
          { token: 'variable.predefined', foreground: 'f472b6' }, // pink-400
          { token: 'constant', foreground: 'fbbf24' }, // amber-400
          { token: 'delimiter', foreground: '64748b' }, // slate-500
          { token: 'tag', foreground: '818cf8' }, // indigo-400（HTML tag）
          { token: 'attribute.name', foreground: 'fbbf24' }, // amber-400
          { token: 'attribute.value', foreground: '34d399' }, // emerald-400
          { token: 'metatag', foreground: '64748b' },
          { token: 'invalid', foreground: 'f87171' }, // red-400
        ],
        colors: {
          // 编辑器底色：透明，让页面径向渐变透出
          'editor.background': '#03071200',
          'editor.foreground': '#cbd5e1',
          'editorGutter.background': '#03071200',
          'editorLineNumber.foreground': '#475569', // slate-600
          'editorLineNumber.activeForeground': '#818cf8', // indigo-400
          'editor.lineHighlightBackground': '#6366f10d',
          'editor.lineHighlightBorder': '#00000000',
          'editor.selectionBackground': '#6366f140', // indigo-500/25
          'editor.inactiveSelectionBackground': '#6366f126',
          'editor.selectionHighlightBackground': '#6366f126',
          'editorCursor.foreground': '#818cf8', // indigo-400
          'editorWhitespace.foreground': '#1e293b',
          'editorIndentGuide.background': '#1e293b',
          'editorIndentGuide.activeBackground': '#334155',
          'editorBracketMatch.background': '#6366f126',
          'editorBracketMatch.border': '#818cf880',
          'editor.findMatchBackground': '#6366f140',
          'editor.findMatchHighlightBackground': '#6366f126',
          'editor.hoverHighlightBackground': '#6366f11a',
          'editorLink.activeForeground': '#818cf8',
          'editorWidget.background': '#0b1220',
          'editorWidget.border': '#1e293b',
          'editorSuggestWidget.background': '#0b1220',
          'editorSuggestWidget.border': '#1e293b',
          'editorSuggestWidget.selectedBackground': '#6366f126',
          'editorSuggestWidget.hoverBackground': '#6366f11a',
          'editorSuggestWidget.foreground': '#cbd5e1',
          'editorSuggestWidget.highlightForeground': '#818cf8',
          'editorHoverWidget.background': '#0b1220',
          'editorHoverWidget.border': '#1e293b',
          'editorError.foreground': '#f87171',
          'editorWarning.foreground': '#fbbf24',
          'editorInfo.foreground': '#22d3ee',
          'scrollbarSlider.background': '#ffffff14',
          'scrollbarSlider.hoverBackground': '#6366f14d',
          'scrollbarSlider.activeBackground': '#6366f180',
          'scrollbar.shadow': '#00000000',
          'minimap.background': '#03071200',
          'minimapSlider.background': '#ffffff0a',
          'minimapSlider.hoverBackground': '#6366f126',
          'peekView.border': '#6366f1',
          'peekViewResult.background': '#0b1220',
          'peekViewEditor.background': '#0b1220',
        },
      });
      themeDefined = true;
    }
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Ctrl/Cmd + S 保存
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const value = editor.getValue();
      if (file) {
        onSave(file.path, value);
        setIsModified(false);
      }
    });
  };

  const handleChange = (value: string | undefined) => {
    const next = value ?? '';
    setCode(next);
    if (file) {
      // 与原始 textContent 对比，避免刚加载就被标记为已修改
      const original = file.textContent ?? '';
      setIsModified(next !== original);
    } else {
      setIsModified(true);
    }
  };

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none bg-slate-950/40 font-mono">
        <div className="w-16 h-16 rounded-full bg-white/2 flex items-center justify-center border border-white/5 text-slate-400 mb-4 shadow-inner">
          <Code className="w-8 h-8 stroke-1" />
        </div>
        <h3 className="text-sm font-bold text-slate-300">{t('noFileSelected')}</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">{t('selectFileToEdit')}</p>
      </div>
    );
  }

  const lines = code.split('\n');

  return (
    <div className="flex flex-col h-full bg-slate-950/20 overflow-hidden relative">
      {/* Editor Sub-Header (Only visible if hideHeader is false) */}
      {!hideHeader && (
        <div className="px-4 py-3 bg-white/2 border-b border-white/5 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2 min-w-0">
            {file.isBinary ? (
              <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Code className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-xs font-mono font-semibold text-slate-200 block truncate">{file.path}</span>
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
                onClick={handleSaveClick}
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
      )}

      {/* Save Trigger Floating Bar (If we are hiding header but have modified code) */}
      {hideHeader && !file.isBinary && isModified && (
        <div className="absolute top-3 right-5 z-20 flex items-center gap-2 animate-fade-in">
          <span className="text-[10px] text-amber-400 font-medium px-2 py-1 bg-slate-900/90 border border-amber-500/20 rounded-lg flex items-center gap-1 shadow-xl">
            <Sparkles className="w-2.5 h-2.5 animate-pulse" /> {t('unsavedEdits')}
          </span>
          <button
            onClick={handleSaveClick}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all shadow-lg hover:shadow-indigo-600/20 border border-indigo-500/30 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {t('saveAndSync')}
          </button>
        </div>
      )}

      {/* Editor Content Panel */}
      <div className="flex-1 overflow-auto relative bg-slate-950/40 custom-scrollbar flex min-h-0">
        {file.isBinary ? (
          /* Binary File Viewer */
          <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-slate-900/20">
            {imageUrl ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative group max-w-full max-h-[350px] overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-2 shadow-inner">
                  <img 
                    src={imageUrl} 
                    alt={file.path} 
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-[300px] object-contain rounded grid-pattern"
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
                <span className="text-xs text-slate-400 block font-semibold">{t('binaryDataView')}</span>
                <span className="text-[10px] text-slate-500 block mt-1">{t('binaryDesc')}</span>
              </div>
            )}
          </div>
        ) : (
          /* Monaco Editor */
          <div className="flex-1 h-full min-h-0 relative">
            <Editor
              path={file.path}
              language={getLanguage(file.path)}
              value={code}
              theme="dist2view-dark"
              beforeMount={handleBeforeMount}
              onMount={handleMount}
              onChange={handleChange}
              loading={
                <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">
                  <Sparkles className="w-3 h-3 mr-2 animate-pulse" />
                  Loading editor...
                </div>
              }
              options={{
                fontFamily: '"Fira Code", "JetBrains Mono", "SF Mono", monospace',
                fontSize: 12,
                lineHeight: 21,
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                roundedSelection: true,
                padding: { top: 16, bottom: 16 },
                renderWhitespace: 'selection',
                renderLineHighlight: 'all',
                guides: {
                  indentation: true,
                  bracketPairs: true,
                },
                bracketPairColorization: { enabled: true },
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                  useShadows: false,
                },
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                contextmenu: true,
                mouseWheelZoom: true,
                fixedOverflowWidgets: true,
              }}
            />
          </div>
        )}
      </div>

      {/* Editor Status Bar */}
      {!file.isBinary && (
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500 shrink-0 select-none">
          <span>Encoding: <b className="text-slate-400">UTF-8</b> &bull; Mode: <b className="text-indigo-400 uppercase">{getLanguage(file.path)}</b></span>
          <span>Lines: <b className="text-slate-400">{lines.length}</b> &bull; Chars: <b className="text-slate-400">{code.length}</b></span>
        </div>
      )}
    </div>
  );
}
