import { blogApi } from '@/lib/api-client';
import { BlogPost } from '@/types';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cooksmartapp.com';

export async function GET(): Promise<Response> {
  try {
    const response = await blogApi.getAll({ limit: 50 });
    const posts = response.posts as BlogPost[];

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Cook Smart Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Cooking tips, recipes, and meal planning advice from Cook Smart</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${posts
      .filter((post) => post.isPublished)
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <author>${post.author}</author>
      ${post.categories.map((cat) => `<category>${cat}</category>`).join('\n      ')}
    </item>`
      )
      .join('\n')}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Failed to generate RSS feed:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
}
