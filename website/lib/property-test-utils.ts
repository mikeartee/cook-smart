import * as fc from 'fast-check';

// Arbitrary generators for property-based testing

// Generate random user data
export const userArbitrary = () =>
  fc.record({
    id: fc.uuid(),
    email: fc.emailAddress(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    role: fc.constantFrom('user', 'admin', 'super_admin'),
    isActive: fc.boolean(),
    createdAt: fc.date(),
    lastLoginAt: fc.date(),
  });

// Generate random admin user data
export const adminUserArbitrary = () =>
  fc.record({
    id: fc.uuid(),
    email: fc.emailAddress(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    role: fc.constantFrom('admin', 'super_admin'),
    permissions: fc.array(
      fc.constantFrom(
        'user_management',
        'content_moderation',
        'recipe_management',
        'analytics_view',
        'system_settings',
        'admin_management',
        'notification_send',
        'financial_view',
        'support_manage'
      ),
      { minLength: 1, maxLength: 9 }
    ),
    isActive: fc.boolean(),
    createdAt: fc.date(),
    lastLoginAt: fc.date(),
  });

// Generate random ingredient data
export const ingredientArbitrary = () =>
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    amount: fc.string({ minLength: 1, maxLength: 10 }),
    unit: fc.constantFrom('cup', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l'),
  });

// Generate random nutritional info
export const nutritionalInfoArbitrary = () =>
  fc.record({
    calories: fc.integer({ min: 0, max: 2000 }),
    protein: fc.integer({ min: 0, max: 200 }),
    carbs: fc.integer({ min: 0, max: 300 }),
    fat: fc.integer({ min: 0, max: 100 }),
    fiber: fc.integer({ min: 0, max: 50 }),
  });

// Generate random recipe data
export const recipeArbitrary = () =>
  fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 500 }),
    imageUrl: fc.webUrl(),
    ingredients: fc.array(ingredientArbitrary(), { minLength: 1, maxLength: 20 }),
    instructions: fc.array(fc.string({ minLength: 1, maxLength: 200 }), {
      minLength: 1,
      maxLength: 10,
    }),
    cookingTime: fc.integer({ min: 5, max: 480 }),
    servings: fc.integer({ min: 1, max: 20 }),
    nutritionalInfo: nutritionalInfoArbitrary(),
    author: userArbitrary(),
    isFeatured: fc.boolean(),
    isFlagged: fc.boolean(),
    status: fc.constantFrom('draft', 'published', 'archived'),
    createdAt: fc.date(),
    updatedAt: fc.date(),
  });

// Generate random blog post data
export const blogPostArbitrary = () =>
  fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    slug: fc
      .string({ minLength: 1, maxLength: 100 })
      .map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    excerpt: fc.string({ minLength: 1, maxLength: 200 }),
    content: fc.string({ minLength: 1, maxLength: 5000 }),
    featuredImage: fc.webUrl(),
    author: fc.string({ minLength: 1, maxLength: 50 }),
    categories: fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
      minLength: 1,
      maxLength: 5,
    }),
    tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
    publishedAt: fc.date(),
    isPublished: fc.boolean(),
    seoMetadata: fc.record({
      title: fc.string({ minLength: 1, maxLength: 60 }),
      description: fc.string({ minLength: 1, maxLength: 160 }),
      keywords: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
        minLength: 0,
        maxLength: 10,
      }),
      ogImage: fc.webUrl(),
    }),
  });

// Generate random email address
export const emailArbitrary = () => fc.emailAddress();

// Generate random URL
export const urlArbitrary = () => fc.webUrl();

// Generate random non-empty string
export const nonEmptyStringArbitrary = () => fc.string({ minLength: 1, maxLength: 100 });

// Generate random viewport size
export const viewportArbitrary = () =>
  fc.record({
    width: fc.integer({ min: 320, max: 3840 }),
    height: fc.integer({ min: 568, max: 2160 }),
  });

// Property test configuration
export const propertyTestConfig = {
  numRuns: 100, // Run each property test 100 times as specified in design
  verbose: true,
};
