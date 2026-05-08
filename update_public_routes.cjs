const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const imports = `import PublicWriters from './pages/PublicWriters';
import PublicWriterDetail from './pages/PublicWriterDetail';
import PublicExhibitions from './pages/PublicExhibitions';
import PublicExhibitionDetail from './pages/PublicExhibitionDetail';
import PublicMagazine from './pages/PublicMagazine';
import PublicArticleDetail from './pages/PublicArticleDetail';
`;

app = app.replace("import AdminArticles from './pages/AdminArticles';", "import AdminArticles from './pages/AdminArticles';\n" + imports);

const routes = `<Route path="/writers" element={<PublicWriters />} />
            <Route path="/writers/:id" element={<PublicWriterDetail />} />
            <Route path="/minimostre" element={<PublicExhibitions />} />
            <Route path="/minimostre/:id" element={<PublicExhibitionDetail />} />
            <Route path="/magazine" element={<PublicMagazine />} />
            <Route path="/magazine/:slug" element={<PublicArticleDetail />} />
            <Route path="/login" element={<Login />} />`;

app = app.replace('<Route path="/login" element={<Login />} />', routes);

fs.writeFileSync('src/App.tsx', app);
