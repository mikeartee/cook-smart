import { MetadataRoute } from 'next';
import { blogApi, recipesApi } from '@/lib/api-client';
import { BlogPost, Recipe } from '@/types';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cooksmartapp.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Fetch blog posts
    const blogResponse = await blogApi.getAll({ limit: 1000 });
    const blogPosts = (blogResponse.posts as BlogPost[]).filter((post) => post.isPublished);

    // Fetch recipes
    const recipeResponse = await recipesApi.getAll({ limit: 1000 });
    const recipes = recipeResponse.recipes as Recipe[];

    // Static pages
    const staticPages = [
      {
        url: siteUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: `${siteUrl}/recipes`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
      {
        url: `${siteUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
      {
        url: `${siteUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      },
      {
        url: `${siteUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      },
      {
        url: `${siteUrl}/faq`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      },
    ];

    // Blog post pages
    const blogPages = blogPosts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Recipe pages
    const recipePages = recipes.map((recipe) => ({
      url: `${siteUrl}/recipes/${recipe.id}`,
      lastModified: new Date(recipe.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticPages, ...blogPages, ...recipePages];
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    // Return at least static pages if API fails
    return [
      {
        url: siteUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
    ];
  }
}
