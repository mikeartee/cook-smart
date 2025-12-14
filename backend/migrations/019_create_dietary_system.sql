-- Migration: Create Dietary Restriction System
-- This creates the tables needed for dietary restrictions and allergies

-- Create dietary_restrictions table (master list)
CREATE TABLE IF NOT EXISTS dietary_restrictions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL, -- 'diet', 'lifestyle', 'religious', etc.
  description TEXT,
  excluded_ingredients JSONB DEFAULT '[]'::jsonb, -- Array of ingredient names to exclude
  excluded_tags JSONB DEFAULT '[]'::jsonb, -- Array of tags to exclude
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create allergies table (master list)
CREATE TABLE IF NOT EXISTS allergies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  severity VARCHAR(20) DEFAULT 'moderate', -- 'mild', 'moderate', 'severe'
  description TEXT,
  trigger_ingredients JSONB DEFAULT '[]'::jsonb, -- Array of ingredient names that trigger
  cross_reactive_ingredients JSONB DEFAULT '[]'::jsonb, -- Array of cross-reactive ingredients
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_dietary_restrictions table (user selections)
CREATE TABLE IF NOT EXISTS user_dietary_restrictions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restriction_id INTEGER NOT NULL REFERENCES dietary_restrictions(id) ON DELETE CASCADE,
  custom_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, restriction_id)
);

-- Create user_allergies table (user selections)
CREATE TABLE IF NOT EXISTS user_allergies (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  allergy_id INTEGER NOT NULL REFERENCES allergies(id) ON DELETE CASCADE,
  severity_override VARCHAR(20), -- User can override severity
  custom_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, allergy_id)
);

-- Insert default dietary restrictions
INSERT INTO dietary_restrictions (name, category, description, excluded_ingredients) VALUES
('Vegetarian', 'diet', 'No meat, poultry, or fish', '["beef", "chicken", "pork", "fish", "meat", "poultry", "turkey", "lamb", "bacon", "ham", "sausage"]'),
('Vegan', 'diet', 'No animal products', '["beef", "chicken", "pork", "fish", "meat", "poultry", "turkey", "lamb", "bacon", "ham", "sausage", "milk", "cheese", "butter", "cream", "yogurt", "eggs", "honey"]'),
('Gluten-Free', 'diet', 'No gluten-containing grains', '["wheat", "flour", "bread", "pasta", "barley", "rye", "oats", "gluten"]'),
('Dairy-Free', 'diet', 'No dairy products', '["milk", "cheese", "butter", "cream", "yogurt", "dairy"]'),
('Keto', 'diet', 'Very low carb, high fat', '["bread", "pasta", "rice", "potato", "sugar", "flour"]'),
('Paleo', 'diet', 'No processed foods, grains, or legumes', '["bread", "pasta", "rice", "beans", "lentils", "flour", "sugar", "processed"]'),
('Low-Sodium', 'health', 'Reduced sodium intake', '["salt", "sodium", "soy sauce", "processed"]'),
('Halal', 'religious', 'Islamic dietary laws', '["pork", "bacon", "ham", "alcohol", "wine", "beer"]'),
('Kosher', 'religious', 'Jewish dietary laws', '["pork", "bacon", "ham", "shellfish", "mixing meat and dairy"]')
ON CONFLICT (name) DO NOTHING;

-- Insert default allergies
INSERT INTO allergies (name, severity, description, trigger_ingredients) VALUES
('Peanut Allergy', 'severe', 'Allergy to peanuts', '["peanut", "peanuts", "peanut butter"]'),
('Tree Nut Allergy', 'severe', 'Allergy to tree nuts', '["almond", "walnut", "cashew", "pecan", "pistachio", "hazelnut", "brazil nut", "macadamia"]'),
('Dairy Allergy', 'moderate', 'Allergy to dairy products', '["milk", "cheese", "butter", "cream", "yogurt", "dairy", "lactose"]'),
('Egg Allergy', 'moderate', 'Allergy to eggs', '["egg", "eggs", "mayonnaise"]'),
('Wheat Allergy', 'moderate', 'Allergy to wheat', '["wheat", "flour", "bread", "pasta"]'),
('Soy Allergy', 'moderate', 'Allergy to soy products', '["soy", "tofu", "soy sauce", "edamame"]'),
('Fish Allergy', 'severe', 'Allergy to fish', '["fish", "salmon", "tuna", "cod", "halibut"]'),
('Shellfish Allergy', 'severe', 'Allergy to shellfish', '["shrimp", "crab", "lobster", "oyster", "clam", "mussel"]'),
('Sesame Allergy', 'moderate', 'Allergy to sesame', '["sesame", "tahini", "sesame oil"]')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_dietary_restrictions_user_id ON user_dietary_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_allergies_user_id ON user_allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_dietary_restrictions_category ON dietary_restrictions(category);
CREATE INDEX IF NOT EXISTS idx_allergies_severity ON allergies(severity);

-- Show created tables
SELECT 'Dietary system tables created successfully' as status;