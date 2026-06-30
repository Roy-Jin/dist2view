import { VirtualFile, FileNode } from '../types';

export function buildFileTree(files: VirtualFile[]): FileNode {
  const root: FileNode = {
    name: 'root',
    path: '',
    isDirectory: true,
    children: []
  };

  files.forEach(file => {
    const normalizedPath = file.path.replace(/\\/g, '/').replace(/^\//, '');
    const parts = normalizedPath.split('/');
    let currentNode = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      let child = currentNode.children?.find(c => c.name === part);

      if (!child) {
        child = {
          name: part,
          path: currentPath,
          isDirectory: !isLast,
          size: isLast ? file.size : undefined,
          children: isLast ? undefined : []
        };
        currentNode.children = currentNode.children || [];
        currentNode.children.push(child);
      }

      currentNode = child;
    }
  });

  const sortNodes = (node: FileNode) => {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortNodes);
    }
  };

  sortNodes(root);
  return root;
}
