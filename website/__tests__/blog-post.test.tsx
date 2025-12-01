import { render, screen } from '@/lib/test-utils';
import { BlogCard } from '@/components/blog-card';
import { createMockBlogPost } from '@/lib/test-utils';
import * as fc from 'fast-check';
import { propertyTestConfig, blogPostArbitrary } from '@/lib/property-test-utils';

// **Feature: cook-smart-website, Property 13: Blog post completeness**
describe('Blog Post Tests', () => {
  it('property: blog cards display complete information', () => {
    fc.assert(
      fc.property(
        fc.array(blogPostArbitrary(), { minLength: 1, maxLength: 10 }),
        (posts) => {
          posts.forEach((post) => {
            const { container } = render(<BlogCard post={post} />);

            // Verify required elements are present
            expect(container.textContent).toContain(post.title);
            expect(container.textContent).toContain(post.excerpt);
            expect(container.textContent).toContain(post.author);

            // Verify at least one category is displayed
            if (post.categories.length > 0) {
              expect(container.textContent).toContain(post.categories[0]);
            }
          });

          return true;
        }
      ),
      propertyTestConfig
    );
  });

  it('should render blog card with all required elements', () => {
    const post = createMockBlogPost();
    render(<BlogCard post={post} />);

    expect(screen.getByText(post.title)).toBeInTheDocument();
    expect(screen.getByText(post.excerpt)).toBeInTheDocument();
    expect(screen.getByText(post.author)).toBeInTheDocument();
  });

  it('should display featured image or placeholder', () => {
    const postWithImage = createMockBlogPost({
      featuredImage: 'https://example.com/image.jpg',
    });
    const { container: container1 } = render(<BlogCard post={postWithImage} />);
    expect(container1.querySelector('img')).toBeInTheDocument();

    const postWithoutImage = createMockBlogPost({ featuredImage: '' });
    const { container: container2 } = render(<BlogCard post={postWithoutImage} />);
    expect(container2.textContent).toContain('📝');
  });

  it('should display categories', () => {
    const post = createMockBlogPost({
      categories: ['Cooking Tips', 'Recipes', 'Health'],
    });
    const { container } = render(<BlogCard post={post} />);

    // Should display first 2 categories
    expect(container.textContent).toContain('Cooking Tips');
    expect(container.textContent).toContain('Recipes');
  });

  it('should display formatted publication date', () => {
    const post = createMockBlogPost({
      publishedAt: new Date('2024-01-15'),
    });
    const { container } = render(<BlogCard post={post} />);

    // Check that a date is displayed (format may vary)
    expect(container.textContent).toMatch(/January \d+, 2024/i);
  });

  it('should display read time', () => {
    const post = createMockBlogPost();
    render(<BlogCard post={post} />);

    expect(screen.getByText(/5 min read/i)).toBeInTheDocument();
  });

  it('should have hover effects', () => {
    const post = createMockBlogPost();
    const { container } = render(<BlogCard post={post} />);

    const card = container.querySelector('.group');
    expect(card).toHaveClass('hover:shadow-lg');
  });

  it('should link to blog post detail page', () => {
    const post = createMockBlogPost({ slug: 'test-post' });
    const { container } = render(<BlogCard post={post} />);

    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/blog/test-post');
  });
});
