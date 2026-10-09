-- The image-generation function publishes stable public image URLs from this bucket.
-- Keep this idempotent so fresh and partially provisioned projects converge safely.
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-images', 'exercise-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
