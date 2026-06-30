interface EditorStatusBarProps {
  language: string;
  lineCount: number;
  charCount: number;
}

export default function EditorStatusBar({
  language,
  lineCount,
  charCount,
}: EditorStatusBarProps) {
  return (
    <div className="px-4 py-2.5 bg-slate-950/60 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500 shrink-0 select-none">
      <span>
        Encoding: <b className="text-slate-400">UTF-8</b> &bull; Mode:{' '}
        <b className="text-indigo-400 uppercase">{language}</b>
      </span>
      <span>
        Lines: <b className="text-slate-400">{lineCount}</b> &bull; Chars:{' '}
        <b className="text-slate-400">{charCount}</b>
      </span>
    </div>
  );
}
