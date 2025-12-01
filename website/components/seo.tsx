import Head from 'next/head';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    tags?: string[];
  };
  canonical?: string;
}

export function SEO({
  title,
  description,
  keywords = [],
  ogImage = '/og-image.png',
  ogType = 'website',
  article,
  canonical,
}: SEOProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cooksmartapp.com';
  const fullTitle = `${title} | Cook Smart`;
  const canonicalUrl = canonical || siteUrl;

  // Generate JSON-LD structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ogType === 'article' ? 'Article' : 'WebSite',
    name: fullTitle,
    description,
    url: canonicalUrl,
    ...(ogType === 'article' && article
      ? {
          headline: title,
          datePublished: article.publishedTime,
          dateModified: article.modifiedTime,
          author: {
            '@type': 'Person',
            name: article.author,
          },
          keywords: article.tags?.join(', '),
        }
      : {}),
  };

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:site_name" content="Cook Smart" />

      {/* Article-specific Open Graph Tags */}
      {ogType === 'article' && article && (
        <>
          {article.publishedTime && (
            <meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.modifiedTime && (
            <meta property="article:modified_time" content={article.modifiedTime} />
          )}
          {article.author && <meta property="article:author" content={article.author} />}
          {article.tags?.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      <meta name="twitter:site" content="@cooksmartapp" />

      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
}

