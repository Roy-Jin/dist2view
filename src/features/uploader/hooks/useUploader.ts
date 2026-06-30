import { useCallback, useEffect } from 'react';
import { parseZipBuffer, parseFolderFileList } from '../../../core/file/parser';
import { generateSandboxId } from '../../../core/sandbox/id';
import { useWorkspace } from '../../workspace/WorkspaceStore';
import { useI18n } from '../../../i18n/I18nContext';

export interface UseUploaderResult {
  handleFileInput: (file: File) => void;
  handleFolderInput: (fileList: FileList) => Promise<void>;
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

  useEffect(() => {
    let dragDepth = 0;

    const hasFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes('Files');

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragDepth++;
      if (hasFiles(e)) {
        workspace.actions.setIsDragging(true);
      }
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragDepth--;
      if (dragDepth <= 0) {
        dragDepth = 0;
        const related = e.relatedTarget as Node | null;
        if (!related || !document.documentElement.contains(related)) {
          workspace.actions.setIsDragging(false);
        }
      }
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragDepth = 0;
      workspace.actions.setIsDragging(false);

      const file = e.dataTransfer?.files?.[0];
      if (!file) return;

      if (file.name.endsWith('.zip')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const buffer = event.target?.result as ArrayBuffer;
          loadFiles(buffer, file.name, 'zip');
        };
        reader.readAsArrayBuffer(file);
      } else {
        alert(t('zipFailed'));
      }
    };

    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('drop', onDrop);

    return () => {
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('drop', onDrop);
    };
  }, [loadFiles, t, workspace]);

  const loadDemoTemplate = useCallback(async () => {
    try {
      const res = await fetch('./_demo');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const parsedFiles = parseZipBuffer(buf);
      workspace.actions.loadFiles(
        parsedFiles,
        t('demoTemplateName'),
        generateSandboxId('demo')
      );
    } catch (err) {
      console.error('Failed to load demo template:', err);
      alert(t('zipFailed'));
    }
  }, [t, workspace]);

  return {
    handleFileInput,
    handleFolderInput,
    loadDemoTemplate,
  };
}
