const fs = require('fs');
let code = fs.readFileSync('src/pages/PublicHome.tsx', 'utf8');

// 1. SWAP HEADER AND MOBILE MENU ITEMS
code = code.replace(/<a[\s\S]*?href="#writers"[\s\S]*?>\s*WRITERS\s*<\/a>([\s\S]*?)<a[\s\S]*?href="#minimostre"[\s\S]*?>\s*MINIMOSTRE\s*<\/a>/, 
  '<a href="#minimostre" className="hover:text-[#FF4F00] transition-colors">MINIMOSTRE</a>$1<a href="#writers" className="hover:text-[#FF4F00] transition-colors">WRITERS</a>');

// For mobile menu, currently it uses #writers and #mostre
code = code.replace(/<a[\s\S]*?href="#writers"[\s\S]*?onClick=\{\(\) => setMobileMenuOpen\(false\)\}[\s\S]*?>\s*WRITERS\s*<\/a>([\s\S]*?)<a[\s\S]*?href="#mostre"[\s\S]*?onClick=\{\(\) => setMobileMenuOpen\(false\)\}[\s\S]*?>\s*MOSTRE\s*<\/a>/,
  '<a href="#minimostre" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#FF4F00]">MINIMOSTRE</a>$1<a href="#writers" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#FF4F00]">WRITERS</a>');


// 2. MODULAR FOOTER REWRITE
const footerRegex = /\{\/\* Footer \*\/\}[\s\S]*?<\/footer>/;

const newFooter = `{/* Footer */}
      <footer className="bg-[#121212] flex-col text-white py-12 px-[25px] md:px-[50px] relative z-10 overflow-hidden">
        <div className="w-full relative z-10">
          
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 mb-20">
            <div className="w-full lg:w-1/3">
              <img
                src="/TagTales-tagline-bianco-medium.png"
                alt="TagTales"
                className="w-[200px] lg:w-[320px] h-auto opacity-50 mb-6"
              />
              <p className="max-w-md text-lg mb-6 text-white font-medium">
                La storia di ogni writer inizia con una tag. TagTales Gallery connette graffiti writer e collezionisti attraverso mini mostre: opere originali, stampe in edizione limitata, print-on-demand. Zero intellingenza artificiale, solo writing nelle sue forme più originali.
              </p>
              
              <div className="relative inline-block">
                <button 
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-2 hover:text-[#FF4F00] transition-colors focus:outline-none text-white border border-white/20 px-6 py-3 rounded-lg"
                >
                  <Globe size={20} />
                  <span className="font-bold text-lg">{currentLang}</span>
                </button>
                <AnimatePresence>
                  {langDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute bottom-full left-0 mb-2 bg-[#F2EEE8] shadow-xl rounded-xl border border-[#EAE3D9] overflow-hidden min-w-[120px] z-50 text-[#121212]"
                    >
                      {languages.map(lang => (
                        <button
                          key={lang}
                          onClick={() => {
                            setCurrentLang(lang);
                            setLangDropdownOpen(false);
                          }}
                          className={
                            "w-full text-left px-5 py-3 text-lg transition-colors block " +
                            (currentLang === lang ? "bg-[#FF4F00] text-white" : "hover:bg-white text-[#121212]")
                          }
                        >
                          {lang}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="w-full lg:w-2/3 grid grid-cols-2 gap-12">
                <div>
                  <h4 className="font-bold text-[#FF4F00] mb-6 uppercase tracking-widest text-lg">
                    Menu
                  </h4>
                  <ul className="space-y-4 text-lg font-medium text-white">
                    <li><Link to="/" className="hover:text-[#FF4F00] transition-colors">HOME</Link></li>
                    <li><a href="#minimostre" className="hover:text-[#FF4F00] transition-colors">MINIMOSTRE</a></li>
                    <li><a href="#writers" className="hover:text-[#FF4F00] transition-colors">WRITERS</a></li>
                    <li><a href="#magazine" className="hover:text-[#FF4F00] transition-colors">MAGAZINE</a></li>
                    <li><a href="#faq" className="hover:text-[#FF4F00] transition-colors">FAQ</a></li>
                    <li><Link to="/contact" className="hover:text-[#FF4F00] transition-colors">CONTATTI</Link></li>
                    <li><Link to="/aelle" className="hover:text-[#FF4F00] transition-colors">AELLE</Link></li>
                    <li><Link to="/about" className="hover:text-[#FF4F00] transition-colors">CHI SIAMO</Link></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold text-[#FF4F00] mb-6 uppercase tracking-widest text-lg">
                    Legal
                  </h4>
                  <ul className="space-y-4 text-lg font-medium text-white mb-10">
                    <li>
                      <Link to="/privacy" className="hover:text-[#FF4F00] transition-colors">Privacy</Link>
                    </li>
                    <li>
                      <Link to="/terms" className="hover:text-[#FF4F00] transition-colors">Terms of Service</Link>
                    </li>
                    <li>
                      <Link to="/cookies" className="hover:text-[#FF4F00] transition-colors">Cookies</Link>
                    </li>
                  </ul>

                  <h4 className="font-bold text-[#FF4F00] mb-6 uppercase tracking-widest text-lg">
                    Social
                  </h4>
                  <ul className="space-y-4 text-lg font-medium text-white">
                    <li>
                      <a href="https://www.instagram.com/tagtales.gallery/" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF4F00] transition-colors">
                        Instagram
                      </a>
                    </li>
                  </ul>
                </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center text-sm mt-12 gap-4 border-t border-white/20 pt-8">
            <p className="font-medium text-white">
              © {new Date().getFullYear()} TagTales Gallery by Brignole | Switzerland.
            </p>
            <Link
              to="/app"
              className="hover:text-[#FF4F00] text-white transition-colors flex items-center gap-2 font-medium"
            >
              Artists Panel{" "}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-lock"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </Link>
          </div>
        </div>
      </footer>`;
code = code.replace(footerRegex, newFooter);

fs.writeFileSync('src/pages/PublicHome.tsx', code);
