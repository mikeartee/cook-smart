-- Create user recipes tables

-- Main user recipes table
CREATE TABLE IF NOT EXISTS user_recipes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  prep_time INTEGER DEFAULT 0,
  cook_time INTEGER DEFAULT 0,
  servings INTEGER DEFAULT 4,
  category VARCHAR(100),
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  image_url VARCHAR(500),
  is_public BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User recipe ingredients
CREATE TABLE IF NOT EXISTS user_recipe_ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES user_recipes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity VARCHAR(50),
  unit VARCHAR(50),
  sort_order INTEGER DEFAULT 0
);

-- User recipe instructions
CREATE TABLE IF NOT EXISTS user_recipe_instructions (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES user_recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL
);

-- User recipe favorites (for other users to favorite)
CREATE TABLE IF NOT EXISTS user_recipe_favorites (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES user_recipes(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(recipe_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_recipes_user_id ON user_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recipes_category ON user_recipes(category);
CREATE INDEX IF NOT EXISTS idx_user_recipes_difficulty ON user_recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_user_recipes_public ON user_recipes(is_public);
CREATE INDEX IF NOT EXISTS idx_user_recipes_created ON user_recipes(date_created DESC);
CREATE INDEX IF NOT EXISTS idx_user_recipe_ingredients_recipe ON user_recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_instructions_recipe ON user_recipe_instructions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_favorites_recipe ON user_recipe_favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_favorites_user ON user_recipe_favorites(user_id);

-- Show table structures
\d user_recipes
\d user_recipe_ingredients
\d user_recipe_instructions
