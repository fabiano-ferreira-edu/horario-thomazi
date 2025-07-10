/*
  # Fix audit log RLS policies

  1. Security Updates
    - Drop existing restrictive policies on log_auditoria table
    - Create new policies that allow authenticated users to insert their own audit logs
    - Ensure admins can read all logs while users can only read their own

  2. Changes Made
    - Remove overly restrictive INSERT policy
    - Add proper INSERT policy for authenticated users
    - Maintain existing SELECT policies for security
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "All users can insert audit logs" ON log_auditoria;
DROP POLICY IF EXISTS "Users can read own audit logs" ON log_auditoria;
DROP POLICY IF EXISTS "Admins can read all audit logs" ON log_auditoria;

-- Create new INSERT policy that allows authenticated users to insert their own logs
CREATE POLICY "Authenticated users can insert own audit logs"
  ON log_auditoria
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id_usuario_acao);

-- Create SELECT policy for users to read their own logs
CREATE POLICY "Users can read own audit logs"
  ON log_auditoria
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id_usuario_acao);

-- Create SELECT policy for admins to read all logs
CREATE POLICY "Admins can read all audit logs"
  ON log_auditoria
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.perfil = 'Administrador'::user_profile
    )
  );