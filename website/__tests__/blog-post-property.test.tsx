/**
 * Feature: cook-smart-website, Property 13: Blog post completeness
 * Validates: Requirements 4.1
 *
 * Property: For any list of blog posts, each post should display all required
 * information including title, excerpt, featured image, and publication date.
 */

import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { BlogCard } from '@/components/blog-card';
import { BlogPost } from '@/types';

// Arbitrary for generating test blog posts
const blogPostArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 10, maxLength: 150 }),
  slug: fc
    .string({ minLength: 10, maxLength: 100 })
    .map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, '-')),
  excerpt: fc.string({ minLength: 20, maxLength: 300 }),
  content: fc.string({ minLength: 100, maxLength: 2000 }),
  featuredImage: fc.oneof(fc.constant(''), fc.webUrl()),
  author: fc.string({ minLength: 3, maxLength: 50 }),
  categories: fc.array(fc.string({ minLength: 3, maxLength: 30 }), {
    minLength: 1,
    maxLength: 5,
  }),
  tags: fc.array(fc.string({ minLength: 2, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
  publishedAt: fc.date(),
  isPublished: fc.boolean(),
  seoMetadata: fc.record({
    title: fc.string({ minLength: 10, maxLength: 100 }),
    description: fc.string({ minLength: 20, maxLength: 200 }),
    keywords: fc.array(fc.string({ minLength: 3, maxLength: 20 }), {
      minLength: 1,
      maxLength: 10,
    }),
    ogImage: fc.oneof(fc.constant(''), fc.webUrl()),
  }),
});

describe('Property 13: Blog post completeness', () => {
  it('should display all required blog post information', () => {
    fc.assert(
      fc.property(blogPostArbitrary, (post) => {
        const { container, unmount } = render(<BlogCard post={post} />);

        // Title should be present
        expect(container.textContent).toContain(post.title);

        // Excerpt should be present
        expect(container.textContent).toContain(post.excerpt);

        // Author should be present
        expect(container.textContent).toContain(post.author);

        // Publication date should be formatted and present
        const dateStr = new Date(post.publishedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        expect(container.textContent).toContain(dateStr);

        unmount();
      }),
      { numRuns: 50 }
    );
  });

  it('should display categories for each blog post', () => {
    fc.assert(
      fc.property(blogPostArbitrary, (post) => {
        const { container, unmount } = render(<BlogCard post={post} />);

        // At least one category should be displayed
        if (post.categories.length > 0) {
          const hasCategory = post.categories.some((cat) =>
            container.textContent?.includes(cat)
          );
          expect(hasCategory).toBe(true);
        }

        unmount();
      }),
      { numRuns: 40 }
    );
  });

  it('should have a link to the full blog post', () => {
    fc.assert(
      fc.property(blogPostArbitrary, (post) => {
        const { container, unmount } = render(<BlogCard post={post} />);

        // Should have a link with the post slug
        const links = container.querySelectorAll('a');
        const hasCorrectLink = Array.from(links).some((link) =>
          link.getAttribute('href')?.includes(post.slug)
        );

        expect(hasCorrectLink).toBe(true);

        unmount();
      }),
      { numRuns: 40 }
    );
  });

  it('should display featured image or placeholder', () => {
    fc.assert(
      fc.property(blogPostArbitrary, (post) => {
        const { container, unmount } = render(<BlogCard post={post} />);

        // Should have an image element or placeholder
        const hasImage = container.querySelector('img') !== null;
        const hasPlaceholder = container.textContent?.includes('📝');

        expect(hasImage || hasPlaceholder).toBe(true);

        unmount();
      }),
      { numRuns: 40 }
    );
  });

  it('should format publication date consistently', () => {
    fc.assert(
      fc.property(
        fc.array(blogPostArbitrary, { minLength: 2, maxLength: 5 }),
        (posts) => {
          const formattedDates = posts.map((post) => {
            const { container, unmount } = render(<BlogCard post={post} />);
            const dateStr = new Date(post.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            const hasDate = container.textContent?.includes(dateStr);
            unmount();
            return hasDate;
          });

          // All posts should have formatted dates
          expect(formattedDates.every((hasDate) => hasDate)).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should truncate long excerpts appropriately', () => {
    fc.assert(
      fc.property(
        blogPostArbitrary.map((post) => ({
          ...post,
          excerpt: fc.sample(fc.string({ minLength: 200, maxLength: 500 }), 1)[0],
        })),
        (post) => {
          const { container, unmount } = render(<BlogCard post={post} />);

          // The excerpt should be present but may be truncated
          // Check that at least part of the excerpt is visible
          const excerptStart = post.excerpt.substring(0, 50);
          expect(container.textContent).toContain(excerptStart);

          unmount();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should handle posts with multiple categories', () => {
    fc.assert(
      fc.property(
        blogPostArbitrary.map((post) => ({
          ...post,
          categories: ['Category1', 'Category2', 'Category3'],
        })),
        (post) => {
          const { container, unmount } = render(<BlogCard post={post} />);

          // At least one category should be visible
          const hasCategory = post.categories.some((cat) =>
            container.textContent?.includes(cat)
          );
          expect(hasCategory).toBe(true);

          unmount();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should maintain consistent card structure across all posts', () => {
    fc.assert(
      fc.property(
        fc.array(blogPostArbitrary, { minLength: 3, maxLength: 8 }),
        (posts) => {
          const structures = posts.map((post) => {
            const { container, unmount } = render(<BlogCard post={post} />);

            const structure = {
              hasLink: container.querySelectorAll('a').length > 0,
              hasTitle: container.textContent?.includes(post.title) || false,
              hasExcerpt: container.textContent?.includes(post.excerpt) || false,
              hasAuthor: container.textContent?.includes(post.author) || false,
            };

            unmount();
            return structure;
          });

          // All posts should have the same structure
          structures.forEach((structure) => {
            expect(structure.hasLink).toBe(true);
            expect(structure.hasTitle).toBe(true);
            expect(structure.hasExcerpt).toBe(true);
            expect(structure.hasAuthor).toBe(true);
          });
        }
      ),
      { numRuns: 30 }
    );
  });
});

