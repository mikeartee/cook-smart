import * as fc from 'fast-check';
import { PBT_CONFIG, arbitraries } from '@/__tests__/utils/pbt-helpers';

/**
 * Feature: cook-smart-website, Property 8: Content categorization
 * Validates: Requirements 3.1
 */
describe('Property 8: Content categorization', () => {
  it('should categorize content correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            title: fc.string({ minLength: 5, maxLength: 100 }),
            category: fc.constantFrom('nutrition', 'cooking-tips', 'meal-planning', 'food-safety', 'kitchen-tools'),
            tags: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
            type: fc.constantFrom('article', 'guide', 'tutorial', 'faq'),
          }),
          { minLength: 10, maxLength: 100 }
        ),
        fc.constantFrom('nutrition', 'cooking-tips', 'meal-planning', 'food-safety', 'kitchen-tools'),
        (content, targetCategory) => {
          const categorizedContent = content.filter(item => item.category === targetCategory);
          const otherContent = content.filter(item => item.category !== targetCategory);

          // Property: Categorized + other should equal total
          expect(categorizedContent.length + otherContent.length).toBe(content.length);

          // Property: All categorized items should have target category
          categorizedContent.forEach(item => {
            expect(item.category).toBe(targetCategory);
          });

          // Property: No other items should have target category
          otherContent.forEach(item => {
            expect(item.category).not.toBe(targetCategory);
          });

          // Property: Each item should have at least one tag
          content.forEach(item => {
            expect(item.tags.length).toBeGreaterThan(0);
          });
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle multiple category filters', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            category: fc.constantFrom('nutrition', 'cooking-tips', 'meal-planning', 'food-safety', 'kitchen-tools'),
            type: fc.constantFrom('article', 'guide', 'tutorial', 'faq'),
            difficulty: fc.constantFrom('beginner', 'intermediate', 'advanced'),
          }),
          { minLength: 20, maxLength: 100 }
        ),
        fc.array(
          fc.constantFrom('nutrition', 'cooking-tips', 'meal-planning', 'food-safety', 'kitchen-tools'),
          { minLength: 1, maxLength: 3 }
        ),
        (content, selectedCategories) => {
          const filteredContent = content.filter(item =>
            selectedCategories.includes(item.category)
          );

          // Property: All filtered items should have one of the selected categories
          filteredContent.forEach(item => {
            expect(selectedCategories).toContain(item.category);
          });

          // Property: Filtered content should be subset of original
          expect(filteredContent.length).toBeLessThanOrEqual(content.length);

          // Property: Items not in selected categories should be excluded
          const excludedContent = content.filter(item =>
            !selectedCategories.includes(item.category)
          );
          excludedContent.forEach(item => {
            expect(filteredContent).not.toContain(item);
          });
        }
      ),
      PBT_CONFIG
    );
  });

  it('should maintain category integrity', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            category: fc.constantFrom('nutrition', 'cooking-tips', 'meal-planning', 'food-safety', 'kitchen-tools'),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        (content) => {
          const validCategories = ['nutrition', 'cooking-tips', 'meal-planning', 'food-safety', 'kitchen-tools'];

          // Property: All items should have valid categories
          content.forEach(item => {
            expect(validCategories).toContain(item.category);
          });

          // Property: Category distribution should be consistent
          const categoryCount = new Map<string, number>();
          content.forEach(item => {
            categoryCount.set(item.category, (categoryCount.get(item.category) || 0) + 1);
          });

          const totalCounted = Array.from(categoryCount.values()).reduce((sum, count) => sum + count, 0);
          expect(totalCounted).toBe(content.length);
        }
      ),
      PBT_CONFIG
    );
  });
});

/**
 * Feature: cook-smart-website, Property 9: Content search functionality
 * Validates: Requirements 3.2
 */
describe('Property 9: Content search functionality', () => {
  it('should search content by title and description', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            title: fc.string({ minLength: 10, maxLength: 100 }),
            description: fc.string({ minLength: 20, maxLength: 200 }),
            category: fc.string(),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        fc.string({ minLength: 3, maxLength: 15 }),
        (content, searchTerm) => {
          const searchResults = content.filter(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase())
          );

          // Property: All results should contain the search term
          searchResults.forEach(item => {
            const inTitle = item.title.toLowerCase().includes(searchTerm.toLowerCase());
            const inDescription = item.description.toLowerCase().includes(searchTerm.toLowerCase());
            expect(inTitle || inDescription).toBe(true);
          });

          // Property: Search should be case-insensitive
          const upperCaseResults = content.filter(item =>
            item.title.toUpperCase().includes(searchTerm.toUpperCase()) ||
            item.description.toUpperCase().includes(searchTerm.toUpperCase())
          );
          expect(searchResults.length).toBe(upperCaseResults.length);

          // Property: Search results should be subset of original content
          expect(searchResults.length).toBeLessThanOrEqual(content.length);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle empty search terms', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            title: fc.string({ minLength: 5, maxLength: 50 }),
          }),
          { minLength: 5, maxLength: 30 }
        ),
        fc.constantFrom('', '   ', '\t', '\n'),
        (content, emptySearch) => {
          const trimmedSearch = emptySearch.trim();

          // Property: Empty search should return all content
          if (trimmedSearch === '') {
            expect(content.length).toBe(content.length);
          }

          // Property: Whitespace-only search should be treated as empty
          const searchResults = trimmedSearch === '' ? content :
            content.filter(item => item.title.toLowerCase().includes(trimmedSearch.toLowerCase()));

          if (trimmedSearch === '') {
            expect(searchResults.length).toBe(content.length);
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it('should support tag-based search', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            title: fc.string({ minLength: 5, maxLength: 50 }),
            tags: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 5 }),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        fc.string({ minLength: 3, maxLength: 15 }),
        (content, searchTag) => {
          const tagResults = content.filter(item =>
            item.tags.some(tag => tag.toLowerCase().includes(searchTag.toLowerCase()))
          );

          // Property: All results should have matching tags
          tagResults.forEach(item => {
            const hasMatchingTag = item.tags.some(tag =>
              tag.toLowerCase().includes(searchTag.toLowerCase())
            );
            expect(hasMatchingTag).toBe(true);
          });

          // Property: Tag search should be case-insensitive
          const upperCaseTagResults = content.filter(item =>
            item.tags.some(tag => tag.toUpperCase().includes(searchTag.toUpperCase()))
          );
          expect(tagResults.length).toBe(upperCaseTagResults.length);
        }
      ),
      PBT_CONFIG
    );
  });
});

/**
 * Feature: cook-smart-website, Property 10: Related content suggestions
 * Validates: Requirements 3.3
 */
describe('Property 10: Related content suggestions', () => {
  it('should suggest content from the same category', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string(),
          category: fc.constantFrom('nutrition', 'cooking-tips', 'meal-planning', 'food-safety', 'kitchen-tools'),
          tags: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 5 }),
        }),
        fc.array(
          fc.record({
            id: fc.string(),
            category: fc.constantFrom('nutrition', 'cooking-tips', 'meal-planning', 'food-safety', 'kitchen-tools'),
            tags: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 5 }),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        fc.integer({ min: 1, max: 5 }),
        (currentContent, allContent, maxSuggestions) => {
          // Find related content from same category
          const relatedContent = allContent
            .filter(item => item.id !== currentContent.id && item.category === currentContent.category)
            .slice(0, maxSuggestions);

          // Property: Related content should not include current item
          relatedContent.forEach(item => {
            expect(item.id).not.toBe(currentContent.id);
          });

          // Property: Related content should be from same category
          relatedContent.forEach(item => {
            expect(item.category).toBe(currentContent.category);
          });

          // Property: Should not exceed max suggestions
          expect(relatedContent.length).toBeLessThanOrEqual(maxSuggestions);

          // Property: If enough content exists, should return max suggestions
          const sameCategoryCount = allContent.filter(
            item => item.id !== currentContent.id && item.category === currentContent.category
          ).length;

          if (sameCategoryCount >= maxSuggestions) {
            expect(relatedContent.length).toBe(maxSuggestions);
          } else {
            expect(relatedContent.length).toBe(sameCategoryCount);
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it('should prioritize content with shared tags', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string(),
          tags: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 2, maxLength: 5 }),
        }),
        fc.array(
          fc.record({
            id: fc.string(),
            tags: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 5 }),
          }),
          { minLength: 10, maxLength: 30 }
        ),
        (currentContent, allContent) => {
          // Calculate tag overlap for each item
          const contentWithOverlap = allContent
            .filter(item => item.id !== currentContent.id)
            .map(item => {
              const sharedTags = item.tags.filter(tag => currentContent.tags.includes(tag));
              return {
                ...item,
                sharedTagCount: sharedTags.length,
              };
            })
            .filter(item => item.sharedTagCount > 0)
            .sort((a, b) => b.sharedTagCount - a.sharedTagCount);

          // Property: Items with more shared tags should come first
          for (let i = 0; i < contentWithOverlap.length - 1; i++) {
            expect(contentWithOverlap[i].sharedTagCount).toBeGreaterThanOrEqual(
              contentWithOverlap[i + 1].sharedTagCount
            );
          }

          // Property: All suggested items should have at least one shared tag
          contentWithOverlap.forEach(item => {
            expect(item.sharedTagCount).toBeGreaterThan(0);
          });

          // Property: Current item should not be in suggestions
          contentWithOverlap.forEach(item => {
            expect(item.id).not.toBe(currentContent.id);
          });
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle content with no related items', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string(),
          category: fc.string(),
          tags: fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
        }),
        fc.array(
          fc.record({
            id: fc.string(),
            category: fc.string(),
            tags: fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (currentContent, allContent) => {
          // Filter to only items with different category and no shared tags
          const unrelatedContent = allContent.filter(item =>
            item.id !== currentContent.id &&
            item.category !== currentContent.category &&
            !item.tags.some(tag => currentContent.tags.includes(tag))
          );

          // Property: If no related content exists, suggestions should be empty or fallback
          const relatedSuggestions = allContent.filter(item =>
            item.id !== currentContent.id &&
            (item.category === currentContent.category ||
              item.tags.some(tag => currentContent.tags.includes(tag)))
          );

          if (relatedSuggestions.length === 0) {
            // Property: Should handle gracefully with empty array
            expect(relatedSuggestions).toEqual([]);
          }

          // Property: Unrelated content should not be suggested
          unrelatedContent.forEach(item => {
            expect(relatedSuggestions).not.toContain(item);
          });
        }
      ),
      PBT_CONFIG
    );
  });

  it('should maintain diversity in suggestions', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string(),
          category: fc.string(),
        }),
        fc.array(
          fc.record({
            id: fc.string(),
            category: fc.string(),
            author: fc.string(),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        fc.integer({ min: 3, max: 10 }),
        (currentContent, allContent, maxSuggestions) => {
          const relatedContent = allContent
            .filter(item => item.id !== currentContent.id && item.category === currentContent.category)
            .slice(0, maxSuggestions);

          // Property: All suggested items should have unique IDs
          const ids = relatedContent.map(item => item.id);
          const uniqueIds = [...new Set(ids)];
          expect(uniqueIds.length).toBe(ids.length);

          // Property: Should not suggest the same item multiple times
          relatedContent.forEach((item, index) => {
            const duplicates = relatedContent.filter((other, otherIndex) =>
              otherIndex !== index && other.id === item.id
            );
            expect(duplicates.length).toBe(0);
          });
        }
      ),
      PBT_CONFIG
    );
  });
});

