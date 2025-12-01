import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import { BlogPost } from '@/types';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
        {/* Featured Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {post.featuredImage ? (
            <img
              src={post.featuredImage}
              alt={post.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <span className="text-6xl">📝</span>
            </div>
          )}
        </div>

        <CardContent className="p-6">
          {/* Categories */}
          <div className="mb-3 flex flex-wrap gap-2">
            {post.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {category}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3 className="mb-3 line-clamp-2 text-xl font-bold group-hover:text-primary">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>5 min read</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t p-6">
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{post.author}</span>
            <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
