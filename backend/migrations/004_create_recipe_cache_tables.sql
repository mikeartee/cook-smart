-- Recipe cache tables for aggressive caching strategy

-- Table for caching individual recipe details (PERMANENT)
CREATE TABLE IF NOT EXISTS cached_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id VARCHAR(255) UNIQUE NOT NULL,
    recipe_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_accessed TIMESTAMP DEFAULT NOW(),
    access_count INTEGER DEFAULT 1,
    is_popular BOOLEAN DEFAULT false
);

-- Index for fast recipe lookup
CREATE INDEX idx_cached_recipes_recipe_id ON cached_recipes(recipe_id);
CREATE INDEX idx_cached_recipes_popular ON cached_recipes(is_popular) WHERE is_popular = true;
CREATE INDEX idx_cached_recipes_access_count ON cached_recipes(access_count DESC);

-- Table for caching recipe search results (30 days)
CREATE TABLE IF NOT EXISTS recipe_search_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_hash VARCHAR(255) UNIQUE NOT NULL,
    recipe_ids TEXT[] NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    access_count INTEGER DEFAULT 1
);

-- Index for fast search lookup
CREATE INDEX idx_recipe_search_cache_hash ON recipe_search_cache(ingredient_hash);
CREATE INDEX idx_recipe_search_cache_expires ON recipe_search_cache(expires_at);

-- Comments
COMMENT ON TABLE cached_recipes IS 'Permanent cache of recipe details from Spoonacular API';
COMMENT ON TABLE recipe_search_cache IS 'Temporary cache (30 days) of recipe search results by ingredient combination';
COMMENT ON COLUMN cached_recipes.is_popular IS 'Recipes with 10+ accesses are marked popular and never expire';
COMMENT ON COLUMN recipe_search_cache.ingredient_hash IS 'MD5 hash of sorted ingredient IDs for cache key';
