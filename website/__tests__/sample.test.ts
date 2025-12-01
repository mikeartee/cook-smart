import * as fc from 'fast-check';
import { propertyTestConfig } from '@/lib/property-test-utils';

describe('Sample Tests', () => {
  it('should pass a basic unit test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should pass a basic property test', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        // Commutative property of addition
        return a + b === b + a;
      }),
      propertyTestConfig
    );
  });
});
