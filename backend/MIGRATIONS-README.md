# Database Migrations

## Status: Ready to Deploy

All database migrations have been created and are ready to run against AWS RDS PostgreSQL.

## Migrations Created

1. **1763166240985_create-users-table.js**
   - Users table with authentication fields
   - Email uniqueness constraint
   - Co-founder flag and subscription tracking
   - Indexes on email and is_co_founder

2. **1763166295070_create-ingredients-tables.js**
   - Ingredients table with categories
   - Ingredient_synonyms table for alternate names
   - Foreign key relationships
   - Indexes for performance

3. **1763166332452_create-user-ingredients-tables.js**
   - User_ingredients table (user inventory)
   - Custom_ingredients table (user-created)
   - Unique constraint on user+ingredient
   - Cascade deletes

4. **1763166356164_create-user-data-tables.js**
   - User_recipes table (favorites with JSONB)
   - Shopping_lists table
   - User_points table
   - Referrals table with unique codes

## Running Migrations

### Prerequisites
- AWS RDS PostgreSQL instance must be created
- DATABASE_URL must be configured in .env
- Connection must allow SSL

### Commands

```bash
# Apply all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate:create <migration-name>
```

### When RDS is Ready

1. Ensure RDS instance is running
2. Update DATABASE_URL in .env if needed
3. Run: `npm run migrate:up`
4. Verify tables created: Connect to RDS and check schema

## Database Schema

### Tables Created
- users
- ingredients
- ingredient_synonyms
- user_ingredients
- custom_ingredients
- user_recipes
- shopping_lists
- user_points
- referrals

### Total: 9 tables with proper relationships and indexes

## Next Steps

- Task 2.1: Set up Serverless Framework
- Task 2.2: Create shared database connection module
- RDS instance will be created when needed for deployment
