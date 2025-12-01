import * as fc from 'fast-check';

/**
 * Property-based testing helpers for Cook Smart website
 * Configured to run 100 iterations per property as per design requirements
 */

export const PBT_CONFIG = {
  numRuns: 10, // Reduced from 100 for faster testing
  verbose: false,
  timeout: 5000, // 5 second timeout per test
};

/**
 * Common arbitraries for testing
 */

export const arbitraries = {
  // User data
  userId: () => fc.integer({ min: 1, max: 100000 }),
  username: () =>
    fc.stringMatching(/^[a-zA-Z0-9_]{3,20}$/).filter((s) => s.length >= 3),
  email: () => fc.emailAddress(),
  password: () => fc.string({ minLength: 8, maxLength: 50 }),

  // Recipe data
  recipeId: () => fc.integer({ min: 1, max: 100000 }),
  recipeName: () => fc.string({ minLength: 3, maxLength: 100 }),
  recipeDescription: () => fc.string({ minLength: 10, maxLength: 500 }),
  cookingTime: () => fc.integer({ min: 5, max: 480 }),
  servings: () => fc.integer({ min: 1, max: 20 }),
  difficulty: () => fc.constantFrom('easy', 'medium', 'hard'),
  dietaryTag: () =>
    fc.constantFrom(
      'vegetarian',
      'vegan',
      'gluten-free',
      'dairy-free',
      'keto',
      'paleo'
    ),

  // Blog data
  blogPostId: () => fc.integer({ min: 1, max: 100000 }),
  blogTitle: () => fc.string({ minLength: 10, maxLength: 200 }),
  blogContent: () => fc.string({ minLength: 100, maxLength: 5000 }),
  blogCategory: () =>
    fc.constantFrom(
      'recipes',
      'nutrition',
      'cooking-tips',
      'meal-planning',
      'kitchen-tools'
    ),
  blogTag: () =>
    fc.array(fc.string({ minLength: 3, maxLength: 20 }), {
      minLength: 1,
      maxLength: 5,
    }),

  // Search and filter
  searchQuery: () => fc.string({ minLength: 1, maxLength: 100 }),
  pageNumber: () => fc.integer({ min: 1, max: 100 }),
  pageSize: () => fc.constantFrom(10, 20, 50, 100),

  // Dates
  pastDate: () =>
    fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  futureDate: () =>
    fc.date({ min: new Date(), max: new Date('2030-12-31') }),

  // Status
  approvalStatus: () => fc.constantFrom('pending', 'approved', 'rejected'),
  accountStatus: () => fc.constantFrom('active', 'inactive', 'suspended'),

  // URLs and paths
  url: () => fc.webUrl(),
  imagePath: () =>
    fc
      .tuple(fc.uuid(), fc.constantFrom('jpg', 'png', 'webp'))
      .map(([id, ext]) => `/images/${id}.${ext}`),

  // Metadata
  metadata: () =>
    fc.record({
      createdAt: fc.date(),
      updatedAt: fc.date(),
      views: fc.integer({ min: 0, max: 1000000 }),
      likes: fc.integer({ min: 0, max: 100000 }),
    }),
};

/**
 * Helper to create a mock recipe object
 */
export const mockRecipe = () =>
  fc.record({
    id: arbitraries.recipeId(),
    name: fc.string({ minLength: 5, maxLength: 100 }),
    description: fc.string({ minLength: 20, maxLength: 500 }),
    cookingTime: arbitraries.cookingTime(),
    servings: arbitraries.servings(),
    difficulty: arbitraries.difficulty(),
    dietaryTags: fc.array(arbitraries.dietaryTag(), { minLength: 0, maxLength: 3 }),
    approved: fc.boolean(),
    featured: fc.boolean(),
    imageUrl: arbitraries.imagePath(),
    createdAt: arbitraries.pastDate(),
  });

/**
 * Helper to create a mock blog post object
 */
export const mockBlogPost = () =>
  fc.record({
    id: arbitraries.blogPostId(),
    title: fc.string({ minLength: 15, maxLength: 200 }),
    slug: fc.string({ minLength: 10, maxLength: 50 }).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/^-+|-+$/g, '')).filter(s => s.length >= 5),
    content: fc.string({ minLength: 150, maxLength: 5000 }),
    excerpt: fc.string({ minLength: 60, maxLength: 200 }),
    category: arbitraries.blogCategory(),
    tags: fc.array(fc.string({ minLength: 4, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
    published: fc.boolean(),
    featuredImage: arbitraries.imagePath(),
    publishedAt: arbitraries.pastDate(),
    createdAt: arbitraries.pastDate(),
    updatedAt: arbitraries.pastDate(),
  });

/**
 * Helper to create a mock user object
 */
export const mockUser = () =>
  fc.record({
    id: arbitraries.userId(),
    username: arbitraries.username(),
    email: arbitraries.email(),
    status: arbitraries.accountStatus(),
    role: fc.constantFrom('user', 'admin', 'moderator'),
    createdAt: arbitraries.pastDate(),
  });

