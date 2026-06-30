import { useCallback } from 'react';
import { parseZipBuffer, parseFolderFileList } from '../../../core/file/parser';
import { generateSandboxId } from '../../../core/sandbox/id';
import { useWorkspace } from '../../workspace/WorkspaceStore';
import { useI18n } from '../../../i18n/I18nContext';

export interface UseUploaderResult {
  handleFileInput: (file: File) => void;
  handleFolderInput: (fileList: FileList) => Promise<void>;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  loadDemoTemplate: () => Promise<void>;
}

export function useUploader(): UseUploaderResult {
  const { t } = useI18n();
  const workspace = useWorkspace();

  const loadFiles = useCallback(
    (files: ArrayBuffer, name: string, type: 'zip' | 'folder') => {
      const parsedFiles = parseZipBuffer(new Uint8Array(files));
      if (parsedFiles.length === 0) {
        alert(t('noValidFilesZip'));
        return;
      }
      workspace.actions.loadFiles(parsedFiles, name, generateSandboxId(type));
    },
    [t, workspace]
  );

  const handleFileInput = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        loadFiles(buffer, file.name, 'zip');
      };
      reader.readAsArrayBuffer(file);
    },
    [loadFiles]
  );

  const handleFolderInput = useCallback(
    async (fileList: FileList) => {
      const parsedFiles = await parseFolderFileList(fileList);
      if (parsedFiles.length === 0) {
        alert(t('noValidFilesZip'));
        return;
      }
      const sourceName = fileList[0].webkitRelativePath.split('/')[0];
      workspace.actions.loadFiles(
        parsedFiles,
        sourceName,
        generateSandboxId('folder')
      );
    },
    [t, workspace]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      workspace.actions.setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file && file.name.endsWith('.zip')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const buffer = event.target?.result as ArrayBuffer;
          loadFiles(buffer, file.name, 'zip');
        };
        reader.readAsArrayBuffer(file);
      } else {
        alert(t('zipFailed'));
      }
    },
    [loadFiles, t, workspace]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      workspace.actions.setIsDragging(true);
    },
    [workspace]
  );

  const handleDragLeave = useCallback(() => {
    workspace.actions.setIsDragging(false);
  }, [workspace]);

  const loadDemoTemplate = useCallback(async () => {
    try {
      const res = await fetch('demo.zip');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const parsedFiles = parseZipBuffer(buf);
      workspace.actions.loadFiles(
        parsedFiles,
        t('demoTemplateName'),
        generateSandboxId('demo')
      );
    } catch (err) {
      console.error('Failed to load demo.zip:', err);
      alert(t('zipFailed'));
    }
  }, [t, workspace]);

  return {
    handleFileInput,
    handleFolderInput,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    loadDemoTemplate,
  };
}
