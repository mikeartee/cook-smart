# Environment Configuration Guide

## Overview

This document explains how to configure environment variables for the Cook Smart website.

## Environment Files

- `.env.example` - Template file with all available environment variables
- `.env.local` - Local development environment (not committed to git)
- `.env.production` - Production environment variables (managed by Vercel)

## Required Environment Variables

### Backend API URL

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

This should point to your backend API server. In production, this will be `https://api.cooksmartapp.com`.

### Email Service (Resend)

```bash
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>
```

Required for:
- Newsletter subscriptions
- Contact form auto-replies
- Admin notifications

Get your API key from: https://resend.com/api-keys

### App Store Links (Optional)

```bash
NEXT_PUBLIC_ANDROID_STORE_URL=https://play.google.com/store/apps/details?id=com.cooksmartapp
NEXT_PUBLIC_IOS_STORE_URL=https://apps.apple.com/app/cook-smart/id123456789
```

These are used for download buttons on the website.

## Setup Instructions

### Local Development

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your values in `.env.local`

3. Start the development server:
   ```bash
   npm run dev
   ```

### Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add all required variables:
   - `NEXT_PUBLIC_API_URL`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - Any optional variables

4. Redeploy your application

## API Integration

The website uses axios for API communication with the following features:

- **Automatic authentication**: JWT tokens are automatically added to requests
- **Error handling**: Global error handling with automatic retries
- **Request timeout**: 30 second timeout for all requests
- **Retry logic**: Automatic retry for 500 errors and network failures

### API Services

All API calls are organized into service modules:

- `lib/api/auth.ts` - Authentication (login, logout, verify)
- `lib/api/recipes.ts` - Recipe fetching and filtering
- `lib/api/blog.ts` - Blog post management
- `lib/api/newsletter.ts` - Newsletter subscriptions
- `lib/api/contact.ts` - Contact form submissions

### Usage Example

```typescript
import { getRecipes, getBlogPosts, subscribeToNewsletter } from '@/lib/api';

// Fetch recipes with filters
const { recipes, total, hasMore } = await getRecipes(1, 12, {
  search: 'pasta',
  category: 'Italian',
  dietaryPreferences: ['vegetarian'],
});

// Subscribe to newsletter
const result = await subscribeToNewsletter({
  email: 'user@example.com',
  preferences: {
    recipes: true,
    tips: true,
    updates: false,
  },
});
```

## Security

- All `.env.local` files are automatically ignored by git
- Never commit API keys or secrets to the repository
- Use `NEXT_PUBLIC_` prefix only for variables that should be exposed to the browser
- Server-side only variables (like `RESEND_API_KEY`) should NOT have the `NEXT_PUBLIC_` prefix

## CORS Configuration

The backend API should allow requests from:
- Development: `http://localhost:3001`
- Production: `https://cooksmartapp.com`

## Troubleshooting

### API Connection Issues

1. Check that `NEXT_PUBLIC_API_URL` is set correctly
2. Verify the backend server is running
3. Check browser console for CORS errors
4. Ensure the backend allows requests from your domain

### Email Not Sending

1. Verify `RESEND_API_KEY` is set correctly
2. Check that the API key has the correct permissions
3. Verify `EMAIL_FROM` uses a verified domain in Resend
4. Check server logs for detailed error messages

### Environment Variables Not Loading

1. Restart the development server after changing `.env.local`
2. Clear Next.js cache: `rm -rf .next`
3. Verify variable names match exactly (case-sensitive)
4. Check that variables starting with `NEXT_PUBLIC_` are used in client-side code

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Resend Documentation](https://resend.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

