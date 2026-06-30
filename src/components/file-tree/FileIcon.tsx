import {
  File,
  FileCode,
  FileJson,
  FileText,
  Image,
} from 'lucide-react';

interface FileIconProps {
  path: string;
}

export default function FileIcon({ path }: FileIconProps) {
  const ext = path.split('.').pop()?.toLowerCase() || '';

  if (['html', 'htm'].includes(ext)) {
    return <FileCode className="w-4 h-4 text-orange-400" id={`icon-html-${path}`} />;
  }
  if (['css'].includes(ext)) {
    return <FileCode className="w-4 h-4 text-sky-400" id={`icon-css-${path}`} />;
  }
  if (['js', 'jsx', 'ts', 'tsx', 'mjs'].includes(ext)) {
    return <FileCode className="w-4 h-4 text-amber-400" id={`icon-js-${path}`} />;
  }
  if (['json'].includes(ext)) {
    return <FileJson className="w-4 h-4 text-purple-400" id={`icon-json-${path}`} />;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
    return <Image className="w-4 h-4 text-emerald-400" id={`icon-image-${path}`} />;
  }
  if (['md', 'txt'].includes(ext)) {
    return <FileText className="w-4 h-4 text-slate-300" id={`icon-text-${path}`} />;
  }
  return <File className="w-4 h-4 text-slate-400" id={`icon-file-${path}`} />;
}
