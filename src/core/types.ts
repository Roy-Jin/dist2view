export interface VirtualFile {
  path: string;
  content: Uint8Array<ArrayBuffer>;
  size: number;
  isBinary: boolean;
  // For text files, we cache the decoded string for easy editing
  textContent?: string;
}

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  size?: number;
}

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  files: Record<string, string>; // path -> content
}

export interface ConsoleLog {
  type: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
}

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
