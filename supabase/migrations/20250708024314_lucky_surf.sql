/*
  # Add INSERT policy for users table

  1. Security Changes
    - Add policy to allow authenticated users to insert their own user profile
    - Policy ensures users can only insert records with their own auth.uid()

  This fixes the RLS violation error during user registration by allowing
  authenticated users to create their profile in the users table.
*/

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);