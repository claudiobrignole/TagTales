const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');
const languages = ['en', 'it', 'de', 'fr', 'es'];

const newKeys = {
  "errorJpgPng": "Only JPG and PNG images are allowed.",
  "errorImageSize": "Image size must be less than 50MB.",
  "errorMp4": "Only MP4 videos are allowed.",
  "errorVideoSize": "Video size must be less than 500MB.",
  "errorOneImage": "Please upload at least one image.",
  "errorUploadFailed": "Failed to upload artwork",
  "images": "Images",
  "addImages": "Add Images",
  "imageFormat": "JPG/PNG, max 50MB",
  "videoOptional": "Video (Optional)",
  "uploading": "Uploading...",
  "uploadVideo": "Upload Video",
  "videoFormat": "MP4 only, max 500MB",
  "artworkDetails": "Artwork Details",
  "titlePlaceholder": "e.g. The Starry Night",
  "techniquePlaceholder": "e.g. Oil on Canvas",
  "typeOriginal": "Original",
  "typeLimited": "Limited Edition",
  "typePrint": "Print on Demand",
  "none": "None",
  "summerCollection": "Summer Collection 2026",
  "abstractVisions": "Abstract Visions",
  "shortDescription": "Short Description",
  "descriptionPlaceholder": "Tell the story behind this artwork..."
};

languages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!data.uploadArtwork) data.uploadArtwork = {};
    
    // For simplicity, we just add the English keys to all languages.
    // In a real scenario, these would be translated.
    Object.keys(newKeys).forEach(key => {
      if (!data.uploadArtwork[key]) {
        data.uploadArtwork[key] = newKeys[key];
      }
    });
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
});

let uploadArtworkContent = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'UploadArtwork.tsx'), 'utf8');

uploadArtworkContent = uploadArtworkContent
  .replace(/'Only JPG and PNG images are allowed\.'/g, "t('uploadArtwork.errorJpgPng')")
  .replace(/'Image size must be less than 50MB\.'/g, "t('uploadArtwork.errorImageSize')")
  .replace(/'Only MP4 videos are allowed\.'/g, "t('uploadArtwork.errorMp4')")
  .replace(/'Video size must be less than 500MB\.'/g, "t('uploadArtwork.errorVideoSize')")
  .replace(/'Please upload at least one image\.'/g, "t('uploadArtwork.errorOneImage')")
  .replace(/'Failed to upload artwork'/g, "t('uploadArtwork.errorUploadFailed')")
  .replace(/<h1 className="text-4xl font-bold tracking-tight text-\[#121212\] mb-2">Upload New Artwork<\/h1>/g, '<h1 className="text-4xl font-bold tracking-tight text-[#121212] mb-2">{t(\'uploadArtwork.title\')}</h1>')
  .replace(/<p className="text-\[#59554E\] text-lg">Submit your latest creation for review and listing\.<\/p>/g, '<p className="text-[#59554E] text-lg">{t(\'uploadArtwork.subtitle\')}</p>')
  .replace(/Artwork uploaded successfully! Redirecting\.\.\./g, "{t('uploadArtwork.successMessage')}")
  .replace(/Images\n\s*<\/h2>/g, "{t('uploadArtwork.images')}\n            </h2>")
  .replace(/<p className="text-xs font-bold text-\[#121212\]">Add Images<\/p>/g, '<p className="text-xs font-bold text-[#121212]">{t(\'uploadArtwork.addImages\')}</p>')
  .replace(/<p className="text-\[10px\] text-\[#59554E\] mt-1">JPG\/PNG, max 50MB<\/p>/g, '<p className="text-[10px] text-[#59554E] mt-1">{t(\'uploadArtwork.imageFormat\')}</p>')
  .replace(/Video \(Optional\)\n\s*<\/h2>/g, "{t('uploadArtwork.videoOptional')}\n            </h2>")
  .replace(/<span className="text-\[#59554E\]">Uploading\.\.\.<\/span>/g, '<span className="text-[#59554E]">{t(\'uploadArtwork.uploading\')}</span>')
  .replace(/<p className="text-sm font-bold text-\[#121212\]">Upload Video<\/p>/g, '<p className="text-sm font-bold text-[#121212]">{t(\'uploadArtwork.uploadVideo\')}</p>')
  .replace(/<p className="text-xs text-\[#59554E\] mt-1">MP4 only, max 500MB<\/p>/g, '<p className="text-xs text-[#59554E] mt-1">{t(\'uploadArtwork.videoFormat\')}</p>')
  .replace(/<h2 className="text-xl font-bold text-\[#121212\] mb-6 border-b border-\[#EAE3D9\] pb-4">Artwork Details<\/h2>/g, '<h2 className="text-xl font-bold text-[#121212] mb-6 border-b border-[#EAE3D9] pb-4">{t(\'uploadArtwork.artworkDetails\')}</h2>')
  .replace(/<label className="block text-\[0\.75rem\] font-bold uppercase tracking-\[0\.1em\] text-\[#121212\]">Title<\/label>/g, '<label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t(\'uploadArtwork.artworkTitle\')}</label>')
  .replace(/placeholder="e\.g\. The Starry Night"/g, 'placeholder={t(\'uploadArtwork.titlePlaceholder\')}')
  .replace(/<label className="block text-\[0\.75rem\] font-bold uppercase tracking-\[0\.1em\] text-\[#121212\]">Technique<\/label>/g, '<label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t(\'uploadArtwork.technique\')}</label>')
  .replace(/placeholder="e\.g\. Oil on Canvas"/g, 'placeholder={t(\'uploadArtwork.techniquePlaceholder\')}')
  .replace(/<label className="block text-\[0\.75rem\] font-bold uppercase tracking-\[0\.1em\] text-\[#121212\]">Type<\/label>/g, '<label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t(\'uploadArtwork.type\')}</label>')
  .replace(/<option value="Original">Original<\/option>/g, '<option value="Original">{t(\'uploadArtwork.typeOriginal\')}</option>')
  .replace(/<option value="Limited Edition">Limited Edition<\/option>/g, '<option value="Limited Edition">{t(\'uploadArtwork.typeLimited\')}</option>')
  .replace(/<option value="Print on Demand">Print on Demand<\/option>/g, '<option value="Print on Demand">{t(\'uploadArtwork.typePrint\')}</option>')
  .replace(/<label className="block text-\[0\.75rem\] font-bold uppercase tracking-\[0\.1em\] text-\[#121212\]">Exhibition \(Optional\)<\/label>/g, '<label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t(\'uploadArtwork.exhibitionId\')}</label>')
  .replace(/<option value="">None<\/option>/g, '<option value="">{t(\'uploadArtwork.none\')}</option>')
  .replace(/<option value="exh_1">Summer Collection 2026<\/option>/g, '<option value="exh_1">{t(\'uploadArtwork.summerCollection\')}</option>')
  .replace(/<option value="exh_2">Abstract Visions<\/option>/g, '<option value="exh_2">{t(\'uploadArtwork.abstractVisions\')}</option>')
  .replace(/<label className="block text-\[0\.75rem\] font-bold uppercase tracking-\[0\.1em\] text-\[#121212\]">Short \{t\('uploadArtwork\.description'\)\}<\/label>/g, '<label className="block text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#121212]">{t(\'uploadArtwork.shortDescription\')}</label>')
  .replace(/placeholder="Tell the story behind this artwork\.\.\."/g, 'placeholder={t(\'uploadArtwork.descriptionPlaceholder\')}')
  .replace(/Cancel\n\s*<\/button>/g, "{t('common.cancel')}\n            </button>")
  .replace(/<span>Uploading\.\.\.<\/span>/g, '<span>{t(\'uploadArtwork.uploading\')}</span>');

fs.writeFileSync(path.join(__dirname, 'src', 'pages', 'UploadArtwork.tsx'), uploadArtworkContent);
console.log('UploadArtwork.tsx fixed');
