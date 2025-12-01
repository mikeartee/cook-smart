/**
 * Mock data for testing
 */

export const mockRecipes = [
  {
    id: 1,
    name: 'Classic Spaghetti Carbonara',
    description: 'A traditional Italian pasta dish with eggs, cheese, and bacon',
    cookingTime: 30,
    servings: 4,
    difficulty: 'medium' as const,
    dietaryTags: [],
    approved: true,
    featured: true,
    imageUrl: '/images/carbonara.jpg',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 2,
    name: 'Vegan Buddha Bowl',
    description: 'A nutritious bowl packed with vegetables, grains, and plant-based protein',
    cookingTime: 25,
    servings: 2,
    difficulty: 'easy' as const,
    dietaryTags: ['vegan', 'gluten-free'],
    approved: true,
    featured: false,
    imageUrl: '/images/buddha-bowl.jpg',
    createdAt: new Date('2024-01-20'),
  },
  {
    id: 3,
    name: 'Pending Recipe',
    description: 'This recipe is awaiting approval',
    cookingTime: 45,
    servings: 6,
    difficulty: 'hard' as const,
    dietaryTags: [],
    approved: false,
    featured: false,
    imageUrl: '/images/pending.jpg',
    createdAt: new Date('2024-02-01'),
  },
];

export const mockBlogPosts = [
  {
    id: 1,
    title: '10 Essential Cooking Tips for Beginners',
    slug: 'cooking-tips-for-beginners',
    content: 'Lorem ipsum dolor sit amet...',
    excerpt: 'Learn the fundamental cooking techniques that every beginner should know',
    category: 'cooking-tips' as const,
    tags: ['beginner', 'basics', 'techniques'],
    published: true,
    featuredImage: '/images/cooking-tips.jpg',
    publishedAt: new Date('2024-01-10'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 2,
    title: 'The Ultimate Guide to Meal Planning',
    slug: 'ultimate-guide-meal-planning',
    content: 'Lorem ipsum dolor sit amet...',
    excerpt: 'Save time and money with effective meal planning strategies',
    category: 'meal-planning' as const,
    tags: ['meal-prep', 'organization', 'budget'],
    published: true,
    featuredImage: '/images/meal-planning.jpg',
    publishedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16'),
  },
];

export const mockUsers = [
  {
    id: 1,
    username: 'john_doe',
    email: 'john@example.com',
    status: 'active' as const,
    role: 'user' as const,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    username: 'admin_user',
    email: 'admin@example.com',
    status: 'active' as const,
    role: 'admin' as const,
    createdAt: new Date('2023-12-01'),
  },
];

export const mockTestimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    photo: '/images/testimonials/sarah.jpg',
    quote: 'Cook Smart has completely transformed how I approach meal planning!',
    goal: 'weight-loss',
    diet: 'vegetarian',
    skillLevel: 'beginner',
    metricsAchieved: 'Lost 15 pounds in 3 months',
  },
  {
    id: 2,
    name: 'Mike Chen',
    photo: '/images/testimonials/mike.jpg',
    quote: 'The recipe suggestions are always spot-on and easy to follow.',
    goal: 'muscle-gain',
    diet: 'high-protein',
    skillLevel: 'intermediate',
    metricsAchieved: 'Gained 10 pounds of muscle',
  },
];

