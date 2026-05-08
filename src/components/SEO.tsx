import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  article?: boolean;
}

const SEO: React.FC<SEOProps> = ({ title, description, image, article }) => {
  const { t, i18n } = useTranslation();
  
  const siteName = 'TagTales';
  const defaultDescription = t('seo.defaultDescription', 'TagTales - Graffiti Culture, Exhibition and Magazine');
  const baseUrl = window.location.origin;
  const defaultImage = `${baseUrl}/pwa-192x192.png`; // Fallback to PWA icon
  
  const seo = {
    title: title ? `${title} | ${siteName}` : siteName,
    description: description || defaultDescription,
    image: image || defaultImage,
    url: window.location.href,
  };

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="image" content={seo.image} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:url" content={seo.url} />
      {article ? <meta property="og:type" content="article" /> : <meta property="og:type" content="website" />}
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />
      
      {/* Standard SEO */}
      <link rel="canonical" href={seo.url} />
    </Helmet>
  );
};

export default SEO;
