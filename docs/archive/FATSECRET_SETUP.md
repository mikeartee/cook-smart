# FatSecret API Integration - Setup Guide

## Status: 🕐 Credentials Added - Awaiting IP Whitelist Propagation

### What's Been Done

1. ✅ Created `FatSecretService.ts` - handles OAuth2 authentication and API calls
2. ✅ Updated `barcodeService.ts` - FatSecret is now the primary barcode lookup
3. ✅ Added environment variables to `.env.example`
4. ✅ Implemented fallback chain: FatSecret → Open Food Facts → Nutritionix → USDA
5. ✅ Added credentials to production `.env`
6. ✅ Whitelisted IPs in FatSecret portal (34.203.8.150, 172.59.200.202)
7. 🕐 Waiting for IP whitelist to propagate (can take a few minutes)

### Integration Benefits

**FatSecret Premier Free Tier provides:**
- Comprehensive barcode database (US and international)
- Detailed nutritional information (calories, protein, carbs, fat, and more)
- Brand information and product names
- Better accuracy than free alternatives
- No monthly request limits (within reasonable use)

### Next Steps

#### 1. Get Your API Credentials

Once FatSecret approves your Premier Free access:

1. Log in to FatSecret Platform: https://platform.fatsecret.com/
2. Go to "My Applications" or "API Keys"
3. Create a new application (if needed)
4. Copy your **Client ID** and **Client Secret**

#### 2. Add Credentials to Environment

Add to your `.env` file:

```bash
# FatSecret API (Premier Free)
FATSECRET_CLIENT_ID=your_client_id_here
FATSECRET_CLIENT_SECRET=your_client_secret_here
```

#### 3. Deploy to Production

**Local Testing:**
```bash
cd backend
npm install
npm run build
npm start
```

**EC2 Deployment:**
```bash
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150
cd cook-smart/backend
nano .env  # Add FatSecret credentials
npm run build
pm2 restart cook-smart-backend
```

#### 4. Test the Integration

Test barcode lookup with a product:

```bash
curl -X POST http://localhost:3000/api/v1/ingredients/barcode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"barcode": "012000161155"}'
```

Expected response:
```json
{
  "found": true,
  "product": {
    "name": "Product Name",
    "brand": "Brand Name",
    "category": "proteins",
    "nutrition_per_100g": {
      "calories": 250,
      "protein": 15.5,
      "carbs": 30.2,
      "fat": 8.1
    },
    "barcode": "012000161155",
    "source": "fatsecret"
  }
}
```

### How It Works

**Lookup Priority:**

1. **FatSecret** (if configured) - Best quality, comprehensive data
2. **Open Food Facts** - Free, international coverage
3. **Nutritionix** - US products, limited free tier
4. **USDA** - Enhancement for missing nutrition data
5. **Manual Entry** - If all APIs fail

**Smart Fallback:**
- If FatSecret credentials are missing, automatically falls back to Open Food Facts
- No code changes needed - just add credentials when ready
- Existing barcode scanning continues to work

### API Features Available

The FatSecret service supports:

- ✅ Barcode lookup (`searchByBarcode`)
- ✅ Food search by name (`searchFoods`)
- ✅ Detailed food information (`getFoodDetails`)
- ✅ Automatic OAuth2 token management
- ✅ Token caching and refresh
- ✅ Nutrition conversion to per-100g format

### Monitoring

Check if FatSecret is being used:

```bash
# Check backend logs
pm2 logs cook-smart-backend | grep FatSecret

# Look for:
# [Barcode] Found via FatSecret
# [FatSecret] Token error (if credentials are wrong)
# [FatSecret] Barcode not found (if product not in database)
```

### Troubleshooting

**Issue: "Failed to get FatSecret access token"**
- Check that `FATSECRET_CLIENT_ID` and `FATSECRET_CLIENT_SECRET` are set correctly
- Verify credentials are from FatSecret Platform (not the old REST API)
- Ensure you're using OAuth2 credentials, not REST API keys

**Issue: Barcode not found**
- FatSecret will return null, and the service automatically tries Open Food Facts
- This is normal - not all barcodes are in every database

**Issue: Rate limiting**
- Premier Free tier has generous limits
- If you hit limits, the service falls back to other APIs automatically

### Cost Savings

By using FatSecret Premier Free:
- **Save $0.002 per Nutritionix request** (after free tier)
- **Better data quality** than free alternatives
- **No monthly limits** to worry about
- **Estimated savings:** $50-100/month at scale

### Documentation

- FatSecret Platform API: https://platform.fatsecret.com/api/
- OAuth2 Authentication: https://platform.fatsecret.com/api/Default.aspx?screen=rapiauth2
- Premier Free Tier: https://platform.fatsecret.com/api/Default.aspx?screen=rapipremier

---

**Ready to activate:** Just add your credentials to `.env` and restart the backend!
