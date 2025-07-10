/*
  # Email Scheduler Database Schema

  1. New Tables
    - `users` - User accounts with role-based access
    - `emails_agendados` - Scheduled emails with full metadata
    - `configuracoes` - SMTP configuration settings
    - `log_auditoria` - Audit trail for all system operations

  2. Security
    - Enable RLS on all tables
    - Add policies for user data isolation
    - Admin policies for system management

  3. Features
    - Multi-user support with role separation
    - Email scheduling with status tracking
    - Audit logging for compliance
    - SMTP configuration management
*/

-- Create custom types
CREATE TYPE user_profile AS ENUM ('Usuário Padrão', 'Administrador');
CREATE TYPE email_status AS ENUM ('Agendado', 'Enviado', 'Falha no Envio', 'Cancelado');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email_login text UNIQUE NOT NULL,
  senha_hash text NOT NULL,
  perfil user_profile NOT NULL DEFAULT 'Usuário Padrão',
  data_criacao timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Scheduled emails table
CREATE TABLE IF NOT EXISTS emails_agendados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  remetente text NOT NULL,
  destinatarios jsonb NOT NULL,
  copia_cc jsonb DEFAULT '[]'::jsonb,
  assunto text NOT NULL,
  corpo_email text NOT NULL,
  data_agendamento timestamptz NOT NULL,
  data_envio_real timestamptz NULL,
  status email_status NOT NULL DEFAULT 'Agendado',
  mensagem_erro text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- SMTP configuration table
CREATE TABLE IF NOT EXISTS configuracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_host text NOT NULL,
  smtp_porta integer NOT NULL DEFAULT 587,
  smtp_usuario text NOT NULL,
  smtp_senha text NOT NULL,
  usar_tls boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS log_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario_acao uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  acao text NOT NULL,
  detalhes text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_agendados ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_auditoria ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND perfil = 'Administrador'
    )
  );

-- Emails policies
CREATE POLICY "Users can manage own emails"
  ON emails_agendados
  FOR ALL
  TO authenticated
  USING (id_usuario = auth.uid());

CREATE POLICY "Admins can manage all emails"
  ON emails_agendados
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND perfil = 'Administrador'
    )
  );

-- Configuration policies (admin only)
CREATE POLICY "Only admins can access config"
  ON configuracoes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND perfil = 'Administrador'
    )
  );

-- Audit log policies
CREATE POLICY "Users can read own audit logs"
  ON log_auditoria
  FOR SELECT
  TO authenticated
  USING (id_usuario_acao = auth.uid());

CREATE POLICY "Admins can read all audit logs"
  ON log_auditoria
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND perfil = 'Administrador'
    )
  );

CREATE POLICY "All users can insert audit logs"
  ON log_auditoria
  FOR INSERT
  TO authenticated
  WITH CHECK (id_usuario_acao = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_emails_agendados_usuario ON emails_agendados(id_usuario);
CREATE INDEX idx_emails_agendados_status ON emails_agendados(status);
CREATE INDEX idx_emails_agendados_data_agendamento ON emails_agendados(data_agendamento);
CREATE INDEX idx_log_auditoria_usuario ON log_auditoria(id_usuario_acao);
CREATE INDEX idx_log_auditoria_timestamp ON log_auditoria(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_emails_agendados_updated_at
  BEFORE UPDATE ON emails_agendados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at
  BEFORE UPDATE ON configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();