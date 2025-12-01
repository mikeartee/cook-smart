# Cook Smart Website

A comprehensive web platform for the Cook Smart mobile app, featuring a public marketing site and admin dashboard.

## Features

### Public Site
- **Homepage**: Hero section, features, testimonials, download CTAs
- **Recipes**: Browse, search, filter recipes with detailed views
- **Blog**: Articles with categories, search, and RSS feed
- **FAQ**: Searchable help center
- **Contact**: Contact form with validation
- **About**: Company information
- **Testimonials**: Success stories with filtering

### Admin Dashboard
- **User Management**: View, edit, search, and manage users
- **Content Moderation**: Review and moderate flagged content
- **Recipe Management**: Curate and feature recipes
- **Analytics**: View metrics, trends, and export reports
- **Notifications**: Send push notifications to users
- **Email Campaigns**: Create and track email campaigns
- **Support Tickets**: Manage user support requests
- **Financial Dashboard**: Monitor revenue and subscriptions
- **Security & Audit**: View security events and audit logs
- **Settings**: Configure system settings

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **API Client**: Axios
- **Testing**: Jest, React Testing Library, fast-check

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your values
```

### Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.cooksmartapp.com
NEXT_PUBLIC_SITE_URL=https://cooksmartapp.com

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>

# App Store Links
NEXT_PUBLIC_ANDROID_STORE_URL=https://play.google.com/store/apps/details?id=com.cooksmartapp
NEXT_PUBLIC_IOS_STORE_URL=https://apps.apple.com/app/cook-smart/id123456789
```

### Development

```bash
# Run development server
npm run dev

# Open http://localhost:3000
```

### Build

```bash
# Create production build
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run type checking
npm run type-check
```

## Project Structure

```
website/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── blog/              # Blog pages
│   ├── recipes/           # Recipe pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # Reusable components
│   ├── ui/               # UI primitives
│   └── ...               # Feature components
├── contexts/             # React contexts
├── lib/                  # Utilities
│   ├── api-client.ts    # API integration
│   └── metadata.ts      # SEO utilities
├── types/               # TypeScript types
└── __tests__/           # Tests
```

## API Integration

The website integrates with the Cook Smart backend API. All API calls are centralized in `lib/api-client.ts`.

### Authentication

Admin routes are protected with JWT authentication. The auth system includes:
- Login/logout functionality
- Auto-logout after 30 minutes of inactivity
- Token refresh
- Protected route middleware

### API Endpoints

See `lib/api-client.ts` for all available API methods organized by domain:
- `authApi` - Authentication
- `recipesApi` - Recipe operations
- `blogApi` - Blog operations
- `usersApi` - User management
- `moderationApi` - Content moderation
- `analyticsApi` - Analytics data
- `newsletterApi` - Newsletter subscriptions
- `contactApi` - Contact form submissions

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## SEO

The website includes comprehensive SEO optimization:
- Dynamic meta tags for all pages
- Open Graph tags for social sharing
- Structured data (JSON-LD)
- XML sitemap at `/sitemap.xml`
- RSS feed at `/rss.xml`
- Server-side rendering for better SEO

## Security

Security features include:
- HTTPS enforcement
- Security headers (CSP, HSTS, X-Frame-Options)
- JWT authentication
- Input validation
- XSS protection
- Auto-logout on inactivity

## Performance

Performance optimizations:
- Server-side rendering (SSR)
- Static site generation (SSG)
- Image optimization with Next/Image
- Code splitting
- Lazy loading

## Accessibility

Accessibility features:
- Skip to content link
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management
- WCAG compliant color contrast

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and type checking
4. Submit a pull request

## License

Proprietary - Cook Smart

## Support

For support, email services.cooksmart@gmail.com
