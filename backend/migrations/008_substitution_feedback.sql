-- Create substitution feedback table
CREATE TABLE IF NOT EXISTS substitution_feedback (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  recipe_id VARCHAR(255) NOT NULL,
  original_ingredient VARCHAR(255) NOT NULL,
  substitute_ingredient VARCHAR(255) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  worked BOOLEAN NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_substitution_feedback_original 
  ON substitution_feedback(original_ingredient);

CREATE INDEX IF NOT EXISTS idx_substitution_feedback_user 
  ON substitution_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_substitution_feedback_recipe 
  ON substitution_feedback(recipe_id);

-- Add comment
COMMENT ON TABLE substitution_feedback IS 'User feedback on ingredient substitutions to improve recommendations';
