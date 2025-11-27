-- Fix Spanish category names in ingredients table
-- Convert Spanish categories to English

UPDATE ingredients
SET category = 'vegetables'
WHERE category ILIKE '%alimento%vegetal%' 
   OR category ILIKE '%bebida%vegetal%'
   OR category ILIKE '%plant-based%';

UPDATE ingredients
SET category = 'proteins'
WHERE category ILIKE '%carne%' 
   OR category ILIKE '%pescado%'
   OR category ILIKE '%proteína%';

UPDATE ingredients
SET category = 'fruits'
WHERE category ILIKE '%fruta%';

UPDATE ingredients
SET category = 'dairy'
WHERE category ILIKE '%lácteo%' 
   OR category ILIKE '%lacteo%'
   OR category ILIKE '%leche%'
   OR category ILIKE '%queso%';

UPDATE ingredients
SET category = 'grains'
WHERE category ILIKE '%grano%' 
   OR category ILIKE '%pan%'
   OR category ILIKE '%arroz%'
   OR category ILIKE '%cereal%';

UPDATE ingredients
SET category = 'spices'
WHERE category ILIKE '%especia%' 
   OR category ILIKE '%condimento%';

-- Set any remaining non-English categories to 'other'
UPDATE ingredients
SET category = 'other'
WHERE category NOT IN ('proteins', 'vegetables', 'fruits', 'dairy', 'grains', 'spices', 'other', 'condiments');

-- Show results
SELECT category, COUNT(*) as count
FROM ingredients
GROUP BY category
ORDER BY category;
