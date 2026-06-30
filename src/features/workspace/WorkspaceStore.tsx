import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { VirtualFile, ConsoleLog } from '../../core/types';
import {
  writeFileToCache,
  deleteFileFromCache,
  deleteFilesFromCache,
} from '../../core/sandbox/cache';
import { triggerZipDownload } from '../../core/file/exporter';
import { resolveDefaultHtmlPath } from '../../core/file/parser';
import { registerServiceWorker } from '../../core/sandbox/serviceWorker';
import { useI18n } from '../../i18n/I18nContext';
import {
  WorkspaceState,
  WorkspaceAction,
  initialWorkspaceState,
  workspaceReducer,
} from './workspaceReducer';

const now = () => new Date().toLocaleTimeString();

interface WorkspaceActions {
  registerServiceWorker: () => Promise<void>;
  loadFiles: (files: VirtualFile[], sourceName: string, sandboxId: string) => Promise<void>;
  reset: () => void;
  saveFile: (path: string, textContent: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  renameFile: (oldPath: string, newPath: string) => Promise<void>;
  renameFolder: (oldFolderPath: string, newFolderPath: string) => Promise<void>;
  deleteFolder: (folderPath: string) => Promise<void>;
  createFolder: (folderPath: string) => Promise<void>;
  createFile: (path: string) => Promise<void>;
  selectFile: (path: string) => void;
  closeTab: (path: string) => void;
  setAddressPath: (path: string) => void;
  setViewMode: (mode: 'preview' | 'code') => void;
  setIframeTitle: (title: string) => void;
  setIsDragging: (value: boolean) => void;
  setShowFileTree: (value: boolean) => void;
  setShowConsole: (value: boolean) => void;
  addLog: (log: ConsoleLog) => void;
  clearLogs: () => void;
  downloadZip: () => void;
}

interface WorkspaceContextValue extends WorkspaceState {
  actions: WorkspaceActions;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [state, dispatch] = useReducer(workspaceReducer, initialWorkspaceState);

  useEffect(() => {
    let mounted = true;
    registerServiceWorker().then((result) => {
      if (!mounted) return;
      dispatch({ type: 'SET_SW_REGISTERED', payload: result.registered });
      dispatch({ type: 'SET_REGISTER_ERROR', payload: result.error });
    });
    return () => {
      mounted = false;
    };
  }, []);

  const actions: WorkspaceActions = useMemo(() => {
    const addInfoLog = (message: string) =>
      dispatch({
        type: 'ADD_LOG',
        payload: { type: 'info', message, timestamp: now() },
      });

    const addWarnLog = (message: string) =>
      dispatch({
        type: 'ADD_LOG',
        payload: { type: 'warn', message, timestamp: now() },
      });

    return {
      registerServiceWorker: async () => {
        const result = await registerServiceWorker();
        dispatch({ type: 'SET_SW_REGISTERED', payload: result.registered });
        dispatch({ type: 'SET_REGISTER_ERROR', payload: result.error });
      },

      loadFiles: async (files: VirtualFile[], sourceName: string, sandboxId: string) => {
        await Promise.all(
          files.map((file) => writeFileToCache(sandboxId, file.path, file.content))
        );

        const defaultPath = resolveDefaultHtmlPath(files);

        dispatch({ type: 'SET_FILES', payload: files });
        dispatch({ type: 'SET_SANDBOX_ID', payload: sandboxId });
        dispatch({ type: 'SET_ADDRESS_PATH', payload: defaultPath });
        dispatch({ type: 'SELECT_FILE', payload: defaultPath });
        dispatch({ type: 'SET_HAS_UPLOADED', payload: true });
        dispatch({ type: 'CLEAR_LOGS' });
        addInfoLog(t('sandboxInited', { count: files.length, source: sourceName }));
      },

      reset: () => {
        dispatch({ type: 'RESET_WORKSPACE' });
      },

      saveFile: async (path: string, textContent: string) => {
        const content = new TextEncoder().encode(textContent);
        const updatedFiles = state.files.map((file) =>
          file.path === path
            ? { ...file, content, size: content.length, textContent }
            : file
        );
        dispatch({ type: 'SET_FILES', payload: updatedFiles });

        if (state.sandboxId) {
          await writeFileToCache(state.sandboxId, path, content);
          addInfoLog(t('hotSwapped', { path }));
        }
      },

      deleteFile: async (path: string) => {
        const updatedFiles = state.files.filter((file) => file.path !== path);
        dispatch({ type: 'SET_FILES', payload: updatedFiles });

        if (state.sandboxId) {
          await deleteFileFromCache(state.sandboxId, path);
          addWarnLog(t('deletedFile', { path }));
        }

        if (state.openTabs.includes(path)) {
          dispatch({ type: 'CLOSE_TAB', payload: path });
        }
      },

      renameFile: async (oldPath: string, newPath: string) => {
        if (!newPath.trim() || oldPath === newPath) return;
        if (state.files.some((file) => file.path === newPath)) {
          alert(t('fileAlreadyExists'));
          return;
        }

        const fileToRename = state.files.find((file) => file.path === oldPath);
        if (!fileToRename) return;

        const updatedFile = { ...fileToRename, path: newPath };
        const updatedFiles = state.files.map((file) =>
          file.path === oldPath ? updatedFile : file
        );
        dispatch({ type: 'SET_FILES', payload: updatedFiles });

        if (state.sandboxId) {
          await deleteFileFromCache(state.sandboxId, oldPath);
          await writeFileToCache(state.sandboxId, newPath, updatedFile.content);
          addInfoLog(t('renamedFile', { oldPath, newPath }));
        }

        if (state.openTabs.includes(oldPath) || state.selectedFilePath === oldPath) {
          dispatch({ type: 'RENAME_TAB', payload: { oldPath, newPath } });
        }
        if (state.addressPath === oldPath) {
          dispatch({ type: 'SET_ADDRESS_PATH', payload: newPath });
        }
      },

      renameFolder: async (oldFolderPath: string, newFolderPath: string) => {
        if (!newFolderPath.trim() || oldFolderPath === newFolderPath) return;
        const oldPrefix = oldFolderPath.endsWith('/')
          ? oldFolderPath
          : `${oldFolderPath}/`;
        const newPrefix = newFolderPath.endsWith('/')
          ? newFolderPath
          : `${newFolderPath}/`;

        if (state.files.some((file) => file.path.startsWith(newPrefix))) {
          alert(t('folderOrFileExists'));
          return;
        }

        const updatedFiles = state.files.map((file) =>
          file.path.startsWith(oldPrefix)
            ? { ...file, path: file.path.replace(oldPrefix, newPrefix) }
            : file
        );
        dispatch({ type: 'SET_FILES', payload: updatedFiles });

        if (state.sandboxId) {
          const affectedFiles = state.files.filter((file) =>
            file.path.startsWith(oldPrefix)
          );

          for (const file of affectedFiles) {
            const updatedPath = file.path.replace(oldPrefix, newPrefix);
            await deleteFileFromCache(state.sandboxId, file.path);
            await writeFileToCache(state.sandboxId, updatedPath, file.content);
          }

          addInfoLog(t('renamedFolder', { oldFolderPath, newFolderPath }));
        }

        const nextTabs = state.openTabs.map((path) =>
          path.startsWith(oldPrefix) ? path.replace(oldPrefix, newPrefix) : path
        );
        dispatch({ type: 'SET_OPEN_TABS', payload: nextTabs });

        if (state.selectedFilePath?.startsWith(oldPrefix)) {
          dispatch({
            type: 'SELECT_FILE',
            payload: state.selectedFilePath.replace(oldPrefix, newPrefix),
          });
        }
        if (state.addressPath.startsWith(oldPrefix)) {
          dispatch({
            type: 'SET_ADDRESS_PATH',
            payload: state.addressPath.replace(oldPrefix, newPrefix),
          });
        }
      },

      deleteFolder: async (folderPath: string) => {
        const prefix = folderPath.endsWith('/')
          ? folderPath
          : `${folderPath}/`;
        const filesToDelete = state.files.filter((file) =>
          file.path.startsWith(prefix)
        );
        const updatedFiles = state.files.filter(
          (file) => !file.path.startsWith(prefix)
        );
        dispatch({ type: 'SET_FILES', payload: updatedFiles });

        if (state.sandboxId) {
          await deleteFilesFromCache(
            state.sandboxId,
            filesToDelete.map((file) => file.path)
          );
          addWarnLog(t('deletedFolder', { folderPath }));
        }

        const nextTabs = state.openTabs.filter(
          (path) => !path.startsWith(prefix)
        );
        dispatch({ type: 'SET_OPEN_TABS', payload: nextTabs });

        if (state.selectedFilePath?.startsWith(prefix)) {
          dispatch({ type: 'SELECT_FILE', payload: nextTabs[nextTabs.length - 1] ?? null });
        }
      },

      createFolder: async (folderPath: string) => {
        const keepPath = folderPath.endsWith('/')
          ? `${folderPath}.keep`
          : `${folderPath}/.keep`;
        if (state.files.some((file) => file.path === keepPath)) {
          alert(t('folderExists'));
          return;
        }

        const defaultContent = `/* Folder keep file for: ${folderPath} */\n`;
        const content = new TextEncoder().encode(defaultContent);
        const newFile: VirtualFile = {
          path: keepPath,
          content,
          size: content.length,
          isBinary: false,
          textContent: defaultContent,
        };

        const updatedFiles = [...state.files, newFile];
        dispatch({ type: 'SET_FILES', payload: updatedFiles });

        if (state.sandboxId) {
          await writeFileToCache(state.sandboxId, keepPath, content);
          addInfoLog(t('createdFolder', { folderPath }));
        }
      },

      createFile: async (path: string) => {
        if (state.files.some((file) => file.path === path)) {
          alert(t('fileAlreadyExists'));
          return;
        }

        const defaultContent = `/* New file: ${path} */\n`;
        const content = new TextEncoder().encode(defaultContent);
        const newFile: VirtualFile = {
          path,
          content,
          size: content.length,
          isBinary: false,
          textContent: defaultContent,
        };

        const updatedFiles = [...state.files, newFile];
        dispatch({ type: 'SET_FILES', payload: updatedFiles });

        if (state.sandboxId) {
          await writeFileToCache(state.sandboxId, path, content);
          addInfoLog(t('createdFile', { path }));
        }
      },

      selectFile: (path: string) => {
        dispatch({ type: 'SELECT_FILE', payload: path });
        const ext = path.split('.').pop()?.toLowerCase() || '';
        if (['html', 'htm'].includes(ext)) {
          dispatch({ type: 'SET_ADDRESS_PATH', payload: path });
        } else {
          dispatch({ type: 'SET_VIEW_MODE', payload: 'code' });
        }
      },

      closeTab: (path: string) => {
        dispatch({ type: 'CLOSE_TAB', payload: path });
      },

      setAddressPath: (path: string) => {
        dispatch({ type: 'SET_ADDRESS_PATH', payload: path });
      },

      setViewMode: (mode: 'preview' | 'code') => {
        dispatch({ type: 'SET_VIEW_MODE', payload: mode });
      },

      setIframeTitle: (title: string) => {
        dispatch({ type: 'SET_IFRAME_TITLE', payload: title });
      },

      setIsDragging: (value: boolean) => {
        dispatch({ type: 'SET_DRAGGING', payload: value });
      },

      setShowFileTree: (value: boolean) => {
        dispatch({ type: 'SET_SHOW_FILE_TREE', payload: value });
      },

      setShowConsole: (value: boolean) => {
        dispatch({ type: 'SET_SHOW_CONSOLE', payload: value });
      },

      addLog: (log: ConsoleLog) => {
        dispatch({ type: 'ADD_LOG', payload: log });
      },

      clearLogs: () => {
        dispatch({ type: 'CLEAR_LOGS' });
      },

      downloadZip: () => {
        if (state.files.length === 0) return;
        triggerZipDownload(
          state.files,
          `dist2view-export-${Date.now()}.zip`
        );
      },
    };
  }, [state, t]);

  const value = useMemo(
    () => ({ ...state, actions }),
    [state, actions]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
