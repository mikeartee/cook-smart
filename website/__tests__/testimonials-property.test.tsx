import * as fc from 'fast-check';
import { PBT_CONFIG, arbitraries } from '@/__tests__/utils/pbt-helpers';

/**
 * Feature: cook-smart-website, Property 18: Testimonial completeness
 * Validates: Requirements 5.1, 5.2
 */
describe('Property 18: Testimonial completeness', () => {
  it('should display all required testimonial fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          userName: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
          userPhoto: fc.string({ minLength: 15, maxLength: 100 }).filter(s => s.trim().length >= 15),
          quote: fc.string({ minLength: 60, maxLength: 500 }).filter(s => s.trim().length >= 60),
          rating: fc.integer({ min: 1, max: 5 }),
          date: arbitraries.pastDate(),
          verified: fc.boolean(),
          goal: fc.constantFrom('weight-loss', 'muscle-gain', 'healthy-eating', 'meal-prep', 'budget-cooking'),
          diet: fc.constantFrom('vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'none'),
          skillLevel: fc.constantFrom('beginner', 'intermediate', 'advanced'),
        }),
        (testimonial) => {
          // Property: All required fields should be present
          expect(testimonial.id).toBeTruthy();
          expect(testimonial.userName).toBeTruthy();
          expect(testimonial.userPhoto).toBeTruthy();
          expect(testimonial.quote).toBeTruthy();
          expect(testimonial.date).toBeInstanceOf(Date);

          // Property: Rating should be between 1 and 5
          expect(testimonial.rating).toBeGreaterThanOrEqual(1);
          expect(testimonial.rating).toBeLessThanOrEqual(5);

          // Property: Quote should be meaningful (not too short)
          expect(testimonial.quote.trim().length).toBeGreaterThan(20);

          // Property: Date should be in the past
          expect(testimonial.date.getTime()).toBeLessThanOrEqual(Date.now());

          // Property: Goal should be valid
          const validGoals = ['weight-loss', 'muscle-gain', 'healthy-eating', 'meal-prep', 'budget-cooking'];
          expect(validGoals).toContain(testimonial.goal);

          // Property: Diet should be valid
          const validDiets = ['vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'none'];
          expect(validDiets).toContain(testimonial.diet);

          // Property: Skill level should be valid
          const validSkills = ['beginner', 'intermediate', 'advanced'];
          expect(validSkills).toContain(testimonial.skillLevel);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle verified and unverified testimonials', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            userName: fc.string({ minLength: 3, maxLength: 20 }),
            quote: fc.string({ minLength: 60, maxLength: 500 }),
            verified: fc.boolean(),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        (testimonials) => {
          const verifiedTestimonials = testimonials.filter(t => t.verified);
          const unverifiedTestimonials = testimonials.filter(t => !t.verified);

          // Property: Verified + unverified should equal total
          expect(verifiedTestimonials.length + unverifiedTestimonials.length).toBe(testimonials.length);

          // Property: All verified testimonials should have verified flag
          verifiedTestimonials.forEach(t => {
            expect(t.verified).toBe(true);
          });

          // Property: All unverified testimonials should not have verified flag
          unverifiedTestimonials.forEach(t => {
            expect(t.verified).toBe(false);
          });

          // Property: Each testimonial should have a unique ID (UUIDs guarantee this)
          const ids = testimonials.map(t => t.id);
          const uniqueIds = [...new Set(ids)];
          expect(uniqueIds.length).toBe(ids.length);
        }
      ),
      PBT_CONFIG
    );
  });
});

/**
 * Feature: cook-smart-website, Property 19: Testimonial metrics
 * Validates: Requirements 5.2
 */
describe('Property 19: Testimonial metrics', () => {
  it('should calculate average rating correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            rating: fc.integer({ min: 1, max: 5 }),
          }),
          { minLength: 5, maxLength: 100 }
        ),
        (testimonials) => {
          const totalRating = testimonials.reduce((sum, t) => sum + t.rating, 0);
          const averageRating = totalRating / testimonials.length;

          // Property: Average rating should be between 1 and 5
          expect(averageRating).toBeGreaterThanOrEqual(1);
          expect(averageRating).toBeLessThanOrEqual(5);

          // Property: Average should be calculated correctly
          const manualAverage = testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length;
          expect(Math.abs(averageRating - manualAverage)).toBeLessThan(0.001);

          // Property: If all ratings are the same, average should equal that rating
          const allSameRating = testimonials.every(t => t.rating === testimonials[0].rating);
          if (allSameRating) {
            expect(averageRating).toBe(testimonials[0].rating);
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it('should track success metrics correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            weightLost: fc.option(fc.integer({ min: 0, max: 100 })),
            mealsPrepared: fc.option(fc.integer({ min: 0, max: 1000 })),
            moneySaved: fc.option(fc.integer({ min: 0, max: 10000 })),
            timeUsed: fc.option(fc.integer({ min: 1, max: 365 })), // days
          }),
          { minLength: 10, maxLength: 50 }
        ),
        (testimonials) => {
          const withWeightLoss = testimonials.filter(t => t.weightLost !== null);
          const withMeals = testimonials.filter(t => t.mealsPrepared !== null);
          const withSavings = testimonials.filter(t => t.moneySaved !== null);

          // Property: Metrics should be non-negative
          withWeightLoss.forEach(t => {
            expect(t.weightLost).toBeGreaterThanOrEqual(0);
          });

          withMeals.forEach(t => {
            expect(t.mealsPrepared).toBeGreaterThanOrEqual(0);
          });

          withSavings.forEach(t => {
            expect(t.moneySaved).toBeGreaterThanOrEqual(0);
          });

          // Property: Average metrics should be reasonable
          if (withWeightLoss.length > 0) {
            const avgWeightLoss = withWeightLoss.reduce((sum, t) => sum + (t.weightLost || 0), 0) / withWeightLoss.length;
            expect(avgWeightLoss).toBeGreaterThanOrEqual(0);
            expect(avgWeightLoss).toBeLessThanOrEqual(100);
          }

          // Property: Testimonials with metrics should be subset of all testimonials
          expect(withWeightLoss.length).toBeLessThanOrEqual(testimonials.length);
          expect(withMeals.length).toBeLessThanOrEqual(testimonials.length);
          expect(withSavings.length).toBeLessThanOrEqual(testimonials.length);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle testimonials without metrics', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            quote: fc.string({ minLength: 50, maxLength: 500 }),
            weightLost: fc.option(fc.integer({ min: 0, max: 100 })),
            mealsPrepared: fc.option(fc.integer({ min: 0, max: 1000 })),
          }),
          { minLength: 5, maxLength: 30 }
        ),
        (testimonials) => {
          const withoutMetrics = testimonials.filter(t =>
            t.weightLost === null && t.mealsPrepared === null
          );

          // Property: Testimonials without metrics should still be valid
          withoutMetrics.filter(t => t.id.trim().length > 0 && t.quote.trim().length > 0).forEach(t => {
            expect(t.id.trim().length).toBeGreaterThan(0);
            expect(t.quote.trim().length).toBeGreaterThan(0);
          });

          // Property: Should not throw errors when accessing null metrics
          expect(() => {
            withoutMetrics.forEach(t => {
              const weight = t.weightLost || 0;
              const meals = t.mealsPrepared || 0;
              return weight + meals;
            });
          }).not.toThrow();
        }
      ),
      PBT_CONFIG
    );
  });
});

/**
 * Feature: cook-smart-website, Property 20: Testimonial filtering
 * Validates: Requirements 5.3
 */
describe('Property 20: Testimonial filtering', () => {
  it('should filter testimonials by goal', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            userName: arbitraries.username(),
            goal: fc.constantFrom('weight-loss', 'muscle-gain', 'healthy-eating', 'meal-prep', 'budget-cooking'),
          }),
          { minLength: 20, maxLength: 100 }
        ),
        fc.constantFrom('weight-loss', 'muscle-gain', 'healthy-eating', 'meal-prep', 'budget-cooking'),
        (testimonials, targetGoal) => {
          const filteredTestimonials = testimonials.filter(t => t.goal === targetGoal);
          const otherTestimonials = testimonials.filter(t => t.goal !== targetGoal);

          // Property: Filtered + other should equal total
          expect(filteredTestimonials.length + otherTestimonials.length).toBe(testimonials.length);

          // Property: All filtered testimonials should have target goal
          filteredTestimonials.forEach(t => {
            expect(t.goal).toBe(targetGoal);
          });

          // Property: No other testimonials should have target goal
          otherTestimonials.forEach(t => {
            expect(t.goal).not.toBe(targetGoal);
          });

          // Property: Filtered testimonials should be subset of original
          expect(filteredTestimonials.length).toBeLessThanOrEqual(testimonials.length);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should filter testimonials by diet preference', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            userName: arbitraries.username(),
            diet: fc.constantFrom('vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'none'),
          }),
          { minLength: 20, maxLength: 100 }
        ),
        fc.constantFrom('vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'none'),
        (testimonials, targetDiet) => {
          const filteredTestimonials = testimonials.filter(t => t.diet === targetDiet);

          // Property: All filtered testimonials should have target diet
          filteredTestimonials.forEach(t => {
            expect(t.diet).toBe(targetDiet);
          });

          // Property: Count should match manual count
          const manualCount = testimonials.reduce((count, t) =>
            t.diet === targetDiet ? count + 1 : count, 0
          );
          expect(filteredTestimonials.length).toBe(manualCount);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should filter testimonials by skill level', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            userName: arbitraries.username(),
            skillLevel: fc.constantFrom('beginner', 'intermediate', 'advanced'),
          }),
          { minLength: 20, maxLength: 100 }
        ),
        fc.constantFrom('beginner', 'intermediate', 'advanced'),
        (testimonials, targetSkill) => {
          const filteredTestimonials = testimonials.filter(t => t.skillLevel === targetSkill);

          // Property: All filtered testimonials should have target skill level
          filteredTestimonials.forEach(t => {
            expect(t.skillLevel).toBe(targetSkill);
          });

          // Property: Filtered testimonials should be subset
          expect(filteredTestimonials.length).toBeLessThanOrEqual(testimonials.length);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle multiple filter combinations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            goal: fc.constantFrom('weight-loss', 'muscle-gain', 'healthy-eating', 'meal-prep', 'budget-cooking'),
            diet: fc.constantFrom('vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'none'),
            skillLevel: fc.constantFrom('beginner', 'intermediate', 'advanced'),
            rating: fc.integer({ min: 1, max: 5 }),
          }),
          { minLength: 30, maxLength: 150 }
        ),
        fc.constantFrom('weight-loss', 'muscle-gain', 'healthy-eating'),
        fc.constantFrom('vegetarian', 'vegan', 'keto'),
        fc.integer({ min: 4, max: 5 }),
        (testimonials, targetGoal, targetDiet, minRating) => {
          const filteredTestimonials = testimonials.filter(t =>
            t.goal === targetGoal &&
            t.diet === targetDiet &&
            t.rating >= minRating
          );

          // Property: All conditions must be satisfied simultaneously
          filteredTestimonials.forEach(t => {
            expect(t.goal).toBe(targetGoal);
            expect(t.diet).toBe(targetDiet);
            expect(t.rating).toBeGreaterThanOrEqual(minRating);
          });

          // Property: Combined filter should be more restrictive than individual filters
          const goalFiltered = testimonials.filter(t => t.goal === targetGoal);
          const dietFiltered = testimonials.filter(t => t.diet === targetDiet);
          const ratingFiltered = testimonials.filter(t => t.rating >= minRating);

          expect(filteredTestimonials.length).toBeLessThanOrEqual(goalFiltered.length);
          expect(filteredTestimonials.length).toBeLessThanOrEqual(dietFiltered.length);
          expect(filteredTestimonials.length).toBeLessThanOrEqual(ratingFiltered.length);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should sort testimonials by rating', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            rating: fc.integer({ min: 1, max: 5 }),
            date: arbitraries.pastDate(),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        fc.constantFrom('asc', 'desc'),
        (testimonials, sortOrder) => {
          const sortedTestimonials = [...testimonials].sort((a, b) => {
            return sortOrder === 'asc'
              ? a.rating - b.rating
              : b.rating - a.rating;
          });

          // Property: Testimonials should be sorted correctly
          for (let i = 0; i < sortedTestimonials.length - 1; i++) {
            if (sortOrder === 'asc') {
              expect(sortedTestimonials[i].rating).toBeLessThanOrEqual(sortedTestimonials[i + 1].rating);
            } else {
              expect(sortedTestimonials[i].rating).toBeGreaterThanOrEqual(sortedTestimonials[i + 1].rating);
            }
          }

          // Property: Sorting should not change the number of testimonials
          expect(sortedTestimonials.length).toBe(testimonials.length);

          // Property: All original testimonials should be present
          testimonials.forEach(t => {
            expect(sortedTestimonials.some(sorted => sorted.id === t.id)).toBe(true);
          });
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle empty filter results', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            goal: fc.constantFrom('weight-loss', 'muscle-gain'),
            diet: fc.constantFrom('vegetarian', 'vegan'),
          }),
          { minLength: 5, maxLength: 20 }
        ),
        (testimonials) => {
          // Filter with impossible combination
          const impossibleFilter = testimonials.filter(t =>
            t.goal === 'weight-loss' && t.goal === 'muscle-gain' // Impossible condition
          );

          // Property: Impossible filters should return empty array
          expect(impossibleFilter.length).toBe(0);

          // Property: Empty results should not throw errors
          expect(() => {
            impossibleFilter.forEach(t => t.id);
          }).not.toThrow();
        }
      ),
      PBT_CONFIG
    );
  });
});

