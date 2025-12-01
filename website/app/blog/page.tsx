'use client';

import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/main-layout';
import { BlogCard } from '@/components/blog-card';
import { BlogFilters } from '@/components/blog-filters';

// Mock blog posts
const mockPosts = [
  {
    id: '1',
    title: '10 Essential Cooking Tips for Beginners',
    slug: '10-essential-cooking-tips-for-beginners',
    excerpt:
      'Starting your cooking journey? These fundamental tips will help you build confidence in the kitchen and create delicious meals from day one.',
    content: '',
    featuredImage: '',
    author: 'Chef Sarah',
    categories: ['Cooking Tips', 'Beginners'],
    tags: ['basics', 'tips', 'beginner-friendly'],
    publishedAt: new Date('2024-01-15'),
    isPublished: true,
    seoMetadata: {
      title: '10 Essential Cooking Tips for Beginners',
      description: 'Learn the fundamental cooking tips every beginner needs',
      keywords: ['cooking', 'tips', 'beginners'],
      ogImage: '',
    },
  },
  {
    id: '2',
    title: 'Meal Prep Like a Pro: A Complete Guide',
    slug: 'meal-prep-like-a-pro-complete-guide',
    excerpt:
      'Save time and eat healthier with our comprehensive meal prep guide. Learn strategies, recipes, and storage tips for successful meal planning.',
    content: '',
    featuredImage: '',
    author: 'Mike Johnson',
    categories: ['Meal Planning', 'Productivity'],
    tags: ['meal-prep', 'planning', 'efficiency'],
    publishedAt: new Date('2024-01-10'),
    isPublished: true,
    seoMetadata: {
      title: 'Meal Prep Like a Pro: A Complete Guide',
      description: 'Master meal prep with our complete guide',
      keywords: ['meal prep', 'planning', 'cooking'],
      ogImage: '',
    },
  },
  {
    id: '3',
    title: 'Understanding Macros: A Simple Guide to Nutrition',
    slug: 'understanding-macros-simple-guide-nutrition',
    excerpt:
      'Confused about macros? This simple guide breaks down proteins, carbs, and fats to help you make informed dietary choices.',
    content: '',
    featuredImage: '',
    author: 'Dr. Emily Chen',
    categories: ['Nutrition', 'Health'],
    tags: ['nutrition', 'macros', 'health'],
    publishedAt: new Date('2024-01-05'),
    isPublished: true,
    seoMetadata: {
      title: 'Understanding Macros: A Simple Guide to Nutrition',
      description: 'Learn about macronutrients and balanced nutrition',
      keywords: ['nutrition', 'macros', 'diet'],
      ogImage: '',
    },
  },
];

export default function BlogPage() {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Filter posts based on search and categories
  const filteredPosts = useMemo(() => {
    return mockPosts.filter((post) => {
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
  }, [search, selectedCategories]);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Cook Smart Blog</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Tips, recipes, and insights to help you cook smarter and eat better
          </p>
        </div>

        {/* Filters */}
        <BlogFilters
          onSearchChange={setSearch}
          onCategoryChange={setSelectedCategories}
        />

        {/* Results Count */}
        <div className="mb-6 text-sm text-muted-foreground">
          Showing {filteredPosts.length} of {mockPosts.length} article
          {mockPosts.length !== 1 ? 's' : ''}
        </div>

        {/* Featured Post */}
        {filteredPosts.length > 0 && (
          <div className="mb-12">
            <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8 md:p-12">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="flex flex-col justify-center">
                  <span className="mb-3 inline-block w-fit rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
                    Featured Post
                  </span>
                  <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                    {filteredPosts[0].title}
                  </h2>
                  <p className="mb-6 text-lg text-muted-foreground">{filteredPosts[0].excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{filteredPosts[0].author}</span>
                    <span>•</span>
                    <span>
                      {new Date(filteredPosts[0].publishedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div className="aspect-video overflow-hidden rounded-xl bg-muted">
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                    <span className="text-8xl">📝</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blog Grid */}
        {filteredPosts.length > 1 ? (
          <div className="mb-8">
            <h2 className="mb-6 text-2xl font-bold">
              {search || selectedCategories.length > 0 ? 'Matching Articles' : 'Latest Articles'}
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.slice(1).map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <div className="mb-4 text-6xl">🔍</div>
            <h3 className="mb-2 text-xl font-semibold">No articles found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : null}

        {/* Load More */}
        <div className="mt-12 text-center">
          <button className="rounded-lg border bg-background px-8 py-3 font-medium transition-colors hover:bg-accent">
            Load More Articles
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
