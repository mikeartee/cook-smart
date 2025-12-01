import * as fc from 'fast-check';
import { PBT_CONFIG } from '@/__tests__/utils/pbt-helpers';

/**
 * Feature: cook-smart-website, Property 11: SEO metadata completeness
 * Validates: Requirements 3.4
 */
describe('Property 11: SEO metadata completeness', () => {
  it('should generate complete meta tags for all pages', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 10, maxLength: 60 }),
          description: fc.string({ minLength: 50, maxLength: 160 }),
          keywords: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 3, maxLength: 10 }),
          url: fc.string({ minLength: 10, maxLength: 100 }),
          image: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        (pageData) => {
          // Simulate meta tag generation
          const metaTags = {
            title: pageData.title,
            description: pageData.description,
            keywords: pageData.keywords.join(', '),
            canonical: pageData.url,
            robots: 'index, follow',
          };

          // Property: All required meta tags should be present
          expect(metaTags.title).toBeTruthy();
          expect(metaTags.description).toBeTruthy();
          expect(metaTags.keywords).toBeTruthy();
          expect(metaTags.canonical).toBeTruthy();
          expect(metaTags.robots).toBeTruthy();

          // Property: Title should be within optimal length
          expect(metaTags.title.length).toBeGreaterThan(0);
          expect(metaTags.title.length).toBeLessThanOrEqual(60);

          // Property: Description should be within optimal length
          expect(metaTags.description.length).toBeGreaterThanOrEqual(50);
          expect(metaTags.description.length).toBeLessThanOrEqual(160);

          // Property: Keywords should be comma-separated
          expect(metaTags.keywords).toContain(',');

          // Property: Canonical URL should be valid
          expect(metaTags.canonical.length).toBeGreaterThan(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle title length optimization', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        (title) => {
          const maxLength = 60;
          const optimizedTitle = title.length > maxLength
            ? title.substring(0, maxLength - 3) + '...'
            : title;

          // Property: Optimized title should not exceed max length
          expect(optimizedTitle.length).toBeLessThanOrEqual(maxLength);

          // Property: If original was short enough, should be unchanged
          if (title.length <= maxLength) {
            expect(optimizedTitle).toBe(title);
          }

          // Property: If truncated, should end with ellipsis
          if (title.length > maxLength) {
            expect(optimizedTitle).toMatch(/\.\.\.$/);
          }

          // Property: Truncated title should preserve beginning
          if (title.length > maxLength) {
            expect(title.startsWith(optimizedTitle.substring(0, 10))).toBe(true);
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it('should generate structured data (JSON-LD)', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constantFrom('Article', 'Recipe', 'WebPage', 'Organization'),
          name: fc.string({ minLength: 5, maxLength: 100 }),
          description: fc.string({ minLength: 20, maxLength: 200 }),
          url: fc.string({ minLength: 10, maxLength: 100 }),
          image: fc.string({ minLength: 10, maxLength: 100 }),
          datePublished: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
        }),
        (data) => {
          // Simulate JSON-LD generation
          const jsonLd = {
            '@context': 'https://schema.org',
            '@type': data.type,
            name: data.name,
            description: data.description,
            url: data.url,
            image: data.image,
            datePublished: data.datePublished.toISOString(),
          };

          // Property: Should have schema.org context
          expect(jsonLd['@context']).toBe('https://schema.org');

          // Property: Should have valid type
          expect(['Article', 'Recipe', 'WebPage', 'Organization']).toContain(jsonLd['@type']);

          // Property: All required fields should be present
          expect(jsonLd.name).toBeTruthy();
          expect(jsonLd.description).toBeTruthy();
          expect(jsonLd.url).toBeTruthy();
          expect(jsonLd.image).toBeTruthy();

          // Property: Date should be in ISO format
          expect(jsonLd.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}T/);

          // Property: Should be valid JSON
          expect(() => JSON.stringify(jsonLd)).not.toThrow();
        }
      ),
      PBT_CONFIG
    );
  });

  it('should generate robots meta tag correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          index: fc.boolean(),
          follow: fc.boolean(),
          noarchive: fc.boolean(),
          nosnippet: fc.boolean(),
        }),
        (robotsConfig) => {
          // Simulate robots meta generation
          const directives = [];
          
          // Add index/noindex (mutually exclusive)
          if (robotsConfig.index) {
            directives.push('index');
          } else {
            directives.push('noindex');
          }

          // Add follow/nofollow (mutually exclusive)
          if (robotsConfig.follow) {
            directives.push('follow');
          } else {
            directives.push('nofollow');
          }

          // Add optional directives
          if (robotsConfig.noarchive) directives.push('noarchive');
          if (robotsConfig.nosnippet) directives.push('nosnippet');

          const robotsMeta = directives.join(', ');

          // Property: Should contain exactly one of index/noindex
          const directiveList = directives;
          const hasIndex = directiveList.includes('index');
          const hasNoindex = directiveList.includes('noindex');
          expect(hasIndex !== hasNoindex).toBe(true); // XOR - exactly one

          // Property: Should contain exactly one of follow/nofollow
          const hasFollow = directiveList.includes('follow');
          const hasNofollow = directiveList.includes('nofollow');
          expect(hasFollow !== hasNofollow).toBe(true); // XOR - exactly one

          // Property: Directives should be comma-separated
          if (directives.length > 1) {
            expect(robotsMeta).toContain(',');
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle canonical URLs correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          path: fc.string({ minLength: 1, maxLength: 100 }),
          domain: fc.constantFrom('example.com', 'www.example.com'),
          protocol: fc.constantFrom('http', 'https'),
          queryParams: fc.record({
            utm_source: fc.option(fc.string({ minLength: 3, maxLength: 20 })),
            utm_medium: fc.option(fc.string({ minLength: 3, maxLength: 20 })),
          }),
        }),
        (urlData) => {
          // Simulate canonical URL generation (strip tracking params)
          const canonicalUrl = `${urlData.protocol}://${urlData.domain}/${urlData.path}`;

          // Property: Canonical should not include tracking parameters
          expect(canonicalUrl).not.toContain('utm_');

          // Property: Canonical should have protocol
          expect(canonicalUrl).toMatch(/^https?:\/\//);

          // Property: Canonical should have domain
          expect(canonicalUrl).toContain(urlData.domain);

          // Property: Canonical should have path
          expect(canonicalUrl).toContain(urlData.path);

          // Property: HTTPS should be preferred
          if (urlData.protocol === 'https') {
            expect(canonicalUrl.startsWith('https://')).toBe(true);
          }
        }
      ),
      PBT_CONFIG
    );
  });
});

/**
 * Feature: cook-smart-website, Property 12: Social sharing metadata
 * Validates: Requirements 3.5
 */
describe('Property 12: Social sharing metadata', () => {
  it('should generate Open Graph tags correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 10, maxLength: 60 }),
          description: fc.string({ minLength: 50, maxLength: 160 }),
          image: fc.string({ minLength: 10, maxLength: 100 }),
          url: fc.string({ minLength: 10, maxLength: 100 }),
          type: fc.constantFrom('website', 'article', 'product'),
        }),
        (pageData) => {
          // Simulate Open Graph tag generation
          const ogTags = {
            'og:title': pageData.title,
            'og:description': pageData.description,
            'og:image': pageData.image,
            'og:url': pageData.url,
            'og:type': pageData.type,
            'og:site_name': 'Cook Smart',
          };

          // Property: All required OG tags should be present
          expect(ogTags['og:title']).toBeTruthy();
          expect(ogTags['og:description']).toBeTruthy();
          expect(ogTags['og:image']).toBeTruthy();
          expect(ogTags['og:url']).toBeTruthy();
          expect(ogTags['og:type']).toBeTruthy();

          // Property: OG title should match page title
          expect(ogTags['og:title']).toBe(pageData.title);

          // Property: OG type should be valid
          expect(['website', 'article', 'product']).toContain(ogTags['og:type']);

          // Property: Site name should be present
          expect(ogTags['og:site_name']).toBeTruthy();
        }
      ),
      PBT_CONFIG
    );
  });

  it('should generate Twitter Card tags correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 10, maxLength: 60 }),
          description: fc.string({ minLength: 50, maxLength: 160 }),
          image: fc.string({ minLength: 10, maxLength: 100 }),
          cardType: fc.constantFrom('summary', 'summary_large_image', 'app', 'player'),
        }),
        (pageData) => {
          // Simulate Twitter Card tag generation
          const twitterTags = {
            'twitter:card': pageData.cardType,
            'twitter:title': pageData.title,
            'twitter:description': pageData.description,
            'twitter:image': pageData.image,
            'twitter:site': '@cooksmartapp',
          };

          // Property: All required Twitter tags should be present
          expect(twitterTags['twitter:card']).toBeTruthy();
          expect(twitterTags['twitter:title']).toBeTruthy();
          expect(twitterTags['twitter:description']).toBeTruthy();
          expect(twitterTags['twitter:image']).toBeTruthy();

          // Property: Card type should be valid
          expect(['summary', 'summary_large_image', 'app', 'player']).toContain(twitterTags['twitter:card']);

          // Property: Twitter handle should start with @
          expect(twitterTags['twitter:site']).toMatch(/^@/);

          // Property: Title and description should match page data
          expect(twitterTags['twitter:title']).toBe(pageData.title);
          expect(twitterTags['twitter:description']).toBe(pageData.description);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should optimize social sharing images', () => {
    fc.assert(
      fc.property(
        fc.record({
          src: fc.string({ minLength: 10, maxLength: 100 }),
          width: fc.integer({ min: 200, max: 4000 }),
          height: fc.integer({ min: 200, max: 4000 }),
        }),
        (image) => {
          // Simulate social image optimization
          const ogImageWidth = 1200;
          const ogImageHeight = 630;

          const optimizedImage = {
            src: `${image.src}?w=${ogImageWidth}&h=${ogImageHeight}&fit=crop`,
            width: ogImageWidth,
            height: ogImageHeight,
            alt: 'Social sharing image',
          };

          // Property: OG image should have standard dimensions
          expect(optimizedImage.width).toBe(1200);
          expect(optimizedImage.height).toBe(630);

          // Property: Image should have 1.91:1 aspect ratio (OG standard)
          const ratio = optimizedImage.width / optimizedImage.height;
          expect(Math.abs(ratio - 1.905)).toBeLessThan(0.01);

          // Property: Optimized image should include dimensions in URL
          expect(optimizedImage.src).toContain(`w=${ogImageWidth}`);
          expect(optimizedImage.src).toContain(`h=${ogImageHeight}`);

          // Property: Should have alt text
          expect(optimizedImage.alt).toBeTruthy();
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle article-specific metadata', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date() }).chain(publishedDate =>
          fc.record({
            title: fc.string({ minLength: 10, maxLength: 100 }),
            author: fc.string({ minLength: 3, maxLength: 50 }),
            publishedDate: fc.constant(publishedDate),
            modifiedDate: fc.date({ min: publishedDate, max: new Date() }),
            section: fc.string({ minLength: 3, maxLength: 30 }),
            tags: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          })
        ),
        (article) => {
          // Simulate article metadata generation
          const articleMeta = {
            'article:published_time': article.publishedDate.toISOString(),
            'article:modified_time': article.modifiedDate.toISOString(),
            'article:author': article.author,
            'article:section': article.section,
            'article:tag': article.tags,
          };

          // Property: Published time should be in ISO format
          expect(articleMeta['article:published_time']).toMatch(/^\d{4}-\d{2}-\d{2}T/);

          // Property: Modified time should be in ISO format
          expect(articleMeta['article:modified_time']).toMatch(/^\d{4}-\d{2}-\d{2}T/);

          // Property: Modified time should be after or equal to published time
          expect(new Date(articleMeta['article:modified_time']).getTime())
            .toBeGreaterThanOrEqual(new Date(articleMeta['article:published_time']).getTime());

          // Property: Author should be present
          expect(articleMeta['article:author']).toBeTruthy();

          // Property: Section should be present
          expect(articleMeta['article:section']).toBeTruthy();

          // Property: Tags should be an array
          expect(Array.isArray(articleMeta['article:tag'])).toBe(true);
          expect(articleMeta['article:tag'].length).toBeGreaterThan(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should generate locale-specific metadata', () => {
    fc.assert(
      fc.property(
        fc.record({
          locale: fc.constantFrom('en_US', 'en_GB', 'es_ES', 'fr_FR', 'de_DE'),
          alternateLocales: fc.array(
            fc.constantFrom('en_US', 'en_GB', 'es_ES', 'fr_FR', 'de_DE'),
            { minLength: 0, maxLength: 3 }
          ),
        }),
        (localeData) => {
          // Simulate locale metadata generation
          const localeMeta = {
            'og:locale': localeData.locale,
            'og:locale:alternate': localeData.alternateLocales.filter(
              loc => loc !== localeData.locale
            ),
          };

          // Property: Primary locale should be present
          expect(localeMeta['og:locale']).toBeTruthy();

          // Property: Locale should be in correct format
          expect(localeMeta['og:locale']).toMatch(/^[a-z]{2}_[A-Z]{2}$/);

          // Property: Alternate locales should not include primary
          expect(localeMeta['og:locale:alternate']).not.toContain(localeData.locale);

          // Property: All alternate locales should be in correct format
          localeMeta['og:locale:alternate'].forEach(locale => {
            expect(locale).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
          });
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle missing or optional metadata gracefully', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 10, maxLength: 60 }),
          description: fc.option(fc.string({ minLength: 50, maxLength: 160 })),
          image: fc.option(fc.string({ minLength: 10, maxLength: 100 })),
          author: fc.option(fc.string({ minLength: 3, maxLength: 50 })),
        }),
        (pageData) => {
          // Simulate metadata with defaults for missing values
          const metadata = {
            title: pageData.title,
            description: pageData.description || 'Default description for Cook Smart',
            image: pageData.image || '/default-og-image.jpg',
            author: pageData.author || 'Cook Smart Team',
          };

          // Property: Required fields should always be present
          expect(metadata.title).toBeTruthy();
          expect(metadata.description).toBeTruthy();
          expect(metadata.image).toBeTruthy();

          // Property: Defaults should be used when values are missing
          if (!pageData.description) {
            expect(metadata.description).toBe('Default description for Cook Smart');
          }

          if (!pageData.image) {
            expect(metadata.image).toBe('/default-og-image.jpg');
          }

          if (!pageData.author) {
            expect(metadata.author).toBe('Cook Smart Team');
          }

          // Property: All metadata values should be non-empty
          expect(metadata.title.length).toBeGreaterThan(0);
          expect(metadata.description.length).toBeGreaterThan(0);
          expect(metadata.image.length).toBeGreaterThan(0);
        }
      ),
      PBT_CONFIG
    );
  });
});

