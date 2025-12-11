-- Fix meal_ratings public data exposure - require authentication
DROP POLICY IF EXISTS "Anyone can view public ratings" ON meal_ratings;
CREATE POLICY "Authenticated can view public ratings" ON meal_ratings
  FOR SELECT USING (is_public = true AND auth.role() = 'authenticated');