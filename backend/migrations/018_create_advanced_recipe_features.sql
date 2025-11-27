-- Advanced Recipe Features: Nutrition, Timers, Step-by-Step Mode

-- Recipe nutrition information
CREATE TABLE IF NOT EXISTS recipe_nutrition (
  id SERIAL PRIMARY KEY,
  recipe_id VARCHAR(255) UNIQUE NOT NULL,
  calories INTEGER,
  protein_g DECIMAL(10,2),
  carbs_g DECIMAL(10,2),
  fat_g DECIMAL(10,2),
  fiber_g DECIMAL(10,2),
  sugar_g DECIMAL(10,2),
  sodium_mg DECIMAL(10,2),
  servings INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_nutrition_recipe ON recipe_nutrition(recipe_id);

-- Recipe cooking timers
CREATE TABLE IF NOT EXISTS recipe_timers (
  id SERIAL PRIMARY KEY,
  recipe_id VARCHAR(255) NOT NULL,
  step_number INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  timer_label VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_timers_recipe ON recipe_timers(recipe_id);

-- User cooking sessions (step-by-step mode tracking)
CREATE TABLE IF NOT EXISTS cooking_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id VARCHAR(255) NOT NULL,
  current_step INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'paused', 'completed', 'abandoned'
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  total_time_minutes INTEGER
);

CREATE INDEX idx_cooking_sessions_user ON cooking_sessions(user_id);
CREATE INDEX idx_cooking_sessions_recipe ON cooking_sessions(recipe_id);
CREATE INDEX idx_cooking_sessions_status ON cooking_sessions(status);

-- Recipe filters and tags
CREATE TABLE IF NOT EXISTS recipe_tags (
  id SERIAL PRIMARY KEY,
  recipe_id VARCHAR(255) NOT NULL,
  tag VARCHAR(100) NOT NULL,
  tag_type VARCHAR(50) NOT NULL, -- 'cuisine', 'difficulty', 'time', 'season', 'meal_type'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(recipe_id, tag, tag_type)
);

CREATE INDEX idx_recipe_tags_recipe ON recipe_tags(recipe_id);
CREATE INDEX idx_recipe_tags_tag ON recipe_tags(tag);
CREATE INDEX idx_recipe_tags_type ON recipe_tags(tag_type);

-- Seasonal recipe suggestions
CREATE TABLE IF NOT EXISTS seasonal_recipes (
  id SERIAL PRIMARY KEY,
  recipe_id VARCHAR(255) NOT NULL,
  season VARCHAR(20) NOT NULL, -- 'spring', 'summer', 'fall', 'winter'
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(recipe_id, season)
);

CREATE INDEX idx_seasonal_recipes_season ON seasonal_recipes(season);
CREATE INDEX idx_seasonal_recipes_priority ON seasonal_recipes(priority DESC);
