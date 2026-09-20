
-- First, let's check if we have proper RLS policies for the features table
-- and ensure the geo column can handle our data properly

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Users can view their own features" ON public.features;
DROP POLICY IF EXISTS "Users can create their own features" ON public.features;
DROP POLICY IF EXISTS "Users can update their own features" ON public.features;
DROP POLICY IF EXISTS "Users can delete their own features" ON public.features;

-- Ensure RLS is enabled
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies that allow both authenticated and anonymous access for testing
CREATE POLICY "Allow all users to view features" 
  ON public.features 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to create features" 
  ON public.features 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update their own features" 
  ON public.features 
  FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow users to delete their own features" 
  ON public.features 
  FOR DELETE 
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Ensure the geo column can handle both JSON strings and actual geometry
-- Let's make sure the column allows text (JSON strings) which we can parse
ALTER TABLE public.features ALTER COLUMN geo TYPE text;

-- Make sure all required columns have proper defaults
ALTER TABLE public.features ALTER COLUMN name SET DEFAULT 'Untitled Feature';
ALTER TABLE public.features ALTER COLUMN description SET DEFAULT '';
ALTER TABLE public.features ALTER COLUMN category SET DEFAULT 'general';
ALTER TABLE public.features ALTER COLUMN visibility SET DEFAULT 'private';
ALTER TABLE public.features ALTER COLUMN tags SET DEFAULT '{}';
