import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Calendar, Users, Mail, Projector as Subject } from 'lucide-react';
import ReactQuill from 'react-quill';
import DatePicker from 'react-datepicker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { EmailFormData } from '../../types';
import clsx from 'clsx';
import 'react-quill/dist/quill.snow.css';
import 'react-datepicker/dist/react-datepicker.css';

const emailSchema = z.object({
  remetente: z.string().email('Email do remetente inválido'),
  destinatarios: z.string().min(1, 'Pelo menos um destinatário é obrigatório'),
  copia_cc: z.string().optional(),
  assunto: z.string().min(1, 'Assunto é obrigatório'),
  corpo_email: z.string().min(1, 'Corpo do email é obrigatório'),
  data_agendamento: z.date().min(new Date(), 'Data deve ser no futuro'),
});

type EmailFormInputs = z.infer<typeof emailSchema>;

const ComposeEmail: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { appUser } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<EmailFormInputs>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      remetente: appUser?.email_login || '',
      data_agendamento: new Date(),
    },
  });

  const onSubmit = async (data: EmailFormInputs) => {
    if (!appUser) return;

    setLoading(true);
    setSuccess(false);

    try {
      // Parse recipients and CC
      const destinatarios = data.destinatarios
        .split(/[,;]/)
        .map(email => email.trim())
        .filter(email => email);

      const copia_cc = data.copia_cc
        ? data.copia_cc
            .split(/[,;]/)
            .map(email => email.trim())
            .filter(email => email)
        : [];

      // Insert email into database
      const { error } = await supabase
        .from('emails_agendados')
        .insert({
          id_usuario: appUser.id,
          remetente: data.remetente,
          destinatarios,
          copia_cc,
          assunto: data.assunto,
          corpo_email: data.corpo_email,
          data_agendamento: data.data_agendamento.toISOString(),
        });

      if (error) throw error;

      // Log audit
      await supabase.from('log_auditoria').insert({
        id_usuario_acao: appUser.id,
        acao: 'CRIOU AGENDAMENTO',
        detalhes: `Usuário '${appUser.nome}' agendou e-mail com assunto '${data.assunto}' para '${destinatarios.join(', ')}'`,
      });

      setSuccess(true);
      reset();
    } catch (error) {
      console.error('Error scheduling email:', error);
    } finally {
      setLoading(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Redigir Email</span>
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-700">
                <Send className="h-5 w-5" />
                <span className="font-medium">Email agendado com sucesso!</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                De
              </label>
              <input
                {...register('remetente')}
                type="email"
                className={clsx(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.remetente ? 'border-red-300' : 'border-gray-300'
                )}
                placeholder="seu@email.com"
              />
              {errors.remetente && (
                <p className="mt-1 text-sm text-red-600">{errors.remetente.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Data de Agendamento
              </label>
              <Controller
                name="data_agendamento"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    showTimeSelect
                    timeIntervals={15}
                    dateFormat="dd/MM/yyyy HH:mm"
                    className={clsx(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                      errors.data_agendamento ? 'border-red-300' : 'border-gray-300'
                    )}
                    placeholderText="Selecione data e hora"
                  />
                )}
              />
              {errors.data_agendamento && (
                <p className="mt-1 text-sm text-red-600">{errors.data_agendamento.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Para (separar múltiplos emails com vírgula)
            </label>
            <input
              {...register('destinatarios')}
              type="text"
              className={clsx(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.destinatarios ? 'border-red-300' : 'border-gray-300'
              )}
              placeholder="destinatario1@email.com, destinatario2@email.com"
            />
            {errors.destinatarios && (
              <p className="mt-1 text-sm text-red-600">{errors.destinatarios.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Cópia (CC) - opcional
            </label>
            <input
              {...register('copia_cc')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="cc1@email.com, cc2@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Subject className="inline h-4 w-4 mr-1" />
              Assunto
            </label>
            <input
              {...register('assunto')}
              type="text"
              className={clsx(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.assunto ? 'border-red-300' : 'border-gray-300'
              )}
              placeholder="Digite o assunto do email"
            />
            {errors.assunto && (
              <p className="mt-1 text-sm text-red-600">{errors.assunto.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Corpo do Email
            </label>
            <Controller
              name="corpo_email"
              control={control}
              render={({ field }) => (
                <ReactQuill
                  theme="snow"
                  value={field.value}
                  onChange={field.onChange}
                  modules={quillModules}
                  className={clsx(
                    'bg-white rounded-lg',
                    errors.corpo_email ? 'border-red-300' : ''
                  )}
                  style={{ height: '200px', marginBottom: '50px' }}
                />
              )}
            />
            {errors.corpo_email && (
              <p className="mt-1 text-sm text-red-600">{errors.corpo_email.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={clsx(
                'flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium transition-all duration-200',
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'hover:bg-blue-700 transform hover:scale-105'
              )}
            >
              <Send className="h-5 w-5" />
              <span>{loading ? 'Agendando...' : 'Agendar Envio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposeEmail;