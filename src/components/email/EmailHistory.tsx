import React, { useState, useEffect } from 'react';
import { Search, Filter, Mail, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { EmailAgendado } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

const EmailHistory: React.FC = () => {
  const [emails, setEmails] = useState<EmailAgendado[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailAgendado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { appUser, isAdmin } = useAuth();

  useEffect(() => {
    fetchEmailHistory();
  }, [appUser]);

  useEffect(() => {
    filterEmails();
  }, [emails, searchTerm, statusFilter]);

  const fetchEmailHistory = async () => {
    if (!appUser) return;

    setLoading(true);
    try {
      let query = supabase
        .from('emails_agendados')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('id_usuario', appUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Error fetching email history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEmails = () => {
    let filtered = emails;

    if (searchTerm) {
      filtered = filtered.filter(email =>
        email.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(email.destinatarios) 
          ? email.destinatarios.some(dest => dest.toLowerCase().includes(searchTerm.toLowerCase()))
          : email.destinatarios.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(email => email.status === statusFilter);
    }

    setFilteredEmails(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Agendado':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'Enviado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Falha no Envio':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Cancelado':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Mail className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Agendado':
        return 'bg-blue-100 text-blue-800';
      case 'Enviado':
        return 'bg-green-100 text-green-800';
      case 'Falha no Envio':
        return 'bg-red-100 text-red-800';
      case 'Cancelado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Histórico de Emails</h2>
        <p className="text-gray-600">Visualize todos os emails enviados e agendados</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por assunto ou destinatário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="Agendado">Agendado</option>
            <option value="Enviado">Enviado</option>
            <option value="Falha no Envio">Falha no Envio</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Email List */}
      {filteredEmails.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum email encontrado</h3>
          <p className="text-gray-600">Tente ajustar os filtros ou criar um novo agendamento</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assunto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destinatários
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{email.assunto}</div>
                      <div className="text-sm text-gray-500">De: {email.remetente}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {Array.isArray(email.destinatarios) 
                          ? email.destinatarios.join(', ') 
                          : email.destinatarios}
                      </div>
                      {email.copia_cc && Array.isArray(email.copia_cc) && email.copia_cc.length > 0 && (
                        <div className="text-sm text-gray-500">
                          CC: {email.copia_cc.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {format(new Date(email.data_agendamento), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div className="text-gray-500">
                        {format(new Date(email.data_agendamento), 'HH:mm', { locale: ptBR })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(email.status)}
                        <span className={clsx(
                          'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                          getStatusColor(email.status)
                        )}>
                          {email.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {email.data_envio_real && (
                        <div>
                          Enviado: {format(new Date(email.data_envio_real), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      )}
                      {email.mensagem_erro && (
                        <div className="text-red-600 text-xs">
                          {email.mensagem_erro}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailHistory;