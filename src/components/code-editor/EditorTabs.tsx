import { useEffect, useRef, useState } from 'react';
import { X, FileCode, Image as ImageIcon } from 'lucide-react';
import { VirtualFile } from '../../core/types';

interface EditorTabsProps {
  tabs: string[];
  activeTab: string;
  files: VirtualFile[];
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

export default function EditorTabs({
  tabs,
  activeTab,
  files,
  onSelect,
  onClose,
}: EditorTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const getFile = (path: string): VirtualFile | undefined =>
    files.find((file) => file.path === path);

  const getFileName = (path: string): string => {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  };

  const updateFadeIndicators = () => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftFade(scrollLeft > 0);
    setShowRightFade(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    updateFadeIndicators();
  }, [tabs]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => updateFadeIndicators();
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      if (container.scrollWidth <= container.clientWidth) return;
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const activeButton = container.querySelector(
      `[data-tab-path="${CSS.escape(activeTab)}"]`
    ) as HTMLElement | null;
    if (!activeButton) return;

    const containerLeft = container.scrollLeft;
    const containerRight = containerLeft + container.clientWidth;
    const buttonLeft = activeButton.offsetLeft;
    const buttonRight = buttonLeft + activeButton.clientWidth;

    if (buttonLeft < containerLeft) {
      container.scrollTo({ left: buttonLeft, behavior: 'smooth' });
    } else if (buttonRight > containerRight) {
      container.scrollTo({
        left: buttonRight - container.clientWidth,
        behavior: 'smooth',
      });
    }
  }, [activeTab]);

  return (
    <div className="relative min-w-0 bg-slate-950/60 border-b border-white/5 shrink-0 select-none">
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-950/90 to-transparent pointer-events-none z-10" />
      )}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-950/90 to-transparent pointer-events-none z-10" />
      )}
      <div
        ref={containerRef}
        className="flex items-center min-w-0 overflow-x-auto scrollbar-hide"
      >
        {tabs.map((path) => {
          const file = getFile(path);
          const isActive = path === activeTab;
          const isImage =
            file?.isBinary &&
            ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(
              file.path.split('.').pop()?.toLowerCase() || ''
            );

          return (
            <button
              key={path}
              data-tab-path={path}
              onClick={() => onSelect(path)}
              className={`group flex shrink-0 items-center gap-1.5 px-3 py-2 text-[11px] font-mono cursor-pointer border-r border-white/5 whitespace-nowrap transition-all min-w-0 ${
                isActive
                  ? 'bg-white/10 text-slate-200 border-b-2 border-b-indigo-500'
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
              }`}
              title={path}
            >
              {isImage ? (
                <ImageIcon className="w-3 h-3 shrink-0" />
              ) : (
                <FileCode className="w-3 h-3 shrink-0" />
              )}
              <span className="truncate max-w-24 sm:max-w-32">
                {getFileName(path)}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(path);
                }}
                className="w-4 h-4 flex items-center justify-center rounded transition-colors hover:bg-white/10 hover:text-rose-400"
                title="Close tab"
              >
                <X className="w-3 h-3" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
