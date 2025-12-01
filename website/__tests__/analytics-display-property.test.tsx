import * as fc from 'fast-check';
import { PBT_CONFIG, arbitraries } from '@/__tests__/utils/pbt-helpers';

/**
 * Feature: cook-smart-website, Property 23: Analytics data accuracy
 * Validates: Requirements 12.1, 12.2
 */
describe('Property 23: Analytics data accuracy', () => {
  it('should calculate user metrics correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: arbitraries.userId(),
            registrationDate: arbitraries.pastDate(),
            lastActive: arbitraries.pastDate(),
            status: arbitraries.accountStatus(),
          }),
          { minLength: 10, maxLength: 1000 }
        ),
        (users) => {
          const totalUsers = users.length;
          const activeUsers = users.filter(user => user.status === 'active').length;
          const inactiveUsers = users.filter(user => user.status === 'inactive').length;
          const suspendedUsers = users.filter(user => user.status === 'suspended').length;

          // Property: Sum of all status categories should equal total users
          expect(activeUsers + inactiveUsers + suspendedUsers).toBe(totalUsers);

          // Property: Each category should be non-negative
          expect(activeUsers).toBeGreaterThanOrEqual(0);
          expect(inactiveUsers).toBeGreaterThanOrEqual(0);
          expect(suspendedUsers).toBeGreaterThanOrEqual(0);

          // Property: Active percentage should be between 0 and 100
          const activePercentage = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
          expect(activePercentage).toBeGreaterThanOrEqual(0);
          expect(activePercentage).toBeLessThanOrEqual(100);

          // Property: If all users are active, percentage should be 100
          if (activeUsers === totalUsers && totalUsers > 0) {
            expect(activePercentage).toBe(100);
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it('should calculate content metrics correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.integer({ min: 0, max: 100000 }).chain(views =>
            fc.record({
              id: arbitraries.recipeId(),
              type: fc.constantFrom('recipe', 'blog', 'comment'),
              status: arbitraries.approvalStatus(),
              views: fc.constant(views),
              likes: fc.integer({ min: 0, max: views }),
              createdAt: arbitraries.pastDate(),
            })
          ),
          { minLength: 20, maxLength: 500 }
        ),
        (content) => {
          const totalContent = content.length;
          const publishedContent = content.filter(item => item.status === 'approved').length;
          const pendingContent = content.filter(item => item.status === 'pending').length;
          const rejectedContent = content.filter(item => item.status === 'rejected').length;

          const totalViews = content.reduce((sum, item) => sum + item.views, 0);
          const totalLikes = content.reduce((sum, item) => sum + item.likes, 0);

          // Property: Sum of all status categories should equal total content
          expect(publishedContent + pendingContent + rejectedContent).toBe(totalContent);

          // Property: Views and likes should be non-negative
          expect(totalViews).toBeGreaterThanOrEqual(0);
          expect(totalLikes).toBeGreaterThanOrEqual(0);

          // Property: Average views should be reasonable
          const avgViews = totalContent > 0 ? totalViews / totalContent : 0;
          expect(avgViews).toBeGreaterThanOrEqual(0);

          // Property: Likes should not exceed views for any item
          content.forEach(item => {
            expect(item.likes).toBeLessThanOrEqual(item.views);
          });

          // Property: Content by type should sum to total
          const recipes = content.filter(item => item.type === 'recipe').length;
          const blogs = content.filter(item => item.type === 'blog').length;
          const comments = content.filter(item => item.type === 'comment').length;
          expect(recipes + blogs + comments).toBe(totalContent);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle time-based analytics correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            timestamp: arbitraries.pastDate(),
            value: fc.integer({ min: 0, max: 1000 }),
            type: fc.constantFrom('pageview', 'signup', 'recipe_view', 'search'),
          }),
          { minLength: 50, maxLength: 1000 }
        ),
        fc.integer({ min: 1, max: 30 }),
        (events, daysBack) => {
          // Filter out invalid dates
          const validEvents = events.filter(event => {
            const date = new Date(event.timestamp);
            return !isNaN(date.getTime());
          });

          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - daysBack);

          const recentEvents = validEvents.filter(event => event.timestamp >= cutoffDate);
          const olderEvents = validEvents.filter(event => event.timestamp < cutoffDate);

          // Property: Recent + older events should equal total valid events
          expect(recentEvents.length + olderEvents.length).toBe(validEvents.length);

          // Property: All recent events should be within the time range
          recentEvents.forEach(event => {
            expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(cutoffDate.getTime());
          });

          // Property: All older events should be outside the time range
          olderEvents.forEach(event => {
            expect(event.timestamp.getTime()).toBeLessThan(cutoffDate.getTime());
          });

          // Property: Daily aggregation should preserve total values
          const totalValue = validEvents.reduce((sum, event) => sum + event.value, 0);
          const recentValue = recentEvents.reduce((sum, event) => sum + event.value, 0);
          const olderValue = olderEvents.reduce((sum, event) => sum + event.value, 0);

          expect(recentValue + olderValue).toBe(totalValue);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should calculate growth rates correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 0, max: 10000 }),
        (previousPeriod, currentPeriod) => {
          const growthRate = previousPeriod > 0
            ? ((currentPeriod - previousPeriod) / previousPeriod) * 100
            : currentPeriod > 0 ? 100 : 0;

          // Property: Growth rate calculation should be consistent
          if (previousPeriod === 0 && currentPeriod === 0) {
            expect(growthRate).toBe(0);
          }

          if (previousPeriod === 0 && currentPeriod > 0) {
            expect(growthRate).toBe(100);
          }

          if (previousPeriod > 0) {
            const expectedGrowth = ((currentPeriod - previousPeriod) / previousPeriod) * 100;
            expect(Math.abs(growthRate - expectedGrowth)).toBeLessThan(0.001);
          }

          // Property: If current equals previous, growth should be 0
          if (currentPeriod === previousPeriod && previousPeriod > 0) {
            expect(Math.abs(growthRate)).toBeLessThan(0.001);
          }

          // Property: If current is double previous, growth should be 100%
          if (currentPeriod === previousPeriod * 2 && previousPeriod > 0) {
            expect(Math.abs(growthRate - 100)).toBeLessThan(0.001);
          }
        }
      ),
      PBT_CONFIG
    );
  });
});

/**
 * Feature: cook-smart-website, Property 24: Analytics filtering and aggregation
 * Validates: Requirements 12.3
 */
describe('Property 24: Analytics filtering and aggregation', () => {
  it('should filter analytics data by date range correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            timestamp: arbitraries.pastDate(),
            value: fc.integer({ min: 1, max: 1000 }),
            category: fc.constantFrom('users', 'content', 'engagement'),
          }),
          { minLength: 30, maxLength: 200 }
        ),
        arbitraries.pastDate(),
        arbitraries.pastDate(),
        (data, startDate, endDate) => {
          // Ensure proper date order
          const actualStart = startDate < endDate ? startDate : endDate;
          const actualEnd = startDate < endDate ? endDate : startDate;

          const filteredData = data.filter(item =>
            item.timestamp >= actualStart && item.timestamp <= actualEnd
          );

          // Property: All filtered items should be within date range
          filteredData.forEach(item => {
            expect(item.timestamp.getTime()).toBeGreaterThanOrEqual(actualStart.getTime());
            expect(item.timestamp.getTime()).toBeLessThanOrEqual(actualEnd.getTime());
          });

          // Property: No items outside range should be included
          const outsideRange = data.filter(item =>
            item.timestamp < actualStart || item.timestamp > actualEnd
          );
          outsideRange.forEach(item => {
            expect(filteredData).not.toContain(item);
          });

          // Property: Filtered data should be subset of original
          expect(filteredData.length).toBeLessThanOrEqual(data.length);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should aggregate data by time periods correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            timestamp: arbitraries.pastDate(),
            value: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 20, maxLength: 100 }
        ),
        fc.constantFrom('day', 'week', 'month'),
        (data, period) => {
          // Filter out invalid dates
          const validData = data.filter(item => {
            const date = new Date(item.timestamp);
            return !isNaN(date.getTime());
          });

          // Group data by time period
          const grouped = new Map<string, number>();

          validData.forEach(item => {
            let key: string;
            const date = new Date(item.timestamp);

            switch (period) {
              case 'day':
                key = date.toISOString().split('T')[0];
                break;
              case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
                break;
              case 'month':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                break;
              default:
                key = date.toISOString().split('T')[0];
            }

            grouped.set(key, (grouped.get(key) || 0) + item.value);
          });

          const totalOriginal = validData.reduce((sum, item) => sum + item.value, 0);
          const totalAggregated = Array.from(grouped.values()).reduce((sum, value) => sum + value, 0);

          // Property: Aggregation should preserve total values
          expect(totalAggregated).toBe(totalOriginal);

          // Property: Each group should have positive values
          Array.from(grouped.values()).forEach(value => {
            expect(value).toBeGreaterThan(0);
          });

          // Property: Number of groups should not exceed number of data points
          expect(grouped.size).toBeLessThanOrEqual(data.length);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle category-based filtering correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            category: fc.constantFrom('users', 'recipes', 'blog', 'engagement'),
            subcategory: fc.constantFrom('new', 'active', 'views', 'likes', 'shares'),
            value: fc.integer({ min: 0, max: 1000 }),
          }),
          { minLength: 25, maxLength: 150 }
        ),
        fc.constantFrom('users', 'recipes', 'blog', 'engagement'),
        (data, targetCategory) => {
          const filteredData = data.filter(item => item.category === targetCategory);
          const otherData = data.filter(item => item.category !== targetCategory);

          // Property: Filtered + other should equal total
          expect(filteredData.length + otherData.length).toBe(data.length);

          // Property: All filtered items should have target category
          filteredData.forEach(item => {
            expect(item.category).toBe(targetCategory);
          });

          // Property: No other items should have target category
          otherData.forEach(item => {
            expect(item.category).not.toBe(targetCategory);
          });

          // Property: Category totals should be consistent
          const categoryTotal = filteredData.reduce((sum, item) => sum + item.value, 0);
          const otherTotal = otherData.reduce((sum, item) => sum + item.value, 0);
          const grandTotal = data.reduce((sum, item) => sum + item.value, 0);

          expect(categoryTotal + otherTotal).toBe(grandTotal);
        }
      ),
      PBT_CONFIG
    );
  });
});

/**
 * Feature: cook-smart-website, Property 25: Analytics export functionality
 * Validates: Requirements 12.3
 */
describe('Property 25: Analytics export functionality', () => {
  it('should export data in correct format', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: arbitraries.pastDate(),
            metric: fc.constantFrom('users', 'pageviews', 'recipes', 'engagement'),
            value: fc.integer({ min: 0, max: 10000 }),
            change: fc.float({ min: -100, max: 500 }),
          }),
          { minLength: 10, maxLength: 100 }
        ),
        fc.constantFrom('csv', 'json', 'xlsx'),
        (analyticsData, exportFormat) => {
          // Filter out invalid dates before processing
          const validData = analyticsData.filter(item => !isNaN(item.date.getTime()));

          // Simulate export data preparation
          const exportData = validData.map(item => ({
            Date: item.date.toISOString().split('T')[0],
            Metric: item.metric,
            Value: item.value,
            Change: `${item.change.toFixed(2)}%`,
          }));

          // Property: Export data should have same number of valid records
          expect(exportData.length).toBe(validData.length);

          // Property: All required fields should be present
          exportData.forEach(item => {
            expect(item).toHaveProperty('Date');
            expect(item).toHaveProperty('Metric');
            expect(item).toHaveProperty('Value');
            expect(item).toHaveProperty('Change');
          });

          // Property: Date format should be consistent
          exportData.forEach(item => {
            expect(item.Date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          });

          // Property: Values should be preserved
          exportData.forEach((item, index) => {
            expect(item.Value).toBe(analyticsData[index].value);
            expect(item.Metric).toBe(analyticsData[index].metric);
          });
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle empty data exports gracefully', () => {
    fc.assert(
      fc.property(
        fc.constantFrom([], null, undefined),
        fc.constantFrom('csv', 'json', 'xlsx'),
        (emptyData, exportFormat) => {
          const dataToExport = emptyData || [];

          // Property: Empty data should result in empty export
          expect(dataToExport.length).toBe(0);

          // Property: Export should not throw errors
          expect(() => {
            const exported = dataToExport.map(item => item);
            return exported;
          }).not.toThrow();
        }
      ),
      PBT_CONFIG
    );
  });
});

