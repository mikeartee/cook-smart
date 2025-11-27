-- Recipe ratings and reviews
CREATE TABLE IF NOT EXISTS recipe_ratings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id VARCHAR(255) NOT NULL,
  recipe_type VARCHAR(20) NOT NULL DEFAULT 'api', -- 'api' or 'user'
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, recipe_id, recipe_type)
);

CREATE INDEX idx_recipe_ratings_recipe ON recipe_ratings(recipe_id, recipe_type);
CREATE INDEX idx_recipe_ratings_user ON recipe_ratings(user_id);

-- Recipe collections/folders
CREATE TABLE IF NOT EXISTS recipe_collections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipe_collection_items (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES recipe_collections(id) ON DELETE CASCADE,
  recipe_id VARCHAR(255) NOT NULL,
  recipe_type VARCHAR(20) NOT NULL DEFAULT 'api',
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(collection_id, recipe_id, recipe_type)
);

CREATE INDEX idx_recipe_collections_user ON recipe_collections(user_id);
CREATE INDEX idx_recipe_collection_items_collection ON recipe_collection_items(collection_id);

-- Meal planning calendar
CREATE TABLE IF NOT EXISTS meal_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id VARCHAR(255) NOT NULL,
  recipe_type VARCHAR(20) NOT NULL DEFAULT 'api',
  planned_date DATE NOT NULL,
  meal_type VARCHAR(20) DEFAULT 'dinner', -- breakfast, lunch, dinner, snack
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, planned_date, meal_type)
);

CREATE INDEX idx_meal_plans_user_date ON meal_plans(user_id, planned_date);
CREATE INDEX idx_meal_plans_recipe ON meal_plans(recipe_id, recipe_type);

-- Recipe cooking history
CREATE TABLE IF NOT EXISTS recipe_cooking_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id VARCHAR(255) NOT NULL,
  recipe_type VARCHAR(20) NOT NULL DEFAULT 'api',
  cooked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT
);

CREATE INDEX idx_cooking_history_user ON recipe_cooking_history(user_id);
CREATE INDEX idx_cooking_history_recipe ON recipe_cooking_history(recipe_id, recipe_type);

COMMENT ON TABLE recipe_ratings IS 'User ratings and reviews for recipes';
COMMENT ON TABLE recipe_collections IS 'User-created recipe collections/folders';
COMMENT ON TABLE meal_plans IS 'Meal planning calendar';
COMMENT ON TABLE recipe_cooking_history IS 'Track when users cook recipes';
