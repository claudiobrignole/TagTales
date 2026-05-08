const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');
if (!css.includes('-webkit-user-drag')) {
  css += `
/* Global Image Protection */
img {
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-select: none;
}
`;
  fs.writeFileSync('src/index.css', css);
}

let app = fs.readFileSync('src/App.tsx', 'utf8');
if (!app.includes('handleContextMenu')) {
  app = app.replace(
    'export default function App() {',
    `export default function App() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);`
  );
  app = app.replace(
    /import React[\s\S]*?from 'react';/,
    "import React, { useEffect } from 'react';"
  );
  fs.writeFileSync('src/App.tsx', app);
}
