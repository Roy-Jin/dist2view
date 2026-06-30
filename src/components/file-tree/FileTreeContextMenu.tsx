import { Plus, FolderPlus, Edit3, Trash2, FileText } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

interface ContextMenuState {
  x: number;
  y: number;
  path: string;
  isDirectory: boolean;
  visible: boolean;
}

interface FileTreeContextMenuProps {
  contextMenu: ContextMenuState;
  onClose: () => void;
  onSelectFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onDeleteFolder: (path: string) => void;
  onStartCreate: (parentPath: string, type: 'file' | 'folder') => void;
  onStartRename: (path: string, isDirectory: boolean) => void;
}

export default function FileTreeContextMenu({
  contextMenu,
  onClose,
  onSelectFile,
  onDeleteFile,
  onDeleteFolder,
  onStartCreate,
  onStartRename,
}: FileTreeContextMenuProps) {
  const { t } = useI18n();

  if (!contextMenu.visible) return null;

  return (
    <div
      className="fixed bg-slate-950/90 border border-white/10 rounded-2xl py-1.5 w-44 shadow-2xl backdrop-blur-xl z-50 text-slate-300 font-sans text-[11px] animate-fade-in overflow-hidden"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={onClose}
    >
      {contextMenu.isDirectory ? (
        <>
          <div className="px-3 py-1 text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider border-b border-white/5 mb-1 select-none">
            {t('folderActions')}
          </div>
          <button
            onClick={() => onStartCreate(contextMenu.path, 'file')}
            className="w-full text-left px-3 py-2 hover:bg-[#45969c] hover:text-white transition-colors flex items-center gap-2 cursor-pointer font-medium"
          >
            <Plus className="w-3.5 h-3.5 text-[#45969c] group-hover:text-white shrink-0" />
            <span>{t('createFile')}</span>
          </button>
          <button
            onClick={() => onStartCreate(contextMenu.path, 'folder')}
            className="w-full text-left px-3 py-2 hover:bg-[#45969c] hover:text-white transition-colors flex items-center gap-2 cursor-pointer font-medium"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#45969c] group-hover:text-white shrink-0" />
            <span>{t('newSubfolder')}</span>
          </button>
          <button
            onClick={() => onStartRename(contextMenu.path, true)}
            className="w-full text-left px-3 py-2 hover:bg-[#45969c] hover:text-white transition-colors flex items-center gap-2 cursor-pointer font-medium"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#45969c] group-hover:text-white shrink-0" />
            <span>{t('renameFolder')}</span>
          </button>
          <div className="h-px bg-white/5 my-1" />
          <button
            onClick={() => {
              if (confirm(t('confirmDeleteFolder', { path: contextMenu.path }))) {
                onDeleteFolder(contextMenu.path);
              }
            }}
            className="w-full text-left px-3 py-2 hover:bg-rose-600 hover:text-white text-rose-400 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:text-white shrink-0" />
            <span>{t('deleteFolder')}</span>
          </button>
        </>
      ) : (
        <>
          <div className="px-3 py-1 text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider border-b border-white/5 mb-1 select-none">
            {t('fileActions')}
          </div>
          <button
            onClick={() => onSelectFile(contextMenu.path)}
            className="w-full text-left px-3 py-2 hover:bg-[#45969c] hover:text-white transition-colors flex items-center gap-2 cursor-pointer font-medium"
          >
            <FileText className="w-3.5 h-3.5 text-[#45969c] group-hover:text-white shrink-0" />
            <span>{t('openAndView')}</span>
          </button>
          <button
            onClick={() => onStartRename(contextMenu.path, false)}
            className="w-full text-left px-3 py-2 hover:bg-[#45969c] hover:text-white transition-colors flex items-center gap-2 cursor-pointer font-medium"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#45969c] group-hover:text-white shrink-0" />
            <span>{t('renameFile')}</span>
          </button>
          <div className="h-px bg-white/5 my-1" />
          <button
            onClick={() => {
              if (confirm(t('confirmDeleteFile', { path: contextMenu.path }))) {
                onDeleteFile(contextMenu.path);
              }
            }}
            className="w-full text-left px-3 py-2 hover:bg-rose-600 hover:text-white text-rose-400 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:text-white shrink-0" />
            <span>{t('deleteFile')}</span>
          </button>
        </>
      )}
    </div>
  );
}
