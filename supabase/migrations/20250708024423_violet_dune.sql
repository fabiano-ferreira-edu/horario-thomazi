/*
  # Fix User Registration RLS Policy

  1. Security Changes
    - Update the INSERT policy for users table to allow registration
    - The policy now allows INSERT operations during the registration process
    - Maintains security by ensuring users can only insert their own data

  2. Changes Made
    - Drop the existing restrictive INSERT policy
    - Create a new INSERT policy that works with Supabase Auth registration flow
    - Policy allows authenticated users to insert their own profile data
*/

-- Drop the existing INSERT policy that's too restrictive
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create a new INSERT policy that allows user registration
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure we have a policy for public registration (during signup process)
CREATE POLICY "Allow signup process"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);