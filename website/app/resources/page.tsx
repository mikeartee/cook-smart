'use client';

import { useState } from 'react';
import { Search, BookOpen, Clock } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: number;
  imageUrl: string;
  slug: string;
}

const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Meal Prep 101: A Beginner\'s Guide',
    excerpt: 'Learn the basics of meal prepping to save time and eat healthier throughout the week.',
    category: 'Meal Planning',
    readTime: 8,
    imageUrl: '/resources/meal-prep.jpg',
    slug: 'meal-prep-101',
  },
  {
    id: '2',
    title: 'Understanding Macronutrients',
    excerpt: 'A comprehensive guide to proteins, carbs, and fats for balanced nutrition.',
    category: 'Nutrition',
    readTime: 10,
    imageUrl: '/resources/macros.jpg',
    slug: 'understanding-macronutrients',
  },
  {
    id: '3',
    title: 'Essential Kitchen Tools for Home Cooks',
    excerpt: 'Must-have tools and equipment to make cooking easier and more enjoyable.',
    category: 'Cooking Tips',
    readTime: 6,
    imageUrl: '/resources/kitchen-tools.jpg',
    slug: 'essential-kitchen-tools',
  },
  {
    id: '4',
    title: 'How to Reduce Food Waste',
    excerpt: 'Practical tips for using ingredients efficiently and minimizing waste.',
    category: 'Sustainability',
    readTime: 7,
    imageUrl: '/resources/food-waste.jpg',
    slug: 'reduce-food-waste',
  },
];

const CATEGORIES = Array.from(new Set(ARTICLES.map((a) => a.category)));

export default function ResourcesPage(): React.ReactElement {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredArticles = ARTICLES.filter((article) => {
    if (categoryFilter !== 'all' && article.category !== categoryFilter) return false;
    if (search && !article.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <h1 className="mb-4 text-4xl font-bold">Resources & Guides</h1>
          <p className="text-lg text-muted-foreground">
            Learn cooking techniques, nutrition tips, and meal planning strategies
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setCategoryFilter('all')}
              size="sm"
            >
              All Categories
            </Button>
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={categoryFilter === category ? 'default' : 'outline'}
                onClick={() => setCategoryFilter(category)}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {filteredArticles.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No articles found</p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <Link key={article.id} href={`/resources/${article.slug}`}>
                <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <div className="flex h-full items-center justify-center text-4xl">📚</div>
                  </div>
                  <div className="p-4">
                    <Badge variant="secondary" className="mb-2">
                      {article.category}
                    </Badge>
                    <h3 className="mb-2 font-semibold group-hover:text-primary">
                      {article.title}
                    </h3>
                    <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{article.readTime} min read</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
