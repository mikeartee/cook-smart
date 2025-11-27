-- Social Features: Follow System, Comments, Likes, Shares

-- User follows (who follows who)
CREATE TABLE IF NOT EXISTS user_follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);

-- Recipe comments
CREATE TABLE IF NOT EXISTS recipe_comments (
  id SERIAL PRIMARY KEY,
  recipe_id VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  parent_comment_id INTEGER REFERENCES recipe_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_comments_recipe ON recipe_comments(recipe_id);
CREATE INDEX idx_recipe_comments_user ON recipe_comments(user_id);
CREATE INDEX idx_recipe_comments_parent ON recipe_comments(parent_comment_id);

-- Recipe likes
CREATE TABLE IF NOT EXISTS recipe_likes (
  id SERIAL PRIMARY KEY,
  recipe_id VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(recipe_id, user_id)
);

CREATE INDEX idx_recipe_likes_recipe ON recipe_likes(recipe_id);
CREATE INDEX idx_recipe_likes_user ON recipe_likes(user_id);

-- Recipe shares (tracking social media shares)
CREATE TABLE IF NOT EXISTS recipe_shares (
  id SERIAL PRIMARY KEY,
  recipe_id VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'facebook', 'twitter', 'instagram', 'whatsapp', 'copy_link'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_shares_recipe ON recipe_shares(recipe_id);
CREATE INDEX idx_recipe_shares_user ON recipe_shares(user_id);

-- User activity feed (for community feed)
CREATE TABLE IF NOT EXISTS user_activity_feed (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'created_recipe', 'liked_recipe', 'commented', 'followed_user'
  recipe_id VARCHAR(255),
  target_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_feed_user ON user_activity_feed(user_id);
CREATE INDEX idx_activity_feed_created ON user_activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_type ON user_activity_feed(activity_type);

-- Trending recipes cache
CREATE TABLE IF NOT EXISTS trending_recipes (
  id SERIAL PRIMARY KEY,
  recipe_id VARCHAR(255) UNIQUE NOT NULL,
  score DECIMAL(10,2) NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trending_recipes_score ON trending_recipes(score DESC);
CREATE INDEX idx_trending_recipes_updated ON trending_recipes(updated_at DESC);
