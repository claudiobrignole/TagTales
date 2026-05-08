const fs = require('fs');
let code = fs.readFileSync('src/pages/PublicHome.tsx', 'utf8');

// MINIMOSTRE HTML
let minimostreOld = `<div className="absolute top-4 right-4 flex gap-2">
                    <span className="bg-[#FF4F00] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md bg-opacity-90">
                      {item.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-6 left-6 pr-6 text-white">
                    <h3 className="heading-h3 text-white mb-2 leading-none">
                      {item.title}
                    </h3>
                    <p className="heading-small text-[#FF4F00]">{item.owner}</p>
                  </div>`;
                  
let minimostreNew = `<div className="absolute bottom-6 left-6 pr-6 text-white">
                    <p className="font-bold text-sm tracking-widest text-[#FF4F00] uppercase mb-2">
                       {item.owner}
                    </p>
                    <h3 className="heading-h3 leading-none group-hover:text-[#FF4F00] transition-colors">
                      {item.title}
                    </h3>
                  </div>`;
code = code.replace(minimostreOld, minimostreNew);

// WRITERS HTML
let writersOld = `<div className="absolute bottom-6 left-6 pr-6 text-white">
                    {writer.name && (
                      <h3 className="heading-h3 text-white mb-2 leading-none">
                        {writer.name}
                      </h3>
                    )}
                    <p className="heading-small text-[#FF4F00]">
                      {writer.style}
                    </p>
                  </div>`;
let writersNew = `<div className="absolute bottom-6 left-6 pr-6 text-white">
                      <p className="font-bold text-sm tracking-widest text-[#FF4F00] uppercase mb-2">
                        {writer.nation}
                      </p>
                      {writer.name && (
                        <h3 className="heading-h3 leading-none group-hover:text-[#FF4F00] transition-colors text-white mb-2">
                          {writer.name}
                        </h3>
                      )}
                    </div>`;

code = code.replace(writersOld, writersNew);

// Fix data
code = code.replace(/"ShaOne • Sep 24"/g, '"ShaOne"');
code = code.replace(/"Bros • Nov 1"/g, '"Bros"');
code = code.replace(/"Crew • Dec 15"/g, '"Crew"');
code = code.replace(/"Phase 2 • Jan 10"/g, '"Phase 2"');
code = code.replace(/"Local Artists • Feb 5"/g, '"Local Artists"');
code = code.replace(/"Alice • Mar 20"/g, '"Alice"');

code = code.replace(/style: "Old School"/g, 'nation: "Italia"');
code = code.replace(/style: "Abstract"/g, 'nation: "Italia"');
code = code.replace(/style: "Wildstyle"/g, 'nation: "USA"');
code = code.replace(/style: "Bombing"/g, 'nation: "Francia"');
code = code.replace(/style: "Surrealism"/g, 'nation: "UK"');
code = code.replace(/style: "Throw-ups"/g, 'nation: "Germania"');

// Fix Magazine HTML to align perfectly with the others regarding hover-group color. (already done in previous steps kinda but let's make sure it's strictly the same layout padding/margin inside image).

fs.writeFileSync('src/pages/PublicHome.tsx', code);
