import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from './auth-context';

// Mock auth provider for testing
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

// Custom render function that includes providers
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  return render(ui, { wrapper: MockAuthProvider, ...options });
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };

// Helper to create mock user data
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin' as const,
  permissions: ['user_management', 'content_moderation'],
  isActive: true,
  createdAt: new Date(),
  lastLoginAt: new Date(),
  ...overrides,
});

// Helper to create mock recipe data
export const createMockRecipe = (overrides = {}) => ({
  id: '1',
  title: 'Test Recipe',
  description: 'A delicious test recipe',
  imageUrl: 'https://example.com/image.jpg',
  ingredients: [
    { name: 'Ingredient 1', amount: '1', unit: 'cup' },
    { name: 'Ingredient 2', amount: '2', unit: 'tbsp' },
  ],
  instructions: ['Step 1', 'Step 2', 'Step 3'],
  cookingTime: 30,
  servings: 4,
  nutritionalInfo: {
    calories: 250,
    protein: 15,
    carbs: 30,
    fat: 10,
    fiber: 5,
  },
  author: createMockUser(),
  isFeatured: false,
  isFlagged: false,
  status: 'published' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock blog post data
export const createMockBlogPost = (overrides = {}) => ({
  id: '1',
  title: 'Test Blog Post',
  slug: 'test-blog-post',
  excerpt: 'This is a test blog post excerpt',
  content: 'This is the full content of the test blog post',
  featuredImage: 'https://example.com/blog-image.jpg',
  author: 'Test Author',
  categories: ['Cooking Tips', 'Recipes'],
  tags: ['healthy', 'quick', 'easy'],
  publishedAt: new Date(),
  isPublished: true,
  seoMetadata: {
    title: 'Test Blog Post - Cook Smart',
    description: 'This is a test blog post excerpt',
    keywords: ['cooking', 'recipes', 'tips'],
    ogImage: 'https://example.com/blog-image.jpg',
  },
  ...overrides,
});
