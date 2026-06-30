import { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import Editor, { OnMount, BeforeMount } from '@monaco-editor/react';
import { VirtualFile } from '../core/types';
import { getMimeType } from '../core/file/parser';
import EmptyState from './code-editor/EmptyState';
import EditorHeader from './code-editor/EditorHeader';
import EditorTabs from './code-editor/EditorTabs';
import BinaryViewer from './code-editor/BinaryViewer';
import EditorStatusBar from './code-editor/EditorStatusBar';

// Custom theme: define once to avoid repeated defineTheme calls
const THEME_NAME = 'dist2view-dark';
let themeDefined = false;

interface CodeEditorProps {
  file: VirtualFile | null;
  files: VirtualFile[];
  tabs: string[];
  activeTab: string | null;
  onSave: (path: string, content: string) => void;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  hideHeader?: boolean;
}

export default function CodeEditor({
  file,
  files,
  tabs,
  activeTab,
  onSave,
  onSelectTab,
  onCloseTab,
  hideHeader = false,
}: CodeEditorProps) {
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
    // Define theme once (multiple editor instances share the same monaco runtime)
    if (!themeDefined) {
      // Theme palette:
      //   primary      #45969c  — teal (brand color)
      //   primary-dim  #67b3b8  — lighter teal for active line numbers / highlights
      //   primary-dark #2f7278  — darker teal
      monaco.editor.defineTheme(THEME_NAME, {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: '', foreground: 'cbd5e1' },                    // slate-300 default
          { token: 'comment', foreground: '64748b', fontStyle: 'italic' }, // slate-500
          { token: 'keyword', foreground: '45969c' },             // primary teal
          { token: 'operator', foreground: '94a3b8' },            // slate-400
          { token: 'number', foreground: 'fbbf24' },              // amber-400
          { token: 'string', foreground: '34d399' },              // emerald-400
          { token: 'string.escape', foreground: '67b3b8' },       // primary-dim
          { token: 'type', foreground: '7ecdd1' },                // teal-300-ish
          { token: 'type.identifier', foreground: '7ecdd1' },
          { token: 'class', foreground: '7ecdd1' },
          { token: 'function', foreground: '67b3b8' },            // primary-dim
          { token: 'variable', foreground: 'e2e8f0' },            // slate-200
          { token: 'variable.predefined', foreground: 'f472b6' }, // pink-400
          { token: 'constant', foreground: 'fbbf24' },            // amber-400
          { token: 'delimiter', foreground: '64748b' },           // slate-500
          { token: 'tag', foreground: '45969c' },                 // primary teal (HTML tag)
          { token: 'attribute.name', foreground: 'fbbf24' },      // amber-400
          { token: 'attribute.value', foreground: '34d399' },     // emerald-400
          { token: 'metatag', foreground: '64748b' },
          { token: 'invalid', foreground: 'f87171' },             // red-400
        ],
        colors: {
          // Editor background: transparent to let the page radial gradient show through
          'editor.background': '#03071200',
          'editor.foreground': '#cbd5e1',
          'editorGutter.background': '#03071200',
          'editorLineNumber.foreground': '#475569',       // slate-600
          'editorLineNumber.activeForeground': '#45969c', // primary
          'editor.lineHighlightBackground': '#45969c0d',
          'editor.lineHighlightBorder': '#00000000',
          'editor.selectionBackground': '#45969c40',
          'editor.inactiveSelectionBackground': '#45969c26',
          'editor.selectionHighlightBackground': '#45969c26',
          'editorCursor.foreground': '#45969c',
          'editorWhitespace.foreground': '#1e293b',
          'editorIndentGuide.background': '#1e293b',
          'editorIndentGuide.activeBackground': '#334155',
          'editorBracketMatch.background': '#45969c26',
          'editorBracketMatch.border': '#45969c80',
          'editor.findMatchBackground': '#45969c40',
          'editor.findMatchHighlightBackground': '#45969c26',
          'editor.hoverHighlightBackground': '#45969c1a',
          'editorLink.activeForeground': '#67b3b8',
          'editorWidget.background': '#0b1220',
          'editorWidget.border': '#1e293b',
          'editorSuggestWidget.background': '#0b1220',
          'editorSuggestWidget.border': '#1e293b',
          'editorSuggestWidget.selectedBackground': '#45969c26',
          'editorSuggestWidget.hoverBackground': '#45969c1a',
          'editorSuggestWidget.foreground': '#cbd5e1',
          'editorSuggestWidget.highlightForeground': '#45969c',
          'editorHoverWidget.background': '#0b1220',
          'editorHoverWidget.border': '#1e293b',
          'editorError.foreground': '#f87171',
          'editorWarning.foreground': '#fbbf24',
          'editorInfo.foreground': '#67b3b8',
          'scrollbarSlider.background': '#ffffff14',
          'scrollbarSlider.hoverBackground': '#45969c4d',
          'scrollbarSlider.activeBackground': '#45969c80',
          'scrollbar.shadow': '#00000000',
          'minimap.background': '#03071200',
          'minimapSlider.background': '#ffffff0a',
          'minimapSlider.hoverBackground': '#45969c26',
          'peekView.border': '#45969c',
          'peekViewResult.background': '#0b1220',
          'peekViewEditor.background': '#0b1220',
        },
      });
      themeDefined = true;
    }
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Ctrl/Cmd + S to save
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
      // Compare against original textContent to avoid flagging as modified right after load
      const original = file.textContent ?? '';
      setIsModified(next !== original);
    } else {
      setIsModified(true);
    }
  };

  if (!file) {
    return <EmptyState />;
  }

  const lines = code.split('\n');

  return (
    <div className="flex flex-col h-full min-w-0 bg-slate-950/20 overflow-visible relative">
      {tabs.length > 0 && (
        <EditorTabs
          tabs={tabs}
          activeTab={activeTab || ''}
          files={files}
          onSelect={onSelectTab}
          onClose={onCloseTab}
        />
      )}
      <EditorHeader
        file={file}
        isModified={isModified}
        hideHeader={hideHeader}
        onSave={handleSaveClick}
      />

      {/* Editor Content Panel */}
      <div className="flex-1 overflow-visible relative bg-slate-950/40 flex min-h-0 min-w-0">
        {file.isBinary ? (
          <BinaryViewer file={file} imageUrl={imageUrl} />
        ) : (
          /* Monaco Editor */
          <div className="flex-1 h-full min-h-0 min-w-0 relative w-full overflow-visible">
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

      {!file.isBinary && (
        <EditorStatusBar
          language={getLanguage(file.path)}
          lineCount={lines.length}
          charCount={code.length}
        />
      )}
    </div>
  );
}
