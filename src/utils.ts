import * as fflate from 'fflate';
import { VirtualFile, FileNode, TemplatePreset } from './types';

// Helper to check if file is binary
export function isBinaryFile(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const binaryExtensions = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'pdf',
    'woff', 'woff2', 'ttf', 'otf', 'mp3', 'wav', 'mp4', 'webm',
    'zip', 'tar', 'gz', 'dmg', 'exe', 'bin'
  ]);
  return binaryExtensions.has(ext);
}

// Helper to determine Content-Type header
export function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'html': 'text/html; charset=utf-8',
    'htm': 'text/html; charset=utf-8',
    'css': 'text/css; charset=utf-8',
    'js': 'application/javascript; charset=utf-8',
    'mjs': 'application/javascript; charset=utf-8',
    'json': 'application/json; charset=utf-8',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'otf': 'font/otf',
    'pdf': 'application/pdf',
    'xml': 'application/xml; charset=utf-8',
    'txt': 'text/plain; charset=utf-8'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Formats byte sizes elegantly
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Convert a flat list of virtual files into a hierarchical FileNode tree
export function buildFileTree(files: VirtualFile[]): FileNode {
  const root: FileNode = {
    name: 'root',
    path: '',
    isDirectory: true,
    children: []
  };

  files.forEach(file => {
    // Standardize path (remove leading slashes, backslashes)
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

  // Sort: directories first, then alphabetically
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

// Package virtual files back into a ZIP file for client-side download
export function triggerZipDownload(files: VirtualFile[], zipName: string = 'dist-export.zip') {
  const filesRecord: Record<string, Uint8Array> = {};
  
  files.forEach(file => {
    // Ensure relative paths do not have leading slash
    const relativePath = file.path.replace(/^\//, '');
    filesRecord[relativePath] = file.content;
  });

  const zipUint8Array = fflate.zipSync(filesRecord, { level: 6 });
  const blob = new Blob([zipUint8Array], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Standard Built-in templates
export const STARTER_TEMPLATES: TemplatePreset[] = [
  {
    id: 'react-dashboard',
    name: 'React SPA Dashboard',
    description: 'A fully responsive React + Tailwind CSS dashboard loading from esm.sh, with active tabs, dynamic state, and microcharts.',
    category: 'React / ESM',
    icon: 'LayoutDashboard',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-950">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aura Analytics Sandbox</title>
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
  <style>
    /* Custom glassy elements */
    .glass {
      background: rgba(30, 41, 59, 0.5);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    body {
      color: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
  </style>
</head>
<body class="h-full text-slate-100 flex flex-col">
  <div id="root" class="h-full flex flex-col"></div>
  
  <!-- Loader Script -->
  <script type="module" src="./index.jsx"></script>
</body>
</html>`,
      'index.jsx': `import React, { useState } from 'https://esm.sh/react@19.0.0';
import ReactDOM from 'https://esm.sh/react-dom@19.0.0/client';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [likes, setLikes] = useState(1324);
  const [searchTerm, setSearchTerm] = useState('');
  
  const metricCards = [
    { label: 'Weekly Active Users', value: '18,492', change: '+12.3%', up: true },
    { label: 'Page Views', value: '94,204', change: '+8.1%', up: true },
    { label: 'Conversion Rate', value: '3.42%', change: '-0.2%', up: false },
    { label: 'Sandbox System Health', value: '100% OK', change: 'Stable', up: true },
  ];

  const projects = [
    { name: 'Tailwind V4 compiler', status: 'Stable', build: 'Success', size: '24.2 KB' },
    { name: 'PostCSS Preprocessor', status: 'Beta', build: 'Success', size: '148.5 KB' },
    { name: 'Service Worker Proxy', status: 'Production', build: 'Success', size: '3.8 KB' },
    { name: 'Wasm Asset Pipeline', status: 'Deprecated', build: 'Failed', size: '0.0 KB' },
  ];

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div class="flex flex-col md:flex-row h-full min-h-screen bg-slate-950 font-sans text-slate-100">
      
      {/* Sidebar navigation */}
      <aside class="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-linear-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">A</div>
          <span class="font-bold text-lg tracking-tight bg-linear-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Aura Sandbox</span>
        </div>

        <nav class="flex flex-col gap-1.5 mt-4">
          <button 
            onClick={() => setActiveTab('overview')}
            class={\`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors \${activeTab === 'overview' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}\`}
          >
            📊 Sandbox Overview
          </button>
          <button 
            onClick={() => setActiveTab('files')}
            class={\`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors \${activeTab === 'files' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}\`}
          >
            📁 Files Explorer
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            class={\`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors \${activeTab === 'settings' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}\`}
          >
            ⚙️ Virtual Settings
          </button>
        </nav>

        <div class="mt-auto pt-6 border-t border-slate-800 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-medium border border-slate-700">JS</div>
          <div>
            <div class="text-xs font-semibold text-slate-200">Jin Roy</div>
            <div class="text-[10px] text-slate-500">Preview User</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main class="flex-1 overflow-y-auto p-8 bg-slate-950">
        <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-white">Pure Frontend React Sandbox</h1>
            <p class="text-slate-400 text-sm mt-1">This entire UI is compiled on-the-fly and loaded via Service Worker.</p>
          </div>
          
          <div class="flex items-center gap-3 bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
            <button class="px-3.5 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm">v2.4.0</button>
            <button 
              onClick={() => setLikes(l => l + 1)}
              class="px-3.5 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors"
            >
              ❤️ <span>{likes}</span>
            </button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div class="space-y-8 animate-fadeIn">
            {/* Metric grids */}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {metricCards.map((card, idx) => (
                <div key={idx} class="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                  <span class="text-xs font-medium text-slate-400">{card.label}</span>
                  <div class="flex items-baseline justify-between mt-2.5">
                    <span class="text-2xl font-bold tracking-tight text-white">{card.value}</span>
                    <span class={\`text-xs font-semibold px-2 py-0.5 rounded \${card.up ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}\`}>
                      {card.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Interactive App Card */}
            <div class="p-6 rounded-2xl bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-800 shadow-xl">
              <h2 class="text-lg font-bold text-white mb-1">Interactive Counter Widget</h2>
              <p class="text-slate-400 text-sm mb-6">Fully stateful component. Click keys to increment counters and trigger state updates instantly inside this iframe.</p>
              
              <div class="flex flex-wrap items-center gap-4">
                <button 
                  onClick={() => setLikes(l => l + 10)}
                  class="px-5 py-2.5 bg-linear-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-600/10 hover:shadow-cyan-400/10"
                >
                  🚀 Boost Stats (+10)
                </button>
                <button 
                  onClick={() => setLikes(1000)}
                  class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold border border-slate-700 transition-colors"
                >
                  🔄 Reset Stats
                </button>
              </div>
            </div>

            {/* Bottom Grid */}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="p-6 rounded-xl bg-slate-900 border border-slate-800">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-bold text-white">Build Pipelines</h3>
                  <span class="text-xs text-indigo-400 hover:underline cursor-pointer">View Pipeline Logs</span>
                </div>
                <div class="divide-y divide-slate-800/60">
                  {projects.map((proj, i) => (
                    <div key={i} class="py-3 flex items-center justify-between text-sm">
                      <span class="font-medium text-slate-200">{proj.name}</span>
                      <div class="flex items-center gap-3">
                        <span class="text-xs text-slate-500">{proj.size}</span>
                        <span class={\`px-2 py-0.5 rounded text-[11px] font-semibold \${proj.build === 'Success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}\`}>
                          {proj.build}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AJAX Sandbox Test */}
              <div class="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 class="font-bold text-white mb-2">Internal Cache Query System</h3>
                  <p class="text-slate-400 text-xs leading-relaxed mb-4">The preview site utilizes a Cache-intercepting Service Worker to capture, route, and mock index.html files, dynamic bundles, CSS files, and static JS dependencies completely offline.</p>
                </div>
                <div class="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300">
                  <div class="text-slate-500">// Fetch stats output</div>
                  <div>GET /sb/s1/index.jsx <span class="text-emerald-400 font-bold">200 OK</span></div>
                  <div>Content-Type: <span class="text-indigo-300">application/javascript</span></div>
                  <div>Cache-Control: <span class="text-indigo-300">no-store</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 class="text-lg font-bold text-white mb-2">Virtual File Tree Simulator</h2>
            <p class="text-slate-400 text-sm mb-6">Search and filter virtual static files deployed to the client-side proxy router.</p>
            
            <div class="mb-5">
              <input 
                type="text" 
                placeholder="Search virtual sandbox files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div class="divide-y divide-slate-800/50">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((file, idx) => (
                  <div key={idx} class="py-3 flex items-center justify-between text-sm">
                    <div class="flex items-center gap-3">
                      <span>📄</span>
                      <span class="font-semibold text-slate-200">{file.name}</span>
                    </div>
                    <div class="flex items-center gap-4">
                      <span class="text-xs text-slate-500">{file.size}</span>
                      <span class="text-xs bg-slate-800 text-indigo-400 font-semibold px-2.5 py-0.5 rounded-full">{file.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div class="py-8 text-center text-slate-500 text-sm">No virtual files match your filter.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl">
            <h2 class="text-lg font-bold text-white mb-2">Virtual Sandbox Settings</h2>
            <p class="text-slate-400 text-sm mb-6">Configure runtime simulation flags for browser-based compilation.</p>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800/80">
                <div>
                  <div class="text-sm font-semibold text-slate-200">Local Content-Type Sniffing</div>
                  <div class="text-xs text-slate-500">Allow Service Worker to auto-sniff file extensions.</div>
                </div>
                <div class="w-11 h-6 bg-indigo-600 rounded-full p-0.5 cursor-pointer relative"><div class="w-5 h-5 bg-white rounded-full absolute right-0.5"></div></div>
              </div>

              <div class="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800/80">
                <div>
                  <div class="text-sm font-semibold text-slate-200">Force Absolute Path Rewriting</div>
                  <div class="text-xs text-slate-500">Normalize relative URLs to sandbox root domains automatically.</div>
                </div>
                <div class="w-11 h-6 bg-slate-800 rounded-full p-0.5 cursor-pointer relative"><div class="w-5 h-5 bg-slate-700 rounded-full absolute left-0.5"></div></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
`
    }
  },
  {
    id: 'portfolio-website',
    name: 'Dynamic Creative Portfolio',
    description: 'An elegant professional developer profile that loads project details from an external virtual JSON file using modern async fetch().',
    category: 'HTML / JS',
    icon: 'Briefcase',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Creative Developer Portfolio</title>
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap');
    body {
      font-family: 'Space Grotesk', sans-serif;
      background-color: #020617;
      color: #f8fafc;
    }
    .grid-bg {
      background-size: 40px 40px;
      background-image: linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
    }
  </style>
</head>
<body class="grid-bg min-h-screen relative flex flex-col justify-between">
  
  <div class="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl -z-10"></div>
  <div class="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl -z-10"></div>

  <!-- Header -->
  <header class="max-w-5xl mx-auto w-full px-6 py-8 flex items-center justify-between">
    <div class="text-xl font-bold tracking-tight bg-linear-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
      &lt; J.R /&gt;
    </div>
    <nav class="flex gap-6 text-sm text-slate-400">
      <a href="#" class="hover:text-cyan-400 transition-colors">Works</a>
      <a href="#" class="hover:text-cyan-400 transition-colors">Skills</a>
      <a href="mailto:jinroy769@gmail.com" class="hover:text-cyan-400 transition-colors">Contact</a>
    </nav>
  </header>

  <!-- Hero -->
  <main class="max-w-5xl mx-auto w-full px-6 flex-1 flex flex-col justify-center py-16">
    <div class="max-w-2xl">
      <span class="inline-block px-3 py-1 text-xs font-semibold bg-cyan-950 border border-cyan-800 text-cyan-400 rounded-full mb-6">AVAILABLE FOR CONTRACTS</span>
      <h1 class="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-none">
        Crafting modern <span class="bg-linear-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">interactive sandboxes</span> for browser runtimes.
      </h1>
      <p class="text-slate-400 text-lg mb-10 leading-relaxed">
        I am a frontend generalist engineering lightning-fast client-side applications using reactive hooks, Service Worker virtualization, and canvas physics.
      </p>
    </div>

    <!-- Works Section dynamically populated from JSON -->
    <div class="mt-8">
      <h2 class="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
        <span>📂</span> Dynamic Works (Fetched from virtual JSON)
      </h2>
      
      <div id="projects-grid" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Spinner -->
        <div class="col-span-full py-12 text-center text-slate-500">
          Loading virtual projects from projects.json...
        </div>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="max-w-5xl mx-auto w-full px-6 py-8 border-t border-slate-900 text-center text-xs text-slate-600">
    &copy; 2026 Developer Portfolio Sandbox. Fully functional browser static asset interception.
  </footer>

  <script src="./portfolio.js"></script>
</body>
</html>`,
      'portfolio.js': `// Fetch from static JSON file loaded into the cache sandbox
async function loadProjects() {
  const container = document.getElementById('projects-grid');
  try {
    const response = await fetch('./projects.json');
    if (!response.ok) {
      throw new Error('Failed to fetch projects.json from cache!');
    }
    const projects = await response.json();
    
    container.innerHTML = '';
    
    projects.forEach(p => {
      const card = document.createElement('div');
      card.className = 'p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 transition-all duration-300 transform hover:-translate-y-1 group';
      card.innerHTML = \`
        <div class="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">\${p.category}</div>
        <h3 class="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">\${p.title}</h3>
        <p class="text-slate-400 text-sm mb-4 leading-relaxed">\${p.description}</p>
        <div class="flex flex-wrap gap-1.5 mt-auto">
          \${p.tech.map(t => \`<span class="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-500 font-mono">\${t}</span>\`).join('')}
        </div>
      \`;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = \`
      <div class="col-span-full p-6 text-center text-rose-400 bg-rose-950/20 rounded-lg border border-rose-900/40">
        <h3>⚠️ AJAX Request Failure</h3>
        <p class="text-xs text-rose-500 mt-1">\${err.message}</p>
        <p class="text-[10px] text-slate-500 mt-2">Make sure projects.json exists in your file system!</p>
      </div>
    \`;
  }
}

document.addEventListener('DOMContentLoaded', loadProjects);
`,
      'projects.json': `[
  {
    "title": "Aether Web Engine",
    "description": "Zero-latency WASM-based game editor running entirely on standard Service Workers.",
    "category": "WebAssembly",
    "tech": ["Rust", "Wasm-bindgen", "WebGL"],
    "size": "452 KB"
  },
  {
    "title": "Helix CSS Preprocessor",
    "description": "A lightweight Tailwind-like compiler implemented entirely in 12 lines of regex.",
    "category": "Build Tooling",
    "tech": ["TypeScript", "Regex", "AST"],
    "size": "18 KB"
  },
  {
    "title": "Nebula Physics Canvas",
    "description": "A high-performance interactive solar system simulator rendering 20,000 active gravitational bodies.",
    "category": "Creative Coding",
    "tech": ["HTML5 Canvas", "Vector Math", "Web Workers"],
    "size": "34 KB"
  }
]`
    }
  },
  {
    id: 'threejs-sphere',
    name: 'Three.js 3D Creative Canvas',
    description: 'An interactive 3D particle wireframe sphere built using Three.js as an ES Module, illustrating module importing and canvas resizing.',
    category: '3D Canvas / ESM',
    icon: 'Boxes',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Three.js 3D Particle Sandbox</title>
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
  <style>
    body {
      margin: 0;
      background: #000;
      color: #fff;
      overflow: hidden;
      font-family: monospace;
    }
    #canvas-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10;
    }
    .hud {
      position: absolute;
      top: 24px;
      left: 24px;
      z-index: 20;
      pointer-events: none;
    }
    .controls {
      position: absolute;
      bottom: 24px;
      left: 24px;
      z-index: 20;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 16px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  
  <div id="canvas-container"></div>

  <div class="hud select-none">
    <div class="text-xs text-slate-500">// 3D GRAPHICS PIPELINE</div>
    <div class="text-sm font-bold tracking-widest text-cyan-400 mt-1">THREEJS GLOWING GLOBE</div>
    <div class="text-[10px] text-slate-400 mt-0.5">Render Engine: WebGL2</div>
  </div>

  <div class="controls text-xs flex flex-col gap-2.5">
    <div>
      <span class="text-slate-500">Rotate Speed:</span>
      <span id="speed-label" class="text-cyan-300 font-bold ml-1">1.0x</span>
    </div>
    <div class="flex gap-2">
      <button id="slow-btn" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 rounded text-slate-300 cursor-pointer">Slower</button>
      <button id="fast-btn" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 rounded text-slate-300 cursor-pointer">Faster</button>
      <button id="color-btn" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 rounded text-slate-300 cursor-pointer">Cycle Color</button>
    </div>
  </div>

  <!-- Load script as ES Module -->
  <script type="module" src="./app.js"></script>
</body>
</html>`,
      'app.js': `// Import ThreeJS dynamically from CDN
import * as THREE from 'https://esm.sh/three@0.160.0';

let scene, camera, renderer, globe, particles;
let speed = 0.005;
const colors = [0x06b6d4, 0xec4899, 0x8b5cf6, 0x10b981];
let colorIndex = 0;

function init() {
  const container = document.getElementById('canvas-container');

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.15);

  // Camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 15;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Globe Wireframe Geometry
  const geometry = new THREE.IcosahedronGeometry(5, 3);
  const material = new THREE.MeshBasicMaterial({
    color: colors[colorIndex],
    wireframe: true,
    transparent: true,
    opacity: 0.25
  });
  globe = new THREE.Mesh(geometry, material);
  scene.add(globe);

  // Floating Particle Cloud
  const particleGeo = new THREE.BufferGeometry();
  const particleCount = 1200;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    // Generate particle spherical shell
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 5 + (Math.random() - 0.5) * 0.8; // thickness

    positions[i] = r * Math.sin(phi) * Math.cos(theta);
    positions[i+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i+2] = r * Math.cos(phi);
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  // Custom tiny square particle material
  const particleMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.06,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // Listeners
  window.addEventListener('resize', onWindowResize);
  setupEvents();
  
  animate();
}

function setupEvents() {
  document.getElementById('slow-btn').addEventListener('click', () => {
    speed = Math.max(0.001, speed - 0.002);
    updateSpeedLabel();
  });
  
  document.getElementById('fast-btn').addEventListener('click', () => {
    speed = Math.min(0.05, speed + 0.002);
    updateSpeedLabel();
  });

  document.getElementById('color-btn').addEventListener('click', () => {
    colorIndex = (colorIndex + 1) % colors.length;
    globe.material.color.setHex(colors[colorIndex]);
    particles.material.color.setHex(colors[(colorIndex + 1) % colors.length]);
  });
}

function updateSpeedLabel() {
  const relSpeed = (speed / 0.005).toFixed(1);
  document.getElementById('speed-label').textContent = \`\${relSpeed}x\`;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  // Rotation
  globe.rotation.y += speed;
  globe.rotation.x += speed * 0.4;
  
  particles.rotation.y -= speed * 0.8;
  particles.rotation.x -= speed * 0.2;

  // Pulse effect
  const time = Date.now() * 0.001;
  const pulse = 1 + Math.sin(time * 2) * 0.05;
  globe.scale.set(pulse, pulse, pulse);

  renderer.render(scene, camera);
}

init();
`
    }
  }
];
