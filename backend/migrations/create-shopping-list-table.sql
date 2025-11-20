-- Create shopping_list_items table
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  ingredient VARCHAR(255) NOT NULL,
  quantity VARCHAR(50) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  category VARCHAR(100) DEFAULT 'other',
  recipe_id VARCHAR(255),
  is_completed BOOLEAN DEFAULT false,
  date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_shopping_list_user_id ON shopping_list_items(user_id);

-- Create index on recipe_id
CREATE INDEX IF NOT EXISTS idx_shopping_list_recipe_id ON shopping_list_items(recipe_id);

-- Add trigger to update date_updated
CREATE OR REPLACE FUNCTION update_shopping_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shopping_list_updated_at
BEFORE UPDATE ON shopping_list_items
FOR EACH ROW
EXECUTE FUNCTION update_shopping_list_updated_at();
