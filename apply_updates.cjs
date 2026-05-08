const fs = require('fs');
let content = fs.readFileSync('src/pages/PublicHome.tsx', 'utf8');

// 1. Hero adjustment
content = content.replace(
  'className="px-[25px] md:px-[50px] relative mb-[25px] w-full group"',
  'className="relative mb-[25px] w-full group"'
);
content = content.replace(
  'className="relative h-[calc(100vh-120px)] min-h-[600px] w-full rounded-2xl overflow-hidden bg-[#121212]"',
  'className="relative h-[100vh] w-full overflow-hidden bg-[#121212]"'
);

// We need to ensure that the header doesn't cover top part too badly, but visually it's full screen.

// 2. Minimostre distance & rounded border removal
content = content.replace(
  'mb-32 -mt-10 rounded-[3rem] z-20 relative',
  'mb-[25px] z-20 relative' // distance from top identical to writers which is "mb-32"
);

// Make sure distance is same for minimostre and writers
content = content.replace(
  '<section id="minimostre" className="bg-[#121212] text-white pt-24 pb-32 px-[25px] md:px-[50px] w-full mb-[25px]',
  '<section id="minimostre" className="bg-[#121212] text-white pt-32 pb-32 px-[25px] md:px-[50px] w-full mb-32'
);

// We will use standard margins consistently `mb-32` or similar. Let's make sure it's mb-32 everywhere.

// 3. Grid distances in minimostre, writers, magazine. `gap-[25px]` on desktop, `gap-[15px]` on mobile/tablet. 
// For tailwind: `gap-[15px] md:gap-[25px]`
content = content.replace(/gap-\[25px\]/g, "gap-[15px] md:gap-[25px]");

// Wait, the user said "una per riga su mobile", so it should be grid-cols-1 md:grid-cols-3

// 4. Magazine: titles inside images and no date
const magazineRegex = /\{\/\* Magazine \*\/\}.*?(?=\{\/\* Footer \*\/\})/s;
const magazineReplacement = `
{/* Magazine */}
        <section id="magazine" className="bg-[#121212] text-white pt-24 pb-32 px-[25px] md:px-[50px] w-full relative z-20">
           <div className="w-full">
             <div className="flex flex-col md:flex-row justify-between items-start mb-16">
               <div>
                  <h2 className="heading-hero text-[#FF4F00] mb-8">MAGAZINE</h2>
                  <p className="body-text text-white/80 max-w-xl">
                    Immergiti nella cultura. Storie, interviste e archivi dal mondo dei graffiti e della street art.
                  </p>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px] md:gap-[25px]">
               {[
                 { title: 'THE ORIGINS OF AELLE WITH SHAONE', tag: 'Interview', img: 'https://images.unsplash.com/photo-1517722014278-c256a91a6fba?auto=format&fit=crop&q=80' },
                 { title: 'MILAN 1993: THE GOLDEN ERA', tag: 'Archive', img: 'https://images.unsplash.com/photo-1561214115-f660b7015f8c?auto=format&fit=crop&q=80' },
                 { title: 'FROM TRAINS TO GALLERIES', tag: 'Opinion', img: 'https://images.unsplash.com/photo-1541818276538-3e4b78971af1?auto=format&fit=crop&q=80' },
                 { title: 'HOW WILDSTYLE CHANGED NEW YORK', tag: 'History', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80' },
                 { title: 'COLOR THEORY IN SPRAY CANS', tag: 'Technique', img: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80' },
                 { title: 'THE FUTURE OF DIGITAL GRAFFITI', tag: 'Trend', img: 'https://images.unsplash.com/photo-1525926477800-7a3eaaaf3bee?auto=format&fit=crop&q=80' }
               ].map((article, i) => (
                 <div key={i} className="group cursor-pointer">
                    <div className="aspect-square bg-[#2A2A2A] rounded-2xl overflow-hidden mb-6 relative">
                      <img src={article.img} alt={article.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-80" />
                      <div className="absolute bottom-6 left-6 text-white pr-6">
                        <p className="font-bold text-sm tracking-widest text-[#FF4F00] uppercase mb-2">{article.tag}</p>
                        <h3 className="heading-h3 leading-none group-hover:text-[#FF4F00] transition-colors">{article.title}</h3>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
             
             <div className="mt-20 flex justify-center w-full">
               <Link to="/magazine" className="inline-flex items-center gap-4 btn-text bg-[#FF4F00] text-white py-4 px-10 rounded-full hover:bg-white hover:text-[#121212] transition-colors uppercase">
                 TUTTI GLI ARTICOLI
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
               </Link>
             </div>
           </div>
        </section>

{/* Newsletter */}
        <section id="newsletter" className="bg-[#F2EEE8] text-[#121212] py-32 px-[25px] md:px-[50px] border-t border-[#121212]/10 z-20 relative">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <h2 className="heading-hero text-[#121212] mb-8">ISCRIVITI ALLA LISTA PRIORITARIA</h2>
            <p className="body-text mb-12 max-w-xl">Entra a far parte della nostra community. Riceverai aggiornamenti, inviti ad eventi esclusivi e contenuti editoriali direttamente nella tua casella di posta.</p>
            
            <div className="w-full max-w-lg text-left">
              <form method="post" action="https://sendfox.com/form/m5egn8/mnkywx" className="sendfox-form flex flex-col gap-6" id="mnkywx" data-async="true" data-recaptcha="true">
                <div className="flex flex-col gap-2">
                  <label htmlFor="sendfox_form_name" className="heading-small text-[#121212]">Nome</label>
                  <input type="text" id="sendfox_form_name" placeholder="Il tuo nome" name="first_name" required className="w-full bg-transparent border-b-2 border-[#121212]/20 focus:border-[#FF4F00] py-3 text-lg outline-none transition-colors" />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="sendfox_form_email" className="heading-small text-[#121212]">Email</label>
                  <input type="email" id="sendfox_form_email" placeholder="La tua email" name="email" required className="w-full bg-transparent border-b-2 border-[#121212]/20 focus:border-[#FF4F00] py-3 text-lg outline-none transition-colors" />
                </div>
                <div className="flex items-start gap-4 mt-4">
                  <input type="checkbox" id="sendfox_gdpr" name="gdpr" value="1" required className="mt-1 w-5 h-5 accent-[#FF4F00]" />
                  <label htmlFor="sendfox_gdpr" className="body-text text-base">Accetto di ricevere aggiornamenti e promozioni via e-mail.</label>
                </div>
                {/* no botz please */}
                <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
                  <input type="text" name="a_password" tabIndex="-1" defaultValue="" autoComplete="off" />
                </div>
                <div className="mt-8 flex justify-center">
                  <button type="submit" className="inline-flex items-center gap-4 btn-text bg-[#121212] text-white py-4 px-12 rounded-full hover:bg-[#FF4F00] transition-colors uppercase cursor-pointer">
                    Iscriviti
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
`;

content = content.replace(magazineRegex, magazineReplacement);

fs.writeFileSync('src/pages/PublicHome.tsx', content);

// Add SendFox script to index.html if not present
let indexContent = fs.readFileSync('index.html', 'utf8');
if (!indexContent.includes('sendfox.com/js/form.js')) {
    indexContent = indexContent.replace('</body>', '<script src="https://cdn.sendfox.com/js/form.js" charset="utf-8"></script>\\n  </body>');
    fs.writeFileSync('index.html', indexContent);
}
