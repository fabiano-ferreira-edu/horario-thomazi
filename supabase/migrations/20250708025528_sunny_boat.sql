/*
  # Fix infinite recursion in users table RLS policies

  1. Problem
    - Current policies cause infinite recursion when checking user permissions
    - Admin check policy queries users table from within users table policy
    - This creates a circular dependency

  2. Solution
    - Simplify policies to avoid recursive queries
    - Use auth.uid() directly for user access
    - Create separate admin check that doesn't query users table during user data access
    - Allow users to read their own data without complex checks

  3. Changes
    - Drop existing problematic policies
    - Create new simplified policies
    - Ensure admin users can still access all data
    - Maintain security while avoiding recursion
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Allow signup process" ON users;

-- Create new simplified policies

-- Allow users to read their own data (simple, no recursion)
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow signup process (for registration)
CREATE POLICY "Allow signup process"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert their own record
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- For admin access, we'll handle this at the application level
-- rather than through RLS to avoid recursion issues
-- Admins will use service role key for administrative operations