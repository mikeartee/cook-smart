# Performance Optimization Guide

## Overview

This document outlines the performance optimizations implemented in the Cook Smart website and provides guidelines for maintaining optimal performance.

## Implemented Optimizations

### 1. Code Splitting

- **Automatic Route-Based Splitting**: Next.js automatically splits code by route
- **Dynamic Imports**: Heavy components are loaded on-demand
- **Vendor Chunking**: Third-party libraries are bundled separately for better caching

### 2. Image Optimization

- **Next.js Image Component**: All images use the optimized Image component
- **Modern Formats**: AVIF and WebP formats with automatic fallbacks
- **Responsive Images**: Multiple sizes generated for different devices
- **Lazy Loading**: Images below the fold are loaded on-demand

### 3. Bundle Optimization

- **Tree Shaking**: Unused code is automatically removed
- **Package Optimization**: Lucide React and Radix UI are optimized
- **Compression**: Gzip compression enabled for all assets
- **Minification**: JavaScript and CSS are minified in production

### 4. Caching Strategy

- **Static Generation**: Static pages are pre-rendered at build time
- **Incremental Static Regeneration**: Content pages update periodically
- **API Response Caching**: Frequently accessed data is cached
- **Browser Caching**: Long cache times for static assets

### 5. Performance Monitoring

Run Lighthouse audits regularly:

```bash
npm run build
npm start
# Then run Lighthouse in Chrome DevTools
```

Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

## Best Practices

### Component Optimization

```typescript
// ✅ Good: Dynamic import for heavy components
const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <Skeleton />,
  ssr: false,
});

// ❌ Bad: Importing everything upfront
import HeavyChart from '@/components/heavy-chart';
```

### Image Usage

```typescript
// ✅ Good: Using Next.js Image with proper sizing
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // Only for above-the-fold images
/>

// ❌ Bad: Using regular img tag
<img src="/hero.jpg" alt="Hero image" />
```

### API Calls

```typescript
// ✅ Good: Using SWR or React Query for caching
const { data } = useSWR('/api/recipes', fetcher);

// ❌ Bad: Fetching on every render
useEffect(() => {
  fetch('/api/recipes').then(/* ... */);
}, []);
```

### Bundle Size Management

Monitor bundle size:

```bash
npm run build
# Check the output for bundle sizes
```

Keep individual chunks under 200KB for optimal loading.

## Performance Checklist

- [ ] All images use Next.js Image component
- [ ] Heavy components use dynamic imports
- [ ] API responses are cached appropriately
- [ ] Static pages use SSG where possible
- [ ] Dynamic pages use ISR when appropriate
- [ ] Fonts are optimized (using next/font)
- [ ] Third-party scripts are loaded efficiently
- [ ] Bundle size is monitored and optimized
- [ ] Lighthouse scores meet targets
- [ ] Core Web Vitals are within thresholds

## Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

## Monitoring

Use these tools to monitor performance:

1. **Chrome DevTools**: Lighthouse and Performance tab
2. **Vercel Analytics**: Real user monitoring (if deployed on Vercel)
3. **Web Vitals**: Track Core Web Vitals in production

## Future Optimizations

Consider these additional optimizations:

1. **Service Worker**: For offline support and advanced caching
2. **Prefetching**: Prefetch critical resources
3. **CDN**: Use a CDN for static assets
4. **Database Optimization**: Index frequently queried fields
5. **API Response Compression**: Enable compression on API responses

## Resources

- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
