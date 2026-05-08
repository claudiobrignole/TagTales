const fs = require('fs');
fs.copyFileSync('public/logo.png', 'public/pwa-192x192.png');
fs.copyFileSync('public/logo.png', 'public/pwa-512x512.png');
fs.writeFileSync('public/favicon.ico', '');
fs.writeFileSync('public/apple-touch-icon.png', '');
fs.writeFileSync('public/masked-icon.svg', '<svg></svg>');
console.log('PWA assets created');
