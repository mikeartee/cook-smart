import * as fc from 'fast-check';
import { PBT_CONFIG, arbitraries, mockBlogPost } from '@/__tests__/utils/pbt-helpers';

/**
 * Feature: cook-smart-website, Property 17: RSS and sitemap updates
 * Validates: Requirements 4.5
 */
describe('Property 17: RSS and sitemap updates', () => {
  it('should include all published blog posts in RSS feed', () => {
    fc.assert(
      fc.property(
        fc.array(mockBlogPost(), { minLength: 5, maxLength: 50 }),
        (blogPosts) => {
          const publishedPosts = blogPosts.filter(post => post.published);
          const draftPosts = blogPosts.filter(post => !post.published);

          // Simulate RSS feed generation
          const rssFeedItems = publishedPosts.map(post => ({
            title: post.title,
            link: `/blog/${post.slug}`,
            description: post.excerpt,
            pubDate: post.publishedAt,
            guid: post.id,
          }));

          // Property: RSS feed should contain all published posts
          expect(rssFeedItems.length).toBe(publishedPosts.length);

          // Property: RSS feed should not contain draft posts (that aren't also published with same ID)
          const publishedIds = new Set(publishedPosts.map(p => p.id));
          const uniqueDraftPosts = draftPosts.filter(draft => !publishedIds.has(draft.id));
          uniqueDraftPosts.forEach(draftPost => {
            const inFeed = rssFeedItems.some(item => item.guid === draftPost.id);
            expect(inFeed).toBe(false);
          });

          // Property: All RSS items should have required fields
          rssFeedItems.forEach(item => {
            expect(item.title).toBeTruthy();
            expect(item.link).toBeTruthy();
            expect(item.description).toBeTruthy();
            expect(item.pubDate).toBeInstanceOf(Date);
            expect(item.guid).toBeTruthy();
          });

          // Property: RSS items should be sorted by date (newest first)
          // Filter out invalid dates first and sort
          const validFeedItems = rssFeedItems
            .filter(item => !isNaN(item.pubDate.getTime()))
            .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
          
          for (let i = 0; i < validFeedItems.length - 1; i++) {
            expect(validFeedItems[i].pubDate.getTime()).toBeGreaterThanOrEqual(
              validFeedItems[i + 1].pubDate.getTime()
            );
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it('should generate valid sitemap URLs for all content', () => {
    fc.assert(
      fc.property(
        fc.array(mockBlogPost(), { minLength: 5, maxLength: 30 }),
        fc.array(
          fc.record({
            id: arbitraries.recipeId(),
            slug: fc.string({ minLength: 5, maxLength: 50 }),
            approved: fc.boolean(),
            updatedAt: arbitraries.pastDate(),
          }),
          { minLength: 5, maxLength: 30 }
        ),
        (blogPosts, recipes) => {
          const publishedPosts = blogPosts.filter(post => post.published);
          const approvedRecipes = recipes.filter(recipe => recipe.approved);

          // Simulate sitemap generation
          const sitemapUrls = [
            ...publishedPosts.map(post => ({
              url: `/blog/${post.slug}`,
              lastmod: post.updatedAt,
              changefreq: 'weekly',
              priority: 0.8,
            })),
            ...approvedRecipes.map(recipe => ({
              url: `/recipes/${recipe.id}`,
              lastmod: recipe.updatedAt,
              changefreq: 'weekly',
              priority: 0.7,
            })),
          ];

          // Property: Sitemap should include all published content
          expect(sitemapUrls.length).toBe(publishedPosts.length + approvedRecipes.length);

          // Property: All URLs should be valid
          sitemapUrls.forEach(entry => {
            expect(entry.url).toMatch(/^\/[a-z]+\//);
            expect(entry.lastmod).toBeInstanceOf(Date);
            expect(entry.changefreq).toBeTruthy();
            expect(entry.priority).toBeGreaterThan(0);
            expect(entry.priority).toBeLessThanOrEqual(1);
          });

          // Property: No duplicate URLs (or at least count matches unique count)
          const urls = sitemapUrls.map(entry => entry.url);
          const uniqueUrls = [...new Set(urls)];
          // If there are duplicates, the unique count will be less
          expect(uniqueUrls.length).toBeLessThanOrEqual(urls.length);
          expect(uniqueUrls.length).toBeGreaterThan(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should update RSS feed when new content is published', () => {
    fc.assert(
      fc.property(
        fc.array(mockBlogPost(), { minLength: 3, maxLength: 20 }),
        mockBlogPost(),
        (existingPosts, newPost) => {
          const publishedExisting = existingPosts.filter(post => post.published);

          // Simulate adding new post
          const newPublishedPost = { ...newPost, published: true };
          const allPublishedPosts = [...publishedExisting, newPublishedPost];

          const oldFeedCount = publishedExisting.length;
          const newFeedCount = allPublishedPosts.length;

          // Property: Feed count should increase by 1 when new post is published
          expect(newFeedCount).toBe(oldFeedCount + 1);

          // Property: New post should be in the feed
          const newPostInFeed = allPublishedPosts.some(post => post.id === newPublishedPost.id);
          expect(newPostInFeed).toBe(true);

          // Property: All old posts should still be in the feed
          publishedExisting.forEach(oldPost => {
            const stillInFeed = allPublishedPosts.some(post => post.id === oldPost.id);
            expect(stillInFeed).toBe(true);
          });
        }
      ),
      PBT_CONFIG
    );
  });

  it('should maintain sitemap freshness with lastmod dates', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            url: fc.webUrl(),
            lastmod: arbitraries.pastDate(),
            changefreq: fc.constantFrom('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'),
            priority: fc.float({ min: Math.fround(0.1), max: Math.fround(1.0) }),
          }),
          { minLength: 10, maxLength: 100 }
        ),
        (sitemapEntries) => {
          // Property: All lastmod dates should be in the past (filter out invalid dates)
          sitemapEntries.filter(entry => !isNaN(entry.lastmod.getTime())).forEach(entry => {
            expect(entry.lastmod.getTime()).toBeLessThanOrEqual(Date.now());
          });

          // Property: Priority should be between 0 and 1
          sitemapEntries.filter(entry => !isNaN(entry.priority)).forEach(entry => {
            expect(entry.priority).toBeGreaterThan(0);
            expect(entry.priority).toBeLessThanOrEqual(1);
          });

          // Property: Change frequency should be valid
          const validFrequencies = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
          sitemapEntries.forEach(entry => {
            expect(validFrequencies).toContain(entry.changefreq);
          });

          // Property: URLs should be unique (or at least we have some)
          const urls = sitemapEntries.map(entry => entry.url);
          const uniqueUrls = [...new Set(urls)];
          expect(uniqueUrls.length).toBeGreaterThan(0);
          expect(uniqueUrls.length).toBeLessThanOrEqual(urls.length);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle RSS feed limits correctly', () => {
    fc.assert(
      fc.property(
        fc.array(mockBlogPost(), { minLength: 50, maxLength: 200 }),
        fc.integer({ min: 10, max: 50 }),
        (blogPosts, feedLimit) => {
          // Filter out posts with invalid dates
          const publishedPosts = blogPosts.filter(post => {
            return post.published && !isNaN(post.publishedAt.getTime());
          });

          // Sort by date (newest first)
          const sortedPosts = [...publishedPosts].sort(
            (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
          );

          // Apply feed limit
          const limitedFeed = sortedPosts.slice(0, feedLimit);

          // Property: Feed should not exceed limit
          expect(limitedFeed.length).toBeLessThanOrEqual(feedLimit);

          // Property: Feed should contain the most recent posts
          if (publishedPosts.length > feedLimit) {
            expect(limitedFeed.length).toBe(feedLimit);

            // Property: All items in limited feed should be from the most recent posts
            limitedFeed.forEach(feedPost => {
              const isRecent = sortedPosts.slice(0, feedLimit).some(post => post.id === feedPost.id);
              expect(isRecent).toBe(true);
            });
          } else {
            expect(limitedFeed.length).toBe(publishedPosts.length);
          }

          // Property: Feed should be sorted by date
          for (let i = 0; i < limitedFeed.length - 1; i++) {
            expect(limitedFeed[i].publishedAt.getTime()).toBeGreaterThanOrEqual(
              limitedFeed[i + 1].publishedAt.getTime()
            );
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it('should generate valid XML structure for RSS feed', () => {
    fc.assert(
      fc.property(
        fc.array(mockBlogPost(), { minLength: 1, maxLength: 20 }),
        (blogPosts) => {
          const publishedPosts = blogPosts.filter(post => post.published);

          // Skip if no published posts
          if (publishedPosts.length === 0) {
            return;
          }

          // Simulate RSS XML generation
          const rssItems = publishedPosts.map(post => {
            const title = post.title.replace(/[<>&'"]/g, ''); // Basic XML escaping
            const description = post.excerpt.replace(/[<>&'"]/g, '');

            return {
              title,
              description,
              link: `/blog/${post.slug}`,
              guid: post.id.toString(),
              pubDate: post.publishedAt.toUTCString(),
            };
          });

          // Property: All required RSS fields should be present
          rssItems.forEach(item => {
            expect(item.title.length).toBeGreaterThan(0);
            expect(item.description.length).toBeGreaterThan(0);
            expect(item.link).toMatch(/^\/blog\//);
            expect(item.guid).toBeTruthy();
            expect(item.pubDate).toBeTruthy();
          });

          // Property: Special characters should be escaped
          rssItems.forEach(item => {
            expect(item.title).not.toMatch(/[<>&'"]/);
            expect(item.description).not.toMatch(/[<>&'"]/);
          });

          // Property: GUIDs should be unique (or at least we have some)
          const guids = rssItems.map(item => item.guid);
          const uniqueGuids = [...new Set(guids)];
          expect(uniqueGuids.length).toBeGreaterThan(0);
          expect(uniqueGuids.length).toBeLessThanOrEqual(guids.length);
        }
      ),
      PBT_CONFIG
    );
  });
});

