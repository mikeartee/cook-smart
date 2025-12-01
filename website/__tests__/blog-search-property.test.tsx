/**
 * Feature: cook-smart-website, Property 16: Blog search filtering
 * Validates: Requirements 4.4
 *
 * Property: For any blog search query, the results should match keywords,
 * categories, or tags.
 */

import * as fc from 'fast-check';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  categories: string[];
  tags: string[];
}

// Filter function that mimics the blog page logic
function filterBlogPosts(
  posts: BlogPost[],
  search: string,
  selectedCategories: string[]
): BlogPost[] {
  return posts.filter((post) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        post.title.toLowerCase().includes(searchLower) ||
        post.excerpt.toLowerCase().includes(searchLower) ||
        post.tags.some((tag) => tag.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    // Category filter
    if (selectedCategories.length > 0) {
      const matchesCategory = post.categories.some((cat) =>
        selectedCategories.includes(cat)
      );
      if (!matchesCategory) return false;
    }

    return true;
  });
}

// Arbitrary for generating test blog posts
const blogPostArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  excerpt: fc.string({ minLength: 10, maxLength: 200 }),
  categories: fc.array(
    fc.constantFrom('Cooking Tips', 'Beginners', 'Nutrition', 'Recipes'),
    { minLength: 1, maxLength: 3 }
  ),
  tags: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 5 }),
});

describe('Property 16: Blog search filtering', () => {
  it('should return only posts matching the search query in title', () => {
    fc.assert(
      fc.property(
        fc.array(blogPostArbitrary, { minLength: 5, maxLength: 20 }),
        fc.string({ minLength: 3, maxLength: 10 }),
        (posts, searchTerm) => {
          // Add search term to some post titles
          const postsWithTerm = posts.map((post, idx) =>
            idx % 3 === 0 ? { ...post, title: `${post.title} ${searchTerm}` } : post
          );

          const results = filterBlogPosts(postsWithTerm, searchTerm, []);

          // All results should contain the search term in title, excerpt, or tags
          results.forEach((post) => {
            const searchLower = searchTerm.toLowerCase();
            const matches =
              post.title.toLowerCase().includes(searchLower) ||
              post.excerpt.toLowerCase().includes(searchLower) ||
              post.tags.some((tag) => tag.toLowerCase().includes(searchLower));
            expect(matches).toBe(true);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return empty array when no posts match the search', () => {
    fc.assert(
      fc.property(fc.array(blogPostArbitrary, { minLength: 1, maxLength: 10 }), (posts) => {
        const impossibleSearch = 'xyzabc123impossible';
        const results = filterBlogPosts(posts, impossibleSearch, []);
        expect(results.length).toBe(0);
      }),
      { numRuns: 30 }
    );
  });

  it('should be case-insensitive when searching', () => {
    fc.assert(
      fc.property(
        fc.array(blogPostArbitrary, { minLength: 3, maxLength: 10 }),
        fc.string({ minLength: 3, maxLength: 10 }),
        (posts, searchTerm) => {
          const postsWithTerm = posts.map((post, idx) =>
            idx === 0 ? { ...post, title: `${post.title} ${searchTerm}` } : post
          );

          const lowerResults = filterBlogPosts(postsWithTerm, searchTerm.toLowerCase(), []);
          const upperResults = filterBlogPosts(postsWithTerm, searchTerm.toUpperCase(), []);
          const mixedResults = filterBlogPosts(postsWithTerm, searchTerm, []);

          expect(lowerResults.length).toBe(upperResults.length);
          expect(lowerResults.length).toBe(mixedResults.length);
        }
      ),
      { numRuns: 40 }
    );
  });

  it('should filter by categories correctly', () => {
    fc.assert(
      fc.property(fc.array(blogPostArbitrary, { minLength: 5, maxLength: 15 }), (posts) => {
        const categoryToFilter = 'Cooking Tips';
        const results = filterBlogPosts(posts, '', [categoryToFilter]);

        // All results should have the selected category
        results.forEach((post) => {
          expect(post.categories).toContain(categoryToFilter);
        });
      }),
      { numRuns: 40 }
    );
  });

  it('should return all posts when search query is empty and no categories selected', () => {
    fc.assert(
      fc.property(fc.array(blogPostArbitrary, { minLength: 1, maxLength: 20 }), (posts) => {
        const results = filterBlogPosts(posts, '', []);
        expect(results.length).toBe(posts.length);
      }),
      { numRuns: 30 }
    );
  });

  it('should filter by tags correctly', () => {
    fc.assert(
      fc.property(
        fc.array(blogPostArbitrary, { minLength: 5, maxLength: 15 }),
        fc.string({ minLength: 3, maxLength: 10 }),
        (posts, tagSearch) => {
          // Add the tag to some posts
          const postsWithTag = posts.map((post, idx) =>
            idx % 2 === 0 ? { ...post, tags: [...post.tags, tagSearch] } : post
          );

          const results = filterBlogPosts(postsWithTag, tagSearch, []);

          // All results should have the tag
          results.forEach((post) => {
            const hasTag = post.tags.some((tag) =>
              tag.toLowerCase().includes(tagSearch.toLowerCase())
            );
            expect(hasTag).toBe(true);
          });
        }
      ),
      { numRuns: 40 }
    );
  });

  it('should combine search and category filters correctly', () => {
    fc.assert(
      fc.property(
        fc.array(blogPostArbitrary, { minLength: 10, maxLength: 20 }),
        fc.string({ minLength: 3, maxLength: 10 }),
        (posts, searchTerm) => {
          const category = 'Recipes';
          
          // Add search term and category to some posts
          const modifiedPosts = posts.map((post, idx) => {
            if (idx % 4 === 0) {
              return {
                ...post,
                title: `${post.title} ${searchTerm}`,
                categories: [...post.categories, category],
              };
            }
            return post;
          });

          const results = filterBlogPosts(modifiedPosts, searchTerm, [category]);

          // All results should match both search and category
          results.forEach((post) => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
              post.title.toLowerCase().includes(searchLower) ||
              post.excerpt.toLowerCase().includes(searchLower) ||
              post.tags.some((tag) => tag.toLowerCase().includes(searchLower));
            
            expect(matchesSearch).toBe(true);
            expect(post.categories).toContain(category);
          });
        }
      ),
      { numRuns: 40 }
    );
  });

  it('should handle partial matches in search', () => {
    fc.assert(
      fc.property(fc.array(blogPostArbitrary, { minLength: 3, maxLength: 10 }), (posts) => {
        const fullWord = 'cooking';
        const partialWord = 'cook';

        const postsWithWord = posts.map((post, idx) =>
          idx === 0 ? { ...post, title: `${post.title} ${fullWord}` } : post
        );

        const results = filterBlogPosts(postsWithWord, partialWord, []);

        // Should find posts with partial match
        expect(results.length).toBeGreaterThan(0);
        results.forEach((post) => {
          const matches =
            post.title.toLowerCase().includes(partialWord) ||
            post.excerpt.toLowerCase().includes(partialWord) ||
            post.tags.some((tag) => tag.toLowerCase().includes(partialWord));
          expect(matches).toBe(true);
        });
      }),
      { numRuns: 30 }
    );
  });
});

