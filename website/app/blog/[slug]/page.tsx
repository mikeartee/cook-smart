import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, User, ArrowLeft, Share2, Tag } from 'lucide-react';
import { blogApi } from '@/lib/api-client';
import { BlogPost } from '@/types';
import { generatePageMetadata } from '@/lib/metadata';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import React from 'react';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const post = await blogApi.getById(slug);
    return post as BlogPost;
  } catch (error) {
    console.error('Failed to fetch blog post:', error);
    return null;
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return generatePageMetadata({
    title: post.title,
    description: post.excerpt,
    ogImage: post.featuredImage,
    keywords: post.tags,
    article: {
      publishedTime: post.publishedAt.toISOString(),
      author: post.author,
      tags: post.tags,
    },
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps): Promise<React.ReactElement> {
  const { slug } = React.use(params);
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const readingTime = Math.ceil(post.content.split(' ').length / 200);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Article */}
      <article className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <header className="mb-8">
            {/* Categories */}
            <div className="mb-4 flex flex-wrap gap-2">
              {post.categories.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl">{post.title}</h1>

            {/* Excerpt */}
            <p className="mb-6 text-xl text-muted-foreground">{post.excerpt}</p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.publishedAt.toISOString()}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{readingTime} min read</span>
              </div>
            </div>

            {/* Share Button */}
            <div className="mt-6">
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share Article
              </Button>
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative mb-12 aspect-video overflow-hidden rounded-lg">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-12 border-t pt-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>Tags:</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-muted px-3 py-1 text-sm hover:bg-muted/80"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Author Bio */}
          <div className="mt-12 rounded-lg border p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {post.author.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-semibold">{post.author}</h3>
                <p className="text-sm text-muted-foreground">
                  Content creator and cooking enthusiast sharing recipes and tips to help you cook
                  smarter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
