
CREATE POLICY "Public read exercise images"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-images');
