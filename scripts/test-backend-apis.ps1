# Test Backend APIs
# Quick script to test all new social and advanced recipe endpoints

Write-Host "🧪 Testing Backend APIs" -ForegroundColor Green
Write-Host ""

$baseUrl = "https://api.cooksmartapp.com/api/v1"

# Test 1: Health Check
Write-Host "1️⃣  Testing Health Endpoint..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "https://api.cooksmartapp.com/health" -Method Get
    if ($health.status -eq "OK") {
        Write-Host "   ✅ Health check passed" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Health check error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Trending Recipes
Write-Host "2️⃣  Testing Trending Recipes..." -ForegroundColor Cyan
try {
    $trending = Invoke-RestMethod -Uri "$baseUrl/social/trending" -Method Get
    if ($trending.success) {
        Write-Host "   ✅ Trending endpoint works" -ForegroundColor Green
        Write-Host "   📊 Found $($trending.trending.Count) trending recipes" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Trending endpoint failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Trending error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Seasonal Recipes
Write-Host "3️⃣  Testing Seasonal Recipes..." -ForegroundColor Cyan
try {
    $seasonal = Invoke-RestMethod -Uri "$baseUrl/advanced-recipes/seasonal/current/recipes" -Method Get
    if ($seasonal.success) {
        Write-Host "   ✅ Seasonal endpoint works" -ForegroundColor Green
        Write-Host "   🌸 Current season: $($seasonal.season)" -ForegroundColor Gray
        Write-Host "   📊 Found $($seasonal.recipes.Count) seasonal recipes" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Seasonal endpoint failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Seasonal error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Recipe Comments (public endpoint)
Write-Host "4️⃣  Testing Recipe Comments..." -ForegroundColor Cyan
try {
    $comments = Invoke-RestMethod -Uri "$baseUrl/social/comments/52772" -Method Get
    if ($comments.success) {
        Write-Host "   ✅ Comments endpoint works" -ForegroundColor Green
        Write-Host "   💬 Found $($comments.comments.Count) comments" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Comments endpoint failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Comments error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Recipe Nutrition
Write-Host "5️⃣  Testing Recipe Nutrition..." -ForegroundColor Cyan
try {
    $nutrition = Invoke-RestMethod -Uri "$baseUrl/advanced-recipes/nutrition/52772" -Method Get
    if ($nutrition.success) {
        Write-Host "   ✅ Nutrition endpoint works" -ForegroundColor Green
        if ($nutrition.nutrition) {
            Write-Host "   🥗 Nutrition data found" -ForegroundColor Gray
        } else {
            Write-Host "   📝 No nutrition data yet (expected)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ❌ Nutrition endpoint failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Nutrition error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "🎉 Backend API Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- All endpoints should return success: true"
Write-Host "- Empty arrays are normal (no data yet)"
Write-Host "- Any errors above need investigation"
Write-Host ""
Write-Host "Next: Test the frontend app with 'npm run android'" -ForegroundColor Cyan
Write-Host ""
