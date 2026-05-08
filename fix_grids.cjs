const fs = require('fs');
let content = fs.readFileSync('src/pages/PublicHome.tsx', 'utf8');

// Update Minimostre map
const minimostreRegex = /\{\/\* MiniMostre \*\/\}.*?(?=\{\/\* Writers \*\/\})/s;
const minimostreReplacement = `
{/* MiniMostre */}
        <section id="minimostre" className="bg-[#121212] text-white pt-32 pb-32 px-[25px] md:px-[50px] w-full mb-32 z-20 relative">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
             <div className="flex gap-2">
               <span className="heading-h4 pt-4 text-[#FF4F00]">#</span>
               <h2 className="heading-hero text-white whitespace-nowrap">MINIMOSTRE</h2>
             </div>
             
             <div className="max-w-sm text-right mt-8 md:mt-0">
               <p className="body-text mb-2 text-white/80">Vivi l'arte attraverso le minimostre</p>
               <span className="text-[#FF4F00] font-bold text-sm uppercase tracking-widest">(Eventi & Esposizioni)</span>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px] md:gap-[25px]">
              {[
                { title: 'BLOOM THEORY', owner: 'ShaOne • Sep 24', tag: 'EXHIBITION', img: 'https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?auto=format&fit=crop&q=80' },
                { title: 'CRIMSON ECHO', owner: 'Bros • Nov 1', tag: 'MINIMOSTRA', img: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80' },
                { title: 'TAG TALES', owner: 'Crew • Dec 15', tag: 'LIVE PAINTING', img: 'https://images.unsplash.com/photo-1541818276538-3e4b78971af1?auto=format&fit=crop&q=80' },
                { title: 'URBAN BEAT', owner: 'Phase 2 • Jan 10', tag: 'RETROSPECTIVE', img: 'https://images.unsplash.com/photo-1561214115-f660b7015f8c?auto=format&fit=crop&q=80' },
                { title: 'NEON NIGHTS', owner: 'Local Artists • Feb 5', tag: 'GALLERY', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80' },
                { title: 'CONCRETE FLORA', owner: 'Alice • Mar 20', tag: 'MINIMOSTRA', img: 'https://images.unsplash.com/photo-1525926477800-7a3eaaaf3bee?auto=format&fit=crop&q=80' }
              ].map((item, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="aspect-square bg-[#2A2A2A] rounded-2xl overflow-hidden relative">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-80" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <span className="bg-[#FF4F00] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md bg-opacity-90">{item.tag}</span>
                    </div>
                    <div className="absolute bottom-6 left-6 pr-6 text-white">
                      <h3 className="heading-h3 text-white mb-2 leading-none">{item.title}</h3>
                      <p className="heading-small text-[#FF4F00]">{item.owner}</p>
                    </div>
                  </div>
                </div>
              ))}
           </div>
           
           <div className="mt-20 flex justify-center w-full">
             <Link to="/mostre" className="inline-flex items-center gap-4 btn-text bg-[#FF4F00] text-white py-4 px-10 rounded-full hover:bg-white hover:text-[#121212] transition-colors uppercase">
               TUTTE LE MOSTRE
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
             </Link>
           </div>
        </section>
`;

content = content.replace(minimostreRegex, minimostreReplacement);

// Update Writers map
const writersRegex = /\{\/\* Writers \*\/\}.*?(?=\{\/\* Magazine \*\/\})/s;
const writersReplacement = `
{/* Writers */}
        <section id="writers" className="px-[25px] md:px-[50px] w-full mb-32 relative z-20">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
             <div className="flex gap-2">
               <span className="heading-h4 pt-4 text-[#FF4F00]">#</span>
               <h2 className="heading-hero text-[#121212]">WRITERS</h2>
             </div>
             
             <div className="max-w-sm text-right mt-8 md:mt-0">
               <p className="body-text mb-2 text-[#121212]">Scopri gli artisti che hanno formato la cultura.</p>
               <span className="text-[#59554E] font-bold text-sm uppercase tracking-widest">(Artisti)</span>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px] md:gap-[25px]">
              {[
                { name: 'SHAONE', style: 'Old School', img: 'https://images.unsplash.com/photo-1544328906-81e0ab4a4411?auto=format&fit=crop&q=80' },
                { name: 'BROS', style: 'Abstract', img: 'https://images.unsplash.com/photo-1557008075-7f2c5efa4cfd?auto=format&fit=crop&q=80' },
                { name: 'PHASE 2', style: 'Wildstyle', img: 'https://images.unsplash.com/photo-1525926477800-7a3eaaaf3bee?auto=format&fit=crop&q=80' },
                { name: '10TOC', style: 'Bombing', img: 'https://images.unsplash.com/photo-1517722014278-c256a91a6fba?auto=format&fit=crop&q=80' },
                { name: 'VEX', style: 'Surrealism', img: 'https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&q=80' },
                { name: 'CHROME', style: 'Throw-ups', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80' }
              ].map((writer, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="aspect-square bg-[#121212] rounded-2xl overflow-hidden relative">
                    <img src={writer.img} alt={writer.name} className="w-full h-full object-cover opacity-80 transition-all duration-700 mix-blend-luminosity group-hover:mix-blend-normal group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-6 left-6 pr-6 text-white">
                      {writer.name && <h3 className="heading-h3 text-white mb-2 leading-none">{writer.name}</h3>}
                      <p className="heading-small text-[#FF4F00]">{writer.style}</p>
                    </div>
                  </div>
                </div>
              ))}
           </div>
           
           <div className="mt-20 flex justify-center w-full">
             <Link to="/writers" className="inline-flex items-center gap-4 btn-text bg-[#FF4F00] text-white py-4 px-10 rounded-full hover:bg-white hover:text-[#121212] transition-colors uppercase">
               TUTTI I WRITERS
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
             </Link>
           </div>
        </section>
`;

content = content.replace(writersRegex, writersReplacement);

// Remove mb-6 from Magazine as well
content = content.replace(/className="aspect-square bg-\[#2A2A2A\] rounded-2xl overflow-hidden mb-6 relative"/g, 'className="aspect-square bg-[#2A2A2A] rounded-2xl overflow-hidden relative"');

fs.writeFileSync('src/pages/PublicHome.tsx', content);

