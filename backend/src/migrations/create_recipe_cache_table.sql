-- Recipe Cache Table
CREATE TABLE IF NOT EXISTS recipe_cache (
  id SERIAL PRIMARY KEY,
  recipe_id VARCHAR(255) UNIQUE NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'fatsecret', 'spoonacular', 'themealdb'
  title VARCHAR(500) NOT NULL,
  description TEXT,
  image_url TEXT,
  ready_in_minutes INTEGER,
  servings INTEGER,
  ingredients JSONB,
  instructions TEXT,
  nutrition JSONB,
  dietary_info JSONB,
  meal_type VARCHAR(100),
  cuisine VARCHAR(100),
  season VARCHAR(50), -- 'spring', 'summer', 'fall', 'winter', 'all'
  
  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Trending calculation
  trending_score DECIMAL(10,2) DEFAULT 0,
  last_trending_update TIMESTAMP,
  
  -- Cache management
  is_featured BOOLEAN DEFAULT FALSE,
  is_seasonal BOOLEAN DEFAULT FALSE,
  cache_priority INTEGER DEFAULT 0, -- Higher = keep longer
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for fast queries
  INDEX idx_recipe_source (source),
  INDEX idx_recipe_meal_type (meal_type),
  INDEX idx_recipe_season (season),
  INDEX idx_recipe_trending (trending_score DESC),
  INDEX idx_recipe_views (view_count DESC),
  INDEX idx_recipe_featured (is_featured),
  INDEX idx_recipe_seasonal (is_seasonal)
);

-- User Recipe Interactions
CREATE TABLE IF NOT EXISTS user_recipe_interactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  recipe_id VARCHAR(255) NOT NULL,
  interaction_type VARCHAR(50) NOT NULL, -- 'view', 'save', 'share', 'rate', 'cook'
  rating INTEGER, -- 1-5 stars
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_interactions (user_id),
  INDEX idx_recipe_interactions (recipe_id),
  INDEX idx_interaction_type (interaction_type),
  INDEX idx_interaction_date (created_at DESC)
);

-- Seasonal Recipe Suggestions
CREATE TABLE IF NOT EXISTS seasonal_recipe_queue (
  id SERIAL PRIMARY KEY,
  recipe_id VARCHAR(255) NOT NULL,
  season VARCHAR(50) NOT NULL,
  priority INTEGER DEFAULT 0,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(recipe_id, season),
  INDEX idx_seasonal_queue (season, priority DESC)
);
