import { blogApi, handleApiError } from '../api-client';
import type { BlogPost } from '../../types';

/**
 * Fetch blog posts with optional filters and pagination
 */
export async function getBlogPosts(
  page: number = 1,
  limit: number = 10,
  filters?: { search?: string; category?: string; tag?: string }
): Promise<{ posts: BlogPost[]; total: number; hasMore: boolean }> {
  try {
    const response = await blogApi.getAll({
      page,
      limit,
      search: filters?.search,
      category: filters?.category,
    });
    
    return {
      posts: response.posts as BlogPost[],
      total: response.total,
      hasMore: page * limit < response.total,
    };
  } catch (error) {
    console.error('Error fetching blog posts:', handleApiError(error));
    return { posts: [], total: 0, hasMore: false };
  }
}

/**
 * Fetch a single blog post by slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const response = await blogApi.getById(slug);
    return response as BlogPost;
  } catch (error) {
    console.error('Error fetching blog post:', handleApiError(error));
    return null;
  }
}

/**
 * Fetch featured blog posts for homepage
 */
export async function getFeaturedBlogPosts(limit: number = 3): Promise<BlogPost[]> {
  try {
    const response = await blogApi.getAll({ limit });
    return (response.posts as BlogPost[]).slice(0, limit);
  } catch (error) {
    console.error('Error fetching featured blog posts:', handleApiError(error));
    return [];
  }
}

/**
 * Fetch blog categories
 */
export async function getBlogCategories(): Promise<string[]> {
  try {
    const response = await blogApi.getCategories();
    return response;
  } catch (error) {
    console.error('Error fetching blog categories:', handleApiError(error));
    return [];
  }
}

/**
 * Fetch related blog posts
 */
export async function getRelatedBlogPosts(slug: string, limit: number = 3): Promise<BlogPost[]> {
  try {
    // Mock implementation - replace with actual API call when available
    return [];
  } catch (error) {
    console.error('Error fetching related blog posts:', handleApiError(error));
    return [];
  }
}

