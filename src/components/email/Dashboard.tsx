import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Mail, Edit, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { EmailAgendado } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

const Dashboard: React.FC = () => {
  const [emails, setEmails] = useState<EmailAgendado[]>([]);
  const [loading, setLoading] = useState(true);
  const { appUser, isAdmin } = useAuth();

  useEffect(() => {
    fetchScheduledEmails();
  }, [appUser]);

  const fetchScheduledEmails = async () => {
    if (!appUser) return;

    setLoading(true);
    try {
      let query = supabase
        .from('emails_agendados')
        .select('*')
        .eq('status', 'Agendado')
        .order('data_agendamento', { ascending: true });

      if (!isAdmin) {
        query = query.eq('id_usuario', appUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Error fetching scheduled emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEmail = async (emailId: string) => {
    if (!appUser) return;

    try {
      const { error } = await supabase
        .from('emails_agendados')
        .update({ status: 'Cancelado' })
        .eq('id', emailId);

      if (error) throw error;

      // Log audit
      await supabase.from('log_auditoria').insert({
        id_usuario_acao: appUser.id,
        acao: 'CANCELOU AGENDAMENTO',
        detalhes: `Usuário '${appUser.nome}' cancelou agendamento de e-mail`,
      });

      fetchScheduledEmails();
    } catch (error) {
      console.error('Error canceling email:', error);
    }
  };

  const getTimeUntilSend = (scheduledDate: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    const diff = scheduled.getTime() - now.getTime();

    if (diff <= 0) return 'Vencido';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Painel de Agendamentos</h2>
        <p className="text-gray-600">Gerencie seus emails agendados</p>
      </div>

      {emails.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum email agendado</h3>
          <p className="text-gray-600">Crie um novo agendamento para começar</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {emails.map((email) => (
            <div
              key={email.id}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-200"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold truncate">{email.assunto}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCancelEmail(email.id)}
                      className="p-1 text-white hover:text-red-200 transition-colors"
                      title="Cancelar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span className="truncate">
                    {Array.isArray(email.destinatarios) 
                      ? email.destinatarios.join(', ') 
                      : email.destinatarios}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(email.data_agendamento), 'dd/MM/yyyy HH:mm', { 
                      locale: ptBR 
                    })}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-600">
                    {getTimeUntilSend(email.data_agendamento)}
                  </span>
                </div>

                {email.copia_cc && Array.isArray(email.copia_cc) && email.copia_cc.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>CC: {email.copia_cc.join(', ')}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100">
                  <div 
                    className="text-sm text-gray-600 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: email.corpo_email }}
                  />
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    De: {email.remetente}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {email.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;