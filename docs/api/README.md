# Cook Smart API Documentation

## Overview

The Cook Smart API is a RESTful service that provides comprehensive recipe generation, ingredient management, and user authentication capabilities. Built with Node.js and TypeScript, it serves as the backbone for the Cook Smart mobile application.

**Base URL**: `https://api.cooksmartapp.com`  
**Version**: v1  
**Authentication**: JWT Bearer tokens

## Quick Start

### Authentication
```bash
# Login to get JWT token
curl -X POST https://api.cooksmartapp.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.cooksmartapp.com/api/v1/user/profile
```

### Basic Recipe Search
```bash
# Search recipes by ingredients
curl "https://api.cooksmartapp.com/api/v1/recipes/search?ingredients=chicken,rice"

# Get recipe details
curl "https://api.cooksmartapp.com/api/v1/recipes/fatsecret_12345"
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Password reset confirmation

### User Management
- `GET /api/v1/user/me` - Get current user profile
- `PUT /api/v1/user/profile` - Update user profile
- `DELETE /api/v1/user/account` - Delete user account
- `GET /api/v1/user/preferences` - Get user preferences
- `PUT /api/v1/user/preferences` - Update user preferences

### Recipe Management
- `GET /api/v1/recipes/search` - Search recipes by ingredients
- `GET /api/v1/recipes/:id` - Get recipe details
- `GET /api/v1/recipes/trending` - Get trending recipes
- `GET /api/v1/recipes/seasonal` - Get seasonal recipes
- `POST /api/v1/recipes/:id/save` - Save recipe to favorites
- `DELETE /api/v1/recipes/:id/save` - Remove from favorites
- `GET /api/v1/recipes/saved` - Get user's saved recipes

### Ingredient Management
- `GET /api/v1/ingredients` - Get user's ingredients
- `POST /api/v1/ingredients` - Add ingredient
- `PUT /api/v1/ingredients/:id` - Update ingredient
- `DELETE /api/v1/ingredients/:id` - Remove ingredient
- `POST /api/v1/ingredients/barcode/:code` - Add ingredient by barcode

### Dietary Management
- `GET /api/v1/dietary/restrictions` - Get available dietary restrictions
- `GET /api/v1/dietary/user/preferences` - Get user dietary preferences
- `PUT /api/v1/dietary/user/preferences` - Update dietary preferences
- `GET /api/v1/dietary/allergies` - Get available allergies
- `PUT /api/v1/dietary/user/allergies` - Update user allergies

### Subscription Management
- `GET /api/v1/subscriptions/plans` - Get available subscription plans
- `POST /api/v1/subscriptions/create` - Create subscription
- `GET /api/v1/subscriptions/status` - Get subscription status
- `POST /api/v1/subscriptions/cancel` - Cancel subscription
- `POST /api/v1/subscriptions/resume` - Resume subscription

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error details
    }
  }
}
```

## Status Codes

- `200` - OK: Request successful
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid request parameters
- `401` - Unauthorized: Authentication required
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `409` - Conflict: Resource already exists
- `422` - Unprocessable Entity: Validation errors
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Authenticated Users**: 1000 requests per hour
- **Anonymous Users**: 100 requests per hour
- **Recipe Search**: 60 requests per minute
- **Barcode Lookup**: 30 requests per minute

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination using query parameters:

```bash
# Get page 2 with 20 items per page
curl "https://api.cooksmartapp.com/api/v1/recipes/search?page=2&limit=20"
```

Pagination response format:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 2,
      "limit": 20,
      "total": 150,
      "pages": 8,
      "hasNext": true,
      "hasPrev": true
    }
  }
}
```

## Error Handling

### Common Error Codes

- `AUTH_REQUIRED` - Authentication token required
- `AUTH_INVALID` - Invalid or expired token
- `AUTH_INSUFFICIENT` - Insufficient permissions
- `VALIDATION_ERROR` - Request validation failed
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `RESOURCE_EXISTS` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVER_ERROR` - Internal server error

### Validation Errors
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "email": "Invalid email format",
        "password": "Password must be at least 8 characters"
      }
    }
  }
}
```

## SDK and Libraries

### JavaScript/TypeScript
```bash
npm install @cooksmartapp/api-client
```

```typescript
import { CookSmartAPI } from '@cooksmartapp/api-client';

const api = new CookSmartAPI({
  baseURL: 'https://api.cooksmartapp.com',
  apiKey: 'your-api-key'
});

const recipes = await api.recipes.search(['chicken', 'rice']);
```

### cURL Examples
See [API Examples](examples/) for comprehensive cURL examples.

## Webhooks

Cook Smart supports webhooks for real-time notifications:

### Supported Events
- `user.created` - New user registration
- `subscription.created` - New subscription
- `subscription.cancelled` - Subscription cancelled
- `recipe.saved` - Recipe saved by user

### Webhook Configuration
```bash
curl -X POST https://api.cooksmartapp.com/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/cooksmartapp",
    "events": ["user.created", "subscription.created"]
  }'
```

## Testing

### Test Environment
- **Base URL**: `https://api-staging.cooksmartapp.com`
- **Test Data**: Pre-populated test users and recipes
- **Rate Limits**: Relaxed for testing

### Postman Collection
Import our [Postman Collection](postman/cook-smart-api.json) for easy testing.

## Support

- **API Issues**: api-support@cooksmartapp.com
- **Documentation**: docs@cooksmartapp.com
- **Status Page**: [status.cooksmartapp.com](https://status.cooksmartapp.com)

---

*Last updated: December 14, 2025*