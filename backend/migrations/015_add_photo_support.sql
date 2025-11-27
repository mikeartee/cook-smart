-- Add photo support to user ingredients
ALTER TABLE user_ingredients 
ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

-- Add multiple photos support for user recipes
CREATE TABLE IF NOT EXISTS user_recipe_photos (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES user_recipes(id) ON DELETE CASCADE,
  photo_url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_recipe_photos_recipe ON user_recipe_photos(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_photos_primary ON user_recipe_photos(recipe_id, is_primary) WHERE is_primary = true;

-- Add photo tracking table for storage management
CREATE TABLE IF NOT EXISTS uploaded_photos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_url VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(50),
  entity_type VARCHAR(50), -- 'ingredient' or 'recipe'
  entity_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_uploaded_photos_user ON uploaded_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_photos_entity ON uploaded_photos(entity_type, entity_id);

COMMENT ON TABLE user_recipe_photos IS 'Multiple photos per recipe with primary photo designation';
COMMENT ON TABLE uploaded_photos IS 'Track all uploaded photos for storage management and cleanup';
