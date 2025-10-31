-- Fix Marketplace Listings RLS Issue
-- Run this script if marketplace_listings table has policies but RLS not enabled

-- First, ensure RLS is enabled
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view marketplace listings" ON marketplace_listings;
DROP POLICY IF EXISTS "Users can create marketplace listings" ON marketplace_listings;
DROP POLICY IF EXISTS "Sellers can update own listings" ON marketplace_listings;

-- Recreate the policies
CREATE POLICY "Anyone can view marketplace listings" ON marketplace_listings FOR SELECT USING (true);

CREATE POLICY "Users can create marketplace listings" ON marketplace_listings
    FOR INSERT WITH CHECK (seller_id::text = auth.uid()::text);

CREATE POLICY "Sellers can update own listings" ON marketplace_listings
    FOR UPDATE USING (seller_id::text = auth.uid()::text);

-- Verify RLS is enabled
DO $$
DECLARE
    rls_enabled boolean;
BEGIN
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'marketplace_listings' AND n.nspname = 'public';

    IF rls_enabled THEN
        RAISE NOTICE '✅ RLS successfully enabled for marketplace_listings table';
    ELSE
        RAISE EXCEPTION '❌ RLS is still not enabled for marketplace_listings table';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Marketplace listings RLS fix applied successfully!';
    RAISE NOTICE '✅ RLS enabled and policies configured';
    RAISE NOTICE '🔒 Table is now secure with proper access controls';
END $$;