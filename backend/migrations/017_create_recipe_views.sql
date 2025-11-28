-- Create recipe_views table for tracking recipe views
CREATE TABLE IF NOT EXISTS recipe_views (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    recipe_id VARCHAR(255) NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id)
);

CREATE INDEX idx_recipe_views_user_id ON recipe_views(user_id);
CREATE INDEX idx_recipe_views_recipe_id ON recipe_views(recipe_id);
