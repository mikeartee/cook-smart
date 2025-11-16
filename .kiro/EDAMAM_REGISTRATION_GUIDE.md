# Edamam API Registration Guide

## Quick Setup (5 minutes)

### Step 1: Create Account

1. Go to [https://developer.edamam.com/](https://developer.edamam.com/)
2. Click "Sign Up" in the top right
3. Fill in your details:
   - Email address
   - Password
   - First and Last name
4. Verify your email address

### Step 2: Create Application

1. Log in to your Edamam account
2. Go to "Dashboard" or "Applications"
3. Click "Create a new application" or "Get an API Key"
4. Select **"Recipe Search API"**
5. Choose **"Developer"** plan (FREE - 10,000 calls/month)
6. Fill in application details:
   - Application Name: "Cook Smart"
   - Description: "Recipe search for ingredient-based cooking app"
7. Click "Create Application"

### Step 3: Get Your Credentials

You will receive two credentials:

- **Application ID** (looks like: `12345678`)
- **Application Key** (looks like: `abcdef1234567890abcdef1234567890`)

### Step 4: Add to Backend Environment

1. Open `backend/.env` file
2. Add these lines:

```env
EDAMAM_APP_ID=your_application_id_here
EDAMAM_APP_KEY=your_application_key_here
```

**Example:**

```env
# Recipe APIs
EDAMAM_APP_ID=12345678
EDAMAM_APP_KEY=abcdef1234567890abcdef1234567890
```

### Step 5: Restart Backend

```bash
cd backend
npm run dev
```

## Free Tier Details

**Developer Plan:**
- **Cost:** FREE forever
- **Calls:** 10,000 per month (~333 per day)
- **Rate Limit:** 10 calls per minute
- **Features:**
  - Recipe search by ingredients
  - Full recipe details
  - Nutritional information
  - Recipe images
  - Cooking instructions

**Upgrade Options (if needed later):**
- **Startup:** $49/month - 100,000 calls
- **Growth:** $149/month - 500,000 calls
- **Enterprise:** Custom pricing

## Testing Your API Key

After adding credentials, test with:

```bash
curl "https://api.edamam.com/api/recipes/v2?type=public&q=chicken&app_id=YOUR_APP_ID&app_key=YOUR_APP_KEY"
```

You should see JSON response with recipe data.

## Troubleshooting

### Error: "Invalid credentials"
- Double-check APP_ID and APP_KEY in .env
- Make sure there are no extra spaces
- Restart backend after changing .env

### Error: "Rate limit exceeded"
- You've made more than 10 calls in 1 minute
- Wait 60 seconds and try again
- Our caching will prevent this in production

### Error: "Monthly quota exceeded"
- You've used all 10,000 calls this month
- Resets on the 1st of each month
- Consider upgrading or using TheMealDB fallback

## API Documentation

Full documentation: [https://developer.edamam.com/edamam-docs-recipe-api](https://developer.edamam.com/edamam-docs-recipe-api)

## Status

- ⏳ **Action Required:** Register for Edamam API
- ⏳ **Action Required:** Add credentials to backend/.env
- ⏳ **Action Required:** Restart backend server

Once complete, the app will have 6.6x more API calls than Spoonacular!
