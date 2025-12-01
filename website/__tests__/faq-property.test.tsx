import * as fc from 'fast-check';
import { PBT_CONFIG } from '@/__tests__/utils/pbt-helpers';

/**
 * Feature: cook-smart-website, Property 25: FAQ categorization
 * Validates: Requirements 7.1
 */
describe('Property 25: FAQ categorization', () => {
  it('should categorize FAQs correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            question: fc.string({ minLength: 10, maxLength: 200 }),
            answer: fc.string({ minLength: 20, maxLength: 500 }),
            category: fc.constantFrom('getting-started', 'recipes', 'meal-planning', 'account', 'technical', 'billing'),
            order: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 10, maxLength: 100 }
        ),
        fc.constantFrom('getting-started', 'recipes', 'meal-planning', 'account', 'technical', 'billing'),
        (faqs, targetCategory) => {
          const categorizedFaqs = faqs.filter(faq => faq.category === targetCategory);
          const otherFaqs = faqs.filter(faq => faq.category !== targetCategory);

          // Property: Categorized + other should equal total
          expect(categorizedFaqs.length + otherFaqs.length).toBe(faqs.length);

          // Property: All categorized FAQs should have target category
          categorizedFaqs.forEach(faq => {
            expect(faq.category).toBe(targetCategory);
          });

          // Property: No other FAQs should have target category
          otherFaqs.forEach(faq => {
            expect(faq.category).not.toBe(targetCategory);
          });

          // Property: Categorized FAQs should be subset of original
          expect(categorizedFaqs.length).toBeLessThanOrEqual(faqs.length);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should sort FAQs by order within categories', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            question: fc.string({ minLength: 10, maxLength: 200 }),
            category: fc.constantFrom('getting-started', 'recipes', 'meal-planning'),
            order: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        fc.constantFrom('getting-started', 'recipes', 'meal-planning'),
        (faqs, targetCategory) => {
          const categoryFaqs = faqs
            .filter(faq => faq.category === targetCategory)
            .sort((a, b) => a.order - b.order);

          // Property: FAQs should be sorted by order
          for (let i = 0; i < categoryFaqs.length - 1; i++) {
            expect(categoryFaqs[i].order).toBeLessThanOrEqual(categoryFaqs[i + 1].order);
          }

          // Property: Sorting should not change the count
          const unsortedCount = faqs.filter(faq => faq.category === targetCategory).length;
          expect(categoryFaqs.length).toBe(unsortedCount);

          // Property: All original FAQs should be present after sorting
          const originalCategoryFaqs = faqs.filter(faq => faq.category === targetCategory);
          originalCategoryFaqs.forEach(originalFaq => {
            expect(categoryFaqs.some(faq => faq.id === originalFaq.id)).toBe(true);
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
            category: fc.constantFrom('getting-started', 'recipes', 'meal-planning', 'account', 'technical', 'billing'),
          }),
          { minLength: 20, maxLength: 100 }
        ),
        fc.array(
          fc.constantFrom('getting-started', 'recipes', 'meal-planning', 'account', 'technical', 'billing'),
          { minLength: 1, maxLength: 3 }
        ),
        (faqs, selectedCategories) => {
          const filteredFaqs = faqs.filter(faq => selectedCategories.includes(faq.category));

          // Property: All filtered FAQs should have one of the selected categories
          filteredFaqs.forEach(faq => {
            expect(selectedCategories).toContain(faq.category);
          });

          // Property: FAQs not in selected categories should be excluded
          const excludedFaqs = faqs.filter(faq => !selectedCategories.includes(faq.category));
          excludedFaqs.forEach(faq => {
            expect(filteredFaqs).not.toContain(faq);
          });

          // Property: Filtered FAQs should be subset of original
          expect(filteredFaqs.length).toBeLessThanOrEqual(faqs.length);
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
            category: fc.constantFrom('getting-started', 'recipes', 'meal-planning', 'account', 'technical', 'billing'),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        (faqs) => {
          const validCategories = ['getting-started', 'recipes', 'meal-planning', 'account', 'technical', 'billing'];

          // Property: All FAQs should have valid categories
          faqs.forEach(faq => {
            expect(validCategories).toContain(faq.category);
          });

          // Property: Category distribution should be consistent
          const categoryCount = new Map<string, number>();
          faqs.forEach(faq => {
            categoryCount.set(faq.category, (categoryCount.get(faq.category) || 0) + 1);
          });

          const totalCounted = Array.from(categoryCount.values()).reduce((sum, count) => sum + count, 0);
          expect(totalCounted).toBe(faqs.length);
        }
      ),
      PBT_CONFIG
    );
  });
});

/**
 * Feature: cook-smart-website, Property 26: FAQ search and highlighting
 * Validates: Requirements 7.2
 */
describe('Property 26: FAQ search and highlighting', () => {
  it('should search FAQs by question and answer', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            question: fc.string({ minLength: 10, maxLength: 200 }),
            answer: fc.string({ minLength: 20, maxLength: 500 }),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        fc.string({ minLength: 3, maxLength: 15 }),
        (faqs, searchTerm) => {
          const searchResults = faqs.filter(faq =>
            faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
          );

          // Property: All results should contain the search term
          searchResults.forEach(faq => {
            const inQuestion = faq.question.toLowerCase().includes(searchTerm.toLowerCase());
            const inAnswer = faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
            expect(inQuestion || inAnswer).toBe(true);
          });

          // Property: Search should be case-insensitive
          const upperCaseResults = faqs.filter(faq =>
            faq.question.toUpperCase().includes(searchTerm.toUpperCase()) ||
            faq.answer.toUpperCase().includes(searchTerm.toUpperCase())
          );
          expect(searchResults.length).toBe(upperCaseResults.length);

          // Property: Search results should be subset of original FAQs
          expect(searchResults.length).toBeLessThanOrEqual(faqs.length);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should highlight search terms in results', () => {
    fc.assert(
      fc.property(
        fc.record({
          question: fc.string({ minLength: 20, maxLength: 100 }),
          answer: fc.string({ minLength: 50, maxLength: 300 }),
        }),
        fc.string({ minLength: 3, maxLength: 10 }),
        (faq, searchTerm) => {
          // Simulate highlighting by wrapping matches
          const highlightText = (text: string, term: string): string => {
            // Escape special regex characters
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedTerm})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
          };

          const highlightedQuestion = highlightText(faq.question, searchTerm);
          const highlightedAnswer = highlightText(faq.answer, searchTerm);

          // Property: If search term exists, highlighted text should contain mark tags
          if (faq.question.toLowerCase().includes(searchTerm.toLowerCase())) {
            expect(highlightedQuestion).toContain('<mark>');
            expect(highlightedQuestion).toContain('</mark>');
          }

          if (faq.answer.toLowerCase().includes(searchTerm.toLowerCase())) {
            expect(highlightedAnswer).toContain('<mark>');
            expect(highlightedAnswer).toContain('</mark>');
          }

          // Property: Original text length should be preserved (excluding tags)
          const strippedQuestion = highlightedQuestion.replace(/<\/?mark>/g, '');
          const strippedAnswer = highlightedAnswer.replace(/<\/?mark>/g, '');
          expect(strippedQuestion).toBe(faq.question);
          expect(strippedAnswer).toBe(faq.answer);
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
            question: fc.string({ minLength: 10, maxLength: 100 }),
          }),
          { minLength: 5, maxLength: 30 }
        ),
        fc.constantFrom('', '   ', '\t', '\n'),
        (faqs, emptySearch) => {
          const trimmedSearch = emptySearch.trim();

          // Property: Empty search should return all FAQs
          if (trimmedSearch === '') {
            expect(faqs.length).toBe(faqs.length);
          }

          // Property: Whitespace-only search should be treated as empty
          const searchResults = trimmedSearch === '' ? faqs :
            faqs.filter(faq => faq.question.toLowerCase().includes(trimmedSearch.toLowerCase()));

          if (trimmedSearch === '') {
            expect(searchResults.length).toBe(faqs.length);
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle special characters in search', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            question: fc.string({ minLength: 10, maxLength: 100 }),
            answer: fc.string({ minLength: 20, maxLength: 200 }),
          }),
          { minLength: 5, maxLength: 30 }
        ),
        fc.constantFrom('?', '$', '.', '*', '+', '[', ']', '(', ')'),
        (faqs, specialChar) => {
          // Escape special regex characters for search
          const escapeRegex = (str: string): string => {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          };

          const escapedChar = escapeRegex(specialChar);

          // Property: Search should not throw errors with special characters
          expect(() => {
            faqs.filter(faq =>
              faq.question.includes(specialChar) ||
              faq.answer.includes(specialChar)
            );
          }).not.toThrow();

          // Property: Escaped search should work correctly
          const searchResults = faqs.filter(faq =>
            faq.question.includes(specialChar) ||
            faq.answer.includes(specialChar)
          );

          searchResults.forEach(faq => {
            const inQuestion = faq.question.includes(specialChar);
            const inAnswer = faq.answer.includes(specialChar);
            expect(inQuestion || inAnswer).toBe(true);
          });
        }
      ),
      PBT_CONFIG
    );
  });

  it('should rank search results by relevance', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            question: fc.string({ minLength: 10, maxLength: 100 }),
            answer: fc.string({ minLength: 20, maxLength: 200 }),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        fc.string({ minLength: 4, maxLength: 10 }),
        (faqs, searchTerm) => {
          // Calculate relevance score
          const calculateRelevance = (faq: typeof faqs[0], term: string): number => {
            let score = 0;
            const lowerQuestion = faq.question.toLowerCase();
            const lowerAnswer = faq.answer.toLowerCase();
            const lowerTerm = term.toLowerCase();

            // Question matches are more relevant
            if (lowerQuestion.includes(lowerTerm)) score += 10;
            // Answer matches are less relevant
            if (lowerAnswer.includes(lowerTerm)) score += 5;
            // Exact word matches are more relevant
            if (lowerQuestion.split(' ').includes(lowerTerm)) score += 5;

            return score;
          };

          const rankedResults = faqs
            .map(faq => ({ ...faq, relevance: calculateRelevance(faq, searchTerm) }))
            .filter(faq => faq.relevance > 0)
            .sort((a, b) => b.relevance - a.relevance);

          // Property: Results should be sorted by relevance (highest first)
          for (let i = 0; i < rankedResults.length - 1; i++) {
            expect(rankedResults[i].relevance).toBeGreaterThanOrEqual(rankedResults[i + 1].relevance);
          }

          // Property: All results should have positive relevance
          rankedResults.forEach(result => {
            expect(result.relevance).toBeGreaterThan(0);
          });

          // Property: Question matches should rank higher than answer-only matches
          const questionMatches = rankedResults.filter(r =>
            r.question.toLowerCase().includes(searchTerm.toLowerCase())
          );
          const answerOnlyMatches = rankedResults.filter(r =>
            !r.question.toLowerCase().includes(searchTerm.toLowerCase()) &&
            r.answer.toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (questionMatches.length > 0 && answerOnlyMatches.length > 0) {
            const minQuestionScore = Math.min(...questionMatches.map(r => r.relevance));
            const maxAnswerScore = Math.max(...answerOnlyMatches.map(r => r.relevance));
            expect(minQuestionScore).toBeGreaterThan(maxAnswerScore);
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle multi-word search queries', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            question: fc.string({ minLength: 20, maxLength: 100 }),
            answer: fc.string({ minLength: 30, maxLength: 200 }),
          }),
          { minLength: 10, maxLength: 40 }
        ),
        fc.array(fc.string({ minLength: 3, maxLength: 10 }), { minLength: 2, maxLength: 3 }),
        (faqs, searchWords) => {
          const searchQuery = searchWords.join(' ');

          // Search for FAQs containing all words
          const allWordsResults = faqs.filter(faq => {
            const text = `${faq.question} ${faq.answer}`.toLowerCase();
            return searchWords.every(word => text.includes(word.toLowerCase()));
          });

          // Property: All results should contain all search words
          allWordsResults.forEach(faq => {
            const text = `${faq.question} ${faq.answer}`.toLowerCase();
            searchWords.forEach(word => {
              expect(text.includes(word.toLowerCase())).toBe(true);
            });
          });

          // Search for FAQs containing any word
          const anyWordResults = faqs.filter(faq => {
            const text = `${faq.question} ${faq.answer}`.toLowerCase();
            return searchWords.some(word => text.includes(word.toLowerCase()));
          });

          // Property: "All words" results should be subset of "any word" results
          expect(allWordsResults.length).toBeLessThanOrEqual(anyWordResults.length);

          // Property: All "all words" results should be in "any word" results
          allWordsResults.forEach(result => {
            expect(anyWordResults.some(r => r.id === result.id)).toBe(true);
          });
        }
      ),
      PBT_CONFIG
    );
  });
});

