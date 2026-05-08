const fs = require('fs');

const fixFile = (filePath, search, replace) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(filePath, content);
};

fixFile('./src/pages/Dashboard.tsx', 'total{t(\'sales.artwork\')}s', 'totalArtworks');
fixFile('./src/pages/Dashboard.tsx', 'Upload New {t(\'sales.artwork\')}', 'Upload New Artwork');

fixFile('./src/pages/Artworks.tsx', 'setRejecting{t(\'sales.artwork\')}', 'setRejectingArtwork');
fixFile('./src/pages/Artworks.tsx', 'rejecting{t(\'sales.artwork\')}', 'rejectingArtwork');
fixFile('./src/pages/Artworks.tsx', '{t(\'sales.artwork\')}Ref', 'artworkRef');
fixFile('./src/pages/Artworks.tsx', '{t(\'sales.artwork\')}Title', 'artworkTitle');

fixFile('./src/pages/UploadArtwork.tsx', '{t(\'sales.artwork\')}Id', 'artworkId');
fixFile('./src/pages/UploadArtwork.tsx', '{t(\'sales.artwork\')}Title', 'artworkTitle');

fixFile('./src/pages/Sales.tsx', '{t(\'sales.artwork\')}Id', 'artworkId');
fixFile('./src/pages/Sales.tsx', '{t(\'sales.artwork\')}Title', 'artworkTitle');
fixFile('./src/pages/Sales.tsx', '{t(\'sales.artwork\')}Format', 'artworkFormat');

fixFile('./src/pages/AdminSales.tsx', '{t(\'sales.artwork\')}Id', 'artworkId');
fixFile('./src/pages/AdminSales.tsx', '{t(\'sales.artwork\')}Title', 'artworkTitle');
fixFile('./src/pages/AdminSales.tsx', '{t(\'sales.artwork\')}Format', 'artworkFormat');

fixFile('./src/pages/AdminDashboard.tsx', 'pending{t(\'sales.artwork\')}s', 'pendingArtworks');

console.log('Fixed Artwork issues');
