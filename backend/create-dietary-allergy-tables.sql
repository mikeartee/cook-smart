-- Create Dietary Restrictions and Allergy Tables
-- This migration creates the missing tables for dietary restrictions and allergies

-- 1. Dietary Restrictions Master Table
CREATE TABLE IF NOT EXISTS dietary_restrictions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'diet', 'lifestyle', 'religious', 'health'
    description TEXT,
    excluded_ingredients TEXT DEFAULT '[]', -- JSON array of ingredient names
    excluded_tags TEXT DEFAULT '[]', -- JSON array of tags
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Dietary Restrictions (user selections)
CREATE TABLE IF NOT EXISTS user_dietary_restrictions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restriction_id INTEGER NOT NULL REFERENCES dietary_restrictions(id) ON DELETE CASCADE,
    custom_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, restriction_id)
);

-- 3. Custom Dietary Restrictions (user-created)
CREATE TABLE IF NOT EXISTS custom_dietary_restrictions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    excluded_ingredients TEXT DEFAULT '[]', -- JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Allergies Master Table
CREATE TABLE IF NOT EXISTS allergies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'moderate', -- 'mild', 'moderate', 'severe'
    description TEXT,
    trigger_ingredients TEXT DEFAULT '[]', -- JSON array
    cross_reactive_ingredients TEXT DEFAULT '[]', -- JSON array
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. User Allergies (user selections)
CREATE TABLE IF NOT EXISTS user_allergies (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    allergy_id INTEGER NOT NULL REFERENCES allergies(id) ON DELETE CASCADE,
    severity_override VARCHAR(20), -- User can override severity
    custom_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, allergy_id)
);

-- 6. Custom Allergies (user-created)
CREATE TABLE IF NOT EXISTS custom_allergies (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'moderate',
    description TEXT,
    trigger_ingredients TEXT DEFAULT '[]', -- JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_dietary_restrictions_user_id ON user_dietary_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_dietary_restrictions_user_id ON custom_dietary_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_allergies_user_id ON user_allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_allergies_user_id ON custom_allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_dietary_restrictions_category ON dietary_restrictions(category);
CREATE INDEX IF NOT EXISTS idx_allergies_severity ON allergies(severity);

-- Insert common dietary restrictions
INSERT INTO dietary_restrictions (name, category, description, excluded_ingredients, excluded_tags) VALUES
('Vegetarian', 'diet', 'No meat, poultry, or fish', '["beef", "chicken", "pork", "fish", "turkey", "lamb", "veal", "duck", "meat"]', '["meat", "poultry", "seafood"]'),
('Vegan', 'diet', 'No animal products', '["beef", "chicken", "pork", "fish", "turkey", "lamb", "milk", "cheese", "butter", "eggs", "honey", "cream", "yogurt", "meat", "dairy"]', '["meat", "poultry", "seafood", "dairy", "eggs"]'),
('Dairy-Free', 'diet', 'No dairy products', '["milk", "cheese", "butter", "cream", "yogurt", "ice cream", "sour cream", "whey", "casein", "lactose"]', '["dairy"]'),
('Gluten-Free', 'health', 'No gluten-containing grains', '["wheat", "barley", "rye", "flour", "bread", "pasta", "couscous", "bulgur", "semolina"]', '["gluten", "wheat"]'),
('Kosher', 'religious', 'Follows Jewish dietary laws', '["pork", "shellfish", "mixing meat and dairy"]', '["non-kosher"]'),
('Halal', 'religious', 'Follows Islamic dietary laws', '["pork", "alcohol", "non-halal meat"]', '["non-halal"]'),
('Paleo', 'lifestyle', 'No grains, legumes, or processed foods', '["wheat", "rice", "beans", "lentils", "peanuts", "dairy", "sugar", "processed"]', '["grains", "legumes", "processed"]'),
('Keto', 'lifestyle', 'Very low carb, high fat', '["sugar", "bread", "pasta", "rice", "potatoes", "beans", "fruit"]', '["high-carb"]'),
('Low-Sodium', 'health', 'Reduced sodium intake', '["salt", "soy sauce", "processed meats", "canned soups"]', '["high-sodium"]'),
('Nut-Free', 'health', 'No tree nuts or peanuts', '["almonds", "walnuts", "cashews", "pecans", "peanuts", "hazelnuts", "pistachios", "macadamia"]', '["nuts"]')
ON CONFLICT DO NOTHING;

-- Insert common allergies
INSERT INTO allergies (name, severity, description, trigger_ingredients, cross_reactive_ingredients) VALUES
('Peanut Allergy', 'severe', 'Allergic to peanuts', '["peanuts", "peanut butter", "peanut oil"]', '["tree nuts"]'),
('Tree Nut Allergy', 'severe', 'Allergic to tree nuts', '["almonds", "walnuts", "cashews", "pecans", "hazelnuts", "pistachios", "macadamia"]', '["peanuts"]'),
('Dairy Allergy', 'moderate', 'Allergic to milk proteins', '["milk", "cheese", "butter", "cream", "yogurt", "whey", "casein"]', '[]'),
('Egg Allergy', 'moderate', 'Allergic to eggs', '["eggs", "egg whites", "egg yolks", "mayonnaise"]', '[]'),
('Soy Allergy', 'moderate', 'Allergic to soy products', '["soybeans", "soy sauce", "tofu", "edamame", "soy milk"]', '[]'),
('Wheat Allergy', 'moderate', 'Allergic to wheat proteins', '["wheat", "flour", "bread", "pasta", "couscous"]', '["barley", "rye"]'),
('Fish Allergy', 'severe', 'Allergic to fish', '["salmon", "tuna", "cod", "halibut", "fish"]', '[]'),
('Shellfish Allergy', 'severe', 'Allergic to shellfish', '["shrimp", "crab", "lobster", "clams", "mussels", "oysters"]', '[]'),
('Sesame Allergy', 'moderate', 'Allergic to sesame', '["sesame seeds", "tahini", "sesame oil"]', '[]'),
('Sulfite Sensitivity', 'mild', 'Sensitive to sulfites', '["dried fruits", "wine", "processed foods with sulfites"]', '[]')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Dietary restrictions and allergy tables created successfully!' as status;
