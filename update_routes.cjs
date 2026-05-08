const fs = require('fs');

// 1. UPDATE LAYOUT
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const navItemsRegex = /const adminNavItems = \[([\s\S]*?)\];/;
layout = layout.replace(navItemsRegex, (match, p1) => {
  return `const adminNavItems = [${p1.trimEnd()},
    { to: '/app/admin/writers', icon: User, label: 'manageWriters' },
    { to: '/app/admin/exhibitions', icon: LayoutDashboard, label: 'manageExhibitions' },
    { to: '/app/admin/articles', icon: FileText, label: 'manageMagazine' },
  ];`;
});

fs.writeFileSync('src/components/Layout.tsx', layout);

// 2. UPDATE APP.TSX
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Add imports
const imports = `import AdminWriters from './pages/AdminWriters';
import AdminExhibitions from './pages/AdminExhibitions';
import AdminArticles from './pages/AdminArticles';
`;
app = app.replace("import AdminHelp from './pages/AdminHelp';", "import AdminHelp from './pages/AdminHelp';\n" + imports);

// Add routes
const routes = `<Route path="admin/writers" element={<AdminWriters />} />
              <Route path="admin/exhibitions" element={<AdminExhibitions />} />
              <Route path="admin/articles" element={<AdminArticles />} />
              <Route path="admin/faq"`;
app = app.replace('<Route path="admin/faq"', routes);

fs.writeFileSync('src/App.tsx', app);
