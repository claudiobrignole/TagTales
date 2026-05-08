const fs = require('fs');
let code = fs.readFileSync('src/pages/PublicHome.tsx', 'utf8');

// MINIMOSTRE
const minimostreItemsMatch = code.match(/\{\s*title: "BLOOM THEORY"[\s\S]*?\}\s*\]\.map/);

if (minimostreItemsMatch) {
  let minimostre = `[
              {
                title: "BLOOM THEORY",
                owner: "ShaOne",
                img: "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?auto=format&fit=crop&q=80",
              },
              {
                title: "CRIMSON ECHO",
                owner: "Bros",
                img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80",
              },
              {
                title: "TAG TALES",
                owner: "Crew",
                img: "https://images.unsplash.com/photo-1541818276538-3e4b78971af1?auto=format&fit=crop&q=80",
              },
              {
                title: "URBAN BEAT",
                owner: "Phase 2",
                img: "https://images.unsplash.com/photo-1561214115-f660b7015f8c?auto=format&fit=crop&q=80",
              },
              {
                title: "NEON NIGHTS",
                owner: "Local Artists",
                img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80",
              },
              {
                title: "CONCRETE FLORA",
                owner: "Alice",
                img: "https://images.unsplash.com/photo-1525926477800-7a3eaaaf3bee?auto=format&fit=crop&q=80",
              },
            ].map`;
  code = code.replace(minimostreItemsMatch[0], minimostre);
}

// MINIMOSTRE HTML
let minimostreGrid = `<div className="absolute bottom-6 left-6 pr-6 text-white">
                    <p className="font-bold text-sm tracking-widest text-[#FF4F00] uppercase mb-2">
                       {item.owner}
                    </p>
                    <h3 className="heading-h3 leading-none group-hover:text-[#FF4F00] transition-colors">
                      {item.title}
                    </h3>
                  </div>`;
                  
code = code.replace(/<div className="absolute top-4 right-4 flex gap-2">[\s\S]*?<\/div>\s*<div className="absolute bottom-6 left-6 pr-6 text-white">[\s\S]*?<\/h3>\s*<p.*?<\/p>\s*<\/div>/, minimostreGrid);

// WRITERS
const writersItemsMatch = code.match(/\{\s*name: "SHAONE"[\s\S]*?\}\s*\]\.map/);

if (writersItemsMatch) {
  let writers = `[
              {
                name: "SHAONE",
                nation: "Italia",
                img: "https://images.unsplash.com/photo-1544328906-81e0ab4a4411?auto=format&fit=crop&q=80",
              },
              {
                name: "BROS",
                nation: "Italia",
                img: "https://images.unsplash.com/photo-1557008075-7f2c5efa4cfd?auto=format&fit=crop&q=80",
              },
              {
                name: "PHASE 2",
                nation: "USA",
                img: "https://images.unsplash.com/photo-1525926477800-7a3eaaaf3bee?auto=format&fit=crop&q=80",
              },
              {
                name: "10TOC",
                nation: "Francia",
                img: "https://images.unsplash.com/photo-1517722014278-c256a91a6fba?auto=format&fit=crop&q=80",
              },
              {
                name: "VEX",
                nation: "UK",
                img: "https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&q=80",
              },
              {
                name: "CHROME",
                nation: "Germania",
                img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80",
              },
            ].map`;
  code = code.replace(writersItemsMatch[0], writers);
}

// WRITERS HTML
let writersGrid = `<div className="absolute bottom-6 left-6 pr-6 text-white">
                      <p className="font-bold text-sm tracking-widest text-[#FF4F00] uppercase mb-2">
                        {writer.nation}
                      </p>
                      {writer.name && (
                        <h3 className="heading-h3 leading-none group-hover:text-[#FF4F00] transition-colors text-white mb-2">
                          {writer.name}
                        </h3>
                      )}
                    </div>`;

code = code.replace(/<div className="absolute bottom-6 left-6 pr-6 text-white">\s*\{writer\.name && \(\s*<h3[\s\S]*?<\/h3>\s*\)\}\s*<p className="heading-small text-\[\#FF4F00\]">\{writer\.style\}<\/p>\s*<\/div>/, writersGrid);

// GRIDS (1 on mobile, 2 on tablet, 3 on desktop)
code = code.replace(/className="grid grid-cols-1 md:grid-cols-3 gap-\[15px\] md:gap-\[25px\]"/g, 'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[15px] md:gap-[25px]"');

fs.writeFileSync('src/pages/PublicHome.tsx', code);
