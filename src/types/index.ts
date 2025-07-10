export interface User {
  id: string;
  nome: string;
  email_login: string;
  perfil: 'Usuário Padrão' | 'Administrador';
  data_criacao: string;
}

export interface EmailAgendado {
  id: string;
  id_usuario: string;
  remetente: string;
  destinatarios: string[];
  copia_cc: string[];
  assunto: string;
  corpo_email: string;
  data_agendamento: string;
  data_envio_real?: string;
  status: 'Agendado' | 'Enviado' | 'Falha no Envio' | 'Cancelado';
  mensagem_erro?: string;
  created_at: string;
  updated_at: string;
}

export interface Configuracao {
  id: string;
  smtp_host: string;
  smtp_porta: number;
  smtp_usuario: string;
  smtp_senha: string;
  usar_tls: boolean;
}

export interface LogAuditoria {
  id: string;
  id_usuario_acao: string;
  timestamp: string;
  acao: string;
  detalhes: string;
}

export interface EmailFormData {
  remetente: string;
  destinatarios: string;
  copia_cc: string;
  assunto: string;
  corpo_email: string;
  data_agendamento: Date;
}