/*
  TRANSITIONING TO MULTI-TENANT SECURITY (SUPABASE RLS)
  
  Run the following commands in your Supabase SQL Editor to secure your data.
  This ensures that one Textile Mill cannot access another Mill's invoices or customers.
*/

-- 1. Enable RLS on all core tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

-- 2. Create a helper function to get the current user's company_id
-- We assume the 'users' table links auth.uid() to a company_id
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid AS $$
  SELECT company_id FROM users WHERE firebase_uid = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. CUSTOMERS POLICIES
CREATE POLICY "Users can only see their own company's customers"
  ON customers FOR SELECT
  USING (company_id = get_my_company_id());

CREATE POLICY "Users can only insert customers for their own company"
  ON customers FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "Users can only update their own company's customers"
  ON customers FOR UPDATE
  USING (company_id = get_my_company_id());

-- 4. INVOICES POLICIES
CREATE POLICY "Users can only see their own company's invoices"
  ON invoices FOR SELECT
  USING (company_id = get_my_company_id());

CREATE POLICY "Users can only insert invoices for their own company"
  ON invoices FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

-- 5. ESCALATIONS POLICIES
CREATE POLICY "Users can only see their own company's escalations"
  ON escalations FOR SELECT
  USING (company_id = get_my_company_id());

-- IMPORTANT: Ensure you have a 'users' table that maps firebase_uid to company_id.
